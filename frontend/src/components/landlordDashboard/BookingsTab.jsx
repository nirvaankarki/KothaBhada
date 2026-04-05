import React from 'react';

const statusPillClass = (status) => {
  if (status === 'confirmed') return 'bg-emerald-100 text-emerald-700';
  if (status === 'declined') return 'bg-rose-100 text-rose-700';
  return 'bg-amber-100 text-amber-700';
};

const BookingsTab = ({
  ownerBookings,
  bookingResponseDrafts,
  setBookingResponseDrafts,
  handleOwnerBookingDecision,
  updatingBookingId,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold text-[#132238] mb-4">Booking Requests</h3>
        {ownerBookings.length === 0 ? (
          <p className="text-sm text-gray-500">No booking requests yet.</p>
        ) : (
          <div className="space-y-3">
            {ownerBookings.map((booking) => (
              <article key={booking._id} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#132238] line-clamp-1">{booking.title}</p>
                    <p className="text-xs text-gray-500 mt-1">Renter: {booking.userId?.name || 'Unknown'} ({booking.userId?.email || 'N/A'})</p>
                    <p className="text-xs text-gray-500">Visit: {new Date(booking.preferredVisitDate).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusPillClass(booking.status)}`}>
                    {booking.status || 'pending'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
                  <p><span className="font-semibold text-gray-700">Preferred time:</span> {booking.preferredTime || 'N/A'}</p>
                  <p><span className="font-semibold text-gray-700">Move-in date:</span> {booking.moveInDate ? new Date(booking.moveInDate).toLocaleDateString() : 'N/A'}</p>
                  <p><span className="font-semibold text-gray-700">Duration:</span> {booking.stayDurationMonths || 'N/A'} month(s)</p>
                  <p><span className="font-semibold text-gray-700">Occupants:</span> {booking.occupants || 'N/A'}</p>
                  <p><span className="font-semibold text-gray-700">Occupation:</span> {booking.occupation || 'N/A'}</p>
                  <p><span className="font-semibold text-gray-700">Income:</span> {booking.monthlyIncome || 'N/A'}</p>
                  <p><span className="font-semibold text-gray-700">Pets:</span> {booking.hasPets || 'N/A'}</p>
                  <p><span className="font-semibold text-gray-700">Phone:</span> {booking.phone || 'N/A'}</p>
                </div>

                <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Reason for moving</p>
                  <p className="mt-1 text-sm text-gray-700 leading-relaxed">{booking.reasonForMoving || 'N/A'}</p>
                </div>

                {booking.note ? (
                  <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Additional note</p>
                    <p className="mt-1 text-sm text-blue-800 leading-relaxed">{booking.note}</p>
                  </div>
                ) : null}

                {booking.status === 'pending' || !booking.status ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={bookingResponseDrafts[booking._id] || ''}
                      onChange={(e) => setBookingResponseDrafts((prev) => ({
                        ...prev,
                        [booking._id]: e.target.value,
                      }))}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
                      placeholder="Write a response for the renter (required if declining)"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleOwnerBookingDecision(booking._id, 'confirmed')}
                        disabled={updatingBookingId === booking._id}
                        className="kb-btn kb-btn-primary kb-btn-sm"
                      >
                        {updatingBookingId === booking._id ? 'Updating...' : 'Accept Request'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOwnerBookingDecision(booking._id, 'declined')}
                        disabled={updatingBookingId === booking._id}
                        className="kb-btn kb-btn-danger kb-btn-sm"
                      >
                        {updatingBookingId === booking._id ? 'Updating...' : 'Decline Request'}
                      </button>
                    </div>
                  </div>
                ) : booking.ownerResponse ? (
                  <p className="mt-3 text-xs text-gray-600"><span className="font-semibold">Owner response:</span> {booking.ownerResponse}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BookingsTab;
