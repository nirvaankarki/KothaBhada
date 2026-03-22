import React from 'react';
import { Bell, UserCircle2, ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardHeader = ({ profilePhoto, profileName }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/', { state: { logoutSuccess: true } });
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
      <div>
        <h2 className="text-3xl font-black text-gray-800">Overview</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your profile and publish rental inventory from one place.</p>
      </div>
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors text-sm font-semibold"
        >
          <LogOut size={16} />
          Logout
        </button>
        <button type="button" className="relative p-2 text-gray-400 hover:text-gray-600">
          <Bell size={22} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100">
          {profilePhoto ? (
            <img src={profilePhoto} alt={profileName || 'Owner'} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
              <UserCircle2 size={20} className="text-slate-500" />
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Landlord</p>
            <p className="text-sm font-bold text-gray-700 max-w-40 truncate">{profileName || 'Owner'}</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
