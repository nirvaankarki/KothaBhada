import mongoose from 'mongoose';
import { User } from '../../models/userModel.js';

const ALLOWED_ROLES = new Set(['user', 'landlord', 'admin']);

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export async function setUserRole(req, res) {
  try {
    const { userId, email, role } = req.body;
    const normalizedRole = normalizeRole(role);

    if (!normalizedRole || !ALLOWED_ROLES.has(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be user, landlord, or admin' });
    }

    if (!userId && !email) {
      return res.status(400).json({ message: 'Provide userId or email to update role' });
    }

    let targetUser = null;

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(String(userId))) {
        return res.status(400).json({ message: 'Invalid userId format' });
      }
      targetUser = await User.findById(userId);
    } else {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(400).json({ message: 'Email cannot be empty' });
      }
      targetUser = await User.findOne({ email: normalizedEmail });
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requesterId = String(req.user?.userId || '');
    const targetUserId = String(targetUser._id);
    const currentRole = normalizeRole(targetUser.role);

    if (requesterId && requesterId === targetUserId && normalizedRole !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    if (currentRole === 'admin' && normalizedRole !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'At least one admin account must remain' });
      }
    }

    if (currentRole === normalizedRole) {
      return res.status(200).json({
        message: 'User role is already set',
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        },
      });
    }

    targetUser.role = normalizedRole;
    await targetUser.save();

    return res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update user role',
      error: error.message,
    });
  }
}
