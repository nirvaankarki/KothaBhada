import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Home,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Trash2,
  ImagePlus,
  XCircle,
  UserCircle2,
  Save,
  Phone,
  Bell,
  ChevronDown,
  TrendingUp,
  MessageSquare,
  Send,
} from 'lucide-react';
import api from '../utils/api';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
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

const LandlordDashboardPage = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const profileImageInputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    profilePhoto: '',
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [listings, setListings] = useState([]);
  const [ownerInquiries, setOwnerInquiries] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [chatDrafts, setChatDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingInquiryId, setSendingInquiryId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [imageName, setImageName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(success, () => setSuccess(''));

  useEffect(() => {
    let ignore = false;

    async function loadMyListings() {
      setLoading(true);
      setError('');
      try {
        const [listingsRes, inquiriesRes, bookingsRes] = await Promise.all([
          api.get('/rooms/mine'),
          api.get('/user/owner/inquiries'),
          api.get('/user/owner/bookings'),
        ]);

        if (!ignore) {
          setListings(Array.isArray(listingsRes.data) ? listingsRes.data : []);
          setOwnerInquiries(inquiriesRes.data?.inquiries || []);
          setOwnerBookings(bookingsRes.data?.bookings || []);
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

    loadMyListings();
    return () => {
      ignore = true;
    };
  }, []);

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
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const clearProfileImage = () => {
    setProfileForm((prev) => ({ ...prev, profilePhoto: '' }));
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = '';
    }
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
      const updated = response.data?.user;
      if (updated) {
        updateUser(updated);
      }
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
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setForm((prev) => ({ ...prev, image: '' }));
    setImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openImagePicker = () => {
    fileInputRef.current?.click();
  };

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
      const created = res.data?.room;
      if (created) {
        setListings((prev) => [created, ...prev]);
      }
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

  const handleOwnerReply = async (inquiryId) => {
    const message = (chatDrafts[inquiryId] || '').trim();
    if (!message) return;

    setError('');
    setSuccess('');
    setSendingInquiryId(inquiryId);
    try {
      const response = await api.post(`/user/owner/inquiries/${inquiryId}/messages`, { message });
      setOwnerInquiries((prev) => prev.map((item) => (
        item._id === inquiryId ? response.data?.inquiry || item : item
      )));
      setChatDrafts((prev) => ({ ...prev, [inquiryId]: '' }));
      setSuccess('Reply sent successfully.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send reply.');
    } finally {
      setSendingInquiryId('');
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

    return {
      totalListings,
      activeListings,
      avgPrice,
      totalValue,
      unreadInquiries,
    };
  }, [listings, ownerInquiries]);

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    try {
      return new Date(isoDate).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7fe] font-sans text-gray-800">
      <aside className="hidden lg:flex w-64 bg-[#0f172a] text-white flex-col sticky top-0 h-screen overflow-hidden">
        <div className="p-8">
          <h1 className="text-2xl font-black text-white-500">Kotha<span className="text-blue-500">Bhada</span></h1>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-2">Landlord Panel</p>
        </div>

        <nav className="flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
              activeTab === 'listings'
                ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <Home size={18} />
            <span className="text-sm font-medium">My Listings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
              activeTab === 'chat'
                ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <MessageSquare size={18} />
            <span className="text-sm font-medium">Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
                : 'text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <UserCircle2 size={18} />
            <span className="text-sm font-medium">Owner Profile</span>
          </button>
        </nav>

        <div className="relative h-28 w-full overflow-hidden opacity-60">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-600 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-blue-600 rounded-full blur-3xl" />
        </div>
      </aside>

      <main className="flex-1 p-5 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
          <div>
            <h2 className="text-3xl font-black text-gray-800">Overview</h2>
            <p className="mt-1 text-sm text-gray-500">Manage your profile and publish rental inventory from one place.</p>
          </div>
          <div className="flex items-center gap-5">
            <button type="button" className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100">
              {profileForm.profilePhoto ? (
                <img src={profileForm.profilePhoto} alt={profileForm.name || 'Owner'} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                  <UserCircle2 size={20} className="text-slate-500" />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Landlord</p>
                <p className="text-sm font-bold text-gray-700 max-w-40 truncate">{profileForm.name || 'Owner'}</p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
          </div>
        </header>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>}

        {activeTab === 'dashboard' && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
          <article className="bg-white p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Listings</p>
                <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.totalListings}</h3>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Home size={18} className="text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
              <TrendingUp size={14} />
              <span>{stats.activeListings}</span>
              <span className="text-gray-400 font-normal ml-1">Active now</span>
            </div>
          </article>

          <article className="bg-white p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Average Rent</p>
                <h3 className="text-2xl font-black text-gray-800 mt-1">Rs {stats.avgPrice.toLocaleString()}</h3>
              </div>
              <div className="p-2 rounded-lg bg-cyan-100">
                <Building2 size={18} className="text-cyan-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-cyan-600 text-xs font-bold">
              <TrendingUp size={14} />
              <span>Live Market</span>
            </div>
          </article>

          <article className="bg-white p-6 rounded-2xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Portfolio Value</p>
                <h3 className="text-2xl font-black text-gray-800 mt-1">Rs {stats.totalValue.toLocaleString()}</h3>
              </div>
              <div className="p-2 rounded-lg bg-indigo-100">
                <PlusCircle size={18} className="text-indigo-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-indigo-600 text-xs font-bold">
              <TrendingUp size={14} />
              <span>Total rent potential</span>
            </div>
          </article>
        </section>

            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
              <h3 className="text-xl font-bold text-[#132238] mb-4">Landlord Activity Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Response Queue</p>
                  <p className="text-3xl font-black text-[#1f2937]">{stats.unreadInquiries}</p>
                  <p className="text-sm text-gray-500 mt-2">Open renter inquiries awaiting your reply.</p>
                </div>
                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Booking Interest</p>
                  <p className="text-3xl font-black text-[#1f2937]">{ownerBookings.length}</p>
                  <p className="text-sm text-gray-500 mt-2">Total booking requests received from renters.</p>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'listings' && (
          <>
            <section className="bg-white p-6 rounded-2xl shadow-sm mb-6">
              <h3 className="text-xl font-bold text-[#132238]">My Listings</h3>
              <p className="mt-1 text-sm text-gray-500">Total listings published by you: <span className="font-bold text-[#1d4ed8]">{stats.totalListings}</span></p>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <PlusCircle size={18} className="text-[#2563eb]" />
                <h3 className="text-xl font-bold text-[#132238]">Create New Listing</h3>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={handleChange('title')}
                      placeholder="e.g. Modern 2BHK Flat in Baneshwor"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={handleChange('location')}
                      placeholder="e.g. Kalopul, Kathmandu"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Monthly Rent (Rs)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.price}
                      onChange={handleChange('price')}
                      placeholder="e.g. 25000"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bedrooms</label>
                    <input
                      type="number"
                      min="0"
                      value={form.bedrooms}
                      onChange={handleChange('bedrooms')}
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bathrooms</label>
                    <input
                      type="number"
                      min="0"
                      value={form.bathrooms}
                      onChange={handleChange('bathrooms')}
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Area (sq.ft)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.areaSqFt}
                      onChange={handleChange('areaSqFt')}
                      placeholder="e.g. 450"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact Number</label>
                    <input
                      type="text"
                      value={form.ownerPhone}
                      onChange={handleChange('ownerPhone')}
                      placeholder="e.g. +977-98XXXXXXXX"
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</label>
                    <textarea
                      value={form.description}
                      onChange={handleChange('description')}
                      rows={4}
                      placeholder="Describe the property, amenities, and neighborhood."
                      className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Room Image</label>
                  <div className="mt-1 p-3 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <button
                      type="button"
                      onClick={openImagePicker}
                      className="h-44 w-full rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors"
                    >
                      {form.image ? (
                        <img src={form.image} alt="Selected room" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-gray-500 text-xs">
                          <ImagePlus size={22} className="mx-auto mb-2 text-gray-400" />
                          <p>No image selected</p>
                          <p className="mt-1 text-[11px] text-gray-400">Click here to upload</p>
                        </div>
                      )}
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {form.image && (
                        <button
                          type="button"
                          onClick={clearSelectedImage}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                        >
                          <XCircle size={14} /> Remove
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500">{imageName || 'PNG, JPG, JPEG up to 5MB'}</p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563eb] text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Building2 size={15} /> {submitting ? 'Publishing...' : 'Publish Listing'}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
              <h3 className="text-xl font-bold text-[#132238] mb-4">Your Listings</h3>

              {loading ? (
                <p className="text-sm text-gray-500">Loading your listings...</p>
              ) : listings.length === 0 ? (
                <p className="text-sm text-gray-500">You have not published any listings yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listings.map((item) => (
                    <article key={item._id} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                      <div className="h-40 bg-gray-100">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-linear-to-br from-[#dbeafe] to-[#eef2ff]" />
                        )}
                      </div>

                      <div className="p-4">
                        <h4 className="text-base font-bold text-[#132238] line-clamp-2">{item.title}</h4>
                        <p className="mt-1 text-xs text-gray-500 inline-flex items-center gap-1"><MapPin size={12} /> {item.location}</p>
                        <p className="mt-2 text-lg font-black text-[#1d4ed8]">Rs {Number(item.price || 0).toLocaleString()}</p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg"><BedDouble size={12} /> {item.bedrooms ?? 0} bed</span>
                          <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg"><Bath size={12} /> {item.bathrooms ?? 0} bath</span>
                          <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg"><Ruler size={12} /> {item.areaSqFt ?? 0} sq.ft</span>
                        </div>

                        <div className="mt-3 text-[11px] text-gray-500">Published: {formatDate(item.createdAt)}</div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-60"
                          >
                            <Trash2 size={13} /> {deletingId === item._id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
              </div>

              <div className="space-y-6">
                <section className="bg-white p-6 rounded-2xl shadow-sm">
                  <h3 className="text-lg font-bold text-[#132238] mb-4">Listing Tips</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <ImagePlus size={16} className="text-indigo-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Add clear images</p>
                        <p className="text-xs text-gray-500">Bright photos increase click-through rate.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <MapPin size={16} className="text-teal-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Use exact locality</p>
                        <p className="text-xs text-gray-500">Detailed location improves discoverability.</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}

        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm">
              <h3 className="text-xl font-bold text-[#132238] mb-4">Renter Inquiries</h3>

              {ownerInquiries.length === 0 ? (
                <p className="text-sm text-gray-500">No renter inquiries yet.</p>
              ) : (
                <div className="space-y-4">
                  {ownerInquiries.map((inquiry) => (
                    <article key={inquiry._id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <div>
                          <h4 className="text-base font-bold text-[#132238]">{inquiry.title}</h4>
                          <p className="text-xs text-gray-500">Renter: {inquiry.userId?.name || 'Unknown'} ({inquiry.userId?.email || 'N/A'})</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${inquiry.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {inquiry.status}
                        </span>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mb-3">
                        {(inquiry.messages || []).map((msg, idx) => (
                          <div
                            key={`${inquiry._id}-${idx}`}
                            className={`p-2 rounded-lg text-sm ${msg.senderType === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-700'}`}
                          >
                            <p className="text-[11px] font-bold uppercase opacity-70 mb-1">{msg.senderType}</p>
                            <p>{msg.text}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatDrafts[inquiry._id] || ''}
                          onChange={(e) => setChatDrafts((prev) => ({ ...prev, [inquiry._id]: e.target.value }))}
                          placeholder="Reply to renter..."
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleOwnerReply(inquiry._id)}
                          disabled={sendingInquiryId === inquiry._id}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-[#1f2937] text-white rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-60"
                        >
                          <Send size={14} /> {sendingInquiryId === inquiry._id ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold text-[#132238] mb-4">Booking Requests</h3>
              {ownerBookings.length === 0 ? (
                <p className="text-sm text-gray-500">No booking requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {ownerBookings.map((booking) => (
                    <div key={booking._id} className="p-3 border border-gray-100 rounded-xl bg-gray-50">
                      <p className="text-sm font-bold text-[#132238] line-clamp-1">{booking.title}</p>
                      <p className="text-xs text-gray-500 mt-1">Renter: {booking.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">Visit: {new Date(booking.preferredVisitDate).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <UserCircle2 size={18} className="text-[#2563eb]" />
                <h3 className="text-lg font-bold text-[#132238]">Owner Profile</h3>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <label className="block cursor-pointer">
                  <div className="h-24 w-24 mx-auto rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center hover:border-blue-300 transition-colors">
                    {profileForm.profilePhoto ? (
                      <img src={profileForm.profilePhoto} alt="Owner profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle2 size={40} className="text-gray-400" />
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-center text-gray-500">Click photo to upload</p>
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageSelect}
                    className="hidden"
                  />
                </label>

                {profileForm.profilePhoto && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={clearProfileImage}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                    >
                      <XCircle size={13} /> Remove Photo
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={handleProfileChange('name')}
                    placeholder="Your full name"
                    className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={handleProfileChange('phone')}
                    placeholder="e.g. +977-98XXXXXXXX"
                    className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#0b1627] disabled:opacity-60"
                >
                  <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold text-[#132238] mb-4">Profile Notes</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Phone size={16} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Contact Ready</p>
                    <p className="text-xs text-gray-500">Keep owner number updated for renter calls.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <ImagePlus size={16} className="text-indigo-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Image Quality</p>
                    <p className="text-xs text-gray-500">Listings with photos get better engagement.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <MapPin size={16} className="text-teal-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Location Detail</p>
                    <p className="text-xs text-gray-500">Specific locality improves search visibility.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default LandlordDashboardPage;
