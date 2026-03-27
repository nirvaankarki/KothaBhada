import React, { useEffect, useMemo, useState } from 'react';
import { Star, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

const ReviewsList = ({ listingId, refreshTrigger }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [sortBy, setSortBy] = useState('most-recent');
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
      setReviews(response.data.reviews || []);
      setAverageRating(response.data.averageRating || 0);
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

      const remaining = reviews.filter((review) => review._id !== reviewId);
      setReviews(remaining);

      if (remaining.length > 0) {
        const newAverage =
          remaining.reduce((sum, review) => sum + review.rating, 0) / remaining.length;
        setAverageRating(Number(newAverage.toFixed(1)));
      } else {
        setAverageRating(0);
      }

      showToast({ type: 'success', title: 'Deleted', message: 'Review deleted successfully!' });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Failed',
        message: err.response?.data?.message || err.message || 'Failed to delete review',
      });
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

  const ratingDistribution = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => {
        const star = 5 - index;
        const count = reviews.filter((review) => review.rating === star).length;
        const percentage = reviews.length === 0 ? 0 : Math.round((count / reviews.length) * 100);

        return { star, count, percentage };
      }),
    [reviews]
  );

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];

    if (sortBy === 'highest-rating') {
      sorted.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      return sorted;
    }

    if (sortBy === 'lowest-rating') {
      sorted.sort((a, b) => {
        if (a.rating !== b.rating) return a.rating - b.rating;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      return sorted;
    }

    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted;
  }, [reviews, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {error && <p className="mb-4 text-center text-red-600">{error}</p>}

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
          <h3 className="text-lg font-semibold text-gray-900">No reviews yet</h3>
          <p className="mt-1 text-sm text-gray-600">
            Be the first to share your experience with this property.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4 md:p-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] md:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Overall rating
                </p>
                <div className="mt-1 flex items-end gap-3">
                  <span className="text-5xl font-bold leading-none text-gray-900">
                    {Number(averageRating).toFixed(1)}
                  </span>
                  <div className="pb-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={`${
                            star <= Math.round(averageRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {ratingDistribution.map(({ star, count, percentage }) => (
                  <div key={star} className="grid grid-cols-[42px_1fr_44px] items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{star} star</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-[#fbbc04] transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-right text-xs font-medium text-gray-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ratings and reviews</h3>
            <div className="flex items-center gap-2">
              <label htmlFor="review-sort" className="text-sm text-gray-600">
                Sort by
              </label>
              <select
                id="review-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="most-recent">Most recent</option>
                <option value="highest-rating">Highest rating</option>
                <option value="lowest-rating">Lowest rating</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {sortedReviews.map((review) => (
              <div
                key={review._id}
                className="rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <span className="text-sm font-semibold text-blue-700">
                          {review.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{review.userName}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={`${
                                  star <= review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            <CheckCircle2 size={12} /> Verified stay
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-gray-700">{review.review}</p>
                  </div>

                  {user?._id === review.userId && (
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      disabled={deletingId === review._id}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
        </>
      )}
    </div>
  );
};

export default ReviewsList;
