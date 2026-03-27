import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import ReviewsList from '../components/ReviewsList';

const ReviewsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const listingId = searchParams.get('id');

  const [error, setError] = useState('');

  useEffect(() => {
    if (!listingId) {
      setError('No listing specified');
    }
  }, [listingId]);

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
    <div className="min-h-screen bg-linear-to-b from-[#f5f8ff] to-[#f7f7f7]">
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft size={20} />
            Back to Listing
          </button>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Property Ratings & Reviews</h1>
          <p className="mt-2 text-sm text-gray-600">
            Detailed feedback from real renters, organized for quick and confident decisions.
          </p>
        </div>

        <ReviewsList listingId={listingId} />
      </div>
    </div>
  );
};

export default ReviewsPage;
