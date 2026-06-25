const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Optional ref to internship in our DB
  internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },

  // ── Full internship snapshot (stored so data survives even if internship doc is deleted) ──
  title:       { type: String },
  company:     { type: String },
  companyLogo: { type: String },
  location:    { type: String },
  domain:      { type: String },
  stipend:     { type: Number },
  duration:    { type: String },
  url:         { type: String },
  requiredSkills: [{ type: String }],
  description: { type: String },
  postedAt:    { type: Date },
  source:      { type: String },
  isRemote:    { type: Boolean },

  // ── Status: now includes wishlist tracking statuses ──
  status: {
    type: String,
    enum: [
      'want_to_apply',
      'wishlist',
      'applied',
      'under_review',
      'interview_scheduled',
      'offer_received',
      'rejected',
      // legacy values kept for backwards compatibility
      'Applied', 'Under Review', 'Interview Scheduled', 'Offer Received', 'Rejected'
    ],
    default: 'want_to_apply'
  },

  // ── Calendar / tracking fields ──
  deadline:      { type: Date },
  interviewDate: { type: Date },
  followUpDate:  { type: Date },
  notes:         { type: String },

  // legacy fields
  customCompany: { type: String },
  customRole:    { type: String },
  appliedAt:     { type: Date, default: Date.now },

}, { timestamps: true });

// Sparse index: only enforces uniqueness when BOTH user+internship are non-null.
// This prevents the E11000 duplicate key error when internship is null
// (i.e. custom/external entries not in our DB).
applicationSchema.index(
  { user: 1, internship: 1, status: 1 },
  { sparse: true, background: true }
);

module.exports = mongoose.model('Application', applicationSchema);
