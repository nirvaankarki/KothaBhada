import React from 'react';
import {
  Building2,
  CalendarDays,
  Home,
  MessageSquare,
  PlusCircle,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';

const DashboardOverviewTab = ({ stats, ownerBookings }) => {
  const nowLabel = new Date().toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <section className="mb-7 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black tracking-tight text-[#132238]">Today&apos;s Statistics</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">{nowLabel}</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Live</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Pending Bookings</p>
              <CalendarDays size={15} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.pendingBookings}</p>
            <p className="mt-1 text-xs text-slate-500">Requests requiring your decision today.</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Unread Chats</p>
              <MessageSquare size={15} className="text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.unreadChats}</p>
            <p className="mt-1 text-xs text-slate-500">Conversations waiting for your reply.</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Open Reports</p>
              <ShieldAlert size={15} className="text-rose-600" />
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.openListingReports}</p>
            <p className="mt-1 text-xs text-slate-500">Listing issues that need response.</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Booking Interest</p>
              <TrendingUp size={15} className="text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-800">{ownerBookings.length}</p>
            <p className="mt-1 text-xs text-slate-500">Total booking requests received.</p>
          </article>
        </div>
      </section>

      <section className="mb-7 grid grid-cols-1 gap-5 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400">Total Listings</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-gray-800">{stats.totalListings}</h3>
            </div>
            <div className="rounded-lg bg-blue-100 p-2">
              <Home size={18} className="text-blue-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-green-600">
            <TrendingUp size={14} className="mr-1" />
            {stats.activeListings} active now
          </div>
          <p className="mt-2 text-[11px] font-medium text-gray-400">Compared to inactive listings in your portfolio.</p>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400">Average Rent</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-gray-800">Rs {stats.avgPrice.toLocaleString()}</h3>
            </div>
            <div className="rounded-lg bg-cyan-100 p-2">
              <Building2 size={18} className="text-cyan-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-cyan-700">
            <TrendingUp size={14} className="mr-1" />
            Live rental trend
          </div>
          <p className="mt-2 text-[11px] font-medium text-gray-400">Average asking price from all active and draft listings.</p>
        </article>

        <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-400">Portfolio Value</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-gray-800">Rs {stats.totalValue.toLocaleString()}</h3>
            </div>
            <div className="rounded-lg bg-indigo-100 p-2">
              <PlusCircle size={18} className="text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-indigo-700">
            <TrendingUp size={14} className="mr-1" />
            Total rent potential across inventory
          </div>
          <p className="mt-2 text-[11px] font-medium text-gray-400">Total monthly potential based on current listing price setup.</p>
        </article>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <h3 className="mb-4 text-xl font-bold text-[#132238]">Landlord Activity Analytics</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">Response Queue</p>
            <p className="text-3xl font-black text-[#1f2937]">{stats.unreadChats}</p>
            <p className="mt-2 text-sm text-gray-500">Unread renter chat messages awaiting your attention.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">Booking Interest</p>
            <p className="text-3xl font-black text-[#1f2937]">{ownerBookings.length}</p>
            <p className="mt-2 text-sm text-gray-500">Total booking requests received from renters.</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default DashboardOverviewTab;
