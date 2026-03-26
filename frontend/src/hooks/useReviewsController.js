import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useReviewsController = (listingId) => {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReviews = useCallback(async () => {
    if (!listingId) return;

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/reviews/listing/${listingId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.totalReviews || 0);
    } catch (err) {
      setError(err.message);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [listingId]);

  const addReview = useCallback(
    async (rating, review) => {
      if (!token) throw new Error('Must be logged in to add review');
      if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
      if (review.trim().length < 10) throw new Error('Review must be at least 10 characters');

      try {
        const response = await fetch('/api/reviews/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            listingId,
            rating,
            review: review.trim(),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to add review');
        }

        // Refresh reviews list
        await fetchReviews();
      } catch (err) {
        throw err;
      }
    },
    [listingId, token, fetchReviews]
  );

  const deleteReview = useCallback(
    async (reviewId) => {
      if (!token) throw new Error('Must be logged in to delete review');

      try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete review');
        }

        // Refresh reviews list
        await fetchReviews();
      } catch (err) {
        throw err;
      }
    },
    [token, fetchReviews]
  );

  return {
    reviews,
    averageRating,
    totalReviews,
    isLoading,
    error,
    fetchReviews,
    addReview,
    deleteReview,
  };
};
