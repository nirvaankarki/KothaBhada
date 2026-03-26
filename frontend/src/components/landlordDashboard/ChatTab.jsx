import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, MessageCircle, Search } from 'lucide-react';

const ChatTab = ({
  ownerChats,
  selectedOwnerChatId,
  chatDrafts,
  setChatDrafts,
  handleOpenOwnerChat,
  handleOwnerReply,
  sendingChatId,
  isChatUnread,
}) => {
  const [query, setQuery] = useState('');
  const messagesContainerRef = useRef(null);

  const selectedChat = ownerChats.find((chat) => chat._id === selectedOwnerChatId) || null;

  const getLastMessage = (chat) => {
    if (!Array.isArray(chat?.messages) || chat.messages.length === 0) {
      return 'No messages yet';
    }

    const latest = chat.messages[chat.messages.length - 1];
    const senderPrefix = latest?.senderType === 'owner' ? 'You: ' : '';
    return `${senderPrefix}${latest?.text || ''}`;
  };

  const formatTime = (isoDate) => {
    if (!isoDate) return '';
    try {
      return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDateLabel = (isoDate) => {
    if (!isoDate) return '';
    try {
      return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const filteredChats = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return ownerChats;

    return ownerChats.filter((chat) => {
      const renterName = String(chat.userId?.name || '').toLowerCase();
      const title = String(chat.title || '').toLowerCase();
      const location = String(chat.location || '').toLowerCase();
      return renterName.includes(normalizedQuery) || title.includes(normalizedQuery) || location.includes(normalizedQuery);
    });
  }, [ownerChats, query]);

  const lastMessageAt = selectedChat?.lastMessageAt || selectedChat?.messages?.[selectedChat.messages.length - 1]?.sentAt;

  const getInitial = (name) => String(name || '?').trim().charAt(0).toUpperCase() || '?';
  const getProfilePhoto = (chat) => String(chat?.userId?.profilePhoto || '').trim();

  useEffect(() => {
    if (!selectedChat) return;

    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [selectedOwnerChatId, selectedChat?.messages?.length]);

  return (
    <section className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm h-[calc(100vh-180px)] min-h-[620px] max-h-[820px]">
      <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} className="text-[#3b66ff]" />
          <h3 className="text-lg font-bold text-[#132238]">Chat Inbox</h3>
        </div>
        <p className="text-xs font-semibold text-slate-500">{ownerChats.length} conversation{ownerChats.length === 1 ? '' : 's'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] h-[calc(100%-65px)] min-h-0">
        <aside className="border-r border-slate-100 bg-slate-50/40 min-h-0 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {filteredChats.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No direct messages yet.</div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto">
              {filteredChats.map((chat) => {
                const isSelected = chat._id === selectedOwnerChatId;
                const unread = isChatUnread(chat);
                const latest = chat.messages?.[chat.messages.length - 1];

                return (
                  <button
                    key={chat._id}
                    type="button"
                    onClick={() => handleOpenOwnerChat(chat._id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors ${
                      isSelected ? 'bg-blue-50/60' : 'bg-transparent hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="h-11 w-11 rounded-full bg-linear-to-tr from-[#3b66ff] to-[#2346c7] p-0.5">
                          {getProfilePhoto(chat) ? (
                            <img
                              src={getProfilePhoto(chat)}
                              alt={chat.userId?.name || 'Renter'}
                              className="h-full w-full rounded-full object-cover bg-white"
                            />
                          ) : (
                            <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[13px] font-bold text-[#1a222e]">
                              {getInitial(chat.userId?.name)}
                            </div>
                          )}
                        </div>
                        {unread && <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-[#0095f6] border-2 border-white" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${unread ? 'font-bold text-[#0f172a]' : 'font-semibold text-slate-700'}`}>
                            {chat.userId?.name || 'Unknown renter'}
                          </p>
                          <span className="text-[11px] text-slate-400 shrink-0">{formatTime(latest?.sentAt)}</span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{chat.title || 'Property inquiry'}</p>
                        <p className={`mt-1 text-xs truncate ${unread ? 'font-bold text-slate-700' : 'text-slate-500'}`}>
                          {getLastMessage(chat)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="flex flex-col min-h-0">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-center p-8 text-slate-500">
              <div>
                <MessageCircle size={28} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Select a chat to start replying.</p>
              </div>
            </div>
          ) : (
            <>
              <header className="px-5 py-4 border-b border-slate-100 bg-white flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-linear-to-tr from-[#3b66ff] to-[#2346c7] p-0.5 shrink-0">
                  {getProfilePhoto(selectedChat) ? (
                    <img
                      src={getProfilePhoto(selectedChat)}
                      alt={selectedChat.userId?.name || 'Renter'}
                      className="h-full w-full rounded-full object-cover bg-white"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[13px] font-bold text-[#1a222e]">
                      {getInitial(selectedChat.userId?.name)}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-[#132238] truncate">{selectedChat.userId?.name || 'Unknown renter'}</h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{selectedChat.title || 'Property inquiry'} · {selectedChat.location || 'Location unavailable'}</p>
                </div>
                <span className="ml-auto text-[11px] text-slate-400">{formatDateLabel(lastMessageAt)}</span>
              </header>

              <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3 bg-[radial-gradient(circle_at_top_left,#eef4ff_0%,#ffffff_50%)]">
                {(selectedChat.messages || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No messages yet.</p>
                ) : (
                  (selectedChat.messages || []).map((msg, idx) => (
                    <div
                      key={`${selectedChat._id}-${idx}`}
                      className={`flex ${msg.senderType === 'owner' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          msg.senderType === 'owner'
                            ? 'bg-linear-to-r from-[#3b66ff] to-[#2346c7] text-white rounded-br-md shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-[0_2px_8px_rgba(15,23,42,0.05)]'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className={`mt-1 text-[11px] ${msg.senderType === 'owner' ? 'text-white/80' : 'text-slate-400'}`}>
                          {formatTime(msg.sentAt)}
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
                    value={chatDrafts[selectedChat._id] || ''}
                    onChange={(e) => setChatDrafts((prev) => ({ ...prev, [selectedChat._id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleOwnerReply(selectedChat._id);
                    }}
                    placeholder="Type your reply..."
                    className="flex-1 bg-transparent px-2 py-1 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleOwnerReply(selectedChat._id)}
                    disabled={sendingChatId === selectedChat._id}
                    className="inline-flex items-center justify-center h-9 w-9 bg-[#3b66ff] text-white rounded-full hover:bg-[#2346c7] disabled:opacity-60"
                  >
                    <Send size={15} />
                  </button>
                </div>
                {sendingChatId === selectedChat._id && (
                  <p className="text-[11px] text-slate-400 mt-1.5 px-2">Sending...</p>
                )}
              </footer>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ChatTab;
