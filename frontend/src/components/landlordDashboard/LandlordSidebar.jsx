import React from 'react';
import {
  LayoutDashboard,
  Home,
  MessageSquare,
  CalendarDays,
  ShieldAlert,
  UserCircle2,
} from 'lucide-react';

const primaryNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'listings', label: 'My Listings', icon: Home },
  { id: 'chat', label: 'Messages', icon: MessageSquare, badgeKey: 'unreadChats' },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays, badgeKey: 'pendingBookings' },
];

const utilityNavItems = [
  { id: 'reports', label: 'Reports', icon: ShieldAlert, badgeKey: 'openListingReports' },
  { id: 'profile', label: 'Profile', icon: UserCircle2 },
];

const LandlordSidebar = ({ activeTab, setActiveTab, stats }) => {
  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const badgeCount = Number(item.badgeKey ? stats?.[item.badgeKey] : 0);

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveTab(item.id)}
        className={`mx-3 flex w-[calc(100%-24px)] items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
          isActive
            ? 'bg-[#006aff] text-white shadow-[0_10px_24px_rgba(0,106,255,0.28)]'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon size={18} />
        <span className="text-sm font-semibold">{item.label}</span>
        {badgeCount > 0 ? (
          <span className={`ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
            isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
          }`}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col bg-[#111315] text-white sticky top-0 h-screen overflow-hidden">
      <div className="px-8 py-7">
        <h1 className="text-2xl font-black tracking-tight text-white">Kotha<span className="text-[#006aff]">Bhada</span></h1>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Landlord Panel</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pb-6">
        {primaryNavItems.map(renderNavItem)}

        <p className="px-8 pt-6 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
          Report
        </p>

        {utilityNavItems.map(renderNavItem)}
      </nav>

    </aside>
  );
};

export default LandlordSidebar;
