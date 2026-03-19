import React, { useEffect, useState } from 'react';
import { 
  RotateCw, RefreshCcw, Maximize, Bed, Bath, Ruler, 
  Heart, Share2, CheckCircle2, User, Phone, Mail, 
  MessageSquare, Home, Info, MousePointer2, Move, Search,
  MapPin
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import AuthRequiredModal from '../components/AuthRequiredModal';

const Explore3DPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [message, setMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get listing from route state, fallback to default
  const passedListing = location.state?.listing;
  const listing = passedListing ? {
    ...passedListing,
    listingId: String(passedListing.listingId || passedListing._id || passedListing.id || passedListing.title || 'listing').trim(),
    source: passedListing.source || 'listing-details-page',
    bedrooms: Number(passedListing.bedrooms || 1),
    bathrooms: Number(passedListing.bathrooms || 1),
    areaSqFt: Number(passedListing.areaSqFt || 450),
    ownerName: passedListing.ownerName || 'Property Owner',
    ownerPhone: passedListing.ownerPhone || '',
    ownerEmail: passedListing.ownerEmail || '',
  } : {
    listingId: 'explore3d-modern-studio-apartment',
    title: 'Modern Studio Apartment',
    location: 'Kalopul, Kathmandu-30, Kathmandu',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1200',
    source: 'explore3d-page',
    bedrooms: 3,
    bathrooms: 1,
    areaSqFt: 450,
    ownerName: 'Mr. Rajesh Hamal',
    ownerPhone: '+977-9834987654',
    ownerEmail: 'rajeshhamal@gmail.com',
  };

  useAutoDismiss(message, () => setMessage(''));

  useEffect(() => {
    let ignore = false;

    async function loadFavoriteState() {
      if (!isAuthenticated || !token) {
        setIsFavorite(false);
        return;
      }

      try {
        const res = await api.get('/user/favorites');
        const favoriteSet = new Set((res.data?.favorites || []).map((item) => item.listingId));
        if (!ignore) {
          setIsFavorite(favoriteSet.has(listing.listingId));
        }
      } catch {
        if (!ignore) {
          setIsFavorite(false);
        }
      }
    }

    async function trackView() {
      if (!isAuthenticated || !token) return;

      try {
        await api.post('/user/history', listing);
      } catch {
        // Ignore history tracking errors in UI.
      }
    }

    loadFavoriteState();
    trackView();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const response = await api.post('/user/favorites/toggle', listing);
      const nextState = Boolean(response.data?.isFavorite);
      setIsFavorite(nextState);
      setMessage(nextState ? 'Added to favorites' : 'Removed from favorites');
    } catch {
      setMessage('Could not update favorite right now');
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans p-4 md:p-8">
      <AuthRequiredModal
        open={showAuthModal}
        message="Please log in or sign up to save this listing to favorites."
        onCancel={() => setShowAuthModal(false)}
        onConfirm={() => navigate('/login', { state: { from: '/listing-details' } })}
      />

      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col gap-6">
          {/* 3D Visualization Card */}
          <div className="bg-white rounded-sm shadow-md overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#1a222e]">3D Room Visualization</h2>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-bold hover:bg-gray-50">
                  <RefreshCcw size={14} /> Reset View
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-bold hover:bg-gray-50">
                  <RotateCw size={14} /> Auto Rotate
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-bold hover:bg-gray-50">
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
        </div>

        {/* RIGHT COLUMN: PROPERTY DETAILS */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6">
          <div className="bg-white rounded-sm shadow-md p-8">
            {message && (
              <div className={`mb-5 p-3 rounded-sm text-sm font-semibold ${message.includes('Could not') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                {message}
              </div>
            )}

            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4">
              <Home size={24} className="text-[#1a222e]" fill="#1a222e" />
              <h2 className="text-2xl font-black text-[#1a222e] tracking-tight uppercase">Property Details</h2>
            </div>

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

              <button className="w-full bg-[#3b66ff] hover:bg-blue-700 text-white font-black py-4 rounded-sm flex items-center justify-center gap-3 uppercase tracking-widest shadow-lg transition-all active:scale-95">
                <MessageSquare size={18} /> Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore3DPage;