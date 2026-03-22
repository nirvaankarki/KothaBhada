import React from 'react';

const BookingsTab = ({ ownerBookings }) => {
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
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${booking.status === 'pending' || !booking.status ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {booking.status || 'pending'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BookingsTab;
