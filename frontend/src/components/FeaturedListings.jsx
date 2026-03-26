import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FALLBACK_LISTINGS, getListingId } from '../utils/listingData';
import RatingDisplay from './RatingDisplay';

function getListingImage(listing) {
  return String(listing?.image || listing?.images?.[0] || '').trim();
}

function getTimeAgo(dateValue) {
  if (!dateValue) return 'Recently listed';

  const now = Date.now();
  const then = new Date(dateValue).getTime();
  if (Number.isNaN(then)) return 'Recently listed';

  const diffMs = Math.max(0, now - then);
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const ListingCard = ({ listing, isFavorite, onToggleFavorite }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const listingId = getListingId(listing);
  const listingImage = getListingImage(listing);

  const trackViewHistory = async () => {
    if (!isAuthenticated) return;

    try {
      await api.post('/user/history', {
        listingId,
        title: listing.title,
        location: listing.location,
        price: listing.price,
        image: listingImage,
        source: 'featured-listings'
      });
    } catch {
      // Ignore history tracking failure in UI.
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/', {
        state: {
          requireAuthModal: true,
          authNotice: 'Please log in or sign up to save listings to favorites.',
          from: '/viewlisting',
        },
      });
      return;
    }

    onToggleFavorite(listing);
  };

  const handleCardClick = async () => {
    if (!isAuthenticated) {
      navigate('/', {
        state: {
          requireAuthModal: true,
          authNotice: 'Please log in or sign up to view property details.',
          from: '/listing-details',
        },
      });
      return;
    }

    await trackViewHistory();
    navigate(`/listing-details?id=${listingId}`, { state: { listing } });
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full cursor-pointer hover:shadow-2xl transition-shadow"
    >
      {/* Image Section */}
      <div className="relative h-64 w-full overflow-hidden group">
        <img 
          src={listingImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000'} 
          alt={listing.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Brand New Badge */}
        <div className="absolute top-4 left-4 bg-[#3b66ff] text-white text-[9px] font-medium px-3 py-1.5 rounded-full uppercase tracking-wider z-10">
          Brand New
        </div>

        {/* Favorite Button */}
        <button 
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md transition-all active:scale-90 hover:bg-gray-50 z-10"
        >
          <Heart 
            size={16} 
            className={`transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-red-500'}`} 
          />
        </button>

        {/* Explore 3D Overlay Button */}
        <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="bg-[#ff5a3c] text-white flex items-center gap-2 px-3 py-1.5 rounded-md font-bold text-[9px] uppercase shadow-lg hover:bg-[#e04a2e] transition-colors"
            >
                Explore <span className="bg-white text-[#ff5a3c] px-1 rounded-sm text-[8px]">3D</span>
            </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col grow">
        <h3 className="text-[#1a222e] text-xl font-extrabold mb-3 leading-tight min-h-14">
          {listing.title}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed mb-6 grow">
          {listing.description}
        </p>

        <div className="border-t border-gray-100 pt-4 mb-4">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Monthly Price</p>
          <p className="text-[#3b66ff] text-xl font-extrabold">
            Rs {listing.price.toLocaleString()}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex items-center gap-2 text-gray-500">
            <MapPin size={14} className="text-[#3b66ff]" />
            <span className="text-xs font-medium truncate">{listing.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={14} className="text-[#3b66ff]" />
            <span className="text-xs font-medium">Listed {getTimeAgo(listing.createdAt)}</span>
          </div>
          <div className="flex justify-end">
            <RatingDisplay 
              listingId={getListingId(listing)}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/reviews?id=${getListingId(listing)}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturedListings = () => {
  const { isAuthenticated, token } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  useEffect(() => {
    let ignore = false;

    async function loadFeaturedListings() {
      setLoading(true);
      try {
        const response = await api.get('/rooms/demo');
        const fetched = Array.isArray(response.data) ? response.data : [];

        if (!ignore) {
          const source = fetched.length > 0 ? fetched : FALLBACK_LISTINGS;
          setListings(source.slice(0, 3));
        }
      } catch {
        if (!ignore) {
          setListings(FALLBACK_LISTINGS.slice(0, 3));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadFeaturedListings();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadFavorites() {
      if (!isAuthenticated || !token) {
        setFavoriteIds(new Set());
        return;
      }

      try {
        const res = await api.get('/user/favorites');
        if (!ignore) {
          setFavoriteIds(new Set((res.data?.favorites || []).map((item) => item.listingId)));
        }
      } catch {
        if (!ignore) {
          setFavoriteIds(new Set());
        }
      }
    }

    loadFavorites();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  const handleToggleFavorite = async (listing) => {
    const listingId = getListingId(listing);
    try {
      const response = await api.post('/user/favorites/toggle', {
        listingId,
        title: listing.title,
        location: listing.location,
        price: listing.price,
        image: getListingImage(listing),
        source: 'featured-listings'
      });

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (response.data?.isFavorite) {
          next.add(listingId);
        } else {
          next.delete(listingId);
        }
        return next;
      });
    } catch {
      // Keep current state if save fails.
    }
  };

  return (
    <section className="py-24 px-6 md:px-10 lg:px-20 bg-white">
      <div className="max-w-350 mx-auto">
        {/* Header */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#1a222e] text-center mb-16 tracking-tight uppercase">
          Featured Listings
        </h2>

        {/* Grid Updated to 3 columns for Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading
            ? Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-136 bg-gray-100 rounded-sm animate-pulse border border-gray-100" />
            ))
            : listings.map((listing) => {
              const listingId = getListingId(listing);
              return (
                <ListingCard
                  key={listingId}
                  listing={listing}
                  isFavorite={favoriteIds.has(listingId)}
                  onToggleFavorite={handleToggleFavorite}
                />
              );
            })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;