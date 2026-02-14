import { User } from '../../models/userModel.js';
import { sendVerificationEmail } from '../../utils/emailService.js';

export async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiry time (10 minutes)
        const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

        // Update user with reset code and expiry
        user.resetCode = verificationCode;
        user.resetCodeExpiry = expiryTime;
        await user.save();

        // Send email with verification code
        const emailResult = await sendVerificationEmail(email, verificationCode);

        if (!emailResult.success) {
            return res.status(500).json({ message: 'Failed to send verification code' });
        }

        res.status(200).json({ message: 'Verification code sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Error in password recovery', error: error.message });
    }
}
