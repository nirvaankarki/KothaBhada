import mongoose from 'mongoose';
import { Room } from '../../models/roomModel.js';
import { Notification } from '../../models/notificationModel.js';
import { logAdminAction } from '../../utils/adminAuditLogger.js';

const LISTING_MODERATION_STATES = new Set(['pending', 'approved', 'rejected']);

function normalizeState(value) {
  return String(value || '').trim().toLowerCase();
}

function cleanText(value) {
  return String(value || '').trim();
}

export async function getAdminListings(req, res) {
  try {
    const moderationStatus = normalizeState(req.query?.moderationStatus);
    const search = cleanText(req.query?.search);
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit) || 80));

    const filter = {};

    if (LISTING_MODERATION_STATES.has(moderationStatus)) {
      if (moderationStatus === 'approved') {
        filter.$or = [
          { moderationStatus: 'approved' },
          { moderationStatus: { $exists: false } },
        ];
      } else {
        filter.moderationStatus = moderationStatus;
      }
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const searchClause = [
        { title: regex },
        { location: regex },
        { ownerName: regex },
        { ownerEmail: regex },
      ];

      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: searchClause },
        ];
        delete filter.$or;
      } else {
        filter.$or = searchClause;
      }
    }

    const rawListings = await Room.find(filter)
      .select('ownerId ownerName ownerEmail ownerPhone title location price status moderationStatus moderationNote moderationReviewedAt moderationReviewedBy createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const listings = rawListings.map((listing) => ({
      ...listing,
      moderationStatus: normalizeState(listing?.moderationStatus) || 'approved',
      moderationNote: cleanText(listing?.moderationNote),
    }));

    return res.status(200).json({
      listings,
      meta: {
        count: listings.length,
        moderationStatus: moderationStatus || 'all',
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load listings for moderation',
      error: error.message,
    });
  }
}

export async function setListingModerationStatus(req, res) {
  try {
    const { listingId } = req.params;
    const moderationStatus = normalizeState(req.body?.moderationStatus);
    const moderationNote = cleanText(req.body?.moderationNote);

    if (!mongoose.Types.ObjectId.isValid(String(listingId || ''))) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    if (!['approved', 'rejected'].includes(moderationStatus)) {
      return res.status(400).json({ message: 'moderationStatus must be approved or rejected' });
    }

    if (moderationStatus === 'rejected' && !moderationNote) {
      return res.status(400).json({ message: 'Please provide a rejection reason for landlord feedback.' });
    }

    const listing = await Room.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const currentModerationStatus = normalizeState(listing?.moderationStatus) || 'approved';
    if (currentModerationStatus !== 'pending') {
      return res.status(409).json({
        message: `Moderation already finalized as ${currentModerationStatus}. Landlord must edit and resubmit before another decision.`,
      });
    }

    listing.moderationStatus = moderationStatus;
    listing.moderationNote = moderationNote;
    listing.moderationReviewedAt = new Date();
    listing.moderationReviewedBy = req.user?.userId || null;

    if (moderationStatus === 'approved') {
      // Re-activate listing on approval so it appears in renter-facing listing feeds.
      listing.status = 'active';
    } else if (moderationStatus === 'rejected') {
      listing.status = 'inactive';
    }

    await listing.save();

    const isApproved = moderationStatus === 'approved';

    await Notification.create({
      userId: listing.ownerId,
      role: 'landlord',
      type: isApproved ? 'listing_approved' : 'listing_rejected',
      title: isApproved ? 'Listing approved by admin' : 'Listing rejected by admin',
      message: isApproved
        ? `Your listing "${listing.title}" is approved and is now visible to renters.`
        : `Your listing "${listing.title}" was rejected. ${moderationNote}`,
      metadata: {
        listingId: String(listing._id),
        moderationStatus,
        moderationNote,
      },
    });

    await logAdminAction({
      adminUser: req.user,
      action: moderationStatus === 'approved' ? 'approve_listing' : 'reject_listing',
      targetType: 'listing',
      targetId: String(listing._id),
      targetLabel: listing.title,
      reason: moderationNote,
      metadata: {
        moderationStatus,
      },
    });

    return res.status(200).json({
      message: isApproved ? 'Listing approved successfully' : 'Listing rejected successfully',
      listing,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update listing moderation status',
      error: error.message,
    });
  }
}
