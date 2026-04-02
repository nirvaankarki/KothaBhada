import React from 'react';
import { MessageSquare } from 'lucide-react';
import ReviewForm from '../ReviewForm';
import ReviewsList from '../ReviewsList';

const ReviewsSection = ({
  isAuthenticated,
  listingId,
  reviewRefreshTrigger,
  setReviewRefreshTrigger,
  reviewsSectionRef,
}) => {
  return (
    <section ref={reviewsSectionRef} className="bg-white rounded-2xl border border-slate-200 p-5 scroll-mt-24">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={18} className="text-[#3A5AFF]" />
        <h3 className="text-lg font-bold text-slate-800">Write Reviews</h3>
      </div>

      <div className="space-y-4">
        {isAuthenticated && (
          <ReviewForm
            listingId={listingId}
            onReviewAdded={() => setReviewRefreshTrigger((prev) => prev + 1)}
          />
        )}
        <ReviewsList
          listingId={listingId}
          refreshTrigger={reviewRefreshTrigger}
        />
      </div>
    </section>
  );
};

export default ReviewsSection;
