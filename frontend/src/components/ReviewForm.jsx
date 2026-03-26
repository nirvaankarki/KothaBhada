import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

const ReviewForm = ({ listingId, onReviewAdded }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      showToast({ type: 'error', title: 'Rating required', message: 'Please select a rating' });
      return;
    }

    if (review.trim().length < 10) {
      showToast({ type: 'error', title: 'Review too short', message: 'Review must be at least 10 characters long' });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/reviews/add', {
        listingId,
        rating,
        review: review.trim(),
      });

      showToast({ type: 'success', title: 'Success', message: 'Review added successfully!' });
      setRating(0);
      setReview('');
      onReviewAdded();
    } catch (err) {
      showToast({ type: 'error', title: 'Failed', message: err.response?.data?.message || err.message || 'Could not add review' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Stars */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={24}
                  className={`${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && <p className="text-xs text-gray-500 mt-1">{rating} out of 5 stars</p>}
        </div>

        {/* Review Text */}
        <div>
          <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this property..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 ring-blue-500 outline-none resize-none"
            rows="4"
            maxLength="500"
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">{review.length}/500 characters</p>
            <p className="text-xs text-gray-500">{review.trim().length < 10 ? `${10 - review.trim().length} more characters needed` : '✓'}</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
