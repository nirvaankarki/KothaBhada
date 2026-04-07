import mongoose from 'mongoose';
import { User } from '../../models/userModel.js';
import { Notification } from '../../models/notificationModel.js';
import { logAdminAction } from '../../utils/adminAuditLogger.js';

const ALLOWED_KYC_STATUSES = new Set(['pending', 'reupload_requested', 'verified', 'rejected', 'all']);
const ALLOWED_DECISIONS = new Set(['verify', 'reject', 'request_reupload']);

function cleanText(value) {
  return String(value || '').trim();
}

export async function getLandlordKycQueue(req, res) {
  try {
    const status = cleanText(req.query?.status).toLowerCase() || 'pending';
    const search = cleanText(req.query?.search);
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit) || 80));

    if (!ALLOWED_KYC_STATUSES.has(status)) {
      return res.status(400).json({ message: 'status must be pending, reupload_requested, verified, rejected, or all' });
    }

    const filter = {
      role: 'landlord',
      landlordKycDocumentImage: { $exists: true, $ne: '' },
    };

    if (status !== 'all') {
      filter.landlordKycStatus = status;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { landlordKycDocumentType: regex },
      ];
    }

    const landlords = await User.find(filter)
      .select('_id name email phone profilePhoto createdAt isLandlordVerified landlordKycDocumentType landlordKycDocumentImage landlordKycStatus landlordKycSubmittedAt landlordKycReviewedAt landlordKycReviewNote')
      .sort({ landlordKycSubmittedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      landlords: landlords.map((landlord) => ({
        id: landlord._id,
        name: landlord.name,
        email: landlord.email,
        phone: landlord.phone || '',
        profilePhoto: landlord.profilePhoto || null,
        createdAt: landlord.createdAt,
        isLandlordVerified: Boolean(landlord.isLandlordVerified),
        landlordKycDocumentType: landlord.landlordKycDocumentType || '',
        landlordKycDocumentImage: landlord.landlordKycDocumentImage || '',
        landlordKycStatus: landlord.landlordKycStatus || 'not_submitted',
        landlordKycSubmittedAt: landlord.landlordKycSubmittedAt || null,
        landlordKycReviewedAt: landlord.landlordKycReviewedAt || null,
        landlordKycReviewNote: landlord.landlordKycReviewNote || '',
      })),
      meta: {
        count: landlords.length,
        status,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load landlord KYC queue',
      error: error.message,
    });
  }
}

export async function reviewLandlordKyc(req, res) {
  try {
    const { userId } = req.params;
    const decision = cleanText(req.body?.decision).toLowerCase();
    const reviewNote = cleanText(req.body?.reviewNote);

    if (!mongoose.Types.ObjectId.isValid(String(userId || ''))) {
      return res.status(400).json({ message: 'Invalid landlord id' });
    }

    if (!ALLOWED_DECISIONS.has(decision)) {
      return res.status(400).json({ message: 'decision must be verify, reject, or request_reupload' });
    }

    if ((decision === 'reject' || decision === 'request_reupload') && !reviewNote) {
      return res.status(400).json({ message: 'Please provide review note for landlord feedback' });
    }

    const landlord = await User.findById(userId);
    if (!landlord || String(landlord.role || '').toLowerCase() !== 'landlord') {
      return res.status(404).json({ message: 'Landlord not found' });
    }

    if (!String(landlord.landlordKycDocumentImage || '').trim()) {
      return res.status(400).json({ message: 'No KYC document uploaded by this landlord' });
    }

    landlord.landlordKycStatus = decision === 'verify'
      ? 'verified'
      : decision === 'request_reupload'
        ? 'reupload_requested'
        : 'rejected';
    landlord.isLandlordVerified = decision === 'verify';
    landlord.landlordKycReviewedAt = new Date();
    landlord.landlordKycReviewedBy = req.user?.userId || null;
    landlord.landlordKycReviewNote = reviewNote;

    await landlord.save();

    await Notification.create({
      userId: landlord._id,
      role: 'landlord',
      type: decision === 'verify' ? 'kyc_verified' : decision === 'request_reupload' ? 'kyc_reupload_requested' : 'kyc_rejected',
      title: decision === 'verify' ? 'KYC verified by admin' : decision === 'request_reupload' ? 'KYC re-upload requested' : 'KYC rejected by admin',
      message: decision === 'verify'
        ? 'Your landlord KYC is approved. A verified badge is now visible on your listings.'
        : decision === 'request_reupload'
          ? `Please re-upload your KYC document. ${reviewNote}`
          : `Your landlord KYC was rejected. ${reviewNote || 'Please upload a clear and valid document.'}`,
      metadata: {
        decision,
        reviewNote,
        landlordKycStatus: landlord.landlordKycStatus,
      },
    });

    await logAdminAction({
      adminUser: req.user,
      action: decision === 'verify' ? 'verify_landlord_kyc' : decision === 'request_reupload' ? 'request_landlord_kyc_reupload' : 'reject_landlord_kyc',
      targetType: 'user',
      targetId: String(landlord._id),
      targetLabel: landlord.email || landlord.name || 'landlord',
      reason: reviewNote,
      metadata: {
        decision,
        landlordKycStatus: landlord.landlordKycStatus,
      },
    });

    return res.status(200).json({
      message: decision === 'verify'
        ? 'Landlord marked as verified successfully'
        : decision === 'request_reupload'
          ? 'Re-upload request sent to landlord successfully'
        : 'Landlord KYC rejected successfully',
      landlord: {
        id: landlord._id,
        name: landlord.name,
        email: landlord.email,
        isLandlordVerified: Boolean(landlord.isLandlordVerified),
        landlordKycStatus: landlord.landlordKycStatus,
        landlordKycReviewedAt: landlord.landlordKycReviewedAt,
        landlordKycReviewNote: landlord.landlordKycReviewNote || '',
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to review landlord KYC',
      error: error.message,
    });
  }
}
