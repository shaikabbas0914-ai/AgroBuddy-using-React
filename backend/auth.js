const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { OAuth2Client } = require('google-auth-library');
const User = require('./database');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('./middleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Rate Limiting for login routes to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per 15 minutes
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper: send actual or Ethereal test emails
const sendEmail = async (to, subject, text, html) => {
  let transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Ethereal mock SMTP transporter for development
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      console.error('Error creating Ethereal test account:', err.message);
      return;
    }
  }

  const mailOptions = {
    from: '"AgroBuddy Security" <no-reply@agrobuddy.com>',
    to,
    subject,
    text,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  
  if (!process.env.SMTP_HOST) {
    console.log(`[Ethereal Email Sent] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
};

// 1. REGISTER ROUTE
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = uuidv4();

    await User.create({
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken
    });

    // Send verification email
    const host = req.get('host');
    const protocol = req.protocol;
    const verifyUrl = `${protocol}://${host}/auth/verify-email?token=${verificationToken}`;
    
    const subject = 'Verify your AgroBuddy Account';
    const text = `Welcome to AgroBuddy! Please verify your email by clicking: ${verifyUrl}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #28a745;">Welcome to AgroBuddy</h2>
        <p>Thank you for registering. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="margin-top: 20px; font-size: 0.85em; color: #666; border-top: 1px solid #eee; padding-top: 15px;">
          If the button does not work, copy and paste this link in your browser: <br>
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
      </div>
    `;

    sendEmail(email, subject, text, html).catch(err => console.error('Failed to send verification email:', err));

    res.status(201).json({ message: 'User registered successfully. A verification email has been sent.' });
  } catch (error) {
    if (error.code === 11000 || (error.message && error.message.includes('duplicate key'))) {
      return res.status(400).json({ message: 'Registration failed. User already exists.' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. VERIFY EMAIL ROUTE
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).send('<h1>Verification failed</h1><p>Token is missing.</p>');
  }

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).send('<h1>Verification failed</h1><p>Invalid or expired verification token.</p>');
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px; margin: 50px auto;">
        <h1 style="color: #28a745;">Email Verified Successfully!</h1>
        <p>Your AgroBuddy account has been verified. You can now close this tab and log in.</p>
      </div>
    `);
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).send('<h1>Internal server error</h1>');
  }
});

// 3. LOGIN ROUTE
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check account locking
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(401).json({ message: `Account is temporarily locked. Try again in ${remainingMinutes} minutes.` });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
        user.loginAttempts = 0;
        await user.save();
        return res.status(401).json({ message: 'Account is temporarily locked due to too many failed login attempts. Try again in 15 minutes.' });
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Require email verification
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email address before logging in.' });
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Check MFA
    if (user.mfaEnabled) {
      const tempToken = jwt.sign(
        { id: user._id, mfaRequired: true },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.status(200).json({ mfaRequired: true, tempToken });
    }

    // Issue Session Cookie
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

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

// 4. GOOGLE AUTH ROUTE
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    let user = await User.findOne({ email });
    if (!user) {
      // Create account automatically (implicitly verified since Google verified)
      const randomPassword = await bcrypt.hash(uuidv4(), 10);
      user = await User.create({
        email,
        password: randomPassword,
        isVerified: true
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(401).json({ message: 'Account is temporarily locked.' });
    }

    if (user.mfaEnabled) {
      const tempToken = jwt.sign(
        { id: user._id, mfaRequired: true },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.status(200).json({ mfaRequired: true, tempToken });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 3600000
    });

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ message: 'Invalid Google credential' });
  }
});

// 5. MFA SETUP ROUTE
router.post('/mfa/setup', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const secret = speakeasy.generateSecret({ name: `AgroBuddy (${user.email})` });
    user.mfaSecret = secret.base32;
    await user.save();

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({ secret: secret.base32, qrCodeUrl });
  } catch (err) {
    console.error('MFA Setup Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 6. MFA VERIFY / ENABLE ROUTE
router.post('/mfa/verify', verifyToken, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Verification code is required' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.mfaEnabled = true;
    await user.save();

    res.json({ message: 'MFA enabled successfully' });
  } catch (err) {
    console.error('MFA Verify Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 7. LOGIN MFA ROUTE
router.post('/login-mfa', async (req, res) => {
  const { code, tempToken } = req.body;
  if (!code || !tempToken) {
    return res.status(400).json({ message: 'MFA code and tempToken are required' });
  }

  try {
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    if (!decoded.mfaRequired) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!verified) {
      return res.status(401).json({ message: 'Invalid MFA code' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 3600000
    });

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login MFA error:', err);
    res.status(401).json({ message: 'Invalid or expired temporary session' });
  }
});

// 8. LOGOUT ROUTE
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// 9. FORGOT PASSWORD ROUTE
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  const resetToken = uuidv4();
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour
  
  try {
    await User.findOneAndUpdate(
      { email },
      { resetToken, resetTokenExpiry }
    );

    // Send reset email
    const host = req.get('host');
    const protocol = req.protocol;
    const resetUrl = `${protocol}://${host}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    const subject = 'Reset your AgroBuddy Password';
    const text = `Reset your password by visiting this link: ${resetUrl}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #d9534f;">Reset Your Password</h2>
        <p>A password reset request was received for your AgroBuddy account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #d9534f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="margin-top: 20px; font-size: 0.85em; color: #666; border-top: 1px solid #eee; padding-top: 15px;">
          This link will expire in 1 hour. If you did not request this, ignore this email.
        </p>
      </div>
    `;

    sendEmail(email, subject, text, html).catch(err => console.error('Failed to send reset email:', err));
    
    // Always return success to prevent email enumeration
    res.status(200).json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(200).json({ message: 'If that email address is in our database, we will send you an email to reset your password.' });
  }
});

// 10. RESET PASSWORD ROUTE
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

// 11. CHECK SESSION ROUTE
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
