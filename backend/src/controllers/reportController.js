import mongoose from 'mongoose';
import { Report } from '../models/reportModel.js';
import { Room } from '../models/roomModel.js';
import { Notification } from '../models/notificationModel.js';

const ALLOWED_REPORTER_ROLES = new Set(['user', 'landlord']);
function cleanText(value) {
  return String(value || '').trim();
}

async function createNotification({ userId, role, type, title, message, metadata = {} }) {
  if (!userId || !role || !type || !title || !message) return;

  await Notification.create({
    userId,
    role,
    type,
    title,
    message,
    metadata,
  });
}

export async function createReport(req, res) {
  try {
    const reporterId = req.user?.userId;
    const reporterRole = String(req.user?.role || '').toLowerCase();

    if (!reporterId || !ALLOWED_REPORTER_ROLES.has(reporterRole)) {
      return res.status(403).json({ message: 'Only renters and landlords can submit reports' });
    }

    const targetType = cleanText(req.body?.targetType || 'other').toLowerCase();
    const targetId = cleanText(req.body?.targetId);
    const reasonCategory = cleanText(req.body?.reasonCategory || 'other').toLowerCase();
    const description = cleanText(req.body?.description);

    if (!description) {
      return res.status(400).json({ message: 'Report description is required' });
    }

    const createPayload = {
      reporterId,
      reporterRole,
      targetType,
      targetId,
      reasonCategory,
      description,
      status: 'open',
    };

    let listing = null;
    if (targetType === 'listing') {
      if (reporterRole !== 'user') {
        return res.status(403).json({ message: 'Only renters can report property listings' });
      }

      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(400).json({ message: 'Valid listing id is required for listing reports' });
      }

      listing = await Room.findById(targetId).select('_id title ownerId ownerName');
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      if (String(listing.ownerId || '') === String(reporterId)) {
        return res.status(400).json({ message: 'You cannot report your own listing' });
      }

      createPayload.targetListingId = listing._id;
      createPayload.targetOwnerId = listing.ownerId || null;
    }

    const report = await Report.create(createPayload);

    if (targetType === 'listing' && listing?.ownerId) {
      await createNotification({
        userId: listing.ownerId,
        role: 'landlord',
        type: 'listing_reported',
        title: 'Your listing was reported by a renter',
        message: `Your listing "${listing.title || 'listing'}" was reported for ${reasonCategory.replace('_', ' ')}. Please review and respond from your report center.`,
        metadata: {
          reportId: String(report._id),
          listingId: String(listing._id),
          reasonCategory,
        },
      });
    }

    return res.status(201).json({
      message: 'Report submitted successfully',
      report,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to submit report',
      error: error.message,
    });
  }
}

export async function getMyReports(req, res) {
  try {
    const reporterId = req.user?.userId;
    if (!reporterId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const reports = await Report.find({ reporterId })
      .populate('targetListingId', 'title location ownerName')
      .select('targetType targetId targetListingId reasonCategory description status adminNote landlordResponseNote adminDecisionSeverity adminDecisionAction resolvedAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ reports });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load reports',
      error: error.message,
    });
  }
}

export async function getOwnerListingReports(req, res) {
  try {
    if (String(req.user?.role || '').toLowerCase() !== 'landlord') {
      return res.status(403).json({ message: 'Only landlords can access listing report responses' });
    }

    const ownerId = req.user?.userId;

    const reports = await Report.find({
      targetType: 'listing',
      targetOwnerId: ownerId,
    })
      .populate('reporterId', 'name email role')
      .populate('targetListingId', 'title location')
      .select('targetType targetId targetListingId reasonCategory description status adminNote landlordResponseNote landlordRespondedAt adminDecisionSeverity adminDecisionAction resolvedAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ reports });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load reports for landlord listings',
      error: error.message,
    });
  }
}

export async function respondToOwnerListingReport(req, res) {
  try {
    if (String(req.user?.role || '').toLowerCase() !== 'landlord') {
      return res.status(403).json({ message: 'Only landlords can respond to listing reports' });
    }

    const { reportId } = req.params;
    const landlordResponseNote = cleanText(req.body?.landlordResponseNote);

    if (!mongoose.Types.ObjectId.isValid(String(reportId || ''))) {
      return res.status(400).json({ message: 'Invalid report id' });
    }

    if (!landlordResponseNote) {
      return res.status(400).json({ message: 'Please provide a response note for the renter and admin' });
    }

    const report = await Report.findOne({
      _id: reportId,
      targetType: 'listing',
      targetOwnerId: req.user?.userId,
    });

    if (!report) {
      return res.status(404).json({ message: 'Listing report not found' });
    }

    if (['resolved', 'dismissed'].includes(String(report.status || '').toLowerCase())) {
      return res.status(409).json({ message: 'This report is already finalized by admin' });
    }

    report.landlordResponseNote = landlordResponseNote;
    report.landlordRespondedAt = new Date();
    report.landlordRespondedBy = req.user?.userId || null;
    if (String(report.status || '').toLowerCase() === 'open') {
      report.status = 'in_review';
    }

    await report.save();

    await createNotification({
      userId: report.reporterId,
      role: report.reporterRole,
      type: 'listing_report_landlord_response',
      title: 'Landlord responded to your report',
      message: `The landlord has responded to your listing report. Admin will review this case soon.`,
      metadata: {
        reportId: String(report._id),
        listingId: report.targetId,
      },
    });

    return res.status(200).json({
      message: 'Response submitted for this report',
      report,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to submit landlord response for report',
      error: error.message,
    });
  }
}
