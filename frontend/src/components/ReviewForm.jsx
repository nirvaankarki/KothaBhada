import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

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
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold text-gray-900">Write a review</h3>
        <p className="mt-1 text-sm text-gray-600">
          Share a clear, honest experience to help other renters make better decisions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">Overall rating</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="rounded-md p-0.5 transition-transform hover:scale-110"
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              >
                <Star
                  size={28}
                  className={`${
                    star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-2 text-sm font-medium text-gray-700">
              {rating} out of 5: {RATING_LABELS[rating]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="review" className="mb-2 block text-sm font-semibold text-gray-800">
            Your review
          </label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What stood out? Mention location, cleanliness, owner communication, safety, and value."
            className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            rows="5"
            maxLength="500"
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">{review.length}/500 characters</p>
            <p className="text-xs text-gray-500">
              {review.trim().length < 10 ? `${10 - review.trim().length} more characters needed` : 'Looks good'}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a73e8] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1666c1] disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
