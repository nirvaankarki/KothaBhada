import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

const RecentActivityItem = ({ title, category }) => {
  return (
    <div className="w-full flex items-center gap-3.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
      <span className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-gray-600">
        <ImageIcon size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900 truncate">{title}</span>
        <span className="block text-xs text-gray-600 truncate">{category}</span>
      </span>
    </div>
  );
};

export default RecentActivityItem;
