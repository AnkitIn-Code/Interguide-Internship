const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      const userPayload = {
        _id: user.id,
        name: user.name,
        email: user.email,
        hasOnboarded: user.hasOnboarded,
        profile: user.profile || {}
      };
      res.status(201).json({
        user: userPayload,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const userPayload = {
        _id: user.id,
        name: user.name,
        email: user.email,
        hasOnboarded: user.hasOnboarded,
        profile: user.profile || {}
      };
      res.json({
        user: userPayload,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get user data (full profile including all personal details)
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile — saves all personal detail fields to DB
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Basic fields
    if (req.body.name !== undefined) user.name = req.body.name;

    // Profile sub-document
    if (!user.profile) user.profile = {};
    const profileFields = ['location', 'sector', 'education', 'skills',
                           'phone', 'dateOfBirth', 'linkedinUrl', 'githubUrl'];
    profileFields.forEach(field => {
      if (req.body[field] !== undefined) user.profile[field] = req.body[field];
    });
    // Mark profile as modified so Mongoose saves nested changes
    user.markModified('profile');

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();
    res.json({
      user: {
        _id:          updatedUser._id,
        name:         updatedUser.name,
        email:        updatedUser.email,
        hasOnboarded: updatedUser.hasOnboarded,
        profile:      updatedUser.profile,
        technicalSkills: updatedUser.technicalSkills,
        softSkills:      updatedUser.softSkills,
        resume:          updatedUser.resume,
      },
      token: generateToken(updatedUser._id)
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
