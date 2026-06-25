const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Scraper status tracking (in-memory for now)
let scraperState = {
  isRunning: false,
  status: 'idle',
  lastRun: null,
  totalScraped: 0,
  lastError: null
};

// @route   GET /api/scraper/stats
// @desc    Get scraper statistics
router.get('/stats', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalScraped: scraperState.totalScraped,
        lastRun: scraperState.lastRun,
        status: scraperState.status,
        isRunning: scraperState.isRunning
      }
    });
  } catch (err) {
    console.error('Scraper stats error:', err);
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// @route   GET /api/scraper/status
// @desc    Get scraper current status
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: scraperState.status,
        isRunning: scraperState.isRunning,
        lastError: scraperState.lastError,
        lastRun: scraperState.lastRun
      }
    });
  } catch (err) {
    console.error('Scraper status error:', err);
    res.status(500).json({ success: false, message: 'Error fetching status' });
  }
});

// @route   POST /api/scraper/trigger
// @desc    Trigger scraper to start scraping
router.post('/trigger', protect, async (req, res) => {
  try {
    if (scraperState.isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Scraper is already running'
      });
    }

    scraperState.isRunning = true;
    scraperState.status = 'running';
    scraperState.lastError = null;

    // Simulate scraper work (async, don't wait)
    setTimeout(() => {
      scraperState.isRunning = false;
      scraperState.status = 'completed';
      scraperState.lastRun = new Date();
      scraperState.totalScraped += 100; // Simulated count
    }, 2000);

    res.json({
      success: true,
      message: 'Scraper started successfully',
      data: {
        status: 'started',
        startTime: new Date()
      }
    });
  } catch (err) {
    console.error('Scraper trigger error:', err);
    scraperState.isRunning = false;
    scraperState.lastError = err.message;
    res.status(500).json({ success: false, message: 'Error triggering scraper' });
  }
});

// @route   POST /api/scraper/stop
// @desc    Stop the scraper
router.post('/stop', protect, async (req, res) => {
  try {
    if (!scraperState.isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Scraper is not running'
      });
    }

    scraperState.isRunning = false;
    scraperState.status = 'stopped';

    res.json({
      success: true,
      message: 'Scraper stopped successfully',
      data: {
        status: 'stopped',
        stoppedAt: new Date()
      }
    });
  } catch (err) {
    console.error('Scraper stop error:', err);
    res.status(500).json({ success: false, message: 'Error stopping scraper' });
  }
});

// @route   GET /api/scraper/scraped-internships
// @desc    Get scraped internships
router.get('/scraped-internships', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;

    // This would query actual scraped internships from database
    // For now, return mock data
    res.json({
      success: true,
      data: [],
      pagination: {
        page,
        limit,
        total: 0
      }
    });
  } catch (err) {
    console.error('Get scraped internships error:', err);
    res.status(500).json({ success: false, message: 'Error fetching internships' });
  }
});

module.exports = router;
