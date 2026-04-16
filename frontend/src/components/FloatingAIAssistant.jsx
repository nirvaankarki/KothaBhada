import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Send, Sparkles, X, MapPin, ArrowUpRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

function formatTimestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatTimestampFromValue(value) {
  if (!value) return formatTimestamp();

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return formatTimestamp();
  }

  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getInitialMessages() {
  return [
    {
      id: 'assistant-welcome',
      sender: 'assistant',
      text: 'Hi, I am your AI rental assistant. Tell me your budget, location, bedrooms, or 360-tour preference and I will recommend properties.',
      timestamp: formatTimestamp(),
      recommendations: [],
    },
  ];
}

function sanitizeRecommendationList(items) {
  if (!Array.isArray(items)) return [];

  return items.slice(0, 5).map((item, index) => ({
    rank: Number(item?.rank || index + 1),
    listingId: String(item?.listingId || '').trim(),
    title: String(item?.title || 'Listing').trim(),
    location: String(item?.location || 'Location not specified').trim(),
    price: Number(item?.price || 0),
    reason: String(item?.reason || '').trim(),
  }));
}

function sanitizeStoredMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return getInitialMessages();

  const cleaned = rawMessages
    .map((message, index) => {
      if (!message || typeof message !== 'object') return null;

      return {
        id: String(message.id || `message-${index}-${Date.now()}`),
        sender: message.sender === 'user' ? 'user' : 'assistant',
        text: String(message.text || '').trim(),
        timestamp: String(message.timestamp || formatTimestampFromValue(message.sentAt)).trim(),
        recommendations: sanitizeRecommendationList(message.recommendations),
      };
    })
    .filter((message) => message && message.text);

  return cleaned.length ? cleaned : getInitialMessages();
}

