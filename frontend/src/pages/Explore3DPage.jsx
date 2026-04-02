import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  RotateCw, RefreshCcw, Maximize, Bed, Bath, Square,
  Heart, Share2, CheckCircle2, User, Phone, Mail, 
  MessageSquare, Info, MousePointer2, Move, Search,
  Star,
  MapPin, Calendar, MessageCircle, ExternalLink, Navigation, X,
  Hospital, Pill, GraduationCap, Bus, Store, Landmark, UtensilsCrossed, Shield, Building2
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

const defaultAreaHighlights = [
  '5 mins walk to Market',
  'Peaceful and secure area',
  '24/7 water and power',
];

const PLACE_TYPE_PRIORITY = {
  hospital: 1,
  clinic: 1,
  pharmacy: 2,
  school: 2,
  college: 2,
  university: 2,
  bus_station: 3,
  station: 3,
  supermarket: 4,
  marketplace: 4,
  mall: 4,
  bank: 5,
  police: 5,
  restaurant: 6,
  cafe: 6,
};

const IMPORTANT_CATEGORY_ORDER = ['health', 'education', 'transport', 'shopping', 'safety'];

const TYPE_TO_CATEGORY = {
  hospital: 'health',
  clinic: 'health',
  pharmacy: 'health',
  school: 'education',
  college: 'education',
  university: 'education',
  bus_station: 'transport',
  station: 'transport',
  supermarket: 'shopping',
  marketplace: 'shopping',
  mall: 'shopping',
  convenience: 'shopping',
  bank: 'safety',
  police: 'safety',
  restaurant: 'dining',
  cafe: 'dining',
};

const CATEGORY_LABELS = {
  health: 'Health',
  education: 'Education',
  transport: 'Transport',
  shopping: 'Shopping',
  safety: 'Safety',
  dining: 'Dining',
  other: 'Other',
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

function toRad(value) {
  return (value * Math.PI) / 180;
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadius * c);
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) {
    return 'Nearby';
  }

  if (meters < 1000) {
    return `${meters} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function buildOverpassQuery(lat, lon, radiusMeters = 1500) {
  return `[out:json][timeout:25];
(
  node(around:${radiusMeters},${lat},${lon})[amenity~"hospital|clinic|pharmacy|school|college|university|bus_station|bank|police|restaurant|cafe|marketplace"];
  way(around:${radiusMeters},${lat},${lon})[amenity~"hospital|clinic|pharmacy|school|college|university|bus_station|bank|police|restaurant|cafe|marketplace"];
  node(around:${radiusMeters},${lat},${lon})[shop~"supermarket|mall|convenience"];
  way(around:${radiusMeters},${lat},${lon})[shop~"supermarket|mall|convenience"];
  node(around:${radiusMeters},${lat},${lon})[public_transport~"station"];
  way(around:${radiusMeters},${lat},${lon})[public_transport~"station"];
);
out center;`;
}

function normalizeOverpassElement(element) {
  const tags = element?.tags || {};
  const lat = Number(element?.lat ?? element?.center?.lat);
  const lon = Number(element?.lon ?? element?.center?.lon);
  const name = String(tags.name || '').trim();
  const type = String(tags.amenity || tags.shop || tags.public_transport || '').trim().toLowerCase();

  if (!name || !type || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  return { name, type, lat, lon };
}

function formatPlaceType(type) {
  return String(type || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCategoryByType(type) {
  const normalizedType = String(type || '').toLowerCase();
  return TYPE_TO_CATEGORY[normalizedType] || 'other';
}

async function fetchOverpassWithFallback(query, options = {}) {
  const { signal, timeoutMs = 12000 } = options;
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    const requestController = new AbortController();
    const timeoutId = setTimeout(() => {
      requestController.abort();
    }, timeoutMs);

    const relayAbort = () => {
      requestController.abort();
    };

    if (signal) {
      signal.addEventListener('abort', relayAbort, { once: true });
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        signal: requestController.signal,
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
        },
        body: query,
      });

      if (!response.ok) {
        throw new Error(`Nearby places lookup failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      lastError = error;
    } finally {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', relayAbort);
      }
    }
  }

  throw lastError || new Error('Nearby places lookup failed on all providers');
}

