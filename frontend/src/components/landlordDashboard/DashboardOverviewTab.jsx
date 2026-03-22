import React from 'react';
import { Home, TrendingUp, Building2, PlusCircle } from 'lucide-react';

const DashboardOverviewTab = ({ stats, ownerBookings }) => {
  return (
    <>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-7">
        <article className="bg-white p-6 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Listings</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">{stats.totalListings}</h3>
            </div>
            <div className="p-2 rounded-lg bg-blue-100">
              <Home size={18} className="text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
            <TrendingUp size={14} />
            <span>{stats.activeListings}</span>
            <span className="text-gray-400 font-normal ml-1">Active now</span>
          </div>
        </article>

        <article className="bg-white p-6 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Average Rent</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">Rs {stats.avgPrice.toLocaleString()}</h3>
            </div>
            <div className="p-2 rounded-lg bg-cyan-100">
              <Building2 size={18} className="text-cyan-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-cyan-600 text-xs font-bold">
            <TrendingUp size={14} />
            <span>Live Market</span>
          </div>
        </article>

        <article className="bg-white p-6 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Portfolio Value</p>
              <h3 className="text-2xl font-black text-gray-800 mt-1">Rs {stats.totalValue.toLocaleString()}</h3>
            </div>
            <div className="p-2 rounded-lg bg-indigo-100">
              <PlusCircle size={18} className="text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-indigo-600 text-xs font-bold">
            <TrendingUp size={14} />
            <span>Total rent potential</span>
          </div>
        </article>
      </section>

      <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
        <h3 className="text-xl font-bold text-[#132238] mb-4">Landlord Activity Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Response Queue</p>
            <p className="text-3xl font-black text-[#1f2937]">{stats.unreadInquiries}</p>
            <p className="text-sm text-gray-500 mt-2">Open renter inquiries awaiting your reply.</p>
          </div>
          <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">Booking Interest</p>
            <p className="text-3xl font-black text-[#1f2937]">{ownerBookings.length}</p>
            <p className="text-sm text-gray-500 mt-2">Total booking requests received from renters.</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default DashboardOverviewTab;
