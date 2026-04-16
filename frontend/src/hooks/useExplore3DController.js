import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAutoDismiss } from './useAutoDismiss';
import api from '../utils/api';
import {
  defaultAreaHighlights,
  defaultKeyFeatures,
  fetchDynamicAreaHighlights,
  formatDistance,
  getListingImage,
  getPlaceVisuals,
  normalizeListing,
} from '../utils/explore3dUtils';
import { getListingId } from '../utils/listingData';

function parseListingPanoramaImages(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return Array.from(new Set(input
    .map((item) => String(item || '').trim())
    .filter(Boolean)))
    .slice(0, 12);
}

function parseListingPanoramaScenes(input, fallbackImages = []) {
  if (Array.isArray(input) && input.length > 0) {
    return input
      .map((scene, index) => {
        if (!scene || typeof scene !== 'object') return null;

        const imageUrl = String(scene.imageUrl || scene.url || '').trim();
        if (!imageUrl) return null;

        const links = Array.isArray(scene.links)
          ? scene.links
              .map((link) => {
                if (!link || typeof link !== 'object') return null;

                const targetIndex = Number(link.targetIndex ?? link.toIndex ?? link.sceneIndex);
                if (!Number.isInteger(targetIndex) || targetIndex < 0) {
                  return null;
                }

                const yaw = Number(link.yaw);
                const pitch = Number(link.pitch);

                return {
                  targetIndex,
                  label: String(link.label || '').trim(),
                  yaw: Number.isFinite(yaw) ? Number(yaw.toFixed(4)) : 0,
                  pitch: Number.isFinite(pitch) ? Number(pitch.toFixed(4)) : 0,
                };
              })
              .filter(Boolean)
              .slice(0, 8)
          : [];

        return {
          title: String(scene.title || scene.label || scene.name || `Scene ${index + 1}`).trim() || `Scene ${index + 1}`,
          imageUrl,
          links,
        };
      })
      .filter(Boolean)
      .slice(0, 12);
  }

  return parseListingPanoramaImages(fallbackImages).map((imageUrl, index) => ({
    title: `Scene ${index + 1}`,
    imageUrl,
    links: [],
  }));
}

