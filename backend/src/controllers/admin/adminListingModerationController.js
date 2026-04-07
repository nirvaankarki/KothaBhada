import mongoose from 'mongoose';
import { Room } from '../../models/roomModel.js';
import { Notification } from '../../models/notificationModel.js';
import { logAdminAction } from '../../utils/adminAuditLogger.js';

const LISTING_MODERATION_STATES = new Set(['pending', 'approved', 'rejected']);
const MODEL_HEALTH_STATES = new Set(['unchecked', 'verified', 'broken']);

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
      .select('ownerId ownerName ownerEmail ownerPhone title location price status moderationStatus moderationNote moderationReviewedAt moderationReviewedBy model3dUrl model3dHealthStatus model3dHealthNote model3dReviewedAt isFeatured featuredRank tags createdAt updatedAt')
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

export async function setListingFeatureState(req, res) {
  try {
    const { listingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(listingId || ''))) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const isFeatured = Boolean(req.body?.isFeatured);
    const rankCandidate = Number(req.body?.featuredRank);
    const featuredRank = Number.isFinite(rankCandidate) ? Math.max(0, Math.floor(rankCandidate)) : 0;

    const listing = await Room.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    listing.isFeatured = isFeatured;
    listing.featuredRank = isFeatured ? featuredRank : 0;
    await listing.save();

    await logAdminAction({
      adminUser: req.user,
      action: isFeatured ? 'feature_listing' : 'unfeature_listing',
      targetType: 'listing',
      targetId: String(listing._id),
      targetLabel: listing.title,
      metadata: {
        isFeatured,
        featuredRank: listing.featuredRank,
      },
    });

    return res.status(200).json({
      message: isFeatured ? 'Listing pinned as featured' : 'Listing removed from featured list',
      listing,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update listing feature state',
      error: error.message,
    });
  }
}

export async function reviewListing3DHealth(req, res) {
  try {
    const { listingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(listingId || ''))) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const model3dHealthStatus = normalizeState(req.body?.model3dHealthStatus);
    const model3dHealthNote = cleanText(req.body?.model3dHealthNote);

    if (!MODEL_HEALTH_STATES.has(model3dHealthStatus)) {
      return res.status(400).json({ message: 'model3dHealthStatus must be unchecked, verified, or broken' });
    }

    const listing = await Room.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    listing.model3dHealthStatus = model3dHealthStatus;
    listing.model3dHealthNote = model3dHealthNote;
    listing.model3dReviewedAt = new Date();
    listing.model3dReviewedBy = req.user?.userId || null;
    await listing.save();

    await logAdminAction({
      adminUser: req.user,
      action: 'review_listing_model_3d',
      targetType: 'listing',
      targetId: String(listing._id),
      targetLabel: listing.title,
      reason: model3dHealthNote,
      metadata: {
        model3dHealthStatus,
      },
    });

    return res.status(200).json({
      message: '3D model quality status updated successfully',
      listing,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update 3D model quality status',
      error: error.message,
    });
  }
}

export async function setListingTags(req, res) {
  try {
    const { listingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(listingId || ''))) {
      return res.status(400).json({ message: 'Invalid listing id' });
    }

    const tagsInput = Array.isArray(req.body?.tags) ? req.body.tags : [];
    const tags = Array.from(new Set(tagsInput
      .map((tag) => String(tag || '').trim())
      .filter(Boolean)
      .slice(0, 20)));

    const listing = await Room.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    listing.tags = tags;
    await listing.save();

    await logAdminAction({
      adminUser: req.user,
      action: 'update_listing_tags',
      targetType: 'listing',
      targetId: String(listing._id),
      targetLabel: listing.title,
      metadata: {
        tags,
      },
    });

    return res.status(200).json({
      message: 'Listing tags updated successfully',
      listing,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update listing tags',
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
