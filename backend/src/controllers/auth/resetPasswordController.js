import bcryptjs from 'bcryptjs';
import { User } from '../../models/userModel.js';

export async function resetPassword(req, res) {
    try {
        const { email, verificationCode, newPassword, confirmPassword } = req.body;

        // Validate inputs
        if (!email || !verificationCode || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if code is expired
        if (!user.resetCodeExpiry || new Date() > user.resetCodeExpiry) {
            return res.status(400).json({ message: 'Verification code has expired' });
        }

        // Verify code
        if (user.resetCode !== verificationCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Hash new password
        const hashedPassword = await bcryptjs.hash(newPassword, 10);

        // Update password and clear reset fields
        user.password = hashedPassword;
        user.resetCode = null;
        user.resetCodeExpiry = null;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
}
