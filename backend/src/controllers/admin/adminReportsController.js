import mongoose from 'mongoose';
import { Report } from '../../models/reportModel.js';
import { Notification } from '../../models/notificationModel.js';
import { Room } from '../../models/roomModel.js';
import { User } from '../../models/userModel.js';
import { logAdminAction } from '../../utils/adminAuditLogger.js';

const ALLOWED_REPORT_STATUSES = new Set(['open', 'in_review', 'resolved', 'dismissed']);

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeSeverity(value) {
  const normalized = cleanText(value).toLowerCase();
  return ['minor', 'major'].includes(normalized) ? normalized : '';
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

export async function applyAdminListingReportDecision(req, res) {
  try {
    const { reportId } = req.params;
    const severity = normalizeSeverity(req.body?.severity);
    const adminNote = cleanText(req.body?.adminNote);

    if (!mongoose.Types.ObjectId.isValid(String(reportId || ''))) {
      return res.status(400).json({ message: 'Invalid report id' });
    }

    if (!severity) {
      return res.status(400).json({ message: 'Severity must be minor or major' });
    }

    if (!adminNote) {
      return res.status(400).json({ message: 'Admin decision note is required' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (String(report.targetType || '').toLowerCase() !== 'listing') {
      return res.status(400).json({ message: 'This decision endpoint is only for listing reports' });
    }

    if (['resolved', 'dismissed'].includes(String(report.status || '').toLowerCase())) {
      return res.status(409).json({ message: 'This report is already finalized' });
    }

    const listingIdCandidate = report.targetListingId || (mongoose.Types.ObjectId.isValid(String(report.targetId || '')) ? report.targetId : null);
    const listing = listingIdCandidate
      ? await Room.findById(listingIdCandidate)
      : null;

    const landlordId = report.targetOwnerId || listing?.ownerId || null;
    const reportReason = String(report.reasonCategory || 'policy_violation').replace('_', ' ');

    if (severity === 'minor') {
      if (!listing) {
        return res.status(400).json({ message: 'Listing is required to apply minor report decision' });
      }

      listing.status = 'inactive';
      listing.moderationStatus = 'rejected';
      listing.moderationNote = `Rejected after renter report (${reportReason}). ${adminNote}`;
      listing.moderationReviewedAt = new Date();
      listing.moderationReviewedBy = req.user?.userId || null;
      await listing.save();
    }

    if (severity === 'major') {
      if (!landlordId || !mongoose.Types.ObjectId.isValid(String(landlordId))) {
        return res.status(400).json({ message: 'Landlord account could not be determined for this report' });
      }

      const landlordUser = await User.findById(landlordId);
      if (!landlordUser) {
        return res.status(404).json({ message: 'Landlord account not found for this report' });
      }

      landlordUser.accountStatus = 'banned';
      landlordUser.suspensionUntil = null;
      landlordUser.accountActionReason = `Banned after major listing report: ${adminNote}`;
      landlordUser.accountActionBy = req.user?.userId || null;
      landlordUser.accountActionAt = new Date();
      await landlordUser.save();

      if (listing) {
        listing.status = 'inactive';
        listing.moderationStatus = 'rejected';
        listing.moderationNote = `Rejected and owner banned after major report. ${adminNote}`;
        listing.moderationReviewedAt = new Date();
        listing.moderationReviewedBy = req.user?.userId || null;
        await listing.save();
      }

      await Notification.create({
        userId: landlordUser._id,
        role: 'landlord',
        type: 'account_action',
        title: 'Account banned',
        message: `Your account has been banned by admin after report review. Reason: ${adminNote}`,
        metadata: {
          accountStatus: 'banned',
          reason: adminNote,
          reportId: String(report._id),
          listingId: listing ? String(listing._id) : String(report.targetId || ''),
        },
      });
    }

    report.status = 'resolved';
    report.adminNote = adminNote;
    report.adminDecisionSeverity = severity;
    report.adminDecisionAction = severity === 'major' ? 'ban_landlord' : 'reject_listing';
    report.resolvedBy = req.user?.userId || null;
    report.resolvedAt = new Date();
    if (!report.targetListingId && listing?._id) {
      report.targetListingId = listing._id;
    }
    if (!report.targetOwnerId && landlordId) {
      report.targetOwnerId = landlordId;
    }
    await report.save();

    await Notification.create({
      userId: report.reporterId,
      role: report.reporterRole,
      type: 'report_status_updated',
      title: 'Report decision completed',
      message: severity === 'major'
        ? `Your listing report was marked major. The landlord account has been banned. Note: ${adminNote}`
        : `Your listing report was marked minor. The property has been rejected. Note: ${adminNote}`,
      metadata: {
        reportId: String(report._id),
        severity,
        listingId: listing ? String(listing._id) : String(report.targetId || ''),
      },
    });

    if (landlordId && severity === 'minor') {
      await Notification.create({
        userId: landlordId,
        role: 'landlord',
        type: 'listing_rejected',
        title: 'Listing rejected after report review',
        message: `Your listing was rejected after admin reviewed a renter report. Reason: ${adminNote}`,
        metadata: {
          reportId: String(report._id),
          listingId: listing ? String(listing._id) : String(report.targetId || ''),
          moderationStatus: 'rejected',
          moderationNote: adminNote,
        },
      });
    }

    await logAdminAction({
      adminUser: req.user,
      action: severity === 'major' ? 'resolve_report_major_ban_landlord' : 'resolve_report_minor_reject_listing',
      targetType: 'report',
      targetId: String(report._id),
      targetLabel: listing?.title || String(report.targetId || 'listing-report'),
      reason: adminNote,
      metadata: {
        severity,
        listingId: listing ? String(listing._id) : String(report.targetId || ''),
        landlordId: landlordId ? String(landlordId) : '',
      },
    });

    return res.status(200).json({
      message: severity === 'major'
        ? 'Major report resolved: landlord banned and listing blocked'
        : 'Minor report resolved: listing rejected',
      report,
      listing: listing || null,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to apply listing report decision',
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
