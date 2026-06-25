const express = require('express');
const interviewController = require('./interview.controller');
const audioUpload = require('../utils/audioUpload');
const multer = require('multer');
const router = express.Router();

const { protect } = require('../middleware/auth');

const uploadMemory = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.post('/start', uploadMemory.single('resume'), interviewController.startInterview);
router.post('/evaluate', audioUpload.single('audio'), interviewController.processAnswer);
router.post('/transcribe', audioUpload.single('audio'), interviewController.transcribeAudio);
router.post('/report', interviewController.generateReport);
router.post('/speak', interviewController.speakText);
router.get('/reports', interviewController.getReports);

module.exports = router;
