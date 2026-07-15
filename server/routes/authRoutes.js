const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  sendOtp,
  verifyRegisterOtpAndRegister,
  verifyLoginOtpAndLogin,
  googleLogin,
  getMe,
  forgotPasswordSendOtp,
  resetPasswordWithOtp,
  createAdmin,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/verify-register-otp', verifyRegisterOtpAndRegister);
router.post('/verify-login-otp', verifyLoginOtpAndLogin);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPasswordSendOtp);
router.post('/reset-password', resetPasswordWithOtp);
router.get('/me', protect, getMe);
router.post('/create-admin', createAdmin);

module.exports = router;

