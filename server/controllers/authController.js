// controllers/authController.js
// Authentication: signup, login, logout, getMe
// Demonstrates: bcryptjs hashing, JWT signing, HTTP-only cookies (Lecture 46-47)

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');

// ── Helper: sign JWT and attach as HTTP-only cookie ─────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const cookieOptions = {
    httpOnly: true,                             // Not accessible via document.cookie
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',                            // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,           // 7 days in milliseconds
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
      },
    });
};

// ── POST /api/auth/signup ────────────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Manual validation (demonstrates JS validation – Lecture 5)
    const errors = [];
    if (!name    || name.trim().length < 2)      errors.push('Name must be at least 2 characters');
    if (!email   || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Valid email is required');
    if (!password || password.length < 6)         errors.push('Password must be at least 6 characters');
    if (confirmPassword !== undefined && password !== confirmPassword) errors.push('Passwords do not match');
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password with bcryptjs (salt rounds = 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name:  name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Explicitly select passwordHash (excluded by default in schema)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = (req, res) => {
  res
    .cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
    })
    .json({ success: true, message: 'Logged out successfully.' });
};


// ── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is set by protect middleware
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/auth/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, logout, getMe, updateProfile };


