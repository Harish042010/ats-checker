const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { directAnalyze } = require('../controllers/directAnalysisController');

router.post('/', upload.single('resume'), directAnalyze);

module.exports = router;
