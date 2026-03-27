import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

const RatingDisplay = ({ listingId, onClick, className = '' }) => {
  const [rating, setRating] = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRating();
  }, [listingId]);

  const fetchRating = async () => {
    try {
      const response = await fetch(`/api/reviews/rating/${listingId}`);
      if (response.ok) {
        const data = await response.json();
        setRating(data.averageRating);
        setTotalReviews(data.totalReviews);
      }
    } catch {
      // Silent fail - no reviews yet
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || rating === null || totalReviews === 0) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-xs hover:border-gray-300 hover:bg-gray-50 transition-colors ${className}`}
    >
      <span className="text-sm font-semibold text-gray-900">{Number(rating).toFixed(1)}</span>
      <Star size={14} className="fill-amber-400 text-amber-400" />
      <span className="text-xs font-medium text-gray-600">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
    </button>
  );
};

export default RatingDisplay;
