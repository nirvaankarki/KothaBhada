import React from 'react';
import { X } from 'lucide-react';
import { ChatBox } from '../PropertyActions';

const ChatOverlay = ({ isOpen, onClose, listingKey, listing }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-[1px] flex items-start justify-end px-4 md:px-8 py-4 md:py-8"
      onClick={onClose}
    >
      <section
        className="w-full max-w-136 h-[min(88vh,760px)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-linear-to-r from-slate-50 to-[#3A5AFF]/10">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Owner Chat Assistant</h3>
            <p className="text-[11px] text-slate-500">Quick conversation about this listing.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close chat overlay"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/60 p-2.5">
          <ChatBox
            listingId={listingKey}
            ownerId={listing?.ownerId || listing?.owner}
            ownerName={listing?.ownerName}
            ownerProfilePhoto={listing?.ownerProfilePhoto}
            title={listing?.title}
            location={listing?.location}
            price={listing?.price}
            image={listing?.image}
            compact
          />
        </div>
      </section>
    </div>
  );
};

export default ChatOverlay;
