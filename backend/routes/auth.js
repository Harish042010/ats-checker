const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidator, loginValidator, updateProfileValidator } = require('../validators/authValidator');

router.post('/register', authLimiter, registerValidator, register);
router.post('/login', authLimiter, loginValidator, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidator, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;
