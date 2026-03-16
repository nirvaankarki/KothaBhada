import express from 'express';
import { signup } from '../controllers/auth/signupController.js';
import { login } from '../controllers/auth/loginController.js';
import { forgotPassword } from '../controllers/auth/forgotPasswordController.js';
import { verifyCode } from '../controllers/auth/verifyCodeController.js';
import { resetPassword } from '../controllers/auth/resetPasswordController.js';
import { getCurrentUser, updateCurrentUser } from '../controllers/auth/profileController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { verifyEmail, resendVerificationCode } from '../controllers/auth/emailVerificationController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-code', resendVerificationCode);
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateCurrentUser);

export default router;
