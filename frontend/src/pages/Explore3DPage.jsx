import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  RotateCw, RefreshCcw, Maximize, Bed, Bath, Ruler, 
  Heart, Share2, CheckCircle2, User, Phone, Mail, 
  MessageSquare, Home, Info, MousePointer2, Move, Search,
  Star,
  MapPin, Calendar, MessageCircle, ShieldCheck, Map, Zap
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { getListingId } from '../utils/listingData';
import { ChatBox } from '../components/PropertyActions';
import { useToast } from '../context/ToastContext';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';

function normalizeListing(rawListing) {
  if (!rawListing) return null;

  return {
    ...rawListing,
    listingId: getListingId(rawListing),
    source: rawListing.source || 'listing-details-page',
    bedrooms: Number(rawListing.bedrooms || 1),
    bathrooms: Number(rawListing.bathrooms || 1),
    areaSqFt: Number(rawListing.areaSqFt || 450),
    ownerName: rawListing.ownerName || 'Property Owner',
    ownerPhone: rawListing.ownerPhone || '',
    ownerEmail: rawListing.ownerEmail || '',
    ownerProfilePhoto: rawListing.ownerProfilePhoto || rawListing.owner?.profilePhoto || '',
  };
}

function getListingImage(listing) {
  return String(listing?.image || listing?.images?.[0] || '').trim();
}

const defaultKeyFeatures = [
  'Fully furnished',
  'Security System',
  'Balcony with view',
  'High-speed internet',
  'Kitchen appliances',
  'Laundry facilities',
];

