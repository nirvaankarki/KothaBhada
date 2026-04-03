import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAutoDismiss } from './useAutoDismiss';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  title: '',
  location: '',
  latitude: '',
  longitude: '',
  price: '',
  description: '',
  keyFeatures: [],
  areaHighlights: [],
  bedrooms: '1',
  bathrooms: '1',
  areaSqFt: '',
  image: '',
  images: [],
  model3dUrl: '',
  tourPoints: '',
  ownerPhone: '',
  status: 'active',
};

const initialReportForm = {
  targetType: 'user',
  targetId: '',
  reasonCategory: 'other',
  description: '',
};

const LANDLORD_TAB_STORAGE_KEY = 'landlordDashboardActiveTab';
const LANDLORD_ALLOWED_TABS = new Set(['dashboard', 'listings', 'chat', 'bookings', 'reports', 'profile']);

const parseKeyFeaturesInput = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  return String(value || '')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
};

const parseAreaHighlightsInput = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  return String(value || '')
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
};

const parseImageListInput = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (typeof value === 'string') {
    const cleanedValue = String(value || '').trim();
    return cleanedValue ? [cleanedValue] : [];
  }

  return [];
};

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const encoded = event.target?.result;
    if (typeof encoded === 'string') {
      resolve(encoded);
      return;
    }

    reject(new Error('Could not read image file.'));
  };
  reader.onerror = () => reject(new Error('Could not read image file.'));
  reader.readAsDataURL(file);
});

const parse3DModelUrl = (value) => String(value || '').trim();

const parseTourPointNumber = (value, fallback = null) => {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Number(parsedValue.toFixed(4));
};

const parseTourPointsArray = (input) => {
  if (!Array.isArray(input)) return [];

  return input
    .map((point, index) => {
      if (!point || typeof point !== 'object') {
        return null;
      }

      const x = parseTourPointNumber(point.x ?? point.positionX ?? point.px);
      const y = parseTourPointNumber(point.y ?? point.positionY ?? point.py);
      const z = parseTourPointNumber(point.z ?? point.positionZ ?? point.pz);

      if (x === null || y === null || z === null) {
        return null;
      }

      const lookAtX = parseTourPointNumber(point.lookAtX ?? point.targetX ?? point.tx, 0);
      const lookAtY = parseTourPointNumber(point.lookAtY ?? point.targetY ?? point.ty, 0.82);
      const lookAtZ = parseTourPointNumber(point.lookAtZ ?? point.targetZ ?? point.tz, 0);

      return {
        label: String(point.label || point.name || `Viewpoint ${index + 1}`).trim(),
        x,
        y,
        z,
        lookAtX,
        lookAtY,
        lookAtZ,
      };
    })
    .filter(Boolean)
    .slice(0, 12);
};

const parseTourPointsInput = (value) => {
  if (Array.isArray(value)) {
    return { points: parseTourPointsArray(value), error: '' };
  }

  const trimmedValue = String(value || '').trim();
  if (!trimmedValue) {
    return { points: [], error: '' };
  }

  try {
    const parsed = JSON.parse(trimmedValue);
    if (!Array.isArray(parsed)) {
      return { points: [], error: 'Tour points must be a JSON array.' };
    }

    const points = parseTourPointsArray(parsed);
    if (!points.length) {
      return { points: [], error: 'Tour points JSON is valid, but no usable points were found.' };
    }

    return { points, error: '' };
  } catch {
    return { points: [], error: 'Tour points must be valid JSON.' };
  }
};

const formatTourPointsForTextarea = (input) => {
  if (!Array.isArray(input) || !input.length) {
    return '';
  }

  const points = parseTourPointsArray(input);
  if (!points.length) {
    return '';
  }

  return JSON.stringify(points, null, 2);
};

const isAllowed3DModel = (file) => {
  const fileName = String(file?.name || '').toLowerCase();
  const allowedExtensions = ['.glb', '.gltf'];

  return allowedExtensions.some((extension) => fileName.endsWith(extension));
};

