const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  externalId: { type: String, unique: true, sparse: true },
  title:       { type: String, required: true },
  company:     { type: String, required: true },
  description: { type: String },
  url:         { type: String, required: true, unique: true },
  source:      { type: String },  // Arbeitnow, Remotive, Findwork, …
  location:    { type: String },
  isRemote:    { type: Boolean, default: false },
  isAdzuna:    { type: Boolean, default: false },
  domain:      { type: String, default: 'Technology' },
  stipend:     { type: Number },
  duration:    { type: String },
  requiredSkills: [{ type: String }],
  postedAt:    { type: Date, default: Date.now },
  lastSeenAt:   { type: Date, default: Date.now },
}, { timestamps: true });

internshipSchema.index({ title: 'text', description: 'text', company: 'text' });

module.exports = mongoose.model('Internship', internshipSchema);
