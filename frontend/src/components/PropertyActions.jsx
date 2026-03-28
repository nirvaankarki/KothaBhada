import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, MessageCircle, Send, ChevronDown } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function toUiMessageList(chat) {
  const rawMessages = Array.isArray(chat?.messages) ? chat.messages : [];

  return rawMessages.map((msg, index) => ({
    id: msg?._id || `${chat?._id || 'chat'}-${index}`,
    text: msg?.text || '',
    sender: msg?.senderType === 'owner' ? 'owner' : 'user',
    timestamp: msg?.sentAt
      ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
  }));
}

const BookingForm = ({ listingId, ownerId, title, location, price, image, isBooked = false, onBookingSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
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
  const [loading, setLoading] = useState(false);
  const [showBookedConfirmModal, setShowBookedConfirmModal] = useState(false);
  const [pendingBookingPayload, setPendingBookingPayload] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      fullName: String(user?.name || prev.fullName || '').trim(),
      email: String(user?.email || prev.email || '').trim(),
      phone: String(user?.phone || prev.phone || '').trim(),
    }));
  }, [user?.name, user?.email, user?.phone]);

  const setField = (key) => (e) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const clearForm = () => {
    setFormData({
      fullName: String(user?.name || '').trim(),
      email: String(user?.email || '').trim(),
      phone: String(user?.phone || '').trim(),
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
  };

  const buildBookingPayload = () => ({
    listingId,
    ownerId,
    title: title || 'Property',
    location: location || '',
    price: price || 0,
    image: image || '',
    fullName: formData.fullName.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    preferredVisitDate: new Date(formData.preferredVisitDate).toISOString(),
    preferredTime: formData.preferredTime,
    moveInDate: new Date(formData.moveInDate).toISOString(),
    stayDurationMonths: Number(formData.stayDurationMonths),
    occupants: Number(formData.occupants),
    occupation: formData.occupation.trim(),
    monthlyIncome: formData.monthlyIncome,
    hasPets: formData.hasPets,
    reasonForMoving: formData.reasonForMoving.trim(),
    note: formData.note,
  });

  const submitBookingRequest = async (payload) => {
    setLoading(true);
    try {
      const response = await api.post('/user/bookings', payload);

      showToast({
        type: 'success',
        title: 'Request sent',
        message: 'Booking request sent successfully! The owner will contact you soon.',
      });

      if (onBookingSuccess) {
        onBookingSuccess(response.data.booking);
      }

      clearForm();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Booking failed',
        message: err?.response?.data?.message || 'Failed to send booking request.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredKeys = [
      'fullName',
      'email',
      'phone',
      'preferredVisitDate',
      'preferredTime',
      'moveInDate',
      'stayDurationMonths',
      'occupants',
      'occupation',
      'monthlyIncome',
      'hasPets',
      'reasonForMoving',
    ];

    const missing = requiredKeys.some((key) => !String(formData[key] || '').trim());
    if (missing) {
      showToast({
        type: 'warning',
        title: 'Missing details',
        message: 'Please complete all required fields before sending your booking request.',
      });
      return;
    }

    const payload = buildBookingPayload();

    if (isBooked) {
      setPendingBookingPayload(payload);
      setShowBookedConfirmModal(true);
      return;
    }

    await submitBookingRequest(payload);
  };

  const handleConfirmBookedSubmission = async () => {
    if (!pendingBookingPayload) {
      setShowBookedConfirmModal(false);
      return;
    }

    setShowBookedConfirmModal(false);
    await submitBookingRequest(pendingBookingPayload);
    setPendingBookingPayload(null);
  };

  return (
    <div className="space-y-6">
      {isBooked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">This property is currently marked as booked.</p>
          <p className="mt-1 text-xs text-amber-800">You can still send a booking request. We will ask for your confirmation before submission.</p>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-3">
          <Calendar className="text-[#3b66ff]" size={24} />
        </div>
        <h3 className="text-xl font-bold text-[#1a222e]">Schedule a Visit</h3>
        <p className="text-sm text-gray-600 mt-1">Tell the owner when you'd like to visit this property</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={setField('fullName')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={setField('phone')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="98XXXXXXXX"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={setField('email')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="yourname@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="visitDate" className="block text-sm font-semibold text-gray-700 mb-2">
            Preferred Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="visitDate"
            value={formData.preferredVisitDate}
            onChange={setField('preferredVisitDate')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            required
          />
        </div>

        <div>
          <label htmlFor="visitTime" className="block text-sm font-semibold text-gray-700 mb-2">
            Preferred Time <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="visitTime"
              value={formData.preferredTime}
              onChange={setField('preferredTime')}
              className="w-full px-4 py-2.5 pr-10 appearance-none border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              required
            >
              <option value="">Select a time</option>
              <option value="morning">Morning (9 AM - 12 PM)</option>
              <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
              <option value="evening">Evening (4 PM - 6 PM)</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="moveInDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Expected Move-in Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="moveInDate"
              value={formData.moveInDate}
              onChange={setField('moveInDate')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              required
            />
          </div>

          <div>
            <label htmlFor="stayDurationMonths" className="block text-sm font-semibold text-gray-700 mb-2">
              Planned Stay (Months) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="stayDurationMonths"
              min="1"
              value={formData.stayDurationMonths}
              onChange={setField('stayDurationMonths')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              required
            />
          </div>

          <div>
            <label htmlFor="occupants" className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Occupants <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="occupants"
              min="1"
              value={formData.occupants}
              onChange={setField('occupants')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              required
            />
          </div>

          <div>
            <label htmlFor="hasPets" className="block text-sm font-semibold text-gray-700 mb-2">
              Any Pets? <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="hasPets"
                value={formData.hasPets}
                onChange={setField('hasPets')}
                className="w-full px-4 py-2.5 pr-10 appearance-none border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                required
              >
                <option value="">Select option</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="occupation" className="block text-sm font-semibold text-gray-700 mb-2">
              Occupation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="occupation"
              value={formData.occupation}
              onChange={setField('occupation')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="Software Engineer, Student, etc."
              required
            />
          </div>

          <div>
            <label htmlFor="monthlyIncome" className="block text-sm font-semibold text-gray-700 mb-2">
              Monthly Income Range <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={setField('monthlyIncome')}
                className="w-full px-4 py-2.5 pr-10 appearance-none border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                required
              >
                <option value="">Select range</option>
                <option value="below-25000">Below Rs. 25,000</option>
                <option value="25000-50000">Rs. 25,000 - 50,000</option>
                <option value="50000-100000">Rs. 50,000 - 100,000</option>
                <option value="above-100000">Above Rs. 100,000</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="reasonForMoving" className="block text-sm font-semibold text-gray-700 mb-2">
            Reason for Moving <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reasonForMoving"
            rows="3"
            value={formData.reasonForMoving}
            onChange={setField('reasonForMoving')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white resize-none"
            placeholder="Briefly explain your purpose for renting this property"
            required
          />
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-semibold text-gray-700 mb-2">
            Additional Note (Optional)
          </label>
          <textarea
            id="note"
            rows="3"
            value={formData.note}
            onChange={setField('note')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white resize-none"
            placeholder="Any questions or special requests?"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#3b66ff] hover:bg-blue-700 text-white font-bold py-3 rounded-sm transition-colors disabled:bg-blue-300 flex items-center justify-center gap-2"
        >
          {loading ? 'Sending Request...' : (
            <>
              <Calendar size={18} />
              Send Booking Request
            </>
          )}
        </button>
      </form>

      {showBookedConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[1px] p-4">
          <div className="min-h-full flex items-center justify-center">
            <section className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
              <h3 className="text-lg font-bold text-[#132238]">Property Already Booked</h3>
              <p className="mt-2 text-sm text-gray-600">
                This property currently has a confirmed booking. Do you still want to send your booking request?
              </p>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookedConfirmModal(false);
                    setPendingBookingPayload(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBookedSubmission}
                  className="px-4 py-2 rounded-lg bg-[#3b66ff] text-white text-sm font-semibold hover:bg-blue-700"
                >
                  Send Request Anyway
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatBox = ({ listingId, ownerId, ownerName, ownerProfilePhoto, title, location, price, image }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [ownerMeta, setOwnerMeta] = useState({
    name: ownerName || 'Property Owner',
    profilePhoto: ownerProfilePhoto || '',
  });
  const messagesContainerRef = useRef(null);
  const hasLoadedHistoryRef = useRef(false);
  const { showToast } = useToast();

  useEffect(() => {
    setOwnerMeta({
      name: ownerName || 'Property Owner',
      profilePhoto: ownerProfilePhoto || '',
    });
  }, [ownerName, ownerProfilePhoto]);

  const scrollToLatestMessage = useCallback((behavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const fetchChatByListing = useCallback(async ({ silent = false } = {}) => {
    if (!listingId) {
      setMessages([]);
      return;
    }

    if (!silent) {
      setLoadingHistory(true);
    }

    try {
      const response = await api.get('/user/chats');
      const chats = Array.isArray(response.data?.chats) ? response.data.chats : [];
      const matchingChat = chats.find((chat) => String(chat?.listingId) === String(listingId));
      const nextMessages = toUiMessageList(matchingChat);

      const ownerFromChat = matchingChat?.ownerId;
      setOwnerMeta((prev) => ({
        name: ownerFromChat?.name || prev.name || ownerName || 'Property Owner',
        profilePhoto: ownerFromChat?.profilePhoto || prev.profilePhoto || ownerProfilePhoto || '',
      }));

      setMessages(nextMessages);
      hasLoadedHistoryRef.current = true;
    } catch (err) {
      if (!silent) {
        showToast({
          type: 'error',
          title: 'Chat unavailable',
          message: err?.response?.data?.message || 'Could not load previous messages.',
        });
      }
    } finally {
      if (!silent) {
        setLoadingHistory(false);
      }
    }
  }, [listingId, ownerName, ownerProfilePhoto, showToast]);

  useEffect(() => {
    fetchChatByListing({ silent: false });

    const pullChats = () => {
      fetchChatByListing({ silent: true });
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

    return () => {
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [fetchChatByListing, listingId]);

  useEffect(() => {
    if (!hasLoadedHistoryRef.current || loadingHistory || messages.length === 0) return;
    const behavior = messages.length <= 1 ? 'auto' : 'smooth';
    scrollToLatestMessage(behavior);
  }, [messages, loadingHistory, scrollToLatestMessage]);

  const handleSendMessage = async () => {
    const messageText = newMessage.trim();
    if (!messageText) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');
    setLoading(true);

    try {
      const response = await api.post('/user/chat/send', {
        listingId,
        ownerId,
        title: title || 'Property Chat',
        location: location || '',
        price: price || 0,
        image: image || '',
        message: messageText,
      });

      const persistedChat = response.data?.chat;
      if (persistedChat) {
        setMessages(toUiMessageList(persistedChat));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setNewMessage(messageText);
      showToast({
        type: 'error',
        title: 'Message failed',
        message: err?.response?.data?.message || 'Failed to send message.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <header className="px-5 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
        {ownerMeta.profilePhoto ? (
          <img
            src={ownerMeta.profilePhoto}
            alt={ownerMeta.name || 'Property Owner'}
            className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-linear-to-tr from-[#3b66ff] to-[#2346c7] p-0.5 shrink-0">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[#3b66ff] text-sm font-bold">
              {(ownerMeta.name || 'Property Owner').charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-[#1a222e] truncate">{ownerMeta.name || 'Property Owner'}</h3>
          <p className="text-xs text-slate-500 truncate">Ask questions about this property directly</p>
        </div>
      </header>

      <div ref={messagesContainerRef} className="h-90 overflow-y-auto p-5 space-y-3 bg-[radial-gradient(circle_at_top_left,#eef4ff_0%,#ffffff_50%)]">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-sm text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={30} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No messages yet. Start a conversation with the owner.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-linear-to-r from-[#3b66ff] to-[#2346c7] text-white rounded-br-md shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-[0_2px_8px_rgba(15,23,42,0.05)]'
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
                <p className={`mt-1 text-[11px] ${msg.sender === 'user' ? 'text-white/80' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-transparent px-2 py-1 text-sm outline-none"
            placeholder="Type your message..."
            disabled={loading || loadingHistory}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || loadingHistory || !newMessage.trim()}
            className="inline-flex items-center justify-center h-9 w-9 bg-[#3b66ff] text-white rounded-full hover:bg-[#2346c7] transition-colors disabled:opacity-60"
          >
            <Send size={15} />
          </button>
        </div>
        {loading && (
          <p className="text-[11px] text-slate-400 mt-1.5 px-2">Sending...</p>
        )}
      </footer>
    </section>
  );
};

export { BookingForm, ChatBox };
