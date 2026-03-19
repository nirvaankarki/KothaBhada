import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../../models/userModel.js';
import { sendSignupVerificationEmail } from '../../utils/emailService.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

export async function signup(req, res) {
    try {
        const { name, email, password, confirmPassword, role, phone } = req.body;
        const normalizedRole = String(role || '').trim().toLowerCase();

        // Validate required fields
        if (!name || !email || !password || !confirmPassword || !normalizedRole) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!['user', 'landlord'].includes(normalizedRole)) {
            return res.status(400).json({ message: 'Role must be either user or landlord' });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
        const isLandlord = normalizedRole === 'landlord';

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: normalizedRole,
            phone: phone?.trim() || '',
            isEmailVerified: isLandlord ? true : false,
            emailVerificationCode: isLandlord ? null : verificationCode,
            emailVerificationCodeExpiry: isLandlord ? null : verificationCodeExpiry
        });

        await newUser.save();

        if (isLandlord) {
            const token = jwt.sign(
                { userId: newUser._id, email: newUser.email, role: newUser.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.status(201).json({
                message: 'Landlord account created successfully',
                token,
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    phone: newUser.phone || '',
                    profilePhoto: newUser.profilePhoto || null,
                    isEmailVerified: true
                }
            });
        }

        const emailResult = await sendSignupVerificationEmail(email, verificationCode);
        if (!emailResult.success) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`Signup verification code for ${email}: ${verificationCode}`);
                return res.status(201).json({
                    message: 'User registered. Email service is not configured, use dev code to verify.',
                    requiresEmailVerification: true,
                    email: newUser.email,
                    devVerificationCode: verificationCode
                });
            }

            await User.findByIdAndDelete(newUser._id);
            return res.status(500).json({
                message: emailResult.notConfigured
                    ? 'Email service is not configured on server'
                    : 'Failed to send verification email. Please try again.'
            });
        }

        res.status(201).json({
            message: 'User registered successfully',
            requiresEmailVerification: true,
            email: newUser.email
        });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
}
