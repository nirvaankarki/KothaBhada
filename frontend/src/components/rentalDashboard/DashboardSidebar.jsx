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
    <aside className="w-72 h-full bg-white border-r border-gray-200 flex flex-col relative">
      {mobile && (
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="p-8 flex flex-col items-center">
        <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 overflow-hidden">
          <div className="w-full h-full bg-gray-300" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">Hi, {userName}</h2>
      </div>

      <nav className="flex-1 pb-8 overflow-y-auto">
        <div className="mb-6">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active dot />
        </div>

        <div className="px-6 mb-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Management</p>
        </div>
        <SidebarItem icon={Building2} label="Properties" />
        <SidebarItem icon={Users} label="Tenants" />
        <SidebarItem icon={CalendarDays} label="Bookings" />
        <SidebarItem icon={BarChart3} label="Statistics" />

        <div className="px-6 mt-10 mb-4 border-t border-gray-200 pt-8">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Finance</p>
        </div>
        <SidebarItem icon={FileText} label="Invoices" />
        <SidebarItem icon={CreditCard} label="Billing Information" />
        <SidebarItem icon={MessageSquare} label="Contact" />
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
