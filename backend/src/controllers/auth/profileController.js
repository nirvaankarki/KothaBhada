import { User } from '../../models/userModel.js';

export async function getCurrentUser(req, res) {
    try {
        const user = await User.findById(req.user.userId).select('-password -resetCode -resetCodeExpiry');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone || ''
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
    }
}

export async function updateCurrentUser(req, res) {
    try {
        const { name, phone } = req.body;
        const updatePayload = {};

        if (name !== undefined) {
            if (!name || !name.trim()) {
                return res.status(400).json({ message: 'Name cannot be empty' });
            }
            updatePayload.name = name.trim();
        }

        if (phone !== undefined) {
            const normalizedPhone = String(phone).trim();
            if (normalizedPhone && !/^\+?[0-9\s-]{7,15}$/.test(normalizedPhone)) {
                return res.status(400).json({ message: 'Invalid contact number format' });
            }
            updatePayload.phone = normalizedPhone;
        }

        if (Object.keys(updatePayload).length === 0) {
            return res.status(400).json({ message: 'No profile fields provided for update' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            updatePayload,
            { new: true, runValidators: true }
        ).select('-password -resetCode -resetCodeExpiry');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone || ''
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
}
