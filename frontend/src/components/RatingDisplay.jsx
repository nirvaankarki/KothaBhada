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
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors ${className}`}
    >
      <span className="text-sm font-semibold text-blue-700">{rating}</span>
      <Star size={14} className="fill-yellow-400 text-yellow-400" />
      <span className="text-xs text-gray-600">({totalReviews})</span>
    </button>
  );
};

export default RatingDisplay;
