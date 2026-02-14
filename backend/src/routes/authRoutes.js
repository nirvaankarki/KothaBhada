import express from 'express';
import { signup } from '../controllers/auth/signupController.js';
import { login } from '../controllers/auth/loginController.js';
import { forgotPassword } from '../controllers/auth/forgotPasswordController.js';
import { verifyCode } from '../controllers/auth/verifyCodeController.js';
import { resetPassword } from '../controllers/auth/resetPasswordController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);

export default router;
