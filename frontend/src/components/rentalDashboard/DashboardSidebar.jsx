import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  BarChart3,
  FileText,
  CreditCard,
  MessageSquare,
  X,
} from 'lucide-react';
import SidebarItem from './SidebarItem';

const DashboardSidebar = ({ userName = 'Yasmine', mobile = false, onClose }) => {
  return (
    <aside className="w-72 h-full bg-[#1e293b] border-r border-slate-800 flex flex-col relative">
      {mobile && (
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="p-8 flex flex-col items-center">
        <div className="w-20 h-20 bg-slate-300 rounded-full mb-4 overflow-hidden">
          <div className="w-full h-full bg-slate-400" />
        </div>
        <h2 className="text-sm font-semibold text-white">Hi, {userName}</h2>
      </div>

      <nav className="flex-1 pb-8 overflow-y-auto">
        <div className="mb-6">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active dot />
        </div>

        <div className="px-6 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Management</p>
        </div>
        <SidebarItem icon={Building2} label="Properties" />
        <SidebarItem icon={Users} label="Tenants" />
        <SidebarItem icon={CalendarDays} label="Bookings" />
        <SidebarItem icon={BarChart3} label="Statistics" />

        <div className="px-6 mt-10 mb-4 border-t border-slate-800 pt-8">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Finance</p>
        </div>
        <SidebarItem icon={FileText} label="Invoices" />
        <SidebarItem icon={CreditCard} label="Billing Information" />
        <SidebarItem icon={MessageSquare} label="Contact" />
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
