import bcryptjs from 'bcryptjs';
import { User } from '../../models/userModel.js';
import { sendSignupVerificationEmail } from '../../utils/emailService.js';

export async function signup(req, res) {
    try {
        const { name, email, password, confirmPassword, role, phone } = req.body;

        // Validate required fields
        if (!name || !email || !password || !confirmPassword || !role) {
            return res.status(400).json({ message: 'All fields are required' });
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

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role,
            phone: phone?.trim() || '',
            isEmailVerified: false,
            emailVerificationCode: verificationCode,
            emailVerificationCodeExpiry: verificationCodeExpiry
        });

        await newUser.save();

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
