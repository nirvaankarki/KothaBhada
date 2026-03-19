import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Filter, ArrowUpDown, Box } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { FALLBACK_LISTINGS, getListingId } from '../utils/listingData';

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

const ViewListingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [priceBucket, setPriceBucket] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(message, () => setMessage(''));

  useEffect(() => {
    let ignore = false;

    async function loadListings() {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/rooms/demo');
        const fetched = Array.isArray(response.data) ? response.data : [];

        if (!ignore) {
          if (fetched.length > 0) {
            setListings(fetched);
          } else {
            setListings(FALLBACK_LISTINGS);
            setMessage('No listings found in database. Showing demo listings.');
          }
        }
      } catch {
        if (!ignore) {
          setListings(FALLBACK_LISTINGS);
          setError('Could not load listings from server. Showing demo listings.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      ignore = true;
    };
  }, []);

  const locations = useMemo(() => {
    const unique = new Set(listings.map((item) => item.location).filter(Boolean));
    return ['all', ...Array.from(unique)];
  }, [listings]);

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

    if (isAuthenticated) {
      try {
        await api.post('/user/history', {
          listingId,
          title: listing.title,
          location: listing.location || '',
          price: Number(listing.price || 0),
          image: '',
          source: 'viewlisting-page',
        });
      } catch {
        // Ignore tracking failures in UI.
      }
    }

    navigate('/listing-details', { state: { listing } });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#f6f8fb] to-[#edf2f7] px-5 md:px-10 lg:px-16 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#132238]">View Listings</h1>
          <p className="mt-2 text-gray-600 text-sm md:text-base">
            Browse rooms quickly with smart filters and open any listing in one click.
          </p>
        </div>

        {error && <div className="mb-5 p-3 rounded-sm bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        {message && <div className="mb-5 p-3 rounded-sm bg-blue-50 border border-blue-200 text-blue-700 text-sm">{message}</div>}

        <section className="bg-white border border-gray-100 rounded-sm shadow-sm p-4 md:p-5 mb-7">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="md:col-span-2 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, location, or keyword"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-300"
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                    priceBucket === bucket.id
                      ? 'bg-[#1d4ed8] text-white border-[#1d4ed8]'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
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
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-300"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 text-sm text-gray-500 font-medium">
            {loading ? 'Loading listings...' : `${filteredListings.length} listing(s) found`}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-72 rounded-sm border border-gray-100 bg-white animate-pulse" />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-sm p-10 text-center">
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
                className="mt-4 px-4 py-2 text-sm font-semibold text-[#1d4ed8] border border-blue-200 rounded-sm hover:bg-blue-50"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredListings.map((listing) => {
                const listingId = getListingId(listing);
                return (
                  <article 
                    key={listingId} 
                    onClick={() => handleOpenListing(listing)}
                    className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="h-44 bg-linear-to-br from-[#dbeafe] via-[#f1f5f9] to-[#e2e8f0]" />
                    <div className="p-4">
                      <h2 className="text-lg font-bold text-[#132238] line-clamp-2">{listing.title || 'Untitled Listing'}</h2>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={12} /> {listing.location || 'Location not specified'}
                      </p>

                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{listing.description || 'No description available for this listing.'}</p>

                      <div className="mt-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Monthly Rent</p>
                        <p className="text-xl font-black text-[#1d4ed8]">Rs {Number(listing.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default ViewListingPage;
