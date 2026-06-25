const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/payment/subscription-status
// @desc    Get user subscription status
router.get('/subscription-status', protect, async (req, res) => {
  try {
    // Stub implementation - all users get trial
    res.json({
      success: true,
      data: {
        status: 'trial',
        plan: 'free',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        features: {
          aiRewrites: 10,
          resumeUploads: 5,
          aiInterviews: 3
        }
      }
    });
  } catch (err) {
    console.error('Payment status error:', err);
    res.status(500).json({ success: false, message: 'Error fetching subscription status' });
  }
});

// @route   POST /api/payment/create-order
// @desc    Create payment order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { planId, amount } = req.body;
    
    // Stub implementation
    res.json({
      success: true,
      data: {
        orderId: `ORDER_${Date.now()}`,
        amount,
        planId,
        status: 'pending'
      }
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
});

// @route   POST /api/payment/verify
// @desc    Verify payment
router.post('/verify', protect, async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    
    // Stub implementation - always success
    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId,
        paymentId,
        verified: true
      }
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, message: 'Error verifying payment' });
  }
});

module.exports = router;
