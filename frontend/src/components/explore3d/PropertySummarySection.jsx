import React from 'react';
import {
  Bed,
  Bath,
  Square,
  MapPin,
  User,
  Phone,
  Mail,
  Info,
  Calendar,
  MessageCircle,
} from 'lucide-react';

const PropertySummarySection = ({
  listing,
  isDescriptionOpen,
  setIsDescriptionOpen,
  listingDescription,
  handleBookVisitClick,
  isBookedListing,
  openChatOverlay,
  unreadChatCount,
}) => {
  return (
    <section className="bg-white rounded-lg shadow overflow-hidden border border-slate-100">
      <div className="p-5 md:p-6">
        <h2 className="text-2xl font-black leading-tight text-slate-900">
          {listing.title || 'Listing Details'}
        </h2>

        <div className="mt-2 flex items-center gap-2 text-slate-500">
          <MapPin size={16} className="text-[#3A5AFF]" />
          <span className="text-sm font-semibold">{listing.location || 'Location not specified'}</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-slate-100 bg-gray-50 p-2 text-center">
            <Bed size={14} className="mx-auto text-[#3A5AFF]" />
            <p className="mt-1 text-[11px] font-semibold text-gray-700">{listing.bedrooms ?? 0} Beds</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-gray-50 p-2 text-center">
            <Bath size={14} className="mx-auto text-[#3A5AFF]" />
            <p className="mt-1 text-[11px] font-semibold text-gray-700">{listing.bathrooms ?? 0} Baths</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-gray-50 p-2 text-center">
            <Square size={14} className="mx-auto text-[#3A5AFF]" />
            <p className="mt-1 text-[11px] font-semibold text-gray-700">{listing.areaSqFt ?? 0} sqft</p>
          </div>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setIsDescriptionOpen((prev) => !prev)}
            className="group inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[#3A5AFF]"
          >
            <Info size={15} />
            <span className="group-hover:underline underline-offset-4">{isDescriptionOpen ? 'Hide Description' : 'Read Description'}</span>
          </button>

          {isDescriptionOpen && (
            <section className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
              {listingDescription ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{listingDescription}</p>
              ) : (
                <p className="text-sm text-slate-500">No description provided for this property.</p>
              )}
            </section>
          )}
        </div>

        <div className="my-5 border-t border-slate-200" />

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-[#3A5AFF]">Rs. {Number(listing.price || 0).toLocaleString()}</span>
          <span className="text-slate-400 font-semibold">/month</span>
        </div>

        <div className="mt-3 inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider">
          <Info size={13} /> Utilities Included
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleBookVisitClick}
            disabled={isBookedListing}
            className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              isBookedListing
                ? 'bg-red-100 text-red-700 border border-red-200 cursor-not-allowed'
                : 'bg-[#3A5AFF] hover:bg-[#2F49E6] text-white shadow-lg shadow-[#3A5AFF]/30 active:scale-[0.99]'
            }`}
          >
            <Calendar size={16} /> {isBookedListing ? 'Property Already Booked' : 'Schedule a Visit'}
          </button>
        </div>

        <section className="mt-6 border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-[#3A5AFF]" />
            <h3 className="text-base md:text-lg font-bold text-slate-800">Contact Owner</h3>
          </div>
          <div className="space-y-2.5 rounded-2xl p-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <User size={16} className="text-slate-400" /> {listing.ownerName || 'Property Owner'}
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <Phone size={16} className="text-slate-400" /> {listing.ownerPhone || 'Not provided'}
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <Mail size={16} className="text-slate-400" /> {listing.ownerEmail || 'Not provided'}
            </div>
          </div>

          <button
            type="button"
            onClick={openChatOverlay}
            className="mt-4 w-full relative inline-flex items-center justify-center gap-2 rounded-xl bg-[#3A5AFF] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#2F49E6]"
          >
            <MessageCircle size={16} /> Chat Now
            {unreadChatCount > 0 && (
              <span className="absolute right-3 inline-flex min-w-5 h-5 px-1.5 rounded-full bg-[#ef4444] text-white text-[10px] leading-5 font-bold items-center justify-center">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </button>
        </section>
      </div>
    </section>
  );
};

export default PropertySummarySection;
