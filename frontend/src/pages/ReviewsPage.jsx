import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Loader2, Star } from 'lucide-react';
import ReviewsList from '../components/ReviewsList';

const ReviewsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const listingId = searchParams.get('id');

  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!listingId) {
      setError('No listing specified');
      setIsLoading(false);
      return;
    }

    fetchReviews();
  }, [listingId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/reviews/listing/${listingId}`);
      if (!response.ok) {
        throw new Error('Could not fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setAverageRating(data.averageRating);
      
      // Extract listing info from first review or fetch separately
      if (data.reviews.length > 0) {
        setListing({
          id: listingId,
          title: data.reviews[0].listingTitle || 'Property Reviews'
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft size={20} />
            Back to Listing
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Property Reviews & Ratings</h1>
        </div>

        {/* Summary Card */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-6">
              <div>
                <div className="text-5xl font-bold text-gray-900">{averageRating}</div>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={`${
                        star <= Math.round(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {reviews.length} Review{reviews.length !== 1 ? 's' : ''}
                </h2>
                <div className="space-y-2">
                  {Array.from({ length: 5 }, (_, i) => 5 - i).map((starCount) => {
                    const count = reviews.filter((r) => r.rating === starCount).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={starCount} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 w-12">{starCount} star</span>
                        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <ReviewsList listingId={listingId} />
      </div>
    </div>
  );
};

export default ReviewsPage;
