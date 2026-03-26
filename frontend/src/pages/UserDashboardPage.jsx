import React, { useEffect, useState } from 'react';
import { Heart, History, MapPin, Clock3, MessageSquare, CalendarDays, Send, Plus } from 'lucide-react';
import api from '../utils/api';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { useToast } from '../context/ToastContext';

const UserDashboardPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('favorites');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { showToast } = useToast();

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(success, () => setSuccess(''));

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
    ownerName: '',
    ownerContact: '',
    preferredVisitDate: '',
    note: '',
  });

  const [replyDrafts, setReplyDrafts] = useState({});

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
        setBookings(bookingsRes.data?.bookings || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load your dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

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

    const shouldClear = window.confirm('Remove all viewing history? This action cannot be undone.');
    if (!shouldClear) {
      return;
    }

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
        ownerName: '',
        ownerContact: '',
        preferredVisitDate: '',
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

  return (
    <div className="min-h-screen bg-[#f6f8fc] px-6 md:px-10 lg:px-16 py-10">
      <div className="max-w-[1200px] mx-auto">
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
                    <select
                      value={inquiryForm.listingId}
                      onChange={(e) => handleListingSelectForInquiry(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      <option value="">Select listing from favorites/history</option>
                      {sourceListings.map((item) => (
                        <option key={item.listingId} value={item.listingId}>{item.title}</option>
                      ))}
                    </select>
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
                      className="md:col-span-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
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
                    <select
                      value={bookingForm.listingId}
                      onChange={(e) => handleListingSelectForBooking(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      <option value="">Select listing from favorites/history</option>
                      {sourceListings.map((item) => (
                        <option key={item.listingId} value={item.listingId}>{item.title}</option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={bookingForm.preferredVisitDate}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, preferredVisitDate: e.target.value }))}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <input
                      type="text"
                      value={bookingForm.ownerName}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="Owner name (optional)"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <input
                      type="text"
                      value={bookingForm.ownerContact}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, ownerContact: e.target.value }))}
                      placeholder="Owner contact (optional)"
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <textarea
                      value={bookingForm.note}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="Additional note for booking"
                      className="md:col-span-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 min-h-[90px]"
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
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusPill(booking.status)}`}>{booking.status}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1 inline-flex items-center gap-1"><MapPin size={12} /> {booking.location || 'Location not set'}</p>
                          <p className="text-sm font-extrabold text-[#3b66ff] mb-2">Rs {Number(booking.price || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-600 mb-1">Visit: {new Date(booking.preferredVisitDate).toLocaleString()}</p>
                          {booking.note && <p className="text-xs text-gray-500 mb-1">Note: {booking.note}</p>}
                          {booking.ownerResponse && <p className="text-xs text-green-700">Owner response: {booking.ownerResponse}</p>}
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
