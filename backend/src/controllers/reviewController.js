import { Review } from '../models/reviewModel.js';
import { Room } from '../models/roomModel.js';
import { User } from '../models/userModel.js';
import { Booking } from '../models/bookingModel.js';

export const addReview = async (req, res) => {
  try {
    const { listingId, rating, review } = req.body;
    const userId = req.user?.userId || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User authentication required' });
    }

    const reviewer = await User.findById(userId).select('name email').lean();
    const userName = reviewer?.name || req.user?.name || 'Unknown User';
    const userEmail = reviewer?.email || req.user?.email || '';

    // Validate input
    if (!listingId || !rating || !review) {
      return res.status(400).json({ message: 'Missing required fields: listingId, rating, review' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (review.trim().length < 10) {
      return res.status(400).json({ message: 'Review must be at least 10 characters long' });
    }

    const existingReview = await Review.findOne({ listingId, userId }).lean();
    if (existingReview) {
      return res.status(409).json({
        message: 'You have already submitted a review for this listing. Please edit your existing review instead.',
      });
    }

    // For valid MongoDB ObjectIds, check if listing exists
    // For fallback/demo listings, skip this check to allow reviews on demo properties
    if (isValidObjectId(listingId)) {
      const listing = await Room.findById(listingId);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
    }

    // Create new review
    const newReview = await Review.create({
      listingId,
      userId,
      userName,
      userEmail,
      rating: Number(rating),
      review: review.trim()
    });

    res.status(201).json({
      message: 'Review added successfully',
      review: newReview
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message: 'You have already submitted a review for this listing. Please edit your existing review instead.',
      });
    }

    console.error('Error adding review:', err);
    res.status(500).json({ message: 'Could not add review' });
  }
};

export const getListingReviews = async (req, res) => {
  try {
    const { listingId } = req.params;

    // For fallback/demo listings, return empty reviews
    if (String(listingId).startsWith('fallback-') || !isValidObjectId(listingId)) {
      return res.status(200).json({
        listingId,
        reviews: [],
        averageRating: 0,
        totalReviews: 0
      });
    }

    // Get all reviews for this listing, sorted by newest first
    const reviews = await Review.find({ listingId })
      .populate('userId', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .lean();

    const normalizedReviews = reviews.map((review) => {
      const reviewer = review.userId && typeof review.userId === 'object' ? review.userId : null;
      const reviewerId = reviewer?._id?.toString?.() || review.userId?.toString?.() || '';

      return {
        ...review,
        userId: reviewerId,
        userName: reviewer?.name || review.userName || 'Unknown User',
        userProfilePhoto: reviewer?.profilePhoto || null,
      };
    });

    const reviewerIds = [...new Set(normalizedReviews.map((review) => review.userId).filter(Boolean))];
    let verifiedBookingKeys = new Set();

    if (reviewerIds.length > 0) {
      const confirmedBookings = await Booking.find({
        listingId,
        userId: { $in: reviewerIds },
        status: 'confirmed',
      })
        .select('userId listingId')
        .lean();

      verifiedBookingKeys = new Set(
        confirmedBookings.map((booking) => `${booking.userId?.toString?.()}:${String(booking.listingId)}`)
      );
    }

    const verifiedReviews = normalizedReviews.map((review) => ({
      ...review,
      isVerifiedStay: verifiedBookingKeys.has(`${review.userId}:${String(listingId)}`),
    }));

    // Calculate average rating
    const averageRating = verifiedReviews.length > 0
      ? (verifiedReviews.reduce((sum, r) => sum + r.rating, 0) / verifiedReviews.length).toFixed(1)
      : 0;

    res.status(200).json({
      listingId,
      reviews: verifiedReviews,
      averageRating: parseFloat(averageRating),
      totalReviews: verifiedReviews.length
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ message: 'Could not fetch reviews' });
  }
};

export const getListingAverageRating = async (req, res) => {
  try {
    const { listingId } = req.params;

    // For fallback/demo listings, return 0 rating
    if (String(listingId).startsWith('fallback-') || !isValidObjectId(listingId)) {
      return res.status(200).json({
        listingId,
        averageRating: 0,
        totalReviews: 0
      });
    }

    const reviews = await Review.find({ listingId }).lean();
    
    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.status(200).json({
      listingId,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length
    });
  } catch (err) {
    console.error('Error fetching average rating:', err);
    res.status(500).json({ message: 'Could not fetch rating' });
  }
};

export const getHighlightedReviews = async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(String(req.query.limit || '3'), 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 10)
      : 3;

    // Pull a broad top set first, then prioritize verified + high rated + recent.
    const baseReviews = await Review.find({})
      .sort({ rating: -1, createdAt: -1 })
      .limit(150)
      .populate('userId', 'name profilePhoto')
      .lean();

    if (baseReviews.length === 0) {
      return res.status(200).json({ highlights: [], total: 0 });
    }

    const listingIds = [
      ...new Set(baseReviews.map((review) => String(review.listingId)).filter((id) => isValidObjectId(id))),
    ];
    const reviewerIds = [
      ...new Set(
        baseReviews
          .map((review) => {
            const reviewer = review.userId && typeof review.userId === 'object' ? review.userId : null;
            return reviewer?._id?.toString?.() || review.userId?.toString?.() || '';
          })
          .filter(Boolean)
      ),
    ];

    const [rooms, confirmedBookings] = await Promise.all([
      listingIds.length > 0
        ? Room.find({ _id: { $in: listingIds } }).select('title location').lean()
        : [],
      reviewerIds.length > 0
        ? Booking.find({
            listingId: { $in: listingIds },
            userId: { $in: reviewerIds },
            status: 'confirmed',
          })
            .select('userId listingId')
            .lean()
        : [],
    ]);

    const roomMap = new Map(rooms.map((room) => [String(room._id), room]));
    const verifiedKeys = new Set(
      confirmedBookings.map((booking) => `${booking.userId?.toString?.()}:${String(booking.listingId)}`)
    );

    const highlights = baseReviews
      .map((review) => {
        const reviewer = review.userId && typeof review.userId === 'object' ? review.userId : null;
        const reviewerId = reviewer?._id?.toString?.() || review.userId?.toString?.() || '';
        const room = roomMap.get(String(review.listingId));
        const isVerifiedStay = verifiedKeys.has(`${reviewerId}:${String(review.listingId)}`);

        return {
          _id: review._id,
          listingId: String(review.listingId),
          listingTitle: room?.title || 'Property listing',
          listingLocation: room?.location || '',
          rating: Number(review.rating) || 0,
          review: review.review,
          createdAt: review.createdAt,
          userName: reviewer?.name || review.userName || 'User',
          userProfilePhoto: reviewer?.profilePhoto || null,
          isVerifiedStay,
        };
      })
      .sort((a, b) => {
        if (a.isVerifiedStay !== b.isVerifiedStay) return a.isVerifiedStay ? -1 : 1;
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit);

    return res.status(200).json({ highlights, total: highlights.length });
  } catch (err) {
    console.error('Error fetching highlighted reviews:', err);
    return res.status(500).json({ message: 'Could not fetch highlighted reviews' });
  }
};

// Helper function to validate MongoDB ObjectId
function isValidObjectId(id) {
  try {
    return id.match(/^[0-9a-fA-F]{24}$/) !== null;
  } catch {
    return false;
  }
}

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user?.userId || req.user?._id;

    // Find review
    const existingReview = await Review.findById(reviewId);
    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check authorization
    if (existingReview.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    // Validate input
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (review && review.trim().length < 10) {
      return res.status(400).json({ message: 'Review must be at least 10 characters long' });
    }

    // Update review
    if (rating) existingReview.rating = Number(rating);
    if (review) existingReview.review = review.trim();
    
    await existingReview.save();

    res.status(200).json({
      message: 'Review updated successfully',
      review: existingReview
    });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ message: 'Could not update review' });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.userId || req.user?._id;

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check authorization
    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    // Delete review
    await Review.deleteOne({ _id: reviewId });

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: 'Could not delete review' });
  }
};
