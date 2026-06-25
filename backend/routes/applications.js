const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Application = require('../models/Application');

/* ─────────────────────────────────────────────────────────────────
   Helper: normalise an application doc into a flat object the
   frontend can use directly (merges populated internship fields
   with the snapshot fields stored on the doc itself).
───────────────────────────────────────────────────────────────── */
function normalise(app) {
  const pop = app.internship && typeof app.internship === 'object' ? app.internship : null;
  return {
    _id:          app._id,
    id:           app._id,
    status:       app.status,
    notes:        app.notes,
    deadline:     app.deadline,
    interviewDate:app.interviewDate,
    followUpDate: app.followUpDate,
    createdAt:    app.createdAt,
    updatedAt:    app.updatedAt,
    appliedAt:    app.appliedAt,

    // Snapshot fields (fallback to populated internship if snapshot missing)
    title:        app.title       || pop?.title       || app.customRole    || '',
    company:      app.company     || pop?.company?.name || pop?.company    || app.customCompany || '',
    companyLogo:  app.companyLogo || pop?.company?.logo || pop?.companyLogo || '',
    location:     app.location    || pop?.location    || '',
    domain:       app.domain      || pop?.domain      || '',
    stipend:      app.stipend     ?? pop?.stipend     ?? null,
    duration:     app.duration    || pop?.duration    || '',
    url:          app.url         || pop?.url         || '',
    requiredSkills: app.requiredSkills?.length ? app.requiredSkills : (pop?.requiredSkills || []),
    description:  app.description || pop?.description || '',
    postedAt:     app.postedAt    || pop?.postedAt    || null,
    source:       app.source      || pop?.source      || '',
    isRemote:     app.isRemote    ?? pop?.isRemote    ?? false,
  };
}

// @route   GET /api/applications
// @desc    Get all applications for the logged-in user (normalised)
router.get('/', protect, async (req, res) => {
  try {
    const docs = await Application.find({ user: req.user.id })
      .populate('internship')
      .sort('-createdAt');
    res.json({ applications: docs.map(normalise) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/applications/recent-activity
// @desc    Get recent application activity
router.get('/recent-activity', protect, async (req, res) => {
  try {
    const docs = await Application.find({ user: req.user.id })
      .populate('internship')
      .sort('-updatedAt')
      .limit(5);
    res.json({ applications: docs.map(normalise) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/applications/upcoming-deadlines
// @desc    Get applications with upcoming deadlines
router.get('/upcoming-deadlines', protect, async (req, res) => {
  try {
    const docs = await Application.find({
      user: req.user.id,
      deadline: { $gte: new Date() }
    })
      .populate('internship')
      .sort('deadline')
      .limit(10);
    res.json({ applications: docs.map(normalise) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/applications/upsert
// @desc    Add or update an application (supports full internship snapshot)
router.post('/upsert', protect, async (req, res) => {
  try {
    const {
      _id,
      internshipId,
      status,
      notes,
      deadline,
      interviewDate,
      followUpDate,
      // internship snapshot fields
      title, company, companyLogo, location, domain,
      stipend, duration, url, requiredSkills, description,
      postedAt, source, isRemote,
      // legacy
      customCompany, customRole,
    } = req.body;

    const snapshotFields = {
      title:        title        || customRole    || undefined,
      company:      company      || customCompany || undefined,
      companyLogo:  companyLogo  || undefined,
      location:     location     || undefined,
      domain:       domain       || undefined,
      stipend:      stipend      != null ? Number(stipend) : undefined,
      duration:     duration     || undefined,
      url:          url          || undefined,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : undefined,
      description:  description  || undefined,
      postedAt:     postedAt     || undefined,
      source:       source       || undefined,
      isRemote:     isRemote     != null ? Boolean(isRemote) : undefined,
    };

    // Remove undefined keys so we don't accidentally overwrite stored values
    Object.keys(snapshotFields).forEach(k => snapshotFields[k] === undefined && delete snapshotFields[k]);

    // Validate internshipId — must be a proper 24-char hex ObjectId
    const mongoose = require('mongoose');
    const validInternshipId = internshipId && mongoose.Types.ObjectId.isValid(internshipId)
      ? internshipId
      : null;

    if (_id) {
      // Update existing record by its own _id
      const app = await Application.findOneAndUpdate(
        { _id, user: req.user.id },
        { $set: { status, notes, deadline, interviewDate, followUpDate, ...snapshotFields } },
        { new: true }
      ).populate('internship');

      if (!app) return res.status(404).json({ message: 'Application not found' });
      return res.json(normalise(app));
    }

    // Build the filter for duplicate detection
    // When a valid internshipId is provided, match on user+internship+status
    // When no internshipId, just try to create (no de-dup possible on anonymous entries)
    const effectiveStatus = status || 'want_to_apply';

    if (validInternshipId) {
      // Use findOneAndUpdate with upsert to atomically insert-or-update
      const app = await Application.findOneAndUpdate(
        {
          user:       req.user.id,
          internship: validInternshipId,
          status:     effectiveStatus,
        },
        {
          $set: {
            notes, deadline, interviewDate, followUpDate,
            ...snapshotFields,
          },
          $setOnInsert: {
            user:       req.user.id,
            internship: validInternshipId,
            status:     effectiveStatus,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).populate('internship');
      return res.status(200).json(normalise(app));
    }

    // No valid internshipId — plain insert (custom / external entry)
    const newApp = await Application.create({
      user:   req.user.id,
      status: effectiveStatus,
      notes,
      deadline,
      interviewDate,
      followUpDate,
      ...snapshotFields,
    });
    const populated = await Application.findById(newApp._id).populate('internship');
    return res.status(201).json(normalise(populated));

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   PUT /api/applications/:id/status
// @desc    Update status / deadline / notes of an application
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, deadline, interviewDate, followUpDate, notes } = req.body;
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status, deadline, interviewDate, followUpDate, notes },
      { new: true }
    ).populate('internship');

    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(normalise(app));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/applications/:id
// @desc    Delete an application
router.delete('/:id', protect, async (req, res) => {
  try {
    const app = await Application.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json({ message: 'Removed from tracker', success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