export function useExplore3DController() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token, user } = useAuth();
  const { showToast } = useToast();

  const searchParams = new URLSearchParams(location.search);
  const listingIdFromQuery = searchParams.get('id');
  const tabFromQuery = searchParams.get('tab');
  const openChatFromQuery = tabFromQuery === 'chat';
  const passedListing = useMemo(() => normalizeListing(location.state?.listing), [location.state?.listing]);
  const effectiveListingId = listingIdFromQuery || passedListing?.listingId || '';

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
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const seenOwnerMessageAtRef = useRef('');
  const initializedOwnerMessageRef = useRef(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isListingReportModalOpen, setIsListingReportModalOpen] = useState(false);
  const [listingReportReasonCategory, setListingReportReasonCategory] = useState('fake_listing');
  const [listingReportDescription, setListingReportDescription] = useState('');
  const [listingReportSubmitting, setListingReportSubmitting] = useState(false);
  const [dynamicAreaHighlights, setDynamicAreaHighlights] = useState([]);
  const [isLoadingDynamicAreaHighlights, setIsLoadingDynamicAreaHighlights] = useState(false);
  const [dynamicAreaHighlightsError, setDynamicAreaHighlightsError] = useState('');
  const [isAutoRotateEnabled, setIsAutoRotateEnabled] = useState(false);
  const [is3dTourStarted, setIs3dTourStarted] = useState(false);
  const [activeRoomImageIndex, setActiveRoomImageIndex] = useState(0);
  const highlightsCacheRef = useRef(new Map());
  const reviewsSectionRef = useRef(null);
  const viewerRef = useRef(null);

  useAutoDismiss(message, () => setMessage(''));
  useAutoDismiss(loadError, () => setLoadError(''));

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
    showToast({
      type: message.includes('Could not') ? 'error' : 'success',
      title: message.includes('Could not') ? 'Action failed' : 'Success',
      message,
    });
  }, [message, showToast]);

  useEffect(() => {
    if (!effectiveListingId) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    async function fetchListing() {
      try {
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
  }, [effectiveListingId, passedListing]);

  const listingKey = getListingId(listing);
  const activeRole = String(user?.role || '').toLowerCase();
  const canReportListing = isAuthenticated && activeRole === 'user';

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
    setIs3dTourStarted(false);
    setIsAutoRotateEnabled(false);
    setActiveRoomImageIndex(0);
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
    const latitude = Number(listing?.latitude);
    const longitude = Number(listing?.longitude);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    const cacheKey = hasCoordinates
      ? `${locationText || 'coords'}|${latitude.toFixed(6)},${longitude.toFixed(6)}`
      : locationText;

    if (!locationText && !hasCoordinates) {
      setDynamicAreaHighlights([]);
      setDynamicAreaHighlightsError('');
      setIsLoadingDynamicAreaHighlights(false);
      return;
    }

    const cached = highlightsCacheRef.current.get(cacheKey);
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
        const selected = await fetchDynamicAreaHighlights({
          locationText,
          latitude,
          longitude,
        }, {
          signal: controller.signal,
        });

        highlightsCacheRef.current.set(cacheKey, selected);
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
  }, [listing?.location, listing?.latitude, listing?.longitude]);

  const hasCoordinates = Number.isFinite(Number(listing?.latitude)) && Number.isFinite(Number(listing?.longitude));
  const preciseMapTarget = hasCoordinates
    ? `${Number(listing?.latitude)},${Number(listing?.longitude)}`
    : (String(listing?.location || 'Kathmandu, Nepal').trim() || 'Kathmandu, Nepal');
  const mapQuery = encodeURIComponent(preciseMapTarget);
  const listingStatus = String(listing?.status || '').toLowerCase();
  const isBookedListing = Boolean(
    listing?.isBooked ||
    listingStatus === 'booked' ||
    listingStatus === 'rented' ||
    listingStatus === 'occupied'
  );

  const listingKeyFeatures = Array.isArray(listing?.keyFeatures)
    ? listing.keyFeatures.map((feature) => String(feature || '').trim()).filter(Boolean)
    : [];
  const featuresToDisplay = listingKeyFeatures.length ? listingKeyFeatures : defaultKeyFeatures;

  const listingAreaHighlights = Array.isArray(listing?.areaHighlights)
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

  const listingDescription = String(listing?.description || '').trim();
  const panoramaImages = useMemo(() => parseListingPanoramaImages(listing?.panoramaImages), [listing?.panoramaImages]);
  const panoramaScenes = useMemo(
    () => parseListingPanoramaScenes(listing?.panoramaScenes, listing?.panoramaImages),
    [listing?.panoramaScenes, listing?.panoramaImages],
  );

  const roomImages = useMemo(() => {
    const gallery = [];

    const primaryImage = String(listing?.image || '').trim();
    if (primaryImage) {
      gallery.push(primaryImage);
    }

    if (Array.isArray(listing?.images)) {
      listing.images.forEach((imageUrl) => {
        const cleanedUrl = String(imageUrl || '').trim();
        if (cleanedUrl) {
          gallery.push(cleanedUrl);
        }
      });
    }

    const dedupedGallery = Array.from(new Set(gallery));
    if (dedupedGallery.length) {
      return dedupedGallery;
    }

    return ['https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1200'];
  }, [listing?.image, listing?.images]);

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

  const openListingReportModal = () => {
    if (!canReportListing) {
      showToast({ type: 'warning', title: 'Not allowed', message: 'Only renters can report listed properties.' });
      return;
    }

    if (!listing || !listingKey) {
      showToast({ type: 'error', title: 'Missing listing', message: 'Could not identify this listing for reporting.' });
      return;
    }

    setListingReportReasonCategory('fake_listing');
    setListingReportDescription('');
    setIsListingReportModalOpen(true);
  };

  const closeListingReportModal = () => {
    if (listingReportSubmitting) return;
    setIsListingReportModalOpen(false);
    setListingReportReasonCategory('fake_listing');
    setListingReportDescription('');
  };

  const submitListingReport = async () => {
    const reasonCategory = String(listingReportReasonCategory || '').trim().toLowerCase() || 'other';
    const allowedReasons = new Set(['fake_listing', 'fraud', 'policy_violation', 'spam', 'harassment', 'other']);
    const description = String(listingReportDescription || '').trim();
    if (!description) {
      showToast({ type: 'warning', title: 'Missing details', message: 'Please add details for your report.' });
      return;
    }

    try {
      setListingReportSubmitting(true);
      await api.post('/user/reports', {
        targetType: 'listing',
        targetId: listingKey,
        reasonCategory: allowedReasons.has(reasonCategory) ? reasonCategory : 'other',
        description,
      });

      showToast({
        type: 'success',
        title: 'Report submitted',
        message: 'Your report was sent to admin. The landlord was notified to respond.',
      });
      setIsListingReportModalOpen(false);
      setListingReportReasonCategory('fake_listing');
      setListingReportDescription('');
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Could not submit report',
        message: error?.response?.data?.message || 'Please try again later.',
      });
    } finally {
      setListingReportSubmitting(false);
    }
  };

  const showPreviousRoomImage = () => {
    if (!roomImages.length) return;
    setActiveRoomImageIndex((prev) => (prev - 1 + roomImages.length) % roomImages.length);
  };

  const showNextRoomImage = () => {
    if (!roomImages.length) return;
    setActiveRoomImageIndex((prev) => (prev + 1) % roomImages.length);
  };

  const scrollToReviewsSection = () => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openChatOverlay = () => {
    setUnreadChatCount(0);
    setIsChatOverlayOpen(true);
  };

  const closeChatOverlay = () => {
    setIsChatOverlayOpen(false);
  };

  return {
    isAuthenticated,
    listing,
    listingKey,
    location,
    navigate,
    isLoading,
    isFavorite,
    showAuthModal,
    setShowAuthModal,
    isListingReportModalOpen,
    listingReportReasonCategory,
    setListingReportReasonCategory,
    listingReportDescription,
    setListingReportDescription,
    listingReportSubmitting,
    isChatOverlayOpen,
    openChatOverlay,
    closeChatOverlay,
    reviewRefreshTrigger,
    setReviewRefreshTrigger,
    detailsReviewSummary,
    isLoadingDetailsReviews,
    unreadChatCount,
    isDescriptionOpen,
    setIsDescriptionOpen,
    dynamicAreaHighlights,
    isLoadingDynamicAreaHighlights,
    dynamicAreaHighlightsError,
    isAutoRotateEnabled,
    setIsAutoRotateEnabled,
    is3dTourStarted,
    setIs3dTourStarted,
    activeRoomImageIndex,
    setActiveRoomImageIndex,
    reviewsSectionRef,
    viewerRef,
    hasCoordinates,
    mapQuery,
    isBookedListing,
    canReportListing,
    featuresToDisplay,
    areaHighlightsToDisplay,
    locationPanelHeight,
    listingDescription,
    panoramaScenes,
    panoramaImages,
    roomImages,
    handleToggleFavorite,
    handleBookVisitClick,
    handleReportListing: openListingReportModal,
    closeListingReportModal,
    submitListingReport,
    showPreviousRoomImage,
    showNextRoomImage,
    scrollToReviewsSection,
    effectiveListingId,
    getPlaceVisuals,
    formatDistance,
    loadError,
  };
}
