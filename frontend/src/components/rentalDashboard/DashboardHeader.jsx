import React from 'react';

const DashboardHeader = ({
}) => {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 bg-white p-4 rounded-2xl border border-gray-200">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Renter Dashboard</h1>
      </div>

      <div className="hidden md:block">
        <p className="text-xs text-gray-600 uppercase tracking-wider">Track your saved listings, inquiries and bookings</p>
      </div>

    </header>
  );
};

export default DashboardHeader;
