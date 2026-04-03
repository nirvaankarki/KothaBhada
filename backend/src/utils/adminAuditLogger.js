import { AdminAuditLog } from '../models/adminAuditLogModel.js';

export async function logAdminAction({
  adminUser,
  action,
  targetType,
  targetId = '',
  targetLabel = '',
  reason = '',
  metadata = {},
}) {
  if (!adminUser?.userId || !action || !targetType) {
    return;
  }

  try {
    await AdminAuditLog.create({
      adminId: adminUser.userId,
      adminEmail: String(adminUser.email || '').trim().toLowerCase(),
      action: String(action).trim(),
      targetType: String(targetType).trim(),
      targetId: String(targetId || '').trim(),
      targetLabel: String(targetLabel || '').trim(),
      reason: String(reason || '').trim(),
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });
  } catch {
    // Audit log failures should not block primary admin actions.
  }
}
