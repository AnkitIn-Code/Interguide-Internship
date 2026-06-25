const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Internship = require('../models/Internship');
const User = require('../models/User');
const { calculateMatchScore, generateExplanation } = require('../services/matcher');

// @route   GET /api/recommendations
// @desc    Get recommended internships based on user skills
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allSkills = [...user.technicalSkills, ...user.softSkills];
    
    // Get internships (limit to 100 for performance in this prototype)
    const internships = await Internship.find().sort('-postedAt').limit(100);

    const scoredInternships = internships.map(internship => {
      // If internship has no required skills parsed, we give it a default 50% or calculate based on description keyword match
      const requiredSkills = internship.requiredSkills && internship.requiredSkills.length > 0 
        ? internship.requiredSkills 
        : ['javascript', 'python', 'react', 'node']; // Fallback for testing if no skills extracted

      const matchScore = calculateMatchScore(allSkills, requiredSkills);
      const explanation = generateExplanation(allSkills, requiredSkills, matchScore);

      return {
        ...internship.toObject(),
        matchScore,
        explanation
      };
    });

    // Sort by match score descending
    scoredInternships.sort((a, b) => b.matchScore - a.matchScore);

    res.json(scoredInternships);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