const FloatingAIAssistant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGreetingBubble, setShowGreetingBubble] = useState(true);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(getInitialMessages);
  const containerRef = useRef(null);
  const historyRequestRef = useRef(0);
  const isLandlordDashboardPage = location.pathname.startsWith('/landlord/dashboard');
  const isAdminDashboardPage = location.pathname.startsWith('/admin/dashboard');

  const currentListingId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return String(params.get('id') || '').trim();
  }, [location.search]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMessages(getInitialMessages());
      return;
    }

    let cancelled = false;
    const requestId = ++historyRequestRef.current;

    const loadHistory = async () => {
      try {
        const response = await api.get('/user/ai/history');
        if (cancelled || requestId !== historyRequestRef.current) return;

        setMessages(sanitizeStoredMessages(response.data?.messages));
      } catch {
        if (cancelled || requestId !== historyRequestRef.current) return;
        setMessages(getInitialMessages());
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?._id, user?.id, user?.email]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: formatTimestamp(),
      recommendations: [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setLoading(true);

    try {
      const endpoint = isAuthenticated ? '/user/ai/recommendations' : '/rooms/ai/recommendations';
      const response = await api.post(endpoint, {
        message: text,
        listingId: currentListingId,
        limit: 3,
      });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: String(response.data?.reply || 'I could not generate recommendations right now.').trim(),
        timestamp: formatTimestamp(),
        recommendations: sanitizeRecommendationList(response.data?.recommendations),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          sender: 'assistant',
          text: error?.response?.data?.message || 'AI assistant is unavailable right now. Please try again in a moment.',
          timestamp: formatTimestamp(),
          recommendations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (isLandlordDashboardPage || isAdminDashboardPage) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-70 md:bottom-6 md:right-6">
      {isOpen ? (
        <section
          className={`rounded-3xl border border-slate-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] overflow-hidden flex flex-col transition-all duration-300 ${
            isExpanded ? 'w-[min(92vw,430px)] h-[min(82vh,680px)]' : 'w-[min(92vw,380px)] h-[min(74vh,560px)]'
          }`}
        >
          <header className="relative border-b border-[#111827] bg-[#1F2937] px-4 py-3 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 shadow-[0_8px_16px_rgba(15,23,42,0.45)]">
                  <Bot size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">KothaBhada Chatbot</h3>
                  <div className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-slate-200">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500">
                      <span className="absolute inset-0 rounded-full bg-emerald-500/60 animate-ping" />
                    </span>
                    Online now
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  aria-label={isExpanded ? 'Collapse assistant' : 'Expand assistant'}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <ArrowUpRight size={16} className={isExpanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  aria-label="Close assistant"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </header>

          <div ref={containerRef} className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,#eef3ff_0%,#ffffff_52%)] px-4 py-4 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    message.sender === 'user'
                      ? 'bg-linear-to-r from-[#3b66ff] to-[#2346c7] text-white rounded-br-md shadow-sm'
                      : 'bg-[#f7f9ff] border border-[#dbe4ff] text-slate-700 rounded-bl-md shadow-[0_2px_10px_rgba(15,23,42,0.08)]'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">{message.text}</p>

                  {message.sender === 'assistant' && message.recommendations.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {message.recommendations.map((recommendation, index) => (
                        <article key={`${message.id}-rec-${recommendation.listingId || index}`} className="rounded-xl border border-[#dbe4ff] bg-white p-2.5 shadow-[0_4px_10px_rgba(58,90,255,0.08)]">
                          <p className="text-xs font-bold text-[#1f2a44]">
                            {index + 1}. {recommendation.title}
                          </p>
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin size={11} /> {recommendation.location}
                          </p>
                          <p className="mt-0.5 text-[11px] font-semibold text-[#1d4ed8]">
                            Rs {Number(recommendation.price || 0).toLocaleString()} / month
                          </p>
                          <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{recommendation.reason || 'Strong match for your preferences.'}</p>

                          {recommendation.listingId && (
                            <button
                              type="button"
                              onClick={() => {
                                navigate(`/listing-details?id=${recommendation.listingId}`);
                                setIsOpen(false);
                              }}
                              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-[#3A5AFF]/20 bg-[#3A5AFF]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#3A5AFF] hover:bg-[#3A5AFF]/20"
                            >
                              Open Listing <ArrowUpRight size={12} />
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  )}

                  <p className={`mt-1 text-[11px] ${message.sender === 'user' ? 'text-white/80' : 'text-slate-400'}`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-[#dbe4ff] bg-[#f7f9ff] px-3 py-2 text-xs text-slate-600 shadow-sm">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-[#3A5AFF] animate-spin" />
                  Finding recommendations...
                </div>
              </div>
            )}
          </div>

          <footer className="border-t border-slate-200 bg-white/95 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-2 focus-within:border-[#3A5AFF]/45 focus-within:ring-3 focus-within:ring-[#3A5AFF]/10">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    sendMessage();
                  }
                }}
                placeholder="Ask about rent, location, budget, or availability..."
                className="flex-1 bg-transparent px-1.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                disabled={loading}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || !draft.trim()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-[#3A5AFF] to-[#2746e8] text-white shadow-[0_8px_18px_rgba(58,90,255,0.35)] transition-all hover:brightness-105 disabled:opacity-60"
              >
                {loading ? <Sparkles size={15} /> : <Send size={15} />}
              </button>
            </div>
          </footer>
        </section>
      ) : (
        <div className="group relative">
          {showGreetingBubble && (
            <div className="absolute bottom-full right-0 mb-3 w-fit max-w-[92vw] rounded-2xl border border-[#3A5AFF]/20 bg-white px-3.5 py-2.5 shadow-[0_18px_46px_rgba(15,23,42,0.2)]">
              <button
                type="button"
                onClick={() => setShowGreetingBubble(false)}
                aria-label="Dismiss chatbot greeting"
                className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 hover:text-slate-700"
              >
                <X size={13} />
              </button>
              <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-r border-b border-[#3A5AFF]/20 bg-white" />
              <div className="flex items-center gap-2.5 font-sans">
                <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#dbe4ff] bg-[#f6f9ff] text-[#3154cf] shadow-[0_6px_14px_rgba(58,90,255,0.12)]" aria-hidden="true">
                  <Sparkles size={15} strokeWidth={2.2} fill="currentColor" fillOpacity={0.18} className="drop-shadow-[0_1px_2px_rgba(49,84,207,0.2)]" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-semibold leading-tight text-slate-800 whitespace-nowrap">Namaste, I&apos;m KothaBhada Chatbot</p>
                  <p className="mt-0.5 text-[11px] sm:text-xs font-medium leading-tight text-slate-600">How can I assist you today?</p>
                </div>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 rounded-full bg-[#3A5AFF] opacity-40 blur-xl transition-opacity duration-500 group-hover:opacity-60 animate-pulse" />
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[#7A90FF] opacity-20 animate-ping" />

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open KothaBhada Chatbot"
            className="relative inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-linear-to-tr from-[#3A5AFF] to-[#7A90FF] text-white shadow-[0_10px_30px_rgba(59,90,255,0.4)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 active:scale-90 focus-visible:outline-none"
          >
            <Sparkles
              size={28}
              fill="currentColor"
              fillOpacity={0.2}
              className="text-white drop-shadow-md transition-transform duration-500 group-hover:rotate-12"
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingAIAssistant;
