import { Review } from '../models/reviewModel.js';
import { Room } from '../models/roomModel.js';

export const addReview = async (req, res) => {
  try {
    const { listingId, rating, review } = req.body;
    const userId = req.user?.userId || req.user?._id;
    const userName = req.user?.name || 'Anonymous User';
    const userEmail = req.user?.email || '';

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
      .sort({ createdAt: -1 })
      .lean();

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.status(200).json({
      listingId,
      reviews,
      averageRating: parseFloat(averageRating),
      totalReviews: reviews.length
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
