import React from 'react';
import { MapPin, Clock3 } from 'lucide-react';

const ListingCardsSection = ({ cards, cardType, onRemoveFavorite }) => {
  if (cards.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-sm p-8 text-center text-gray-500">
        {cardType === 'favorites' ? 'No saved favorites yet.' : 'No viewing history yet.'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((item) => {
        const has2DRoom = Boolean(String(item?.image || '').trim() || (Array.isArray(item?.images) && item.images.length));
        const hasPanoramaTour = Array.isArray(item?.panoramaImages) && item.panoramaImages.length > 0;

        return (
          <div key={item._id} className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
            <img
              src={item.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800'}
              alt={item.title}
              className="w-full h-44 object-cover"
            />
            <div className="p-4">
              {(has2DRoom || hasPanoramaTour) && (
                <div className="mb-2">
                  <div className="inline-flex items-center gap-1.5 flex-wrap">
                    {has2DRoom && (
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-sky-700 border border-sky-200">
                        2D Room
                      </span>
                    )}
                    {hasPanoramaTour && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-emerald-700 border border-emerald-200">
                        360 Tour
                      </span>
                    )}
                  </div>
                  <div className="mt-2 border-t border-gray-100" />
                </div>
              )}

              <h3 className="text-base font-bold text-[#1a222e] mb-2 line-clamp-2">{item.title}</h3>
              <div className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1">
                <MapPin size={12} /> {item.location || 'Location not set'}
              </div>

              <div className="text-sm font-extrabold text-[#3b66ff] mb-3">Rs {Number(item.price || 0).toLocaleString()}</div>

              {cardType === 'favorites' ? (
                <button
                  type="button"
                  onClick={() => onRemoveFavorite(item)}
                  className="text-xs font-bold text-red-500 hover:text-red-600"
                >
                  Remove Favorite
                </button>
              ) : (
                <div className="text-xs text-gray-400 inline-flex items-center gap-1">
                  <Clock3 size={12} />
                  Viewed {new Date(item.viewedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListingCardsSection;
