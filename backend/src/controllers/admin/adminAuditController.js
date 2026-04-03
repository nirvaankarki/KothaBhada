import { AdminAuditLog } from '../../models/adminAuditLogModel.js';

function cleanText(value) {
  return String(value || '').trim();
}

export async function getAdminAuditLogs(req, res) {
  try {
    const action = cleanText(req.query?.action).toLowerCase();
    const targetType = cleanText(req.query?.targetType).toLowerCase();
    const search = cleanText(req.query?.search);
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit) || 80));

    const filter = {};

    if (action) {
      filter.action = action;
    }

    if (targetType) {
      filter.targetType = targetType;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { action: regex },
        { targetType: regex },
        { targetLabel: regex },
        { reason: regex },
        { adminEmail: regex },
      ];
    }

    const logs = await AdminAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      logs,
      meta: {
        count: logs.length,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load admin audit logs',
      error: error.message,
    });
  }
}
