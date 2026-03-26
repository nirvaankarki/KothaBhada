import React from 'react';

const SidebarItem = ({ icon: Icon, label, active = false, dot = false }) => {
  return (
    <button
      type="button"
      className={`relative w-full flex items-center justify-between px-6 py-3 transition-all ${
        active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      <span className="flex items-center gap-3">
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 absolute left-3" />}
        <Icon size={20} />
        <span className="text-sm font-medium">{label}</span>
      </span>
    </button>
  );
};

export default SidebarItem;
