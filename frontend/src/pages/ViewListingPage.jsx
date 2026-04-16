import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Filter,
  ArrowUpDown,
  Box,
  Bed,
  Bath,
  Square,
  CalendarDays,
  ArrowUpRight,
  Heart,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { getListingId } from '../utils/listingData';
import { useToast } from '../context/ToastContext';
import RatingDisplay from '../components/RatingDisplay';
import HoverImageSlider from '../components/HoverImageSlider';
import ListingReportModal from '../components/shared/ListingReportModal';

const PRICE_BUCKETS = [
  { id: 'all', label: 'All Prices' },
  { id: 'lt10000', label: 'Under Rs 10,000' },
  { id: '10000to25000', label: 'Rs 10,000 - 25,000' },
  { id: 'gt25000', label: 'Above Rs 25,000' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'title', label: 'Title: A-Z' },
];

function inBucket(price, bucketId) {
  if (bucketId === 'all') return true;
  if (bucketId === 'lt10000') return price < 10000;
  if (bucketId === '10000to25000') return price >= 10000 && price <= 25000;
  return price > 25000;
}

function getListingImage(listing) {
  return String(listing?.image || listing?.images?.[0] || '').trim();
}

function formatDate(dateValue) {
  if (!dateValue) return 'Recently listed';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'Recently listed';
  return parsed.toLocaleDateString();
}

function getAvailabilityBadge(listing, isFeatured = false) {
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

  if (isFeatured) {
    return {
      label: 'Featured',
      className: 'bg-orange-500 text-white',
    };
  }

  return {
    label: 'Available',
    className: 'bg-emerald-600 text-white',
  };
}

const ViewListingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  const [listings, setListings] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [priceBucket, setPriceBucket] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [hoveredListingId, setHoveredListingId] = useState('');
  const [reportModalListing, setReportModalListing] = useState(null);
  const [reportReasonCategory, setReportReasonCategory] = useState('fake_listing');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const activeRole = String(user?.role || '').toLowerCase();
  const canReportProperty = isAuthenticated && activeRole === 'user';

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(message, () => setMessage(''));

  useEffect(() => {
    if (!error) return;
    showToast({ type: 'error', title: 'Listings unavailable', message: error });
  }, [error, showToast]);

  useEffect(() => {
    if (!message) return;
    showToast({ type: 'info', title: 'Notice', message });
  }, [message, showToast]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.get('/rooms/demo');
      const fetched = Array.isArray(response.data) ? response.data : [];

      setListings(fetched);

      if (fetched.length === 0) {
        setMessage('No property listings are available at the moment.');
      }
    } catch {
      setListings([]);
      setError('Could not load listings from server. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    let ignore = false;

    async function loadFavorites() {
      if (!isAuthenticated) {
        setFavoriteIds(new Set());
        return;
      }

      try {
        const response = await api.get('/user/favorites');
        if (!ignore) {
          setFavoriteIds(new Set((response.data?.favorites || []).map((item) => item.listingId)));
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
  }, [isAuthenticated]);

  const locations = useMemo(() => {
    const unique = new Set(listings.map((item) => item.location).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [listings]);

  const featuredListingIds = useMemo(
    () => new Set(listings.slice(0, 3).map((item) => getListingId(item))),
    [listings]
  );

  const filteredListings = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = listings.filter((listing) => {
      const title = (listing.title || '').toLowerCase();
      const location = (listing.location || '').toLowerCase();
      const description = (listing.description || '').toLowerCase();
      const price = Number(listing.price || 0);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        title.includes(normalizedSearch) ||
        location.includes(normalizedSearch) ||
        description.includes(normalizedSearch);

      const matchesLocation = locationFilter === 'all' || listing.location === locationFilter;
      const matchesPrice = inBucket(price, priceBucket);

      return matchesSearch && matchesLocation && matchesPrice;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [listings, searchTerm, locationFilter, priceBucket, sortBy]);

  const handleOpenListing = async (listing) => {
    const listingId = getListingId(listing);
    if (!listingId) return;

    navigate(`/listing-details?id=${listingId}`, { state: { listing } });

    if (isAuthenticated) {
      try {
        await api.post('/user/history', {
          listingId,
          title: listing.title,
          location: listing.location || '',
          price: Number(listing.price || 0),
          image: getListingImage(listing),
          source: 'viewlisting-page',
        });
      } catch {
        // Ignore tracking failures in UI.
      }
    }
  };

  const handleToggleFavorite = async (listing) => {
    const listingId = getListingId(listing);
    if (!listingId) return;

    try {
      const response = await api.post('/user/favorites/toggle', {
        listingId,
        title: listing.title,
        location: listing.location || '',
        price: Number(listing.price || 0),
        image: getListingImage(listing),
        source: 'viewlisting-page',
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
      showToast({ type: 'error', title: 'Action failed', message: 'Could not update favorite right now.' });
    }
  };

  const handleReportListing = (listing, event) => {
    if (event) {
      event.stopPropagation();
    }

    if (!canReportProperty) {
      showToast({ type: 'warning', title: 'Not allowed', message: 'Only renters can report listed properties.' });
      return;
    }

    const listingId = getListingId(listing);
    if (!listingId) {
      showToast({ type: 'error', title: 'Missing listing', message: 'Could not identify this listing for reporting.' });
      return;
    }

    setReportModalListing(listing);
    setReportReasonCategory('fake_listing');
    setReportDescription('');
  };

  const closeReportModal = (forceClose = false) => {
    if (reportSubmitting && !forceClose) return;
    setReportModalListing(null);
    setReportReasonCategory('fake_listing');
    setReportDescription('');
  };

  const submitListingReport = async () => {
    const listing = reportModalListing;
    const listingId = getListingId(listing);
    if (!listing || !listingId) {
      showToast({ type: 'error', title: 'Missing listing', message: 'Could not identify this listing for reporting.' });
      return;
    }

    const reasonCategory = String(reportReasonCategory || '').trim().toLowerCase() || 'other';
    const allowedReasons = new Set(['fake_listing', 'fraud', 'policy_violation', 'spam', 'harassment', 'other']);
    const description = String(reportDescription || '').trim();
    if (!description) {
      showToast({ type: 'warning', title: 'Missing details', message: 'Please add details for your report.' });
      return;
    }

    try {
      setReportSubmitting(true);
      await api.post('/user/reports', {
        targetType: 'listing',
        targetId: listingId,
        reasonCategory: allowedReasons.has(reasonCategory) ? reasonCategory : 'other',
        description,
      });

      showToast({
        type: 'success',
        title: 'Report submitted',
        message: 'Your report was sent to admin. The landlord was also notified to respond.',
      });
      closeReportModal(true);
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Could not submit report',
        message: err?.response?.data?.message || 'Please try again later.',
      });
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#fafbfc] to-[#f3f5f9] px-5 md:px-10 lg:px-16 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#132238]">View Listings</h1>
          <p className="mt-2 text-gray-600 text-sm md:text-base">
            Browse rooms quickly with smart filters and open any listing in one click.
          </p>
        </div>

        <section className="bg-white rounded-2xl shadow-xl p-4 md:p-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="md:col-span-2 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, location, or keyword"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded outline-none focus:ring-2 focus:ring-blue-200 border-none shadow-sm"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full appearance-none pl-9 pr-10 py-2.5 bg-gray-50 rounded outline-none focus:ring-2 focus:ring-blue-200 border-none shadow-sm"
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location === 'all' ? 'All Locations' : location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Filter size={14} /> Price
              </span>
              {PRICE_BUCKETS.map((bucket) => (
                <button
                  key={bucket.id}
                  type="button"
                  onClick={() => setPriceBucket(bucket.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    priceBucket === bucket.id
                      ? 'bg-[#1d4ed8] text-white shadow'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border-none shadow-sm'
                  }`}
                >
                  {bucket.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <ArrowUpDown size={14} /> Sort
              </span>
              <div className="relative">
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-10 py-2 text-sm bg-gray-50 rounded outline-none focus:ring-2 focus:ring-blue-200 border-none shadow-sm"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 text-sm text-gray-500 font-medium">
            {loading ? 'Loading listings...' : listings.length === 0 ? 'No listings available' : `${filteredListings.length} listing(s) found`}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-80 rounded-2xl bg-white animate-pulse shadow-sm" />
              ))}
            </div>
          ) : error && listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-red-100">
              <Box size={20} className="mx-auto text-red-400 mb-2" />
              <p className="text-red-700 font-semibold">Unable to load property listings.</p>
              <p className="text-sm text-gray-600 mt-1">Please check your connection and try again.</p>
              <button
                type="button"
                onClick={loadListings}
                className="mt-4 px-4 py-2 text-sm font-semibold text-[#1d4ed8] border border-blue-200 rounded-xl hover:bg-blue-50"
              >
                Retry
              </button>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <Box size={20} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-700 font-semibold">No property listings available yet.</p>
              <p className="text-sm text-gray-500 mt-1">Please check back later for new listings.</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <Box size={20} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No listings match your filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('all');
                  setPriceBucket('all');
                  setSortBy('newest');
                }}
                className="mt-4 px-4 py-2 text-sm font-semibold text-[#1d4ed8] border border-blue-200 rounded-xl hover:bg-blue-50"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredListings.map((listing) => {
                const listingId = getListingId(listing);
                const fallbackCoverImage = getListingImage(listing);
                const availabilityBadge = getAvailabilityBadge(listing, featuredListingIds.has(listingId));
                const isFavorite = favoriteIds.has(listingId);
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
                return (
                  <article
                    key={listingId}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                  >
                    <div onClick={() => handleOpenListing(listing)} className="cursor-pointer">
                      <div
                        className="relative h-48 w-full overflow-hidden"
                        onMouseEnter={() => setHoveredListingId(listingId)}
                        onMouseLeave={() => setHoveredListingId('')}
                      >
                        <HoverImageSlider
                          images={displayImages}
                          altBase={listing.title || 'Room image'}
                          stepIntervalMs={2000}
                          transitionMs={750}
                          animationType="slide"
                          hoverActive={hoveredListingId === listingId}
                        />

                        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/45 to-transparent" />

                        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${availabilityBadge.className}`}>
                          {availabilityBadge.label}
                        </span>

                        {room2DImageCount > 1 && (
                          <span className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-gray-100/95 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
                            +{room2DImageCount - 1} Images
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(listing);
                          }}
                          className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md transition-all active:scale-90 hover:bg-gray-50"
                          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart
                            size={16}
                            className={`transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-red-500'}`}
                          />
                        </button>

                        <div className="absolute left-3 bottom-3">
                          <RatingDisplay
                            listingId={listingId}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/reviews?id=${listingId}`);
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
                          <h2 className="text-lg font-extrabold text-[#132238] line-clamp-2">{listing.title || 'Untitled Listing'}</h2>
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
                            <CalendarDays size={12} /> {formatDate(listing.createdAt)}
                          </p>
                          {canReportProperty && (
                            <button
                              type="button"
                              onClick={(event) => handleReportListing(listing, event)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                            >
                              <ShieldAlert size={12} /> Report Property
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ListingReportModal
        open={Boolean(reportModalListing)}
        listingTitle={reportModalListing?.title || ''}
        reasonCategory={reportReasonCategory}
        description={reportDescription}
        onChangeReason={setReportReasonCategory}
        onChangeDescription={setReportDescription}
        onCancel={closeReportModal}
        onSubmit={submitListingReport}
        isSubmitting={reportSubmitting}
      />
    </div>
  );
};

export default ViewListingPage;
