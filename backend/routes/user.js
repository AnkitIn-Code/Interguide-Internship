const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   PUT /api/user/onboarded
// @desc    Update user onboarded status
router.put('/onboarded', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.hasOnboarded = true;
    await user.save();
    res.json({ message: 'User marked as onboarded', hasOnboarded: user.hasOnboarded });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
