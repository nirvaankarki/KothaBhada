import React, { useState, useEffect } from 'react';
import { Star, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

const ReviewsList = ({ listingId, refreshTrigger }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [listingId, refreshTrigger]);

  const fetchReviews = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.get(`/reviews/listing/${listingId}`);
      setReviews(response.data.reviews);
      setAverageRating(response.data.averageRating);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Could not fetch reviews';
      setError(errorMsg);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    setDeletingId(reviewId);

    try {
      await api.delete(`/reviews/${reviewId}`);

      setReviews(reviews.filter((r) => r._id !== reviewId));
      
      // Recalculate average rating
      const remaining = reviews.filter((r) => r._id !== reviewId);
      if (remaining.length > 0) {
        const newAverage = (remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length).toFixed(1);
        setAverageRating(parseFloat(newAverage));
      } else {
        setAverageRating(0);
      }
      
      showToast({ type: 'success', title: 'Deleted', message: 'Review deleted successfully!' });
    } catch (err) {
      showToast({ type: 'error', title: 'Failed', message: err.response?.data?.message || err.message || 'Failed to delete review' });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Summary */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-gray-900">{averageRating}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={`${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Reviews List */}
      {error && <p className="text-center text-red-600 mb-4">{error}</p>}

      {reviews.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  {/* Reviewer Info & Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">{review.userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{review.userName}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={`${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-gray-700 leading-relaxed">{review.review}</p>
                </div>

                {/* Delete Button - Only if user is the reviewer */}
                {user?._id === review.userId && (
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    disabled={deletingId === review._id}
                    className="text-gray-400 hover:text-red-600 transition-colors p-2 disabled:opacity-50"
                    title="Delete review"
                  >
                    {deletingId === review._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
