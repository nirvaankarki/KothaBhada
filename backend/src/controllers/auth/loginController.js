import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../../models/userModel.js';
import { resolveAccountAccess } from '../../utils/accountAccess.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare passwords
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in',
                requiresEmailVerification: true,
                email: user.email
            });
        }

        const access = await resolveAccountAccess(user);
        if (access.blocked) {
            return res.status(access.statusCode || 403).json({ message: access.message || 'Access denied' });
        }

        user.lastLoginAt = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || '',
                profilePhoto: user.profilePhoto || null,
                isEmailVerified: user.isEmailVerified,
                isLandlordVerified: Boolean(user.isLandlordVerified),
                landlordKycStatus: user.landlordKycStatus || 'not_submitted',
                moderatorPermissions: Array.isArray(user.moderatorPermissions) ? user.moderatorPermissions : []
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
}
