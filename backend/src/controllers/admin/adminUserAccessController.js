import mongoose from 'mongoose';
import { User } from '../../models/userModel.js';
import { Notification } from '../../models/notificationModel.js';
import { logAdminAction } from '../../utils/adminAuditLogger.js';

const ALLOWED_STATUSES = new Set(['active', 'suspended', 'shadow_banned', 'banned']);

function cleanText(value) {
  return String(value || '').trim();
}

export async function setUserAccountStatus(req, res) {
  try {
    const { userId } = req.params;
    const accountStatus = cleanText(req.body?.accountStatus).toLowerCase();
    const reason = cleanText(req.body?.reason);
    const suspensionDaysRaw = Number(req.body?.suspensionDays);

    if (!mongoose.Types.ObjectId.isValid(String(userId || ''))) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (!ALLOWED_STATUSES.has(accountStatus)) {
      return res.status(400).json({ message: 'accountStatus must be active, suspended, shadow_banned, or banned' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetRole = String(targetUser.role || '').toLowerCase();
    if (!['user', 'landlord'].includes(targetRole)) {
      return res.status(400).json({ message: 'Only renter and landlord accounts can be managed here' });
    }

    if (accountStatus !== 'active' && !reason) {
      return res.status(400).json({ message: 'Please provide a reason for this account action' });
    }

    if (accountStatus === 'suspended') {
      const suspensionDays = Number.isFinite(suspensionDaysRaw) && suspensionDaysRaw > 0
        ? Math.min(365, Math.floor(suspensionDaysRaw))
        : 7;
      const suspensionUntil = new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000);

      targetUser.accountStatus = 'suspended';
      targetUser.suspensionUntil = suspensionUntil;
      targetUser.accountActionReason = reason;
      targetUser.accountActionBy = req.user?.userId || null;
      targetUser.accountActionAt = new Date();
    } else if (accountStatus === 'banned') {
      targetUser.accountStatus = 'banned';
      targetUser.suspensionUntil = null;
      targetUser.accountActionReason = reason;
      targetUser.accountActionBy = req.user?.userId || null;
      targetUser.accountActionAt = new Date();
    } else if (accountStatus === 'shadow_banned') {
      targetUser.accountStatus = 'shadow_banned';
      targetUser.suspensionUntil = null;
      targetUser.accountActionReason = reason;
      targetUser.accountActionBy = req.user?.userId || null;
      targetUser.accountActionAt = new Date();
    } else {
      targetUser.accountStatus = 'active';
      targetUser.suspensionUntil = null;
      targetUser.accountActionReason = '';
      targetUser.accountActionBy = req.user?.userId || null;
      targetUser.accountActionAt = new Date();
    }

    await targetUser.save();

    if (accountStatus !== 'active') {
      await Notification.create({
        userId: targetUser._id,
        role: targetRole,
        type: 'account_action',
        title: accountStatus === 'banned'
          ? 'Account banned'
          : accountStatus === 'shadow_banned'
            ? 'Account restricted'
            : 'Account suspended',
        message: accountStatus === 'banned'
          ? `Your account has been banned by admin. Reason: ${reason}`
          : accountStatus === 'shadow_banned'
            ? `Your account has limited platform visibility due to policy concerns. Reason: ${reason}`
            : `Your account has been suspended by admin${targetUser.suspensionUntil ? ` until ${targetUser.suspensionUntil.toLocaleString()}` : ''}. Reason: ${reason}`,
        metadata: {
          accountStatus,
          reason,
          suspensionUntil: targetUser.suspensionUntil,
        },
      });
    }

    await logAdminAction({
      adminUser: req.user,
      action: 'update_user_account_status',
      targetType: 'user',
      targetId: String(targetUser._id),
      targetLabel: targetUser.email,
      reason,
      metadata: {
        accountStatus,
        suspensionUntil: targetUser.suspensionUntil,
      },
    });

    return res.status(200).json({
      message: `Account status updated to ${accountStatus}`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetRole,
        accountStatus: targetUser.accountStatus,
        suspensionUntil: targetUser.suspensionUntil,
        accountActionReason: targetUser.accountActionReason,
        accountActionAt: targetUser.accountActionAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update account status',
      error: error.message,
    });
  }
}
