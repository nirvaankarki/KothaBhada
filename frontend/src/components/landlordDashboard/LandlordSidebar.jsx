import React from 'react';
import {
  LayoutDashboard,
  Home,
  MessageSquare,
  CalendarDays,
  UserCircle2,
} from 'lucide-react';

const LandlordSidebar = ({ activeTab, setActiveTab, stats }) => {
  return (
    <aside className="hidden lg:flex w-64 bg-[#0f172a] text-white flex-col sticky top-0 h-screen overflow-hidden">
      <div className="p-8">
        <h1 className="text-2xl font-black text-white-500">Kotha<span className="text-blue-500">Bhada</span></h1>
        <p className="text-[11px] uppercase tracking-widest text-slate-400 mt-2">Landlord Panel</p>
      </div>

      <nav className="flex-1">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-sm font-medium">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
            activeTab === 'listings'
              ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <Home size={18} />
          <span className="text-sm font-medium">My Listings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
            activeTab === 'chat'
              ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <MessageSquare size={18} />
          <span className="text-sm font-medium">Chat</span>
          {stats.unreadInquiries > 0 && (
            <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-[11px] font-medium text-white inline-flex items-center justify-center">
              {stats.unreadInquiries}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
            activeTab === 'bookings'
              ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <CalendarDays size={18} />
          <span className="text-sm font-medium">Booking Requests</span>
          {stats.pendingBookings > 0 && (
            <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-[11px] font-medium text-white inline-flex items-center justify-center">
              {stats.pendingBookings}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${
            activeTab === 'profile'
              ? 'bg-blue-600/20 border-r-4 border-blue-500 text-white'
              : 'text-slate-300 hover:bg-slate-800/70'
          }`}
        >
          <UserCircle2 size={18} />
          <span className="text-sm font-medium">Owner Profile</span>
        </button>
      </nav>

      <div className="relative h-28 w-full overflow-hidden opacity-60">
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-600 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-blue-600 rounded-full blur-3xl" />
      </div>
    </aside>
  );
};

export default LandlordSidebar;
