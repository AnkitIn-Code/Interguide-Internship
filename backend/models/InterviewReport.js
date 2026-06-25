const mongoose = require('mongoose');

const questionResultSchema = new mongoose.Schema({
  questionText: { type: String },
  questionType: { type: String },
  userAnswer: { type: String, default: '' },
  evaluation: {
    score: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    strengths: [String],
    improvements: [String]
  },
  timeTaken: { type: Number, default: 0 } // seconds
}, { _id: false });

const interviewReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobRole: { type: String, required: true },
  interviewType: {
    type: String,
    enum: ['behavioral', 'technical', 'hr'],
    default: 'behavioral'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'difficult'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned'],
    default: 'in-progress'
  },
  questionResults: [questionResultSchema],
  report: {
    overallScore: { type: Number, default: 0 },
    summary: { type: String, default: '' },
    strengths: [String],
    areasForImprovement: [String],
    recommendations: [String],
    rawReport: { type: mongoose.Schema.Types.Mixed }
  },
  totalQuestions: { type: Number, default: 0 },
  answeredQuestions: { type: Number, default: 0 },
  totalTimeTaken: { type: Number, default: 0 }, // seconds
}, { timestamps: true });

// Index for querying user's recent interviews
interviewReportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewReport', interviewReportSchema);
