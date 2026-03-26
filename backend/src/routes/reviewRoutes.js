import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get listing reviews and average rating
router.get('/listing/:listingId', reviewController.getListingReviews);

// Get average rating for a listing
router.get('/rating/:listingId', reviewController.getListingAverageRating);

// Add review (requires authentication)
router.post('/add', authenticate, reviewController.addReview);

// Update review (requires authentication)
router.put('/:reviewId', authenticate, reviewController.updateReview);

// Delete review (requires authentication)
router.delete('/:reviewId', authenticate, reviewController.deleteReview);

export default router;
