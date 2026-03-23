import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

const DashboardHeader = () => {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 bg-[#1e293b]/50 p-4 rounded-2xl border border-slate-800/40">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Rental Dashboard</h1>
      </div>

      <div className="hidden md:block">
        <p className="text-xs text-slate-400 uppercase tracking-wider">Track your saved listings, inquiries and bookings</p>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="relative flex-1 sm:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Searching..."
            className="w-full sm:w-64 bg-[#0f172a] border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 ring-slate-700 outline-none"
          />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <button type="button" className="text-slate-400 hover:text-white transition-colors" aria-label="Notifications">
            <Bell size={20} />
          </button>
          <button type="button" className="text-slate-400 hover:text-white transition-colors" aria-label="Settings">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
