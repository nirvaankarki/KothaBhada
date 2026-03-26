import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, MessageCircle, Send } from 'lucide-react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

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

const BookingForm = ({ listingId, ownerId, title, location, price, image, onBookingSuccess }) => {
  const [preferredVisitDate, setPreferredVisitDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!preferredVisitDate) {
      showToast({ type: 'warning', title: 'Missing date', message: 'Please select a date for your visit' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/user/bookings', {
        listingId,
        ownerId,
        title: title || 'Property',
        location: location || '',
        price: price || 0,
        image: image || '',
        preferredVisitDate: new Date(preferredVisitDate).toISOString(),
        preferredTime,
        note,
      });

      showToast({
        type: 'success',
        title: 'Request sent',
        message: 'Booking request sent successfully! The owner will contact you soon.',
      });

      if (onBookingSuccess) {
        onBookingSuccess(response.data.booking);
      }

      setPreferredVisitDate('');
      setPreferredTime('');
      setNote('');
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-3">
          <Calendar className="text-[#3b66ff]" size={24} />
        </div>
        <h3 className="text-xl font-bold text-[#1a222e]">Schedule a Visit</h3>
        <p className="text-sm text-gray-600 mt-1">Tell the owner when you'd like to visit this property</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="visitDate" className="block text-sm font-semibold text-gray-700 mb-2">
            Preferred Date *
          </label>
          <input
            type="date"
            id="visitDate"
            value={preferredVisitDate}
            onChange={(e) => setPreferredVisitDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            required
          />
        </div>

        <div>
          <label htmlFor="visitTime" className="block text-sm font-semibold text-gray-700 mb-2">
            Preferred Time
          </label>
          <select
            id="visitTime"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">Select a time</option>
            <option value="morning">Morning (9 AM - 12 PM)</option>
            <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
            <option value="evening">Evening (4 PM - 6 PM)</option>
          </select>
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-semibold text-gray-700 mb-2">
            Additional Note
          </label>
          <textarea
            id="note"
            rows="3"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
    </div>
  );
};

const ChatBox = ({ listingId, ownerId, title, location, price, image }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesContainerRef = useRef(null);
  const hasLoadedHistoryRef = useRef(false);
  const { showToast } = useToast();

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
  }, [listingId, showToast]);

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
        <div className="h-10 w-10 rounded-full bg-linear-to-tr from-[#3b66ff] to-[#2346c7] p-0.5 shrink-0">
          <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
            <MessageCircle className="text-[#3b66ff]" size={18} />
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-[#1a222e] truncate">Chat with Owner</h3>
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
