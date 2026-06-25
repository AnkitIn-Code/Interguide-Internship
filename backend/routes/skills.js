const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/skills
// @desc    Get user's technical and soft skills
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      skills: [...user.technicalSkills, ...user.softSkills],
      technicalSkills: user.technicalSkills,
      softSkills: user.softSkills
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/skills
// @desc    Update user's technical and soft skills
router.put('/', protect, async (req, res) => {
  try {
    const { technicalSkills, softSkills } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (technicalSkills) user.technicalSkills = technicalSkills;
    if (softSkills) user.softSkills = softSkills;

    const updatedUser = await user.save();
    res.json({
      technicalSkills: updatedUser.technicalSkills,
      softSkills: updatedUser.softSkills
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
