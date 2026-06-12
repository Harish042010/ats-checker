const express = require('express');
const router = express.Router();
const { analyze, getReport, getReports, getAnalysisResult } = require('../controllers/analysisController');
const { protect } = require('../middleware/auth');

router.post('/', protect, analyze);
router.get('/reports', protect, getReports);
router.get('/report/:id', protect, getReport);
router.get('/result/:id', protect, getAnalysisResult);

module.exports = router;
