import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  RotateCw, RefreshCcw, Maximize, Bed, Bath, Ruler, 
  Heart, Share2, CheckCircle2, User, Phone, Mail, 
  MessageSquare, Home, Info, MousePointer2, Move, Search,
  MapPin, Calendar, MessageCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { getListingId } from '../utils/listingData';
import { BookingForm, ChatBox } from '../components/PropertyActions';
import { useToast } from '../context/ToastContext';

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
  };
}

function getListingImage(listing) {
  return String(listing?.image || listing?.images?.[0] || '').trim();
}

const Explore3DPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const listingIdFromQuery = searchParams.get('id');
  const passedListing = normalizeListing(location.state?.listing);
  const effectiveListingId = listingIdFromQuery || passedListing?.listingId || '';
  const { isAuthenticated, token } = useAuth();
  const [listing, setListing] = useState(passedListing);
  const [isLoading, setIsLoading] = useState(!passedListing && Boolean(effectiveListingId));
  const [loadError, setLoadError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [message, setMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'booking', 'chat'
  const { showToast } = useToast();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const seenOwnerMessageAtRef = useRef('');
  const initializedOwnerMessageRef = useRef(false);

  useAutoDismiss(message, () => setMessage(''));

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

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans px-4 md:px-8 py-4 md:py-8">
      <AuthRequiredModal
        open={showAuthModal}
        message="Please log in or sign up to save this listing to favorites."
        onCancel={() => setShowAuthModal(false)}
        onConfirm={() => navigate('/login', { state: { from: location.pathname + location.search } })}
      />

      <div className="w-full max-w-350 mx-auto flex flex-col lg:flex-row gap-6 lg:gap-5 xl:gap-6">
        
        {/* LEFT COLUMN */}
        <div className="flex-1 lg:w-[65%] lg:flex-none flex flex-col gap-6">
          {/* 3D Visualization Card */}
          <div className="bg-white rounded-sm shadow-md overflow-hidden">
            <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#1a222e]">3D Room Visualization</h2>
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

            <div className="relative aspect-video bg-[#2a2a2a] flex items-center justify-center overflow-hidden">
              <img 
                src={listing.image || 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1200'} 
                className="w-full h-full object-cover opacity-40 blur-sm" 
                alt="3D Placeholder"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="font-bold tracking-wide">Loading 3D Model</span>
              </div>

              <div className="absolute bottom-6 right-6 bg-black/80 text-white p-5 rounded flex flex-col gap-3 text-sm border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <MousePointer2 size={16} className="text-blue-400" />
                  <span>Click & Drag to rotate</span>
                </div>
                <div className="flex items-center gap-3">
                  <Search size={16} className="text-blue-400" />
                  <span>Scroll to zoom</span>
                </div>
                <div className="flex items-center gap-3">
                  <Move size={16} className="text-blue-400" />
                  <span>Right-click & drag to pan</span>
                </div>
              </div>
            </div>
          </div>

          {/* Property Location Map */}
          <section className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-slate-900 p-1.5 rounded-md text-white">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Property Location</h2>
                <p className="text-xs text-slate-500 mt-1">Map view of where this property is located.</p>
              </div>
            </div>

            <hr className="border-slate-200 mb-6" />

            <div className="rounded-sm border border-slate-200 overflow-hidden bg-slate-50">
              <iframe
                title="Property location map"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="w-full h-80"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <MapPin size={15} className="text-[#3b66ff]" />
              <span>{listing.location || 'Location not specified'}</span>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: TABBED INTERFACE */}
        <div className="w-full lg:w-[35%] lg:flex-none flex flex-col gap-6">
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
                onClick={() => setActiveTab('booking')}
                className={`flex-1 px-4 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'booking'
                    ? 'bg-blue-50 text-[#3b66ff] border-b-2 border-[#3b66ff]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Calendar size={16} /> Book Visit
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

                  {/* Action Buttons */}
                  <div className="flex gap-3 mb-10">
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

                  {/* Key Features */}
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-6">
                      <CheckCircle2 size={20} className="text-[#3b82f6]" fill="white" />
                      <h3 className="text-lg font-bold text-[#3b66ff]">Key Features</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                      {["Fully furnished", "Security System", "Balcony with view", "High-speed internet", "Kitchen appliances", "Laundry facilities"].map(feature => (
                        <div key={feature} className="flex items-center gap-2 text-xs font-bold text-gray-600">
                          <CheckCircle2 size={16} className="text-gray-400" /> {feature}
                        </div>
                      ))}
                    </div>
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

              {/* Book Visit Tab */}
              {activeTab === 'booking' && (
                <div>
                  <BookingForm 
                    listingId={listingKey} 
                    ownerId={listing?.ownerId || listing?.owner}
                    title={listing?.title}
                    location={listing?.location}
                    price={listing?.price}
                    image={listing?.image}
                    onBookingSuccess={() => {}} 
                  />
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div>
                  <ChatBox 
                    listingId={listingKey} 
                    ownerId={listing?.ownerId || listing?.owner}
                    title={listing?.title}
                    location={listing?.location}
                    price={listing?.price}
                    image={listing?.image}
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