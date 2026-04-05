import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../../models/userModel.js';
import { sendSignupVerificationEmail } from '../../utils/emailService.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

export async function verifyEmail(req, res) {
    try {
        const { email, verificationCode } = req.body;

        if (!email || !verificationCode) {
            return res.status(400).json({ message: 'Email and verification code are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isEmailVerified) {
            const token = jwt.sign(
                { userId: user._id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.status(200).json({
                message: 'Email already verified',
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone || '',
                    isEmailVerified: true,
                    isLandlordVerified: Boolean(user.isLandlordVerified),
                    landlordKycStatus: user.landlordKycStatus || 'not_submitted'
                }
            });
        }

        if (!user.emailVerificationCodeExpiry || new Date() > user.emailVerificationCodeExpiry) {
            return res.status(400).json({ message: 'Verification code has expired' });
        }

        if (user.emailVerificationCode !== verificationCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        user.isEmailVerified = true;
        user.emailVerificationCode = null;
        user.emailVerificationCodeExpiry = null;
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Email verified successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                isEmailVerified: true,
                isLandlordVerified: Boolean(user.isLandlordVerified),
                landlordKycStatus: user.landlordKycStatus || 'not_submitted'
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error verifying email', error: error.message });
    }
}

export async function resendVerificationCode(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.emailVerificationCode = verificationCode;
        user.emailVerificationCodeExpiry = verificationCodeExpiry;
        await user.save();

        const emailResult = await sendSignupVerificationEmail(email, verificationCode);
        if (!emailResult.success) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`Resent signup verification code for ${email}: ${verificationCode}`);
                return res.status(200).json({
                    message: 'Email service is not configured, use dev code to verify.',
                    devVerificationCode: verificationCode
                });
            }

            return res.status(500).json({
                message: emailResult.notConfigured
                    ? 'Email service is not configured on server'
                    : 'Failed to resend verification email'
            });
        }

        return res.status(200).json({ message: 'Verification code sent to your email' });
    } catch (error) {
        return res.status(500).json({ message: 'Error resending verification code', error: error.message });
    }
}
