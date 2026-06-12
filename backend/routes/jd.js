const express = require('express');
const router = express.Router();
const { uploadJD, getJDs, getJD, deleteJD } = require('../controllers/jdController');
const { protect } = require('../middleware/auth');

router.post('/', protect, uploadJD);
router.get('/', protect, getJDs);
router.get('/:id', protect, getJD);
router.delete('/:id', protect, deleteJD);

module.exports = router;
