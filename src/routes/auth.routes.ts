import { Router } from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  verifyEmailOTP,
  verifySmsOTP,
  resendSMSOTP,
  resendEmailOTP,
  forgetPassword,
  deleteUser,
} from '../controllers/auth.controller';

// import { loginLimiter } from '../middlewares/auth.middleware';
import { otpLimiter } from '../middlewares/otp.middleware';

const router = Router();

// Public routes
router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/refresh-token', refreshAccessToken);

// Protected actions with CSRF + rate limiting
router.post('/logout', logoutUser);

router.post('/verify-email-otp', otpLimiter, verifyEmailOTP);

router.post('/verify-sms-otp', otpLimiter, verifySmsOTP);

router.post('/resend-sms-otp', otpLimiter, resendSMSOTP);

router.post('/resend-email-otp', otpLimiter, resendEmailOTP);

router.post('/forget-password', forgetPassword);

router.delete('/delete-user', deleteUser);

export default router;