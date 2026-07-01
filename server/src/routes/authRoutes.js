const express = require('express');
const { requestOtp, verifyOtp, logout, updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/logout', logout);
router.get('/me', protect, (req, res) => res.json(req.user)); // Inline me route for simplicity
router.put('/profile', protect, updateProfile);

module.exports = router;