function getPlaceVisuals(type) {
  const normalizedType = String(type || '').toLowerCase();

  if (['hospital', 'clinic'].includes(normalizedType)) {
    return { Icon: Hospital, badgeClass: 'bg-red-50 text-red-700 border-red-100' };
  }

  if (normalizedType === 'pharmacy') {
    return { Icon: Pill, badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100' };
  }

  if (['school', 'college', 'university'].includes(normalizedType)) {
    return { Icon: GraduationCap, badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
  }

  if (['bus_station', 'station'].includes(normalizedType)) {
    return { Icon: Bus, badgeClass: 'bg-sky-50 text-sky-700 border-sky-100' };
  }

  if (['supermarket', 'marketplace', 'mall', 'convenience'].includes(normalizedType)) {
    return { Icon: Store, badgeClass: 'bg-orange-50 text-orange-700 border-orange-100' };
  }

  if (normalizedType === 'bank') {
    return { Icon: Landmark, badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  }

  if (normalizedType === 'police') {
    return { Icon: Shield, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
  }

  if (['restaurant', 'cafe'].includes(normalizedType)) {
    return { Icon: UtensilsCrossed, badgeClass: 'bg-amber-50 text-amber-700 border-amber-100' };
  }

  return { Icon: Building2, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
}

const Explore3DPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const listingIdFromQuery = searchParams.get('id');
  const tabFromQuery = searchParams.get('tab');
  const openChatFromQuery = tabFromQuery === 'chat';
  const passedListing = normalizeListing(location.state?.listing);
  const effectiveListingId = listingIdFromQuery || passedListing?.listingId || '';
  const { isAuthenticated, token } = useAuth();
  const [listing, setListing] = useState(passedListing);
  const [isLoading, setIsLoading] = useState(!passedListing && Boolean(effectiveListingId));
  const [loadError, setLoadError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [message, setMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isChatOverlayOpen, setIsChatOverlayOpen] = useState(openChatFromQuery);
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
  const [dynamicAreaHighlights, setDynamicAreaHighlights] = useState([]);
  const [isLoadingDynamicAreaHighlights, setIsLoadingDynamicAreaHighlights] = useState(false);
  const [dynamicAreaHighlightsError, setDynamicAreaHighlightsError] = useState('');
  const highlightsCacheRef = useRef(new Map());
  const reviewsSectionRef = useRef(null);

  useAutoDismiss(message, () => setMessage(''));

  useEffect(() => {
    if (tabFromQuery === 'chat') {
      setIsChatOverlayOpen(true);
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

        if (isChatOverlayOpen) {
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
  }, [isChatOverlayOpen, isAuthenticated, token, listingKey]);

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

  useEffect(() => {
    if (!isChatOverlayOpen || typeof document === 'undefined') return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsChatOverlayOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isChatOverlayOpen]);

  useEffect(() => {
    const locationText = String(listing?.location || '').trim();

    if (!locationText) {
      setDynamicAreaHighlights([]);
      setDynamicAreaHighlightsError('');
      setIsLoadingDynamicAreaHighlights(false);
      return;
    }

    const cached = highlightsCacheRef.current.get(locationText);
    if (cached) {
      setDynamicAreaHighlights(cached);
      setDynamicAreaHighlightsError('');
      setIsLoadingDynamicAreaHighlights(false);
      return;
    }

    const controller = new AbortController();
    const fetchNearbyHighlights = async () => {
      setIsLoadingDynamicAreaHighlights(true);
      setDynamicAreaHighlightsError('');
      setDynamicAreaHighlights([]);

      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(locationText)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!geocodeResponse.ok) {
          throw new Error('Geocoding failed');
        }

        const geocodeData = await geocodeResponse.json();
        const place = Array.isArray(geocodeData) ? geocodeData[0] : null;
        const lat = Number(place?.lat);
        const lon = Number(place?.lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          throw new Error('Coordinates not found for listing location');
        }

        const overpassData = await fetchOverpassWithFallback(buildOverpassQuery(lat, lon), {
          signal: controller.signal,
        });
        const rawElements = Array.isArray(overpassData?.elements) ? overpassData.elements : [];

        const uniqueByName = new Map();
        rawElements.forEach((element) => {
          const normalized = normalizeOverpassElement(element);
          if (!normalized) return;

          const dedupeKey = `${normalized.name.toLowerCase()}-${normalized.type}`;
          if (uniqueByName.has(dedupeKey)) return;

          const distance = getDistanceInMeters(lat, lon, normalized.lat, normalized.lon);
          uniqueByName.set(dedupeKey, {
            name: normalized.name,
            type: normalized.type,
            category: getCategoryByType(normalized.type),
            distance,
            typeLabel: formatPlaceType(normalized.type),
            label: normalized.name,
          });
        });

        const rankedPlaces = Array.from(uniqueByName.values())
          .sort((a, b) => {
            const aCategoryPriority = IMPORTANT_CATEGORY_ORDER.indexOf(a.category);
            const bCategoryPriority = IMPORTANT_CATEGORY_ORDER.indexOf(b.category);
            const aCategoryRank = aCategoryPriority === -1 ? 99 : aCategoryPriority;
            const bCategoryRank = bCategoryPriority === -1 ? 99 : bCategoryPriority;
            if (aCategoryRank !== bCategoryRank) return aCategoryRank - bCategoryRank;

            const aPriority = PLACE_TYPE_PRIORITY[a.type] ?? 99;
            const bPriority = PLACE_TYPE_PRIORITY[b.type] ?? 99;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return a.distance - b.distance;
          });

        const selected = [];
        const selectedCategories = new Set();

        IMPORTANT_CATEGORY_ORDER.forEach((category) => {
          const match = rankedPlaces.find((place) => place.category === category && !selectedCategories.has(category));
          if (!match || selected.length >= 5) return;

          selected.push({
            ...match,
            categoryLabel: CATEGORY_LABELS[category] || 'Other',
          });
          selectedCategories.add(category);
        });

        if (selected.length < 5) {
          rankedPlaces.forEach((place) => {
            if (selected.length >= 5) return;
            if (selectedCategories.has(place.category)) return;

            selected.push({
              ...place,
              categoryLabel: CATEGORY_LABELS[place.category] || 'Other',
            });
            selectedCategories.add(place.category);
          });
        }

        highlightsCacheRef.current.set(locationText, selected);
        setDynamicAreaHighlights(selected);
      } catch (error) {
        if (error?.name === 'AbortError') return;
        setDynamicAreaHighlights([]);
        setDynamicAreaHighlightsError('Could not fetch live neighborhood highlights right now.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDynamicAreaHighlights(false);
        }
      }
    };

    fetchNearbyHighlights();

    return () => {
      controller.abort();
    };
  }, [listing?.location]);

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
            className="mt-4 px-4 py-2 text-sm font-semibold text-[#3A5AFF] border border-[#3A5AFF]/25 rounded-sm hover:bg-[#3A5AFF]/10"
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
  const listingAreaHighlights = Array.isArray(listing.areaHighlights)
    ? listing.areaHighlights.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const fallbackAreaHighlights = listingAreaHighlights.length ? listingAreaHighlights : defaultAreaHighlights;
  const shouldShowFallbackHighlights = !isLoadingDynamicAreaHighlights && !dynamicAreaHighlights.length;
  const areaHighlightsToDisplay = dynamicAreaHighlights.length
    ? dynamicAreaHighlights
    : shouldShowFallbackHighlights
      ? fallbackAreaHighlights.map((label) => ({
          category: 'other',
          categoryLabel: 'Local',
          type: 'local',
          typeLabel: 'Local',
          label,
          distance: null,
        }))
      : [];
  const locationBaseHeight = 256;
  const extraHighlightRows = Math.max(0, areaHighlightsToDisplay.length - 3);
  const locationPanelHeight = locationBaseHeight + (extraHighlightRows * 46);
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

  const scrollToReviewsSection = () => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          {/* TOP ROW: 3D and Property Summary Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-[68%_32%] xl:grid-cols-[70%_30%] gap-6 items-start">
            {/* 3D Visualization Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col border border-slate-100">
              <div className="p-4 border-b border-slate-100">
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
                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-100 bg-[#111827]">
                  <img
                    src={listing.image || 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1200'}
                    className="absolute inset-0 w-full h-full object-cover opacity-45"
                    alt="3D Placeholder"
                  />
                  <div className="absolute inset-0 bg-linear-to-tr from-black/65 via-black/40 to-[#3A5AFF]/30" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center">
                    <div className="w-8 h-8 border-4 border-[#3A5AFF] border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm font-bold tracking-wide">Loading 3D Model</p>
                    <p className="mt-1 text-[11px] text-white/80">Preparing textures, lighting, and scene controls</p>
                  </div>

                  <div className="absolute left-3 right-3 bottom-3 h-1.5 rounded-full bg-white/25 overflow-hidden">
                    <div className="h-full w-2/3 bg-linear-to-r from-[#7A90FF] to-[#3A5AFF]" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-md border border-slate-100 bg-white px-3 py-2">
                    <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-700"><MousePointer2 size={13} className="text-[#3A5AFF]" /> Rotate</p>
                    <p className="mt-1 text-[11px] text-slate-500">Click and drag to orbit the camera.</p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-white px-3 py-2">
                    <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-700"><Search size={13} className="text-[#3A5AFF]" /> Zoom</p>
                    <p className="mt-1 text-[11px] text-slate-500">Use mouse wheel for close inspection.</p>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-white px-3 py-2">
                    <p className="flex items-center gap-2 text-[11px] font-semibold text-slate-700"><Move size={13} className="text-[#3A5AFF]" /> Pan</p>
                    <p className="mt-1 text-[11px] text-slate-500">Right-click and drag to reposition.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Property Summary */}
              <section className="bg-white rounded-lg shadow overflow-hidden border border-slate-100">
                <div className="p-5 md:p-6">
                  <h2 className="text-2xl font-black leading-tight text-slate-900">
                    {listing.title || 'Listing Details'}
                  </h2>

                  <div className="mt-2 flex items-center gap-2 text-slate-500">
                    <MapPin size={16} className="text-[#3A5AFF]" />
                    <span className="text-sm font-semibold">{listing.location || 'Location not specified'}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-slate-100 bg-gray-50 p-2 text-center">
                      <Bed size={14} className="mx-auto text-[#3A5AFF]" />
                      <p className="mt-1 text-[11px] font-semibold text-gray-700">{listing.bedrooms ?? 0} Beds</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-gray-50 p-2 text-center">
                      <Bath size={14} className="mx-auto text-[#3A5AFF]" />
                      <p className="mt-1 text-[11px] font-semibold text-gray-700">{listing.bathrooms ?? 0} Baths</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-gray-50 p-2 text-center">
                      <Square size={14} className="mx-auto text-[#3A5AFF]" />
                      <p className="mt-1 text-[11px] font-semibold text-gray-700">{listing.areaSqFt ?? 0} sqft</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setIsDescriptionOpen((prev) => !prev)}
                      className="group inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[#3A5AFF]"
                    >
                      <Info size={15} />
                      <span className="group-hover:underline underline-offset-4">{isDescriptionOpen ? 'Hide Description' : 'Read Description'}</span>
                    </button>

                    {isDescriptionOpen && (
                      <section className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
                        {listingDescription ? (
                          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{listingDescription}</p>
                        ) : (
                          <p className="text-sm text-slate-500">No description provided for this property.</p>
                        )}
                      </section>
                    )}
                  </div>

                  <div className="my-5 border-t border-slate-200" />

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#3A5AFF]">Rs. {Number(listing.price || 0).toLocaleString()}</span>
                    <span className="text-slate-400 font-semibold">/month</span>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider">
                    <Info size={13} /> Utilities Included
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      onClick={handleBookVisitClick}
                      disabled={isBookedListing}
                      className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        isBookedListing
                          ? 'bg-red-100 text-red-700 border border-red-200 cursor-not-allowed'
                          : 'bg-[#3A5AFF] hover:bg-[#2F49E6] text-white shadow-lg shadow-[#3A5AFF]/30 active:scale-[0.99]'
                      }`}
                    >
                      <Calendar size={16} /> {isBookedListing ? 'Property Already Booked' : 'Schedule a Visit'}
                    </button>

                    {/* <button
                      type="button"
                      onClick={scrollToReviewsSection}
                      className="w-full border border-indigo-100 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
                    >
                      <Star size={16} className="inline mr-2 text-amber-500 fill-amber-500" /> Rate and Review
                    </button> */}
                  </div>

                  <section className="mt-6 border-t border-slate-200 pt-5">
                    <div className="flex items-center gap-2 mb-4">
                      <User size={16} className="text-[#3A5AFF]" />
                      <h3 className="text-base md:text-lg font-bold text-slate-800">Contact Owner</h3>
                    </div>
                    <div className="space-y-2.5 rounded-2xl p-4">
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                        <User size={16} className="text-slate-400" /> {listing.ownerName || 'Property Owner'}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                        <Phone size={16} className="text-slate-400" /> {listing.ownerPhone || 'Not provided'}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                        <Mail size={16} className="text-slate-400" /> {listing.ownerEmail || 'Not provided'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUnreadChatCount(0);
                        setIsChatOverlayOpen(true);
                      }}
                      className="mt-4 w-full relative inline-flex items-center justify-center gap-2 rounded-xl bg-[#3A5AFF] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#2F49E6]"
                    >
                      <MessageCircle size={16} /> Chat Now
                      {unreadChatCount > 0 && (
                        <span className="absolute right-3 inline-flex min-w-5 h-5 px-1.5 rounded-full bg-[#ef4444] text-white text-[10px] leading-5 font-bold items-center justify-center">
                          {unreadChatCount > 99 ? '99+' : unreadChatCount}
                        </span>
                      )}
                    </button>
                  </section>

                </div>
              </section>
            </div>
          </div>

          <section className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
              <section className="xl:col-span-12 space-y-8 min-w-0">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-[#3A5AFF] rounded-full" />
                    Key Features
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                    {featuresToDisplay.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-slate-600 font-medium">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 md:p-6 lg:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5 md:mb-6">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-8 w-1.5 rounded-full bg-[#3A5AFF]" />
                      <div>
                        <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">Location & Neighborhood</h2>
                        <div className="mt-1 flex items-center gap-1.5 text-slate-500">
                          <MapPin size={14} className="text-[#3A5AFF]" />
                          <span className="text-sm font-semibold">{listing.location || 'Location not specified'}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${mapQuery}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-[#3A5AFF] bg-[#3A5AFF]/5 px-4 py-2 text-xs md:text-sm font-bold text-[#3A5AFF] hover:bg-[#3A5AFF]/20 transition-colors"
                    >
                      Open Google Maps <ExternalLink size={14} />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-2xl overflow-hidden border border-slate-100 shadow-lg shadow-slate-200/40 bg-white items-stretch">
                    <div
                      className="lg:col-span-7 relative border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-100 h-full"
                    >
                      <iframe
                        title="Property location map"
                        src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                        className="w-full h-full grayscale-[0.08] contrast-[1.06]"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />

                      {/* <div className="absolute top-3 left-3 hidden md:block rounded-xl border border-white/40 bg-white/90 px-3 py-2 backdrop-blur-sm shadow-lg">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Current Listing</p>
                        <p className="text-xs font-bold text-slate-700">{listing.location || 'Location not specified'}</p>
                      </div> */}
                    </div>

                    <div
                      className="lg:col-span-5 p-5 md:p-6 bg-slate-50/60"
                      style={{ minHeight: `${locationPanelHeight}px` }}
                    >
                      <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">Neighborhood Highlights</h4>
                      <div className="space-y-3">
                        {isLoadingDynamicAreaHighlights && (
                          <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                            <div className="flex items-center gap-2.5 text-slate-600">
                              <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-[#3A5AFF] animate-spin" />
                              <p className="text-xs font-semibold">Fetching live nearby places...</p>
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-500">
                              We are checking important neighborhood services around this location.
                            </p>

                            <div className="mt-3 space-y-2.5" aria-hidden="true">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <div key={`highlight-loading-${idx}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 animate-pulse">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <span className="h-7 w-7 rounded-lg bg-slate-200 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="h-3.5 w-3/4 rounded bg-slate-200" />
                                      <div className="mt-1.5 h-3 w-18 rounded bg-slate-200" />
                                    </div>
                                  </div>
                                  <div className="ml-3 h-3.5 w-12 rounded bg-slate-200 shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {areaHighlightsToDisplay.map((highlight, index) => (
                          <div key={`${highlight.label}-${index}`} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {(() => {
                                const { Icon, badgeClass } = getPlaceVisuals(highlight.type);
                                return (
                                  <>
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                      <Icon size={14} />
                                    </span>

                                    <div className="min-w-0">
                                      <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">{highlight.label}</p>
                                      <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                                        {highlight.categoryLabel || highlight.typeLabel || 'Nearby'}
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            <div className="ml-3 flex items-center gap-1 text-slate-400 shrink-0">
                              <Navigation size={12} className="rotate-45" />
                              <span className="text-[11px] font-semibold">{formatDistance(highlight.distance)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 border-t border-slate-200 pt-4">
                        <p className="text-[10px] italic leading-relaxed text-slate-400">
                          {dynamicAreaHighlights.length
                            ? '* Live nearby places are fetched in real time from map data around this location.'
                            : dynamicAreaHighlightsError
                              ? '* Live data unavailable. Showing listing-provided neighborhood context.'
                              : '* Showing listing-provided neighborhood context.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

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

                <section ref={reviewsSectionRef} className="bg-white rounded-2xl border border-slate-200 p-5 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={18} className="text-[#3A5AFF]" />
                    <h3 className="text-lg font-bold text-slate-800">Write Reviews</h3>
                  </div>

                  <div className="space-y-4">
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
                </section>
              </section>

            </div>
          </section>
        </div>
      </div>

      {isChatOverlayOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[1px] flex items-start justify-end px-4 md:px-8 py-4 md:py-8"
          onClick={() => setIsChatOverlayOpen(false)}
        >
          <section
            className="w-full max-w-136 h-[min(88vh,760px)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-linear-to-r from-slate-50 to-[#3A5AFF]/10">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Owner Chat Assistant</h3>
                <p className="text-[11px] text-slate-500">Quick conversation about this listing.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOverlayOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close chat overlay"
              >
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/60 p-2.5">
              <ChatBox
                listingId={listingKey}
                ownerId={listing?.ownerId || listing?.owner}
                ownerName={listing?.ownerName}
                ownerProfilePhoto={listing?.ownerProfilePhoto}
                title={listing?.title}
                location={listing?.location}
                price={listing?.price}
                image={listing?.image}
                compact
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Explore3DPage;