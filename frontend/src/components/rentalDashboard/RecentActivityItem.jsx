import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

const RecentActivityItem = ({ title, category }) => {
  return (
    <button type="button" className="w-full flex items-center gap-4 group text-left">
      <span className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-700 transition-colors">
        <ImageIcon size={20} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="block text-xs text-slate-500">{category}</span>
      </span>
    </button>
  );
};

export default RecentActivityItem;
