import React from 'react';
import { Heart, History, MessageSquare, CalendarDays, ShieldAlert } from 'lucide-react';

const DashboardTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-sm p-3 mb-8 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setActiveTab('favorites')}
        className={`w-full sm:w-auto px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
          activeTab === 'favorites' ? 'bg-[#3b66ff] text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className="inline-flex w-full items-center justify-center gap-2"><Heart size={15} /> Favorites</span>
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('history')}
        className={`w-full sm:w-auto px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
          activeTab === 'history' ? 'bg-[#3b66ff] text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className="inline-flex w-full items-center justify-center gap-2"><History size={15} /> Viewing History</span>
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('inquiries')}
        className={`w-full sm:w-auto px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
          activeTab === 'inquiries' ? 'bg-[#3b66ff] text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className="inline-flex w-full items-center justify-center gap-2"><MessageSquare size={15} /> Inquiries & Messages</span>
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('bookings')}
        className={`w-full sm:w-auto px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
          activeTab === 'bookings' ? 'bg-[#3b66ff] text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className="inline-flex w-full items-center justify-center gap-2"><CalendarDays size={15} /> Booking Requests</span>
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('reports')}
        className={`w-full sm:w-auto px-4 py-2 rounded-sm text-sm font-bold transition-colors ${
          activeTab === 'reports' ? 'bg-[#3b66ff] text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <span className="inline-flex w-full items-center justify-center gap-2"><ShieldAlert size={15} /> Reports</span>
      </button>
    </div>
  );
};

export default DashboardTabs;