export const useLandlordDashboardController = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const modelInputRef = useRef(null);
  const profileImageInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [editingListingId, setEditingListingId] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', profilePhoto: '' });
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';

    const savedTab = window.sessionStorage.getItem(LANDLORD_TAB_STORAGE_KEY);
    return LANDLORD_ALLOWED_TABS.has(savedTab) ? savedTab : 'dashboard';
  });
  const [listings, setListings] = useState([]);
  const [ownerInquiries, setOwnerInquiries] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [reports, setReports] = useState([]);
  const [ownerListingReports, setOwnerListingReports] = useState([]);
  const [reportForm, setReportForm] = useState(initialReportForm);
  const [reportResponseDrafts, setReportResponseDrafts] = useState({});
  const [bookingResponseDrafts, setBookingResponseDrafts] = useState({});
  const [ownerChats, setOwnerChats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedOwnerChatId, setSelectedOwnerChatId] = useState('');
  const [chatDrafts, setChatDrafts] = useState({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingChatId, setSendingChatId] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState('');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [ownerListingReportsLoading, setOwnerListingReportsLoading] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportResponseProcessingId, setReportResponseProcessingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [imageName, setImageName] = useState('');
  const [modelName, setModelName] = useState('');
  const [uploadingModel, setUploadingModel] = useState(false);
  const [uploadingModelProgress, setUploadingModelProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(success, () => setSuccess(''));

  const refreshOwnerChats = useCallback(async () => {
    try {
      const chatsRes = await api.get('/user/owner/chats');
      setOwnerChats(chatsRes.data?.chats || []);
    } catch {
      // Silent fail for background refresh; main load and actions surface errors.
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await api.get('/user/notifications');
      setNotifications(response.data?.notifications || []);
      setUnreadNotifications(response.data?.unreadCount || 0);
    } catch {
      // Silent fail for background refresh.
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      setLoading(true);
      setError('');
      try {
        const [listingsRes, inquiriesRes, bookingsRes, chatsRes, notificationsRes, reportsRes, ownerReportsRes] = await Promise.all([
          api.get('/rooms/mine'),
          api.get('/user/owner/inquiries'),
          api.get('/user/owner/bookings'),
          api.get('/user/owner/chats'),
          api.get('/user/notifications'),
          api.get('/user/reports'),
          api.get('/user/owner/reports'),
        ]);

        if (!ignore) {
          setListings(Array.isArray(listingsRes.data) ? listingsRes.data : []);
          setOwnerInquiries(inquiriesRes.data?.inquiries || []);
          setOwnerBookings(bookingsRes.data?.bookings || []);
          setReports(reportsRes.data?.reports || []);
          setOwnerListingReports(ownerReportsRes.data?.reports || []);
          setOwnerChats(chatsRes.data?.chats || []);
          setNotifications(notificationsRes.data?.notifications || []);
          setUnreadNotifications(notificationsRes.data?.unreadCount || 0);
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.response?.data?.message || 'Could not load your listings.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let stopped = false;

    const pullChats = async () => {
      if (stopped) return;

      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      await Promise.all([refreshOwnerChats(), refreshNotifications()]);
    };

    const intervalId = setInterval(pullChats, 4000);

    const handleFocus = () => {
      pullChats();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pullChats();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    pullChats();

    return () => {
      stopped = true;
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [refreshOwnerChats, refreshNotifications]);

  const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) return;

    setNotifications((prev) => prev.map((item) => (
      item._id === notificationId ? { ...item, isRead: true } : item
    )));
    setUnreadNotifications((prev) => Math.max(0, prev - 1));

    try {
      await api.post(`/user/notifications/${notificationId}/read`);
    } catch {
      refreshNotifications();
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadNotifications(0);

    try {
      await api.post('/user/notifications/read-all');
    } catch {
      refreshNotifications();
    }
  };

  const clearAllNotifications = async () => {
    if (!notifications.length) return;

    const previousNotifications = notifications;
    const previousUnreadCount = unreadNotifications;

    setNotifications([]);
    setUnreadNotifications(0);

    try {
      await api.delete('/user/notifications');
    } catch {
      setNotifications(previousNotifications);
      setUnreadNotifications(previousUnreadCount);
      refreshNotifications();
    }
  };

  const refreshReports = async () => {
    setReportsLoading(true);
    setOwnerListingReportsLoading(true);
    try {
      const [submittedResponse, ownerResponse] = await Promise.all([
        api.get('/user/reports'),
        api.get('/user/owner/reports'),
      ]);
      setReports(submittedResponse.data?.reports || []);
      setOwnerListingReports(ownerResponse.data?.reports || []);
    } catch {
      setError('Could not load reports right now.');
    } finally {
      setReportsLoading(false);
      setOwnerListingReportsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(LANDLORD_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'chat') return;

    if (!ownerChats.length) {
      setSelectedOwnerChatId('');
      return;
    }

    const alreadySelected = ownerChats.some((chat) => chat._id === selectedOwnerChatId);
    if (!alreadySelected) {
      setSelectedOwnerChatId('');
    }
  }, [activeTab, ownerChats, selectedOwnerChatId]);

  const getLatestUserMessageAt = (chat) => {
    if (!Array.isArray(chat?.messages)) return null;

    const latest = chat.messages.reduce((acc, msg) => {
      if (msg?.senderType !== 'user' || !msg?.sentAt) return acc;
      if (!acc) return msg.sentAt;
      return new Date(msg.sentAt) > new Date(acc) ? msg.sentAt : acc;
    }, null);

    return latest;
  };

  const isChatUnread = (chat) => {
    const latestUserMessageAt = getLatestUserMessageAt(chat);
    if (!latestUserMessageAt) return false;

    if (!chat?.ownerLastSeenAt) return true;
    return new Date(latestUserMessageAt) > new Date(chat.ownerLastSeenAt);
  };

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone || '',
      profilePhoto: user?.profilePhoto || '',
    });
  }, [user?.name, user?.phone, user?.profilePhoto]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setError('');
  };

  const handleAddKeyFeature = (featureValue) => {
    const nextFeature = String(featureValue || '').trim();
    if (!nextFeature) return;

    setForm((prev) => {
      const current = parseKeyFeaturesInput(prev.keyFeatures);
      const exists = current.some((item) => item.toLowerCase() === nextFeature.toLowerCase());
      if (exists) {
        return { ...prev, keyFeatures: current };
      }

      return {
        ...prev,
        keyFeatures: [...current, nextFeature].slice(0, 20),
      };
    });
    setError('');
  };

  const handleRemoveKeyFeature = (featureValue) => {
    const target = String(featureValue || '').trim();
    if (!target) return;

    setForm((prev) => {
      const current = parseKeyFeaturesInput(prev.keyFeatures);
      return {
        ...prev,
        keyFeatures: current.filter((item) => item !== target),
      };
    });
    setError('');
  };

  const handleAddAreaHighlight = (highlightValue) => {
    const nextHighlight = String(highlightValue || '').trim();
    if (!nextHighlight) return;

    setForm((prev) => {
      const current = parseAreaHighlightsInput(prev.areaHighlights);
      const exists = current.some((item) => item.toLowerCase() === nextHighlight.toLowerCase());
      if (exists) {
        return { ...prev, areaHighlights: current };
      }

      return {
        ...prev,
        areaHighlights: [...current, nextHighlight].slice(0, 10),
      };
    });
    setError('');
  };

  const handleRemoveAreaHighlight = (highlightValue) => {
    const target = String(highlightValue || '').trim();
    if (!target) return;

    setForm((prev) => {
      const current = parseAreaHighlightsInput(prev.areaHighlights);
      return {
        ...prev,
        areaHighlights: current.filter((item) => item !== target),
      };
    });
    setError('');
  };

  const handleProfileChange = (key) => (e) => {
    setProfileForm((prev) => ({ ...prev, [key]: e.target.value }));
    setError('');
  };

  const handleProfileImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid profile image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const encoded = event.target?.result;
      if (typeof encoded === 'string') {
        setProfileForm((prev) => ({ ...prev, profilePhoto: encoded }));
      }
    };
    reader.readAsDataURL(file);
  };

  const clearProfileImage = () => {
    setProfileForm((prev) => ({ ...prev, profilePhoto: '' }));
    if (profileImageInputRef.current) profileImageInputRef.current.value = '';
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!profileForm.name.trim()) {
      setError('Owner name cannot be empty.');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        profilePhoto: profileForm.profilePhoto || null,
      };
      const response = await api.put('/auth/me', payload);
      if (response.data?.user) updateUser(response.data.user);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const hasInvalidFile = files.some((file) => !file.type.startsWith('image/'));
    if (hasInvalidFile) {
      setError('Please upload only valid image files.');
      return;
    }

    const hasOversizedFile = files.some((file) => file.size > 5 * 1024 * 1024);
    if (hasOversizedFile) {
      setError('Each image must be smaller than 5MB.');
      return;
    }

    Promise.all(files.map(readAsDataUrl))
      .then((encodedImages) => {
        let mergedImageCount = 0;

        setForm((prev) => {
          const existingImages = parseImageListInput(prev.images);
          const mergedImages = Array.from(new Set([...existingImages, ...encodedImages])).slice(0, 8);
          mergedImageCount = mergedImages.length;

          return {
            ...prev,
            images: mergedImages,
            image: mergedImages[0] || '',
          };
        });
        setImageName(`${mergedImageCount} image${mergedImageCount > 1 ? 's' : ''} selected`);
      })
      .catch(() => {
        setError('Could not process selected images. Please try again.');
      });
  };

  const buildShortLocationLabel = (address = {}) => {
    const area = [
      address.suburb,
      address.neighbourhood,
      address.city_district,
      address.village,
      address.town,
      address.city,
      address.municipality,
      address.county,
    ]
      .map((item) => String(item || '').trim())
      .find(Boolean);

    const region = [address.state_district, address.state, address.province]
      .map((item) => String(item || '').trim())
      .find(Boolean);

    const country = String(address.country || '').trim();

    return [area, region, country].filter(Boolean).join(', ');
  };

  const fetchReadableLocation = async (latitude, longitude) => {
    const endpoint = new URL('https://nominatim.openstreetmap.org/reverse');
    endpoint.searchParams.set('format', 'jsonv2');
    endpoint.searchParams.set('lat', String(latitude));
    endpoint.searchParams.set('lon', String(longitude));

    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      throw new Error('Unable to fetch location details.');
    }

    const data = await response.json();
    const shortLabel = buildShortLocationLabel(data?.address || {});
    return shortLabel || String(data?.display_name || '').trim();
  };

  const getCurrentPosition = () => new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  });

  const handleUseCurrentLocation = async () => {
    setError('');
    setSuccess('');
    setLocating(true);

    try {
      const position = await getCurrentPosition();
      const lat = Number(position?.coords?.latitude);
      const lng = Number(position?.coords?.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('Unable to read device coordinates.');
      }

      let readableLocation = '';
      try {
        readableLocation = await fetchReadableLocation(lat, lng);
      } catch {
        readableLocation = '';
      }

      setForm((prev) => ({
        ...prev,
        location: readableLocation || prev.location || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        latitude: lat.toFixed(7),
        longitude: lng.toFixed(7),
      }));
      setSuccess('Live location captured. You can still edit the location text before publishing.');
    } catch (err) {
      if (err?.code === 1) {
        setError('Location permission denied. Please allow location access and try again.');
      } else if (err?.code === 3) {
        setError('Location request timed out. Please try again.');
      } else {
        setError(err?.message || 'Could not fetch your current location.');
      }
    } finally {
      setLocating(false);
    }
  };

  const clearSelectedImage = () => {
    setForm((prev) => ({ ...prev, image: '', images: [] }));
    setImageName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveSelectedImage = (imageToRemove) => {
    const targetImage = String(imageToRemove || '').trim();
    if (!targetImage) return;

    let nextImageCount = 0;
    setForm((prev) => {
      const existingImages = parseImageListInput(prev.images);
      const nextImages = existingImages.filter((image) => image !== targetImage);
      nextImageCount = nextImages.length;

      return {
        ...prev,
        images: nextImages,
        image: nextImages[0] || '',
      };
    });

    setImageName(nextImageCount ? `${nextImageCount} image${nextImageCount > 1 ? 's' : ''} selected` : '');
    setError('');
  };

  const openImagePicker = () => fileInputRef.current?.click();
  const openModelPicker = () => modelInputRef.current?.click();

  const handleModelSelect = (e) => {
    const modelFile = e.target.files?.[0];
    if (!modelFile) return;

    if (!isAllowed3DModel(modelFile)) {
      setError('Please upload only 3D model files in GLB or GLTF format.');
      return;
    }

    if (modelFile.size > 512 * 1024 * 1024) {
      setError('3D model must be smaller than 512MB.');
      return;
    }

    setError('');
    setUploadingModel(true);
    setUploadingModelProgress(0);

    const formData = new FormData();
    formData.append('model', modelFile);

    api.post('/rooms/upload-model', formData, {
      timeout: 4 * 60 * 1000,
      onUploadProgress: (progressEvent) => {
        const total = Number(progressEvent?.total || 0);
        const loaded = Number(progressEvent?.loaded || 0);
        if (!total) return;

        const percentage = Math.min(98, Math.round((loaded / total) * 100));
        setUploadingModelProgress(percentage);
      },
    })
      .then((response) => {
        const uploadedModelUrl = String(response?.data?.modelUrl || '').trim();
        if (!uploadedModelUrl) {
          throw new Error('Upload succeeded but no model URL was returned.');
        }

        setForm((prev) => ({
          ...prev,
          model3dUrl: uploadedModelUrl,
        }));
        setModelName(response?.data?.fileName || modelFile.name);
        setUploadingModelProgress(100);
      })
      .catch((err) => {
        if (err?.code === 'ECONNABORTED') {
          setError('3D model upload timed out. Please try again with a smaller file or retry later.');
          setUploadingModelProgress(0);
          return;
        }

        const backendMessage = String(err?.response?.data?.error || err?.response?.data?.message || '').trim();
        setError(backendMessage || 'Could not upload 3D model file. Please try again.');
        setUploadingModelProgress(0);
      })
      .finally(() => {
        setUploadingModel(false);
      });
  };

  const clearSelectedModel = () => {
    setForm((prev) => ({ ...prev, model3dUrl: '' }));
    setModelName('');
    setUploadingModelProgress(0);
    if (modelInputRef.current) modelInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (uploadingModel) {
      setError('Please wait for the 3D model upload to finish before publishing.');
      return;
    }

    if (!form.title.trim() || !form.location.trim() || Number(form.price) <= 0) {
      setError('Title, location and a valid price are required.');
      return;
    }

    const parsedKeyFeatures = parseKeyFeaturesInput(form.keyFeatures);
    if (!parsedKeyFeatures.length) {
      setError('Please add at least one key feature for the property.');
      return;
    }

    const { points: parsedTourPoints, error: tourPointsError } = parseTourPointsInput(form.tourPoints);
    if (tourPointsError) {
      setError(tourPointsError);
      return;
    }

    setSubmitting(true);
    try {
      const parsedAreaHighlights = parseAreaHighlightsInput(form.areaHighlights);
      const parsedImages = parseImageListInput(form.images);

      const payload = {
        title: form.title.trim(),
        location: form.location.trim(),
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        price: Number(form.price),
        description: form.description.trim(),
        keyFeatures: parsedKeyFeatures,
        areaHighlights: parsedAreaHighlights,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        areaSqFt: Number(form.areaSqFt) || 0,
        image: parsedImages[0] || String(form.image || '').trim(),
        images: parsedImages,
        model3dUrl: parse3DModelUrl(form.model3dUrl),
        tourPoints: parsedTourPoints,
        ownerPhone: form.ownerPhone.trim(),
        status: form.status,
      };

      if (editingListingId) {
        const res = await api.put(`/rooms/${editingListingId}`, payload);
        if (res.data?.room) {
          setListings((prev) => prev.map((item) => (
            item._id === editingListingId ? res.data.room : item
          )));
        }
        setSuccess('Listing updated and resubmitted for admin review. It will go live after approval.');
      } else {
        const res = await api.post('/rooms', payload);
        if (res.data?.room) setListings((prev) => [res.data.room, ...prev]);
        setSuccess('Listing submitted successfully. It is pending admin approval before renters can view it.');
      }

      setForm(initialForm);
      setEditingListingId('');
      setImageName('');
      setModelName('');
    } catch (err) {
      setError(err?.response?.data?.message || (editingListingId ? 'Could not update listing.' : 'Could not publish listing.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewListing = () => {
    setForm(initialForm);
    setEditingListingId('');
    setImageName('');
    setModelName('');
    setError('');
    setSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (modelInputRef.current) modelInputRef.current.value = '';
  };

  const handleDelete = async (listingId) => {
    setDeletingId(listingId);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/rooms/${listingId}`);
      setListings((prev) => prev.filter((item) => item._id !== listingId));
      setSuccess('Listing removed successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not remove listing.');
    } finally {
      setDeletingId('');
    }
  };

  const handleViewListing = (listing) => {
    navigate('/listing-details', {
      state: {
        listing: {
          ...listing,
          listingId: String(listing.listingId || listing._id || listing.id || listing.title || 'listing').trim(),
        },
      },
    });
  };

  const handleEditDraft = (listing) => {
    setEditingListingId(listing._id || '');
    const loadedImages = parseImageListInput(listing.images?.length ? listing.images : listing.image);

    setForm({
      title: listing.title || '',
      location: listing.location || '',
      latitude: listing.latitude !== undefined && listing.latitude !== null ? String(listing.latitude) : '',
      longitude: listing.longitude !== undefined && listing.longitude !== null ? String(listing.longitude) : '',
      price: String(listing.price || ''),
      description: listing.description || '',
      keyFeatures: parseKeyFeaturesInput(listing.keyFeatures),
      areaHighlights: parseAreaHighlightsInput(listing.areaHighlights),
      bedrooms: String(listing.bedrooms ?? 1),
      bathrooms: String(listing.bathrooms ?? 1),
      areaSqFt: String(listing.areaSqFt || ''),
      image: loadedImages[0] || '',
      images: loadedImages,
      model3dUrl: parse3DModelUrl(listing.model3dUrl),
      tourPoints: formatTourPointsForTextarea(listing.tourPoints),
      ownerPhone: listing.ownerPhone || '',
      status: listing.status || 'active',
    });
    setImageName(loadedImages.length ? `${loadedImages.length} image${loadedImages.length > 1 ? 's' : ''} loaded` : '');
    setModelName(parse3DModelUrl(listing.model3dUrl) ? 'Loaded 3D model from listing' : '');
    setSuccess('Listing loaded for editing. Update values and save changes.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenOwnerChat = async (chatId) => {
    setSelectedOwnerChatId(chatId);

    const currentChat = ownerChats.find((chat) => chat._id === chatId);
    if (!currentChat || !isChatUnread(currentChat)) {
      return;
    }

    try {
      const response = await api.post(`/user/chats/${chatId}/seen`);
      const updatedChat = response.data?.chat;
      if (updatedChat) {
        setOwnerChats((prev) => prev.map((item) => (item._id === chatId ? updatedChat : item)));
      }
    } catch {
      // Avoid interrupting UI if seen marker fails.
    }
  };

  const handleReportFormChange = (field, value) => {
    if (!field) return;
    setReportForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateReport = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const description = String(reportForm.description || '').trim();
    if (!description) {
      setError('Please provide report details before submitting.');
      return;
    }

    setReportSubmitting(true);
    try {
      const payload = {
        targetType: String(reportForm.targetType || 'other').trim(),
        targetId: String(reportForm.targetId || '').trim(),
        reasonCategory: String(reportForm.reasonCategory || 'other').trim(),
        description,
      };

      const response = await api.post('/user/reports', payload);
      if (response.data?.report) {
        setReports((prev) => [response.data.report, ...prev]);
      }

      setReportForm((prev) => ({
        ...prev,
        targetId: '',
        description: '',
      }));
      setSuccess('Report submitted successfully. Admin will review it soon.');
      await refreshReports();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOwnerListingReportResponse = async (reportId) => {
    const cleanedReportId = String(reportId || '').trim();
    if (!cleanedReportId) return;

    const landlordResponseNote = String(reportResponseDrafts[cleanedReportId] || '').trim();
    if (!landlordResponseNote) {
      setError('Please write a response before submitting to renter and admin.');
      return;
    }

    setError('');
    setSuccess('');
    setReportResponseProcessingId(cleanedReportId);

    try {
      await api.patch(`/user/owner/reports/${cleanedReportId}/respond`, {
        landlordResponseNote,
      });

      setReportResponseDrafts((prev) => ({ ...prev, [cleanedReportId]: '' }));
      setSuccess('Response submitted. Admin can now review your resolution details.');
      await refreshReports();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit report response.');
    } finally {
      setReportResponseProcessingId('');
    }
  };

  const handleOwnerReply = async (chatId) => {
    const message = (chatDrafts[chatId] || '').trim();
    if (!message) return;

    const optimisticSentAt = new Date().toISOString();
    const optimisticMessage = {
      _id: `optimistic-${Date.now()}`,
      senderId: user?._id || user?.id || '',
      senderType: 'owner',
      text: message,
      sentAt: optimisticSentAt,
    };

    setError('');
    setSendingChatId(chatId);
    setChatDrafts((prev) => ({ ...prev, [chatId]: '' }));

    setOwnerChats((prev) => {
      const current = prev.find((item) => item._id === chatId);
      if (!current) return prev;

      const optimisticChat = {
        ...current,
        messages: [...(current.messages || []), optimisticMessage],
        lastMessageAt: optimisticSentAt,
        ownerLastSeenAt: optimisticSentAt,
      };

      return prev.map((item) => (item._id === chatId ? optimisticChat : item));
    });

    try {
      const response = await api.post(`/user/chats/${chatId}/reply`, { message });
      const updatedChat = response.data?.chat;
      if (updatedChat) {
        setOwnerChats((prev) => prev.map((item) => (
          item._id === chatId ? updatedChat : item
        )));
      }
    } catch (err) {
      setChatDrafts((prev) => ({ ...prev, [chatId]: message }));
      await refreshOwnerChats();
      setError(err?.response?.data?.message || 'Could not send reply.');
    } finally {
      setSendingChatId('');
    }
  };

  const handleOwnerBookingDecision = async (bookingId, status) => {
    if (!bookingId || !['confirmed', 'declined'].includes(status)) return;

    const ownerResponse = String(bookingResponseDrafts[bookingId] || '').trim();
    if (status === 'declined' && !ownerResponse) {
      setError('Please provide a reason before declining this booking request.');
      return;
    }

    setError('');
    setSuccess('');
    setUpdatingBookingId(bookingId);

    try {
      const response = await api.patch(`/user/owner/bookings/${bookingId}/status`, {
        status,
        ownerResponse,
      });

      const updatedBooking = response.data?.booking;
      if (updatedBooking) {
        setOwnerBookings((prev) => prev.map((item) => (
          item._id === bookingId ? updatedBooking : item
        )));
      }

      setBookingResponseDrafts((prev) => ({ ...prev, [bookingId]: '' }));
      setSuccess(status === 'confirmed' ? 'Booking request accepted.' : 'Booking request declined.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update booking request.');
    } finally {
      setUpdatingBookingId('');
    }
  };

  const stats = useMemo(() => {
    const totalListings = listings.length;
    const activeListings = listings.filter((item) => item.status !== 'inactive').length;
    const avgPrice = totalListings
      ? Math.round(listings.reduce((sum, item) => sum + Number(item.price || 0), 0) / totalListings)
      : 0;
    const totalValue = listings.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const unreadInquiries = ownerInquiries.filter((item) => item.status === 'open').length;
    const pendingBookings = ownerBookings.filter((item) => item.status === 'pending' || !item.status).length;
    const openListingReports = ownerListingReports.filter((item) => ['open', 'in_review'].includes(String(item?.status || '').toLowerCase())).length;
    const activeChats = ownerChats.filter((item) => item.status === 'active').length;
    const unreadChats = ownerChats.filter((item) => isChatUnread(item)).length;

    return {
      totalListings,
      activeListings,
      avgPrice,
      totalValue,
      unreadInquiries,
      pendingBookings,
      openListingReports,
      activeChats,
      unreadChats,
    };
  }, [listings, ownerInquiries, ownerBookings, ownerListingReports, ownerChats]);

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    try {
      return new Date(isoDate).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return {
    state: {
      form,
      editingListingId,
      profileForm,
      activeTab,
      listings,
      ownerInquiries,
      ownerBookings,
      reports,
      ownerListingReports,
      reportForm,
      reportResponseDrafts,
      notifications,
      unreadNotifications,
      bookingResponseDrafts,
      ownerChats,
      selectedOwnerChatId,
      chatDrafts,
      loading,
      submitting,
      locating,
      savingProfile,
      sendingChatId,
      updatingBookingId,
      reportsLoading,
      ownerListingReportsLoading,
      reportSubmitting,
      reportResponseProcessingId,
      deletingId,
      imageName,
      modelName,
      uploadingModel,
      uploadingModelProgress,
      error,
      success,
      stats,
    },
    refs: {
      fileInputRef,
      modelInputRef,
      profileImageInputRef,
    },
    handlers: {
      setActiveTab: (tab) => {
        if (!LANDLORD_ALLOWED_TABS.has(tab)) return;
        setActiveTab(tab);
      },
      setChatDrafts,
      setBookingResponseDrafts,
      setReportResponseDrafts,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearAllNotifications,
      refreshReports,
      handleOpenOwnerChat,
      handleChange,
      handleAddKeyFeature,
      handleRemoveKeyFeature,
      handleAddAreaHighlight,
      handleRemoveAreaHighlight,
      handleProfileChange,
      handleProfileImageSelect,
      clearProfileImage,
      handleProfileSubmit,
      handleImageSelect,
      clearSelectedImage,
      handleRemoveSelectedImage,
      openImagePicker,
      handleModelSelect,
      clearSelectedModel,
      openModelPicker,
      handleUseCurrentLocation,
      handleStartNewListing,
      handleSubmit,
      handleDelete,
      handleViewListing,
      handleEditDraft,
      handleOwnerReply,
      handleOwnerBookingDecision,
      handleReportFormChange,
      handleCreateReport,
      handleOwnerListingReportResponse,
      isChatUnread,
      formatDate,
    },
  };
};
