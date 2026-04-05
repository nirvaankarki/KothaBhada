import mongoose from 'mongoose';
import { Report } from '../../models/reportModel.js';
import { Notification } from '../../models/notificationModel.js';
import { Room } from '../../models/roomModel.js';
import { logAdminAction } from '../../utils/adminAuditLogger.js';

const ALLOWED_REPORT_STATUSES = new Set(['open', 'in_review', 'resolved', 'dismissed']);
const ALLOWED_LISTING_CONTENT_ACTIONS = new Set(['delete_listing', 'warn_landlord']);

function cleanText(value) {
  return String(value || '').trim();
}

export async function getAdminReports(req, res) {
  try {
    const statusFilter = cleanText(req.query?.status).toLowerCase();
    const search = cleanText(req.query?.search);
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit) || 80));

    const filter = {};
    if (ALLOWED_REPORT_STATUSES.has(statusFilter)) {
      filter.status = statusFilter;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { description: regex },
        { reasonCategory: regex },
        { targetType: regex },
        { targetId: regex },
        { adminNote: regex },
        { landlordResponseNote: regex },
      ];
    }

    const reports = await Report.find(filter)
      .populate('reporterId', 'name email role')
      .populate('resolvedBy', 'name email')
      .populate('targetOwnerId', 'name email role')
      .populate('targetListingId', 'title location ownerName ownerEmail ownerPhone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      reports,
      meta: {
        count: reports.length,
        status: statusFilter || 'all',
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load reports',
      error: error.message,
    });
  }
}

export async function applyAdminReportedListingAction(req, res) {
  try {
    const { reportId } = req.params;
    const action = cleanText(req.body?.action).toLowerCase();
    const adminNote = cleanText(req.body?.adminNote);

    if (!mongoose.Types.ObjectId.isValid(String(reportId || ''))) {
      return res.status(400).json({ message: 'Invalid report id' });
    }

    if (!ALLOWED_LISTING_CONTENT_ACTIONS.has(action)) {
      return res.status(400).json({ message: 'action must be delete_listing or warn_landlord' });
    }

    if (!adminNote) {
      return res.status(400).json({ message: 'Admin note is required for this action' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (String(report.targetType || '').toLowerCase() !== 'listing') {
      return res.status(400).json({ message: 'This action is only allowed for listing reports' });
    }

    if (['resolved', 'dismissed'].includes(String(report.status || '').toLowerCase())) {
      return res.status(409).json({ message: 'This report is already finalized' });
    }

    const listingIdCandidate = report.targetListingId
      || (mongoose.Types.ObjectId.isValid(String(report.targetId || '')) ? report.targetId : null);
    const listing = listingIdCandidate ? await Room.findById(listingIdCandidate) : null;
    const landlordId = report.targetOwnerId || listing?.ownerId || null;

    if (action === 'delete_listing' && listing) {
      await Room.findByIdAndDelete(listing._id);
    }

    report.status = 'resolved';
    report.adminNote = adminNote;
    report.adminDecisionSeverity = action === 'delete_listing' ? 'major' : 'minor';
    report.adminDecisionAction = action;
    report.resolvedBy = req.user?.userId || null;
    report.resolvedAt = new Date();
    if (!report.targetListingId && listing?._id) {
      report.targetListingId = listing._id;
    }
    if (!report.targetOwnerId && landlordId) {
      report.targetOwnerId = landlordId;
    }
    await report.save();

    if (landlordId && mongoose.Types.ObjectId.isValid(String(landlordId))) {
      await Notification.create({
        userId: landlordId,
        role: 'landlord',
        type: action === 'delete_listing' ? 'listing_deleted_by_admin' : 'listing_warning',
        title: action === 'delete_listing' ? 'Listing removed by admin' : 'Warning on your listing',
        message: action === 'delete_listing'
          ? `Your listing has been removed by admin after report review. Reason: ${adminNote}`
          : `Admin warning on your listing: ${adminNote}`,
        metadata: {
          reportId: String(report._id),
          listingId: listing ? String(listing._id) : String(report.targetId || ''),
          action,
        },
      });
    }

    await Notification.create({
      userId: report.reporterId,
      role: report.reporterRole,
      type: 'report_status_updated',
      title: action === 'delete_listing' ? 'Reported listing removed' : 'Warning sent to landlord',
      message: action === 'delete_listing'
        ? `Admin removed the reported listing. Note: ${adminNote}`
        : `Admin sent a warning to the landlord. Note: ${adminNote}`,
      metadata: {
        reportId: String(report._id),
        action,
        status: 'resolved',
      },
    });

    await logAdminAction({
      adminUser: req.user,
      action: action === 'delete_listing' ? 'delete_reported_listing' : 'warn_landlord_for_listing_report',
      targetType: 'report',
      targetId: String(report._id),
      targetLabel: listing?.title || String(report.targetId || 'listing-report'),
      reason: adminNote,
      metadata: {
        action,
        listingId: listing ? String(listing._id) : String(report.targetId || ''),
        landlordId: landlordId ? String(landlordId) : '',
      },
    });

    return res.status(200).json({
      message: action === 'delete_listing'
        ? 'Reported listing deleted successfully'
        : 'Warning sent to landlord successfully',
      report,
      listingDeleted: action === 'delete_listing',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to apply reported listing action',
      error: error.message,
    });
  }
}

export async function updateAdminReportStatus(req, res) {
  try {
    const { reportId } = req.params;
    const nextStatus = cleanText(req.body?.status).toLowerCase();
    const adminNote = cleanText(req.body?.adminNote);

    if (!mongoose.Types.ObjectId.isValid(String(reportId || ''))) {
      return res.status(400).json({ message: 'Invalid report id' });
    }

    if (!ALLOWED_REPORT_STATUSES.has(nextStatus) || nextStatus === 'open') {
      return res.status(400).json({ message: 'Status must be in_review, resolved, or dismissed' });
    }

    if (['resolved', 'dismissed'].includes(nextStatus) && !adminNote) {
      return res.status(400).json({ message: 'Please provide resolution note for this action' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const isListingReport = String(report.targetType || '').toLowerCase() === 'listing';
    if (isListingReport && nextStatus === 'resolved') {
      return res.status(400).json({
        message: 'Use listing decision action: minor rejects listing, major bans landlord account',
      });
    }

    report.status = nextStatus;
    report.adminNote = adminNote;

    if (nextStatus === 'in_review') {
      report.resolvedBy = null;
      report.resolvedAt = null;
    } else {
      report.resolvedBy = req.user?.userId || null;
      report.resolvedAt = new Date();
    }

    await report.save();

    await Notification.create({
      userId: report.reporterId,
      role: report.reporterRole,
      type: 'report_status_updated',
      title: 'Report status updated',
      message: `Your report is now marked as ${nextStatus.replace('_', ' ')}.${adminNote ? ` Note: ${adminNote}` : ''}`,
      metadata: {
        reportId: String(report._id),
        status: nextStatus,
        adminNote,
      },
    });

    await logAdminAction({
      adminUser: req.user,
      action: 'update_report_status',
      targetType: 'report',
      targetId: String(report._id),
      targetLabel: String(report.targetType || 'report'),
      reason: adminNote,
      metadata: {
        status: nextStatus,
      },
    });

    return res.status(200).json({
      message: 'Report status updated successfully',
      report,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update report status',
      error: error.message,
    });
  }
}
