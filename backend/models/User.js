const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  hasOnboarded: { type: Boolean, default: false },
  technicalSkills: [{ type: String }],
  softSkills:      [{ type: String }],
  profile: {
    location:    String,
    sector:      String,
    education:   String,
    skills:      [{ type: String }],
    phone:       String,
    dateOfBirth: String,
    linkedinUrl: String,
    githubUrl:   String,
  },
  experience: [{
    title:       String,
    company:     String,
    description: String
  }],
  education: [{
    degree:      String,
    institution: String,
    year:        String,
    field:       String
  }],

  /* ── Stored resume (persisted so user doesn't re-upload each login) ── */
  resume: {
    fileName:     String,
    uploadedAt:   Date,
    text:         String,           // full extracted text
    skills:       [{ type: String }],
    atsScore:     Number,           // 0-100
    embedding:    [{ type: Number }],
    experience: [{
      title:       String,
      company:     String,
      description: String
    }],
    education: [{
      degree:      String,
      institution: String,
      year:        String,
      field:       String
    }]
  }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