const Explore3DPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const listingIdFromQuery = searchParams.get('id');
  const tabFromQuery = searchParams.get('tab');
  const allowedTabs = new Set(['details', 'chat', 'reviews']);
  const passedListing = normalizeListing(location.state?.listing);
  const effectiveListingId = listingIdFromQuery || passedListing?.listingId || '';
  const { isAuthenticated, token } = useAuth();
  const [listing, setListing] = useState(passedListing);
  const [isLoading, setIsLoading] = useState(!passedListing && Boolean(effectiveListingId));
  const [loadError, setLoadError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [message, setMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState(allowedTabs.has(tabFromQuery) ? tabFromQuery : 'details'); // 'details', 'chat', 'reviews'
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const [detailsReviewSummary, setDetailsReviewSummary] = useState({
    reviews: [],
    averageRating: 0,
    totalReviews: 0,
  });
  const [isLoadingDetailsReviews, setIsLoadingDetailsReviews] = useState(false);
  const { showToast } = useToast();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const seenOwnerMessageAtRef = useRef('');
  const initializedOwnerMessageRef = useRef(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  useAutoDismiss(message, () => setMessage(''));

  useEffect(() => {
    if (allowedTabs.has(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  useEffect(() => {
    if (!loadError) return;
    showToast({ type: 'error', title: 'Listing error', message: loadError });
  }, [loadError, showToast]);

  useEffect(() => {
    if (!message) return;
    showToast({ type: message.includes('Could not') ? 'error' : 'success', title: message.includes('Could not') ? 'Action failed' : 'Success', message });
  }, [message, showToast]);
  useAutoDismiss(loadError, () => setLoadError(''));

  useEffect(() => {
    if (!effectiveListingId) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    async function fetchListing() {
      try {
        // Only show blocking loader when there is no listing content to render yet.
        if (!passedListing) {
          setIsLoading(true);
        }

        const response = await api.get(`/rooms/${effectiveListingId}`);
        if (!ignore) {
          setListing(normalizeListing(response.data));
          setLoadError('');
        }
      } catch {
        if (!ignore) {
          setLoadError('Could not refresh listing details from server.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchListing();

    return () => {
      ignore = true;
    };
  }, [effectiveListingId]);

  const listingKey = getListingId(listing);

  useEffect(() => {
    if (!listing || !isAuthenticated) return;

    let ignore = false;

    async function loadFavoriteState() {
      if (!token) {
        setIsFavorite(false);
        return;
      }

      try {
        const res = await api.get('/user/favorites');
        const favoriteSet = new Set((res.data?.favorites || []).map((item) => item.listingId));
        if (!ignore) {
          setIsFavorite(favoriteSet.has(listingKey));
        }
      } catch {
        if (!ignore) {
          setIsFavorite(false);
        }
      }
    }

    async function trackView() {
      if (!token) return;

      try {
        await api.post('/user/history', {
          listingId: listingKey,
          title: listing.title,
          location: listing.location,
          price: listing.price,
          image: getListingImage(listing),
          source: 'listing-details-page',
        });
      } catch {
        // Ignore history tracking errors in UI.
      }
    }

    loadFavoriteState();
    trackView();

    return () => {
      ignore = true;
    };
  }, [listing, listingKey, isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token || !listingKey) {
      setUnreadChatCount(0);
      seenOwnerMessageAtRef.current = '';
      initializedOwnerMessageRef.current = false;
      return;
    }

    let stopped = false;

    const getLatestOwnerMessageAt = (chat) => {
      if (!Array.isArray(chat?.messages)) return '';

      const latestOwnerMessage = chat.messages.reduce((acc, msg) => {
        if (msg?.senderType !== 'owner' || !msg?.sentAt) return acc;
        if (!acc) return msg.sentAt;
        return new Date(msg.sentAt) > new Date(acc) ? msg.sentAt : acc;
      }, '');

      return latestOwnerMessage || '';
    };

    const getUnreadOwnerMessageCount = (chat, seenAt) => {
      if (!Array.isArray(chat?.messages) || !chat.messages.length) return 0;

      return chat.messages.filter((msg) => {
        if (msg?.senderType !== 'owner' || !msg?.sentAt) return false;
        if (!seenAt) return true;
        return new Date(msg.sentAt) > new Date(seenAt);
      }).length;
    };

    const pullChatStatus = async () => {
      try {
        const response = await api.get('/user/chats');
        if (stopped) return;

        const chats = Array.isArray(response.data?.chats) ? response.data.chats : [];
        const matchingChat = chats.find((chat) => String(chat?.listingId) === String(listingKey));
        const latestOwnerMessageAt = getLatestOwnerMessageAt(matchingChat);

        if (activeTab === 'chat') {
          seenOwnerMessageAtRef.current = latestOwnerMessageAt;
          initializedOwnerMessageRef.current = true;
          setUnreadChatCount(0);
          return;
        }

        if (!initializedOwnerMessageRef.current) {
          seenOwnerMessageAtRef.current = latestOwnerMessageAt;
          initializedOwnerMessageRef.current = true;
          setUnreadChatCount(0);
          return;
        }

        const count = getUnreadOwnerMessageCount(matchingChat, seenOwnerMessageAtRef.current);
        setUnreadChatCount(count);
      } catch {
        // Keep existing unread state when background polling fails.
      }
    };

    pullChatStatus();
    const intervalId = setInterval(pullChatStatus, 4000);

    const handleFocus = () => {
      pullChatStatus();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pullChatStatus();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      stopped = true;
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [activeTab, isAuthenticated, token, listingKey]);

  useEffect(() => {
    if (!listingKey) {
      setDetailsReviewSummary({ reviews: [], averageRating: 0, totalReviews: 0 });
      return;
    }

    let ignore = false;

    const loadDetailsReviewSummary = async () => {
      setIsLoadingDetailsReviews(true);

      try {
        const response = await api.get(`/reviews/listing/${listingKey}`);
        if (!ignore) {
          const reviews = response.data?.reviews || [];
          setDetailsReviewSummary({
            reviews,
            averageRating: Number(response.data?.averageRating || 0),
            totalReviews: Number(response.data?.totalReviews || reviews.length || 0),
          });
        }
      } catch {
        if (!ignore) {
          setDetailsReviewSummary({ reviews: [], averageRating: 0, totalReviews: 0 });
        }
      } finally {
        if (!ignore) {
          setIsLoadingDetailsReviews(false);
        }
      }
    };

    loadDetailsReviewSummary();

    return () => {
      ignore = true;
    };
  }, [listingKey, reviewRefreshTrigger]);

  useEffect(() => {
    setIsDescriptionOpen(false);
  }, [listingKey]);

  if (isLoading && !listing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading listing details...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center bg-white border border-gray-200 rounded-sm shadow-sm p-6">
          <h1 className="text-xl font-bold text-[#1a222e]">Listing not found</h1>
          <p className="text-sm text-gray-600 mt-2">We could not find details for this listing.</p>
          <button
            type="button"
            onClick={() => navigate('/viewlisting')}
            className="mt-4 px-4 py-2 text-sm font-semibold text-[#1d4ed8] border border-blue-200 rounded-sm hover:bg-blue-50"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!listing) return;

    try {
      const response = await api.post('/user/favorites/toggle', {
        listingId: listingKey,
        title: listing.title,
        location: listing.location,
        price: listing.price,
        image: getListingImage(listing),
      });
      const nextState = Boolean(response.data?.isFavorite);
      setIsFavorite(nextState);
      setMessage(nextState ? 'Added to favorites' : 'Removed from favorites');
    } catch {
      setMessage('Could not update favorite right now');
    }
  };

  const mapQuery = encodeURIComponent(String(listing.location || 'Kathmandu, Nepal').trim() || 'Kathmandu, Nepal');
  const listingStatus = String(listing.status || '').toLowerCase();
  const isBookedListing = Boolean(
    listing.isBooked ||
    listingStatus === 'booked' ||
    listingStatus === 'rented' ||
    listingStatus === 'occupied'
  );
  const listingKeyFeatures = Array.isArray(listing.keyFeatures)
    ? listing.keyFeatures.map((feature) => String(feature || '').trim()).filter(Boolean)
    : [];
  const featuresToDisplay = listingKeyFeatures.length ? listingKeyFeatures : defaultKeyFeatures;
  const listingDescription = String(listing.description || '').trim();

  const handleBookVisitClick = () => {
    if (isBookedListing) {
      showToast({
        type: 'warning',
        title: 'Property unavailable',
        message: 'This listing is currently unavailable.',
      });
      return;
    }

    navigate('/booking-visit', { state: { listing } });
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans px-4 md:px-8 py-4 md:py-8">
      <AuthRequiredModal
        open={showAuthModal}
        message="Please log in or sign up to save this listing to favorites."
        onCancel={() => setShowAuthModal(false)}
        onConfirm={() => navigate('/login', { state: { from: location.pathname + location.search } })}
      />

      <div className="w-full max-w-350 mx-auto">
        <div className="flex flex-col gap-6">
          {/* TOP ROW: 3D and Location Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-[68%_32%] xl:grid-cols-[70%_30%] gap-6">
            {/* 3D Visualization Card */}
            <div className="bg-white rounded-sm shadow-lg ring-1 ring-blue-100 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[#1a222e]">3D Room Visualization</h2>
                    <p className="mt-1 text-xs text-slate-500">Interactive preview canvas with camera controls and real-time loading status.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-bold hover:bg-gray-50 whitespace-nowrap">
                      <RefreshCcw size={14} /> Reset View
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-bold hover:bg-gray-50 whitespace-nowrap">
                      <RotateCw size={14} /> Auto Rotate
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-bold hover:bg-gray-50 whitespace-nowrap">
                      <Maximize size={14} /> Full Screen
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3 bg-slate-50/40">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-[#111827]">
                  <img
                    src={listing.image || 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1200'}
                    className="absolute inset-0 w-full h-full object-cover opacity-45"
                    alt="3D Placeholder"
                  />
                  <div className="absolute inset-0 bg-linear-to-tr from-black/65 via-black/40 to-blue-900/25" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center">
                    <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm font-bold tracking-wide">Loading 3D Model</p>
                    <p className="mt-1 text-[11px] text-white/80">Preparing textures, lighting, and scene controls</p>
                  </div>

                  <div className="absolute left-3 right-3 bottom-3 h-1.5 rounded-full bg-white/25 overflow-hidden">
                    <div className="h-full w-2/3 bg-linear-to-r from-[#60a5fa] to-[#3b82f6]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-700"><MousePointer2 size={13} className="text-[#3b82f6]" /> Rotate</p>
                    <p className="mt-1 text-[11px] text-slate-500">Click and drag to orbit the camera.</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-700"><Search size={13} className="text-[#3b82f6]" /> Zoom</p>
                    <p className="mt-1 text-[11px] text-slate-500">Use mouse wheel for close inspection.</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-700"><Move size={13} className="text-[#3b82f6]" /> Pan</p>
                    <p className="mt-1 text-[11px] text-slate-500">Right-click and drag to reposition.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Location Map */}
            <section className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 md:p-5 pb-3 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-700">Property Location</h2>
                    <p className="text-[11px] text-slate-500 mt-1">Quick location reference</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-[#1d4ed8] transition-colors hover:bg-blue-100"
                  >
                    Open in Maps
                  </a>
                </div>

                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Address</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">{listing.location || 'Location not specified'}</p>
                </div>
              </div>

              <div className="p-4 md:p-5 pt-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden h-64 md:h-72 lg:h-80 xl:h-88 shadow-inner">
                  <iframe
                    title="Property location map"
                    src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3.5">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Area Highlights
                  </h4>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white rounded-md shadow-xs text-blue-500 border border-slate-100">
                        <Map size={16} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">5 mins walk to Market</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white rounded-md shadow-xs text-green-500 border border-slate-100">
                        <ShieldCheck size={16} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">Peaceful and secure area</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white rounded-md shadow-xs text-orange-500 border border-slate-100">
                        <Zap size={16} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">24/7 water and power</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* BOTTOM ROW: TABBED INTERFACE - FULL WIDTH */}
          <div className="bg-white rounded-sm shadow-md overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 px-4 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'details'
                    ? 'bg-blue-50 text-[#3b66ff] border-b-2 border-[#3b66ff]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home size={16} /> Details
              </button>
              <button
                onClick={() => {
                  setActiveTab('chat');
                    setUnreadChatCount(0);
                }}
                className={`flex-1 px-4 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-blue-50 text-[#3b66ff] border-b-2 border-[#3b66ff]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                  <span className="relative inline-flex items-center gap-2 pr-2">
                  <MessageCircle size={16} /> Chat
                      {unreadChatCount > 0 && activeTab !== 'chat' && (
                        <span className="absolute -top-1.5 -right-2.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#ef4444] text-white text-[9px] leading-4.5 font-bold text-center shadow-sm">
                        {unreadChatCount > 99 ? '99+' : unreadChatCount}
                      </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 px-4 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'reviews'
                    ? 'bg-blue-50 text-[#3b66ff] border-b-2 border-[#3b66ff]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MessageSquare size={16} /> Reviews
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div>
                  <div className="mb-6">
                    <h1 className="text-3xl font-black text-[#1a222e] leading-tight mb-2">{listing.title || 'Listing Details'}</h1>
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin size={16} className="text-[#ff5a3c]" />
                      <p className="text-sm font-medium">{listing.location || 'Location not specified'}</p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-8 border-t border-gray-100 pt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[#3b66ff] text-3xl font-black">Rs. {Number(listing.price || 0).toLocaleString()}</span>
                      <span className="text-gray-500 font-bold text-sm">/month</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold mt-2 flex items-center gap-1 uppercase tracking-wider">
                      <Info size={12} /> Utilities Included
                    </p>
                  </div>

                  {/* Description */}
                  <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 border border-slate-200">
                        <Info size={14} />
                      </span>
                      <h3 className="text-base font-bold text-[#1a222e]">Property Description</h3>
                    </div>
                    {listingDescription ? (
                      <>
                        {!isDescriptionOpen ? (
                          <div>
                            <p className="text-sm text-slate-500">Click the button below to read the full property description.</p>
                            <button
                              type="button"
                              onClick={() => setIsDescriptionOpen(true)}
                              className="mt-3 inline-flex items-center rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#1d4ed8] transition-colors hover:bg-blue-50"
                            >
                              Read Description
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm leading-7 text-slate-700 whitespace-pre-line">{listingDescription}</p>
                            <button
                              type="button"
                              onClick={() => setIsDescriptionOpen(false)}
                              className="mt-3 inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              Hide Description
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">No description provided for this property.</p>
                    )}
                  </div>

                  {/* Primary Actions */}
                  <button
                    type="button"
                    onClick={handleBookVisitClick}
                    disabled={isBookedListing}
                    className={`w-full py-3 rounded font-bold text-sm transition-colors mb-3 ${
                      isBookedListing
                        ? 'bg-red-100 text-red-700 border border-red-200 cursor-not-allowed'
                        : 'bg-[#3b66ff] text-white hover:bg-blue-700'
                    }`}
                  >
                    <Calendar size={16} className="inline mr-2" /> {isBookedListing ? 'Property Already Booked' : 'Book a Visit'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    className="w-full border border-blue-200 bg-blue-50 text-[#3b66ff] py-3 rounded font-bold text-sm hover:bg-blue-100 transition-colors mb-4"
                  >
                    <Star size={16} className="inline mr-2 text-amber-500 fill-amber-500" /> Rate and Review this Property
                  </button>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-8">
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      className="flex-1 flex items-center justify-center gap-2 border border-gray-300 py-2 rounded font-bold text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Heart size={16} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
                      {isFavorite ? 'Saved' : 'Save'}
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 border border-gray-300 py-2 rounded font-bold text-sm hover:bg-gray-50 transition-colors">
                      <Share2 size={16} /> Share
                    </button>
                  </div>

                  {/* Specs Badges */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    <div className="flex items-center gap-2 bg-blue-50 text-[#3b82f6] px-4 py-2 rounded-full text-xs font-bold">
                      <Bed size={14} /> {listing.bedrooms} Bedroom
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 text-[#3b66ff] px-4 py-2 rounded-full text-xs font-bold">
                      <Bath size={14} /> {listing.bathrooms} Bathroom
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 text-[#3b66ff] px-4 py-2 rounded-full text-xs font-bold">
                      <Ruler size={14} /> {listing.areaSqFt} sq.ft.
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-6">
                      <CheckCircle2 size={20} className="text-[#3b82f6]" fill="white" />
                      <h3 className="text-lg font-bold text-[#3b66ff]">Key Features</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                      {featuresToDisplay.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-xs font-bold text-gray-600">
                          <CheckCircle2 size={16} className="text-gray-400" /> {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reviews Section in Details Tab */}
                  <div className="border-t border-gray-100 pt-8 mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="bg-[#3b66ff] p-1.5 rounded-full text-white"><MessageSquare size={16} /></div>
                      <h3 className="text-lg font-bold text-[#3b66ff]">Reviews & Ratings</h3>
                    </div>

                    {isLoadingDetailsReviews ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        Loading ratings and reviews...
                      </div>
                    ) : detailsReviewSummary.totalReviews > 0 ? (
                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
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
                        <div className="mb-3 rounded-lg bg-[#f8fbff] px-3 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3b66ff]">Trusted renter feedback</p>
                          <p className="mt-1 text-xs text-gray-600">
                            {recommendationPct}% of renters rated this property 4 stars or above.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[110px_1fr] md:items-center">
                          <div className="text-center md:text-left">
                            <p className="text-4xl font-black leading-none text-gray-900">
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
                                      : 'text-gray-300'
                                  }
                                />
                              ))}
                            </div>
                            <p className="mt-1 text-[11px] font-medium text-gray-500">
                              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            {distribution.map(({ star, count, percentage }) => (
                              <div key={star} className="grid grid-cols-[14px_1fr_24px] items-center gap-2">
                                <span className="text-[11px] font-semibold text-gray-600">{star}</span>
                                <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                                  <div
                                    className="h-full rounded-full bg-[#fbbc04]"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-right text-[11px] text-gray-500">{count}</span>
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
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        No reviews yet for this property.
                      </div>
                    )}

                  </div>

                  {/* Contact Section */}
                  <div className="border-t border-gray-100 pt-8">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="bg-[#3b66ff] p-1.5 rounded-full text-white"><User size={16} /></div>
                      <h3 className="text-lg font-bold text-[#3b66ff]">Contact Owner</h3>
                    </div>
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                        <User size={16} className="text-gray-400" /> {listing.ownerName || 'Property Owner'}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                        <Phone size={16} className="text-gray-400" /> {listing.ownerPhone || 'Not provided'}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                        <Mail size={16} className="text-gray-400" /> {listing.ownerEmail || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div>
                  <ChatBox
                    listingId={listingKey}
                    ownerId={listing?.ownerId || listing?.owner}
                    ownerName={listing?.ownerName}
                    ownerProfilePhoto={listing?.ownerProfilePhoto}
                    title={listing?.title}
                    location={listing?.location}
                    price={listing?.price}
                    image={listing?.image}
                  />
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  {isAuthenticated && (
                    <ReviewForm 
                      listingId={listing.listingId} 
                      onReviewAdded={() => setReviewRefreshTrigger(prev => prev + 1)}
                    />
                  )}
                  <ReviewsList 
                    listingId={listing.listingId}
                    refreshTrigger={reviewRefreshTrigger}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore3DPage;