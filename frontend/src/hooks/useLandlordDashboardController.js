import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAutoDismiss } from './useAutoDismiss';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  title: '',
  location: '',
  price: '',
  description: '',
  bedrooms: '1',
  bathrooms: '1',
  areaSqFt: '',
  image: '',
  ownerPhone: '',
  status: 'active',
};

export const useLandlordDashboardController = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const profileImageInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', profilePhoto: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [listings, setListings] = useState([]);
  const [ownerInquiries, setOwnerInquiries] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [ownerChats, setOwnerChats] = useState([]);
  const [selectedOwnerChatId, setSelectedOwnerChatId] = useState('');
  const [chatDrafts, setChatDrafts] = useState({});

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingChatId, setSendingChatId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [imageName, setImageName] = useState('');
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

  useEffect(() => {
    let ignore = false;

    async function loadDashboardData() {
      setLoading(true);
      setError('');
      try {
        const [listingsRes, inquiriesRes, bookingsRes, chatsRes] = await Promise.all([
          api.get('/rooms/mine'),
          api.get('/user/owner/inquiries'),
          api.get('/user/owner/bookings'),
          api.get('/user/owner/chats'),
        ]);

        if (!ignore) {
          setListings(Array.isArray(listingsRes.data) ? listingsRes.data : []);
          setOwnerInquiries(inquiriesRes.data?.inquiries || []);
          setOwnerBookings(bookingsRes.data?.bookings || []);
          setOwnerChats(chatsRes.data?.chats || []);
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

      await refreshOwnerChats();
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
  }, [refreshOwnerChats]);

  useEffect(() => {
    if (activeTab !== 'chat') return;
    if (!ownerChats.length) {
      setSelectedOwnerChatId('');
      return;
    }

    const alreadySelected = ownerChats.some((chat) => chat._id === selectedOwnerChatId);
    if (!alreadySelected) {
      setSelectedOwnerChatId(ownerChats[0]._id);
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
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const encoded = event.target?.result;
      if (typeof encoded === 'string') {
        setForm((prev) => ({ ...prev, image: encoded }));
        setImageName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setForm((prev) => ({ ...prev, image: '' }));
    setImageName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openImagePicker = () => fileInputRef.current?.click();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.location.trim() || Number(form.price) <= 0) {
      setError('Title, location and a valid price are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        location: form.location.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        areaSqFt: Number(form.areaSqFt) || 0,
        image: form.image.trim(),
        ownerPhone: form.ownerPhone.trim(),
        status: form.status,
      };

      const res = await api.post('/rooms', payload);
      if (res.data?.room) setListings((prev) => [res.data.room, ...prev]);
      setForm(initialForm);
      setImageName('');
      setSuccess('Listing published successfully. It is now visible to renters.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not publish listing.');
    } finally {
      setSubmitting(false);
    }
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
    setForm({
      title: listing.title || '',
      location: listing.location || '',
      price: String(listing.price || ''),
      description: listing.description || '',
      bedrooms: String(listing.bedrooms ?? 1),
      bathrooms: String(listing.bathrooms ?? 1),
      areaSqFt: String(listing.areaSqFt || ''),
      image: listing.image || '',
      ownerPhone: listing.ownerPhone || '',
      status: listing.status || 'active',
    });
    setImageName(listing.image ? 'Loaded from listing' : '');
    setSuccess('Listing details loaded in the form above. Update values and publish.');
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
    setSuccess('');
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
      setSuccess('Reply sent successfully.');
    } catch (err) {
      setChatDrafts((prev) => ({ ...prev, [chatId]: message }));
      await refreshOwnerChats();
      setError(err?.response?.data?.message || 'Could not send reply.');
    } finally {
      setSendingChatId('');
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
    const activeChats = ownerChats.filter((item) => item.status === 'active').length;
    const unreadChats = ownerChats.filter((item) => isChatUnread(item)).length;

    return {
      totalListings,
      activeListings,
      avgPrice,
      totalValue,
      unreadInquiries,
      pendingBookings,
      activeChats,
      unreadChats,
    };
  }, [listings, ownerInquiries, ownerBookings, ownerChats]);

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
      profileForm,
      activeTab,
      listings,
      ownerInquiries,
      ownerBookings,
      ownerChats,
      selectedOwnerChatId,
      chatDrafts,
      loading,
      submitting,
      savingProfile,
      sendingChatId,
      deletingId,
      imageName,
      error,
      success,
      stats,
    },
    refs: {
      fileInputRef,
      profileImageInputRef,
    },
    handlers: {
      setActiveTab,
      setChatDrafts,
      handleOpenOwnerChat,
      handleChange,
      handleProfileChange,
      handleProfileImageSelect,
      clearProfileImage,
      handleProfileSubmit,
      handleImageSelect,
      clearSelectedImage,
      openImagePicker,
      handleSubmit,
      handleDelete,
      handleViewListing,
      handleEditDraft,
      handleOwnerReply,
      isChatUnread,
      formatDate,
    },
  };
};
