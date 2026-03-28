import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, History, MapPin, Clock3, MessageSquare, CalendarDays, Send, Plus, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const UserDashboardPage = () => {
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get('tab');
  const allowedTabs = new Set(['favorites', 'history', 'inquiries', 'bookings']);
  const initialTab = allowedTabs.has(queryTab) ? queryTab : 'favorites';
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const { showToast } = useToast();

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(success, () => setSuccess(''));

  useEffect(() => {
    if (allowedTabs.has(queryTab)) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  useEffect(() => {
    if (!error) return;
    showToast({ type: 'error', title: 'Dashboard error', message: error });
  }, [error, showToast]);

  useEffect(() => {
    if (!success) return;
    showToast({ type: 'success', title: 'Success', message: success });
  }, [success, showToast]);

  const [inquiryForm, setInquiryForm] = useState({
    listingId: '',
    title: '',
    location: '',
    price: '',
    image: '',
    ownerName: '',
    ownerContact: '',
    message: '',
  });

  const [bookingForm, setBookingForm] = useState({
    listingId: '',
    title: '',
    location: '',
    price: '',
    image: '',
    fullName: '',
    email: '',
    phone: '',
    preferredVisitDate: '',
    preferredTime: '',
    moveInDate: '',
    stayDurationMonths: '12',
    occupants: '1',
    occupation: '',
    monthlyIncome: '',
    hasPets: '',
    reasonForMoving: '',
    note: '',
  });

  const [replyDrafts, setReplyDrafts] = useState({});
  const bookingStatusMapRef = useRef({});
  const hasInitializedBookingMapRef = useRef(false);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError('');
      try {
        const [favoritesRes, historyRes, inquiriesRes, bookingsRes] = await Promise.all([
          api.get('/user/favorites'),
          api.get('/user/history'),
          api.get('/user/inquiries'),
          api.get('/user/bookings'),
        ]);

        setFavorites(favoritesRes.data?.favorites || []);
        setHistory(historyRes.data?.history || []);
        setInquiries(inquiriesRes.data?.inquiries || []);
        const initialBookings = bookingsRes.data?.bookings || [];
        setBookings(initialBookings);
        bookingStatusMapRef.current = initialBookings.reduce((acc, booking) => {
          if (booking?._id) {
            acc[booking._id] = booking.status || 'pending';
          }
          return acc;
        }, {});
        hasInitializedBookingMapRef.current = true;
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load your dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!hasInitializedBookingMapRef.current) return;

    const pollBookings = async () => {
      try {
        const response = await api.get('/user/bookings');
        const latestBookings = response.data?.bookings || [];
        setBookings(latestBookings);

        const nextMap = {};

        latestBookings.forEach((booking) => {
          if (!booking?._id) return;

          const latestStatus = booking.status || 'pending';
          const previousStatus = bookingStatusMapRef.current[booking._id] || 'pending';

          if (latestStatus !== previousStatus && ['confirmed', 'declined'].includes(latestStatus)) {
            showToast({
              type: latestStatus === 'confirmed' ? 'success' : 'error',
              title: latestStatus === 'confirmed' ? 'Booking Accepted' : 'Booking Rejected',
              message: latestStatus === 'confirmed'
                ? `Your booking for ${booking.title || 'this property'} was accepted by the landlord.`
                : `Your booking for ${booking.title || 'this property'} was rejected by the landlord.`,
            });
          }

          nextMap[booking._id] = latestStatus;
        });

        bookingStatusMapRef.current = nextMap;
      } catch {
        // Silent polling failure to avoid noisy dashboard errors.
      }
    };

    const intervalId = setInterval(pollBookings, 15000);

    return () => clearInterval(intervalId);
  }, [showToast]);

  const handleRemoveFavorite = async (item) => {
    setError('');
    setSuccess('');
    try {
      await api.post('/user/favorites/toggle', {
        listingId: item.listingId,
        title: item.title,
      });
      setFavorites((prev) => prev.filter((fav) => fav.listingId !== item.listingId));
      setSuccess('Favorite removed successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not remove favorite');
    }
  };

  const handleClearHistory = async () => {
    if (history.length === 0) {
      return;
    }

    setShowClearHistoryConfirm(true);
  };

  const handleConfirmClearHistory = async () => {
    setShowClearHistoryConfirm(false);

    setError('');
    setSuccess('');

    try {
      await api.delete('/user/history');
      setHistory([]);
      setSuccess('Viewing history removed successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not remove viewing history');
    }
  };

  const sourceListings = [...favorites, ...history].reduce((acc, item) => {
    if (!acc.find((entry) => entry.listingId === item.listingId)) {
      acc.push(item);
    }
    return acc;
  }, []);

  const handleListingSelectForInquiry = (listingId) => {
    const selected = sourceListings.find((item) => item.listingId === listingId);
    if (!selected) return;

    setInquiryForm((prev) => ({
      ...prev,
      listingId: selected.listingId,
      title: selected.title,
      location: selected.location,
      price: selected.price,
      image: selected.image,
    }));
  };

  const handleListingSelectForBooking = (listingId) => {
    const selected = sourceListings.find((item) => item.listingId === listingId);
    if (!selected) return;

    setBookingForm((prev) => ({
      ...prev,
      listingId: selected.listingId,
      title: selected.title,
      location: selected.location,
      price: selected.price,
      image: selected.image,
    }));
  };

  const handleCreateInquiry = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/user/inquiries', inquiryForm);
      setInquiries((prev) => [response.data.inquiry, ...prev]);
      setInquiryForm((prev) => ({
        ...prev,
        ownerName: '',
        ownerContact: '',
        message: '',
      }));
      setSuccess('Inquiry sent successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send inquiry');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/user/bookings', bookingForm);
      setBookings((prev) => [response.data.booking, ...prev]);
      setBookingForm((prev) => ({
        ...prev,
        fullName: '',
        email: '',
        phone: '',
        preferredVisitDate: '',
        preferredTime: '',
        moveInDate: '',
        stayDurationMonths: '12',
        occupants: '1',
        occupation: '',
        monthlyIncome: '',
        hasPets: '',
        reasonForMoving: '',
        note: '',
      }));
      setSuccess('Booking request sent successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send booking request');
    }
  };

  const handleSendReply = async (inquiryId) => {
    const message = replyDrafts[inquiryId]?.trim();
    if (!message) return;

    setError('');

    try {
      const response = await api.post(`/user/inquiries/${inquiryId}/messages`, { message });
      setInquiries((prev) => prev.map((item) => (item._id === inquiryId ? response.data.inquiry : item)));
      setReplyDrafts((prev) => ({ ...prev, [inquiryId]: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send message');
    }
  };

  const renderListingCards = (cards, cardType) => {
    if (cards.length === 0) {
      return (
        <div className="bg-white border border-gray-100 rounded-sm p-8 text-center text-gray-500">
          {cardType === 'favorites' ? 'No saved favorites yet.' : 'No viewing history yet.'}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((item) => (
          <div key={item._id} className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
            <img
              src={item.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800'}
              alt={item.title}
              className="w-full h-44 object-cover"
            />
            <div className="p-4">
              <h3 className="text-base font-bold text-[#1a222e] mb-2 line-clamp-2">{item.title}</h3>
              <div className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1">
                <MapPin size={12} /> {item.location || 'Location not set'}
              </div>
              <div className="text-sm font-extrabold text-[#3b66ff] mb-3">Rs {Number(item.price || 0).toLocaleString()}</div>

              {cardType === 'favorites' ? (
                <button
                  type="button"
                  onClick={() => handleRemoveFavorite(item)}
                  className="text-xs font-bold text-red-500 hover:text-red-600"
                >
                  Remove Favorite
                </button>
              ) : (
                <div className="text-xs text-gray-400 inline-flex items-center gap-1">
                  <Clock3 size={12} />
                  Viewed {new Date(item.viewedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const statusPill = (status) => {
    const statusMap = {
      open: 'bg-blue-50 text-blue-700',
      responded: 'bg-green-50 text-green-700',
      closed: 'bg-gray-100 text-gray-600',
      pending: 'bg-amber-50 text-amber-700',
      confirmed: 'bg-green-50 text-green-700',
      declined: 'bg-red-50 text-red-700',
      cancelled: 'bg-gray-100 text-gray-600',
    };

    return statusMap[status] || 'bg-gray-100 text-gray-600';
  };

  const formatStatusLabel = (status) => {
    const normalized = String(status || 'pending');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-6 md:px-10 lg:px-16 py-10">
      <ConfirmModal
        open={showClearHistoryConfirm}
        title="Clear Viewing History?"
        message="Remove all viewing history? This action cannot be undone."
        onCancel={() => setShowClearHistoryConfirm(false)}
        onConfirm={handleConfirmClearHistory}
        confirmLabel="Clear"
        confirmVariant="danger"
      />

      <div className="max-w-300 mx-auto">
        <h1 className="text-4xl font-black text-[#1a222e] mb-6 tracking-tight">My Dashboard</h1>

        <div className="bg-white border border-gray-100 shadow-sm rounded-sm p-3 inline-flex gap-2 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
              activeTab === 'favorites' ? 'bg-[#3b66ff] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="inline-flex items-center gap-2"><Heart size={15} /> Favorites</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
              activeTab === 'history' ? 'bg-[#3b66ff] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="inline-flex items-center gap-2"><History size={15} /> Viewing History</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
              activeTab === 'inquiries' ? 'bg-[#3b66ff] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="inline-flex items-center gap-2"><MessageSquare size={15} /> Inquiries & Messages</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
              activeTab === 'bookings' ? 'bg-[#3b66ff] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="inline-flex items-center gap-2"><CalendarDays size={15} /> Booking Requests</span>
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500 font-medium">Loading dashboard...</div>
        ) : (
          <>
            {activeTab === 'history' && history.length > 0 && (
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="px-4 py-2 text-xs font-bold text-red-600 border border-red-200 rounded-sm hover:bg-red-50"
                >
                  Remove All History
                </button>
              </div>
            )}

            {activeTab === 'favorites' && renderListingCards(favorites, 'favorites')}
            {activeTab === 'history' && renderListingCards(history, 'history')}

            {activeTab === 'inquiries' && (
              <div className="space-y-6">
                <form onSubmit={handleCreateInquiry} className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm">
                  <h2 className="text-xl font-bold text-[#1a222e] mb-4 flex items-center gap-2"><Plus size={18} /> New Inquiry</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <select
                        value={inquiryForm.listingId}
                        onChange={(e) => handleListingSelectForInquiry(e.target.value)}
                        className="w-full px-3 py-2 pr-10 appearance-none bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      >
                        <option value="">Select listing from favorites/history</option>
                        {sourceListings.map((item) => (
                          <option key={item.listingId} value={item.listingId}>{item.title}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={inquiryForm.ownerName}
                      onChange={(e) => setInquiryForm((prev) => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="Owner name (optional)"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                      type="text"
                      value={inquiryForm.ownerContact}
                      onChange={(e) => setInquiryForm((prev) => ({ ...prev, ownerContact: e.target.value }))}
                      placeholder="Owner contact (optional)"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                      type="text"
                      value={inquiryForm.location || ''}
                      disabled
                      className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-sm text-gray-500"
                      placeholder="Location"
                    />
                    <textarea
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder="Write your message to the owner"
                      className="md:col-span-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 min-h-25"
                      required
                    />
                  </div>
                  <button type="submit" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#3b66ff] text-white rounded-sm text-sm font-bold hover:bg-blue-700">
                    <Send size={14} /> Send Inquiry
                  </button>
                </form>

                {inquiries.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-sm p-8 text-center text-gray-500">No inquiries sent yet.</div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <div key={inquiry._id} className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <h3 className="font-bold text-[#1a222e]">{inquiry.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusPill(inquiry.status)}`}>
                            {inquiry.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 inline-flex items-center gap-1"><MapPin size={12} /> {inquiry.location || 'Location not set'}</p>
                        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                          {inquiry.messages.map((msg, index) => (
                            <div key={index} className={`p-2 rounded-sm text-sm ${msg.senderType === 'user' ? 'bg-blue-50 text-blue-900' : 'bg-gray-100 text-gray-700'}`}>
                              <div className="text-[11px] uppercase font-bold opacity-70 mb-1">{msg.senderType}</div>
                              {msg.text}
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyDrafts[inquiry._id] || ''}
                            onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [inquiry._id]: e.target.value }))}
                            placeholder="Write follow-up message"
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReply(inquiry._id)}
                            className="px-3 py-2 bg-[#1f2937] text-white rounded-sm text-sm font-semibold hover:bg-black"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <form onSubmit={handleCreateBooking} className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm">
                  <h2 className="text-xl font-bold text-[#1a222e] mb-4 flex items-center gap-2"><Plus size={18} /> New Booking Request</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <select
                        value={bookingForm.listingId}
                        onChange={(e) => handleListingSelectForBooking(e.target.value)}
                        className="w-full px-3 py-2 pr-10 appearance-none bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      >
                        <option value="">Select listing from favorites/history</option>
                        {sourceListings.map((item) => (
                          <option key={item.listingId} value={item.listingId}>{item.title}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={bookingForm.fullName}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Full name *"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address *"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <input
                      type="tel"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone number *"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <input
                      type="date"
                      value={bookingForm.preferredVisitDate}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, preferredVisitDate: e.target.value }))}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <div className="relative">
                      <select
                        value={bookingForm.preferredTime}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, preferredTime: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 appearance-none bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      >
                        <option value="">Preferred time *</option>
                        <option value="morning">Morning (9 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                        <option value="evening">Evening (4 PM - 6 PM)</option>
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={bookingForm.moveInDate}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, moveInDate: e.target.value }))}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      value={bookingForm.stayDurationMonths}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, stayDurationMonths: e.target.value }))}
                      placeholder="Stay duration (months) *"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      value={bookingForm.occupants}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, occupants: e.target.value }))}
                      placeholder="Number of occupants *"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <input
                      type="text"
                      value={bookingForm.occupation}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, occupation: e.target.value }))}
                      placeholder="Occupation *"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <div className="relative">
                      <select
                        value={bookingForm.monthlyIncome}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, monthlyIncome: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 appearance-none bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      >
                        <option value="">Monthly income range *</option>
                        <option value="below-25000">Below Rs. 25,000</option>
                        <option value="25000-50000">Rs. 25,000 - 50,000</option>
                        <option value="50000-100000">Rs. 50,000 - 100,000</option>
                        <option value="above-100000">Above Rs. 100,000</option>
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="relative">
                      <select
                        value={bookingForm.hasPets}
                        onChange={(e) => setBookingForm((prev) => ({ ...prev, hasPets: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 appearance-none bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                        required
                      >
                        <option value="">Any pets? *</option>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <textarea
                      value={bookingForm.reasonForMoving}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, reasonForMoving: e.target.value }))}
                      placeholder="Reason for moving *"
                      className="md:col-span-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 min-h-24"
                      required
                    />
                    <textarea
                      value={bookingForm.note}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="Additional note for booking (optional)"
                      className="md:col-span-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 min-h-24"
                    />
                  </div>
                  <button type="submit" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#3b66ff] text-white rounded-sm text-sm font-bold hover:bg-blue-700">
                    <CalendarDays size={14} /> Send Booking Request
                  </button>
                </form>

                {bookings.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-sm p-8 text-center text-gray-500">No booking requests yet.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {bookings.map((booking) => (
                      <div key={booking._id} className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
                        <img
                          src={booking.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800'}
                          alt={booking.title}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-[#1a222e] line-clamp-1">{booking.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusPill(booking.status)}`}>{formatStatusLabel(booking.status)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1"><MapPin size={12} /> {booking.location || 'Location not set'}</p>
                          <p className="text-sm font-extrabold text-[#3b66ff] mb-2">Rs {Number(booking.price || 0).toLocaleString()}</p>
                          {booking.status === 'confirmed' && (
                            <p className="mb-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
                              Your booking has been accepted by the landlord.
                            </p>
                          )}
                          {booking.status === 'declined' && (
                            <p className="mb-2 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700">
                              Your booking has been rejected by the landlord.
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mb-1">Visit: {new Date(booking.preferredVisitDate).toLocaleString()}</p>
                          {booking.preferredTime && <p className="text-xs text-gray-600 mb-1">Time slot: {booking.preferredTime}</p>}
                          {booking.moveInDate && <p className="text-xs text-gray-600 mb-1">Move-in date: {new Date(booking.moveInDate).toLocaleDateString()}</p>}
                          {booking.occupants && <p className="text-xs text-gray-600 mb-1">Occupants: {booking.occupants}</p>}
                          {booking.note && <p className="text-xs text-gray-500 mb-1">Note: {booking.note}</p>}
                          {booking.ownerResponse && (
                            <p className={`text-xs ${booking.status === 'declined' ? 'text-rose-700' : 'text-emerald-700'}`}>
                              Owner response: {booking.ownerResponse}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboardPage;
