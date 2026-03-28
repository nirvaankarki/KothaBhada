import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Bed, Bath, Ruler, Phone, Mail, User } from 'lucide-react';
import { BookingForm } from '../components/PropertyActions';

const BookingVisitPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const listing = location.state?.listing;
  const listingStatus = String(listing?.status || '').toLowerCase();
  const isBookedListing = Boolean(
    listing?.isBooked ||
    listingStatus === 'booked' ||
    listingStatus === 'rented' ||
    listingStatus === 'occupied'
  );

  if (!listing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Listing Not Found</h2>
          <p className="text-gray-600 mb-6">The listing information is missing.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-[#3b66ff] text-white font-semibold rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const listingKey = listing.listingId || listing._id || listing.id;

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-20 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#3b66ff] font-semibold hover:text-blue-700 transition-colors"
          >
            <ArrowLeft size={20} /> Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-20 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h1 className="text-3xl font-black text-[#1a222e] mb-6">Book a Visit</h1>
              <BookingForm
                listingId={listingKey}
                ownerId={listing?.ownerId || listing?.owner}
                title={listing?.title}
                location={listing?.location}
                price={listing?.price}
                image={listing?.image}
                isBooked={isBookedListing}
                onBookingSuccess={() => {
                  navigate(-1, { state: { bookingSuccess: true } });
                }}
              />
            </div>
          </div>

          {/* Listing Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-24">
              {/* Listing Image */}
              <div className="h-48 overflow-hidden bg-gray-200">
                {listing.image && (
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Listing Info */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#1a222e] mb-2">{listing.title || 'Property'}</h2>

                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin size={16} className="text-[#ff5a3c]" />
                  <p className="text-sm font-medium">{listing.location || 'Location not specified'}</p>
                </div>

                {/* Specs */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <Bed size={16} className="text-[#3b66ff]" /> {listing.bedrooms || 1} Bedroom
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <Bath size={16} className="text-[#3b66ff]" /> {listing.bathrooms || 1} Bathroom
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <Ruler size={16} className="text-[#3b66ff]" /> {listing.areaSqFt || 'N/A'} sq.ft.
                  </div>
                </div>

                {/* Pricing */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-gray-600 text-xs font-semibold mb-2">MONTHLY PRICE</p>
                  <p className="text-[#3b66ff] text-2xl font-black">Rs. {Number(listing.price || 0).toLocaleString()}</p>
                </div>

                {/* Owner Info */}
                <div className="space-y-3">
                  <p className="text-gray-600 text-xs font-semibold uppercase mb-3">Contact Owner</p>
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                    <User size={14} className="text-gray-400" /> {listing.ownerName || 'Property Owner'}
                  </div>
                  {listing.ownerPhone && (
                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                      <Phone size={14} className="text-gray-400" /> {listing.ownerPhone}
                    </div>
                  )}
                  {listing.ownerEmail && (
                    <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                      <Mail size={14} className="text-gray-400" /> {listing.ownerEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingVisitPage;
