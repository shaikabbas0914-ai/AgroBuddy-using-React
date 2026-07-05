const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('./database');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Rate Limiting for login routes to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashedPassword,
      isVerified: true // Auto-verify for mock purposes
    });

    res.status(201).json({ message: 'User registered successfully. Please login.' });
  } catch (error) {
    if (error.code === 11000 || (error.message && error.message.includes('duplicate key'))) {
      return res.status(400).json({ message: 'Registration failed. User already exists.' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  try {
    const user = await User.findOne({ email });
    
    // Generic error message: never reveal whether email or password is wrong
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' } // Implement session expiry
    );

    // Use HttpOnly & Secure cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 3600000 // 1 hour
    });

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  // Use expiring, single-use tokens
  const resetToken = uuidv4();
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour
  
  try {
    await User.findOneAndUpdate(
      { email },
      { resetToken, resetTokenExpiry }
    );
    // Don't reveal if email exists. Always return success.
    res.status(200).json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(200).json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  
  try {
    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Invalidate old token and update password
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

router.get('/check-session', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }
  
  try {
    jwt.verify(token, JWT_SECRET);
    res.status(200).json({ authenticated: true });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
});

module.exports = router;
