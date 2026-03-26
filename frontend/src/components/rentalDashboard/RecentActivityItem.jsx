import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

const RecentActivityItem = ({ title, category }) => {
  return (
    <button type="button" className="w-full flex items-center gap-4 group text-left">
      <span className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 group-hover:bg-gray-200 transition-colors">
        <ImageIcon size={20} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-gray-900">{title}</span>
        <span className="block text-xs text-gray-600">{category}</span>
      </span>
    </button>
  );
};

export default RecentActivityItem;
