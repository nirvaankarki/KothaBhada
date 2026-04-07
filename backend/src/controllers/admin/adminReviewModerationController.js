import mongoose from 'mongoose';
import { Review } from '../../models/reviewModel.js';
import { Notification } from '../../models/notificationModel.js';
import { logAdminAction } from '../../utils/adminAuditLogger.js';

const ALLOWED_REVIEW_STATES = new Set(['visible', 'hidden', 'removed']);

function cleanText(value) {
  return String(value || '').trim();
}

export async function getAdminReviews(req, res) {
  try {
    const status = cleanText(req.query?.status).toLowerCase();
    const search = cleanText(req.query?.search);
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit) || 80));

    const filter = {};

    if (status && status !== 'all' && ALLOWED_REVIEW_STATES.has(status)) {
      filter.moderationStatus = status;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { review: regex },
        { userName: regex },
        { userEmail: regex },
        { listingId: regex },
      ];
    }

    const reviews = await Review.find(filter)
      .populate('moderatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      reviews,
      meta: {
        count: reviews.length,
        status: status || 'all',
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load reviews for moderation',
      error: error.message,
    });
  }
}

export async function setAdminReviewModeration(req, res) {
  try {
    const { reviewId } = req.params;
    const moderationStatus = cleanText(req.body?.moderationStatus).toLowerCase();
    const moderationNote = cleanText(req.body?.moderationNote);

    if (!mongoose.Types.ObjectId.isValid(String(reviewId || ''))) {
      return res.status(400).json({ message: 'Invalid review id' });
    }

    if (!ALLOWED_REVIEW_STATES.has(moderationStatus)) {
      return res.status(400).json({ message: 'moderationStatus must be visible, hidden, or removed' });
    }

    if ((moderationStatus === 'hidden' || moderationStatus === 'removed') && !moderationNote) {
      return res.status(400).json({ message: 'Please provide moderation note for this action' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.moderationStatus = moderationStatus;
    review.moderationNote = moderationNote;
    review.moderatedBy = req.user?.userId || null;
    review.moderatedAt = new Date();
    await review.save();

    if (review.userId) {
      await Notification.create({
        userId: review.userId,
        role: 'user',
        type: 'review_moderation',
        title: moderationStatus === 'visible' ? 'Review restored' : 'Review moderated',
        message: moderationStatus === 'visible'
          ? 'Your review is now visible again.'
          : `Your review was ${moderationStatus}. ${moderationNote}`,
        metadata: {
          reviewId: String(review._id),
          moderationStatus,
          moderationNote,
        },
      });
    }

    await logAdminAction({
      adminUser: req.user,
      action: 'moderate_review',
      targetType: 'review',
      targetId: String(review._id),
      targetLabel: String(review.listingId || 'review'),
      reason: moderationNote,
      metadata: {
        moderationStatus,
      },
    });

    return res.status(200).json({
      message: 'Review moderation updated successfully',
      review,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update review moderation',
      error: error.message,
    });
  }
}
