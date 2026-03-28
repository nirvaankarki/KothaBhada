import React, { useEffect, useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadHighlights = async () => {
      setIsLoading(true);

      try {
        const response = await api.get('/reviews/highlights?limit=3');
        if (!ignore) {
          setReviews(response.data?.highlights || []);
        }
      } catch {
        if (!ignore) {
          setReviews([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadHighlights();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="bg-linear-to-b from-white via-[#f8f9ff] to-[#f3f4f6] py-32 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-[#3b66ff]/10 mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3159d4]">Trusted Reviews</p>
          </span>
          <h2 className="mt-4 text-4xl md:text-6xl font-black tracking-tight text-[#0f172a]">
            Client Feedback & Testimonial
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-slate-700">
            See why renters trust and love our properties. Real stories from verified renters who've had great experiences.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="relative pt-12">
                <div className="mx-auto h-24 w-24 rounded-full border-4 border-white bg-slate-200 shadow-md animate-pulse" />
                <div className="mt-4 h-80 rounded-2xl border border-slate-200 bg-white animate-pulse" />
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {reviews.map((review) => {
              const displayName = (review.userName || '').trim() || 'Verified renter';
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <article key={review._id} className="group relative pt-12 h-full">
                  <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
                    <div className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-2xl overflow-hidden group-hover:shadow-3xl transition-shadow duration-300">
                      {review.userProfilePhoto ? (
                        <img
                          src={review.userProfilePhoto}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#e8f0ff] to-[#d4e4ff] text-2xl font-bold text-[#3159d4]">
                          {initial}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative h-full rounded-2xl bg-white px-6 py-10 pt-14 text-center shadow-lg border border-slate-100 group-hover:shadow-2xl group-hover:border-slate-200 transition-all duration-300">
                    {review.isVerifiedStay && (
                      <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 border border-emerald-200">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">Verified</span>
                      </div>
                    )}

                    <h3 className="text-lg font-bold text-[#3159d4]">{displayName}</h3>

                    <div className="mt-2.5 flex items-end justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((star, index) => (
                        <Star
                          key={star}
                          size={index === 2 ? 20 : 16}
                          className={star <= Number(review.rating) ? 'fill-[#fbbc04] text-[#fbbc04]' : 'text-slate-200'}
                        />
                      ))}
                    </div>

                    {review.listingTitle && (
                      <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {review.listingTitle}
                      </p>
                    )}

                    <div className="mt-5 relative">
                      <p className="text-base font-normal leading-relaxed text-slate-700 line-clamp-6">
                        "{review.review}"
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <h3 className="text-xl font-bold text-slate-800">Testimonials Coming Soon</h3>
            <p className="mt-3 text-base text-slate-600">Real renter reviews will appear here once renters start sharing their experiences with us.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;