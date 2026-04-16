import React, { useEffect, useState } from 'react';
import { MapPin, CalendarDays, Heart, ArrowUpRight, Bed, Bath, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';
import { FALLBACK_LISTINGS, getListingId } from '../utils/listingData';
import RatingDisplay from './RatingDisplay';
import HoverImageSlider from './HoverImageSlider';

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

function getAvailabilityBadge(listing) {
  const status = String(listing?.status || '').toLowerCase();

  if (listing?.isBooked || status === 'booked' || status === 'rented' || status === 'occupied') {
    return {
      label: 'Booked',
      className: 'bg-rose-600 text-white',
    };
  }

  if (status === 'inactive' || status === 'unavailable') {
    return {
      label: 'Unavailable',
      className: 'bg-gray-700 text-white',
    };
  }

  return {
    label: 'Available',
    className: 'bg-emerald-600 text-white',
  };
}

const ListingCard = ({ listing, isFavorite, onToggleFavorite }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const listingId = getListingId(listing);
  const fallbackCoverImage = getListingImage(listing);
  const availabilityBadge = getAvailabilityBadge(listing);
  const roomImages = [
    String(listing?.image || '').trim(),
    ...(Array.isArray(listing?.images) ? listing.images.map((img) => String(img || '').trim()) : []),
  ].filter(Boolean);
  const uniqueRoomImages = Array.from(new Set(roomImages));
  const displayImages = uniqueRoomImages.length
    ? uniqueRoomImages
    : [fallbackCoverImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000'];
  const room2DImageCount = uniqueRoomImages.length;
  const has2DRoom = Boolean(String(listing?.image || '').trim() || (Array.isArray(listing?.images) && listing.images.length));
  const hasPanoramaTour = Array.isArray(listing?.panoramaImages) && listing.panoramaImages.length > 0;

  const trackViewHistory = async () => {
    if (!isAuthenticated) return;

    try {
      await api.post('/user/history', {
        listingId,
        title: listing.title,
        location: listing.location,
        price: listing.price,
        image: fallbackCoverImage,
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
      className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <HoverImageSlider images={displayImages} altBase={listing.title || 'Room image'} />

        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/45 to-transparent" />

        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide z-10 ${availabilityBadge.className}`}>
          {availabilityBadge.label}
        </div>

        {room2DImageCount > 1 && (
          <span className="absolute left-1/2 top-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-gray-100/95 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
            +{room2DImageCount - 1} Images
          </span>
        )}

        {/* Favorite Button */}
        <button 
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md transition-all active:scale-90 hover:bg-gray-50 z-10"
        >
          <Heart 
            size={16} 
            className={`transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-red-500'}`} 
          />
        </button>

        <div className="absolute left-3 bottom-3">
          <RatingDisplay 
            listingId={getListingId(listing)}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/reviews?id=${getListingId(listing)}`);
            }}
            className="bg-white/95 shadow-md"
          />
        </div>

        <div className="absolute right-3 bottom-3 rounded-xl bg-white/95 px-3 py-1.5 shadow">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Monthly Rent</p>
          <p className="text-base font-black text-[#1d4ed8]">Rs {Number(listing.price || 0).toLocaleString()}</p>
        </div>
      </div>

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

        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold text-[#132238] line-clamp-2">{listing.title || 'Untitled Listing'}</h3>
          <ArrowUpRight size={16} className="text-blue-600 shrink-0 mt-1" />
        </div>

        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin size={12} /> {listing.location || 'Location not specified'}
        </p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-center">
            <Bed size={14} className="mx-auto text-blue-600" />
            <p className="mt-1 text-[11px] font-semibold text-gray-700">{listing.bedrooms ?? 0} Beds</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-center">
            <Bath size={14} className="mx-auto text-blue-600" />
            <p className="mt-1 text-[11px] font-semibold text-gray-700">{listing.bathrooms ?? 0} Baths</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-center">
            <Square size={14} className="mx-auto text-blue-600" />
            <p className="mt-1 text-[11px] font-semibold text-gray-700">{listing.areaSqFt ?? 0} sqft</p>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
          {listing.description || 'No description available for this listing.'}
        </p>

        <div className="mt-3 flex items-start justify-between gap-3 border-t border-gray-100 pt-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarDays size={12} /> Listed {getTimeAgo(listing.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

const FeaturedListings = () => {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
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

      if (response.data?.isFavorite) {
        showToast({ type: 'success', title: 'Saved', message: 'Property added to favorites.' });
      } else {
        showToast({ type: 'success', title: 'Removed', message: 'Property removed from favorites.' });
      }
    } catch {
      // Keep current state if save fails.
      showToast({ type: 'error', title: 'Action failed', message: 'Could not update favorite right now.' });
    }
  };

  return (
    <section className="py-24 px-6 md:px-10 lg:px-20 bg-linear-to-b from-white to-[#f8f9ff]">
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