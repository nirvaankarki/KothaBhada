import { User } from '../../models/userModel.js';

export async function verifyCode(req, res) {
    try {
        const { email, verificationCode } = req.body;

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

        res.status(200).json({ message: 'Code verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying code', error: error.message });
    }
}
