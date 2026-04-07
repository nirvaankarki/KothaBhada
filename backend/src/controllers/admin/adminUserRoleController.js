import mongoose from 'mongoose';
import { User } from '../../models/userModel.js';
import { Notification } from '../../models/notificationModel.js';
import { logAdminAction } from '../../utils/adminAuditLogger.js';
import { MODERATOR_PERMISSIONS, normalizePermissionList } from '../../utils/adminPermissions.js';

const ALLOWED_ROLES = new Set(['user', 'landlord', 'moderator', 'admin']);

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

export async function setUserRole(req, res) {
  try {
    const requestUserId = req.params?.userId || req.body?.userId;
    const { email, role, moderatorPermissions = [] } = req.body;
    const normalizedRole = normalizeRole(role);
    const normalizedPermissions = normalizePermissionList(moderatorPermissions);

    if (!normalizedRole || !ALLOWED_ROLES.has(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be user, landlord, moderator, or admin' });
    }

    if (!requestUserId && !email) {
      return res.status(400).json({ message: 'Provide userId or email to update role' });
    }

    let targetUser = null;

    if (requestUserId) {
      if (!mongoose.Types.ObjectId.isValid(String(requestUserId))) {
        return res.status(400).json({ message: 'Invalid userId format' });
      }
      targetUser = await User.findById(requestUserId);
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

    if (currentRole === normalizedRole && normalizedRole !== 'moderator') {
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

    if (normalizedRole === 'moderator' && !normalizedPermissions.length) {
      return res.status(400).json({
        message: `Please provide moderatorPermissions. Allowed permissions: ${MODERATOR_PERMISSIONS.join(', ')}`,
      });
    }

    targetUser.role = normalizedRole;
    targetUser.moderatorPermissions = normalizedRole === 'moderator' ? normalizedPermissions : [];
    await targetUser.save();

    await Notification.create({
      userId: targetUser._id,
      role: normalizedRole,
      type: 'role_updated',
      title: 'Account role updated',
      message: normalizedRole === 'moderator'
        ? `Your account role is now moderator. Permissions: ${normalizedPermissions.join(', ')}`
        : `Your account role is now ${normalizedRole}.`,
      metadata: {
        role: normalizedRole,
        moderatorPermissions: normalizedPermissions,
      },
    });

    await logAdminAction({
      adminUser: req.user,
      action: 'update_user_role',
      targetType: 'user',
      targetId: String(targetUser._id),
      targetLabel: targetUser.email,
      reason: `Role changed to ${normalizedRole}`,
      metadata: {
        previousRole: currentRole,
        role: normalizedRole,
        moderatorPermissions: normalizedPermissions,
      },
    });

    return res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        moderatorPermissions: Array.isArray(targetUser.moderatorPermissions) ? targetUser.moderatorPermissions : [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update user role',
      error: error.message,
    });
  }
}
