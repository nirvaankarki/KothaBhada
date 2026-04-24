import React from 'react';
import { CalendarDays } from 'lucide-react';

const BookingsSection = ({
  sourceListings,
  bookingForm,
  setBookingForm,
  bookings,
  handleListingSelectForBooking,
  handleCreateBooking,
  statusPill,
  formatStatusLabel,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 shadow-sm rounded-sm p-4">
        <h2 className="text-lg font-extrabold text-[#1a222e] mb-4">Request Property Booking</h2>

        <form onSubmit={handleCreateBooking} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Select Property</label>
            <select
              value={bookingForm.listingId}
              onChange={(event) => handleListingSelectForBooking(event.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            >
              <option value="">Choose property</option>
              {sourceListings.map((item) => (
                <option key={item.listingId} value={item.listingId}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Full Name"
              value={bookingForm.fullName}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, fullName: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={bookingForm.email}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, email: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Phone"
              value={bookingForm.phone}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="date"
              value={bookingForm.preferredVisitDate}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, preferredVisitDate: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            />
            <input
              type="time"
              value={bookingForm.preferredTime}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, preferredTime: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            />
            <input
              type="date"
              value={bookingForm.moveInDate}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, moveInDate: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="number"
              min="1"
              placeholder="Stay duration (months)"
              value={bookingForm.stayDurationMonths}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, stayDurationMonths: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Occupants"
              value={bookingForm.occupants}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, occupants: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Occupation"
              value={bookingForm.occupation}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, occupation: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              placeholder="Monthly income"
              value={bookingForm.monthlyIncome}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, monthlyIncome: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
            />
            <select
              value={bookingForm.hasPets}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, hasPets: event.target.value }))}
              className="border border-gray-200 rounded-sm px-3 py-2 text-sm"
              required
            >
              <option value="">Do you have pets?</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <textarea
            rows={3}
            placeholder="Reason for moving"
            value={bookingForm.reasonForMoving}
            onChange={(event) => setBookingForm((prev) => ({ ...prev, reasonForMoving: event.target.value }))}
            className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm"
            required
          />

          <textarea
            rows={3}
            placeholder="Additional note (optional)"
            value={bookingForm.note}
            onChange={(event) => setBookingForm((prev) => ({ ...prev, note: event.target.value }))}
            className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm"
          />

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-sm bg-[#3b66ff] text-white text-sm font-bold hover:bg-[#2f55d4]"
          >
            Submit Booking Request
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-[#1a222e] inline-flex items-center gap-2">
          <CalendarDays size={18} /> Submitted Booking Requests
        </h2>

        {bookings.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-sm p-8 text-center text-gray-500">
            No booking requests sent yet.
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking._id} className="bg-white border border-gray-100 shadow-sm rounded-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#1a222e]">{booking.title}</h3>
                  <p className="text-xs text-gray-500">{booking.location}</p>
                </div>
                <span className={`inline-flex w-fit text-[11px] px-2 py-1 rounded-full font-semibold ${statusPill(booking.status)}`}>
                  {formatStatusLabel(booking.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs text-gray-600">
                <div>Visit: {booking.preferredVisitDate ? new Date(booking.preferredVisitDate).toLocaleDateString() : 'N/A'}</div>
                <div>Move-in: {booking.moveInDate ? new Date(booking.moveInDate).toLocaleDateString() : 'N/A'}</div>
                <div>Occupants: {booking.occupants || 'N/A'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BookingsSection;
