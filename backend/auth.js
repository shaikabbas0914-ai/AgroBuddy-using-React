const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
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
    const verificationToken = uuidv4(); // Mocking email verification

    db.run(
      `INSERT INTO users (email, password, isVerified) VALUES (?, ?, ?)`,
      [email, hashedPassword, 1], // Auto-verify for mock purposes
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
             // Generic error for duplicate to avoid email enumeration if needed, but standard practice usually says "User already exists" for registration.
            return res.status(400).json({ message: 'Registration failed. User already exists.' });
          }
          return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(201).json({ message: 'User registered successfully. Please login.' });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    // Generic error message: never reveal whether email or password is wrong
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' } // Implement session expiry
    );

    // Use HttpOnly & Secure cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    res.status(200).json({ message: 'Login successful' });
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  
  // Use expiring, single-use tokens
  const resetToken = uuidv4();
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour
  
  db.run(`UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?`,
    [resetToken, resetTokenExpiry, email],
    function(err) {
      if (err) {
        console.error(err);
      }
      // Don't reveal if email exists. Always return success.
      res.status(200).json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
    }
  );
});

router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  
  db.get(`SELECT * FROM users WHERE email = ? AND resetToken = ? AND resetTokenExpiry > ?`, 
    [email, token, Date.now()], 
    async (err, user) => {
      if (err || !user) {
         return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Invalidate old token
      db.run(`UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?`, 
        [hashedPassword, user.id], 
        (updateErr) => {
           if (updateErr) return res.status(500).json({ message: 'Error resetting password' });
           res.status(200).json({ message: 'Password has been reset successfully' });
        }
      );
    }
  );
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
