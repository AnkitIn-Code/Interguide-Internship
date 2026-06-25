require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes (we will create these next)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const skillsRoutes = require('./routes/skills');
const resumeRoutes = require('./routes/resume');
const recommendationsRoutes = require('./routes/recommendations');
const applicationsRoutes = require('./routes/applications');
const chatRoutes = require('./routes/chat');
const internshipsRoutes = require('./routes/internships');
const interviewRoutes = require('./interview/interview.routes');
const jobSearchRoutes = require('./routes/jobs');
const scraperRoutes = require('./routes/scraper');
const paymentRoutes = require('./routes/payment');

const scheduler = require('./scheduler');

const app = express();

// Increase server timeout for long-running AI API calls
app.use((req, res, next) => {
  req.setTimeout(120000); // 2 minutes for request processing
  res.setTimeout(120000);
  next();
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/internships', internshipsRoutes);

// New feature routes
app.use('/api/interview', interviewRoutes);
app.use('/api/jobs', jobSearchRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/payment', paymentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    status: err.status || 'error',
    message: err.message || 'An error occurred'
  });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start background jobs once connected
    scheduler.init();
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    // Set socket timeout for long-running requests
    server.setTimeout(120000);
    server.keepAliveTimeout = 65000;
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
