import React from 'react';
import { CheckCircle2, Star } from 'lucide-react';

const ReviewSummarySection = ({
  isLoadingDetailsReviews,
  detailsReviewSummary,
  scrollToReviewsSection,
}) => {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Star size={18} className="text-amber-500 fill-amber-500" />
        <h3 className="text-lg font-bold text-slate-800">Review and Ratings</h3>
      </div>

      {isLoadingDetailsReviews ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading ratings and reviews...
        </div>
      ) : detailsReviewSummary.totalReviews > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {(() => {
            const allReviews = detailsReviewSummary.reviews || [];
            const totalReviews = detailsReviewSummary.totalReviews || allReviews.length;
            const verifiedCount = allReviews.filter((item) => item.isVerifiedStay).length;
            const recommendationPct = totalReviews > 0
              ? Math.round((allReviews.filter((item) => Number(item.rating) >= 4).length / totalReviews) * 100)
              : 0;
            const distribution = [5, 4, 3, 2, 1].map((star) => {
              const count = allReviews.filter((item) => Number(item.rating) === star).length;
              const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              return { star, count, percentage };
            });

            return (
              <>
                <div className="mb-3 rounded-lg bg-[#3A5AFF]/10 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3A5AFF]">Trusted renter feedback</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {recommendationPct}% of renters rated this property 4 stars or above.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-[110px_1fr] md:items-center">
                  <div className="text-center md:text-left">
                    <p className="text-4xl font-black leading-none text-slate-900">
                      {detailsReviewSummary.averageRating.toFixed(1)}
                    </p>
                    <div className="mt-1 flex justify-center gap-0.5 md:justify-start">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= Math.round(detailsReviewSummary.averageRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    {distribution.map(({ star, count, percentage }) => (
                      <div key={star} className="grid grid-cols-[14px_1fr_24px] items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-600">{star}</span>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-[#fbbc04]" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-right text-[11px] text-slate-500">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 size={12} /> {verifiedCount} verified booking{verifiedCount !== 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    Based on {totalReviews} renter review{totalReviews !== 1 ? 's' : ''}
                  </span>
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <button
          type="button"
          onClick={scrollToReviewsSection}
          className="w-full py-4 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
        >
          <Star size={18} className="fill-slate-400 text-slate-400" />
          Be the first to review this property
        </button>
      )}
    </section>
  );
};

export default ReviewSummarySection;
