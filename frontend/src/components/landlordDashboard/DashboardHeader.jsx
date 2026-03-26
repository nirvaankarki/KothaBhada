import React from 'react';
import { Bell, UserCircle2, ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardHeader = ({ profilePhoto, profileName }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const profileMenuRef = React.useRef(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setIsProfileMenuOpen(false);
    navigate('/', { state: { logoutSuccess: true } });
  };

  const handleLogoutRequest = () => {
    setIsProfileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
        <div>
          <h2 className="text-3xl font-black text-gray-800">Overview</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your profile and publish rental inventory from one place.</p>
        </div>
        <div className="flex items-center gap-5">
          <button type="button" className="relative p-2 text-gray-400 hover:text-gray-600">
            <Bell size={22} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              aria-label="Open landlord profile menu"
            >
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
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] p-3 z-20">
                <div className="rounded-xl bg-linear-to-r from-[#f3f7ff] to-[#eef4ff] border border-blue-100 px-3 py-3">
                  <div className="flex items-center gap-3">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt={profileName || 'Owner'} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm">
                        <UserCircle2 size={22} className="text-slate-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{profileName || user?.name || 'Owner'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || 'Email unavailable'}</p>
                    </div>
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                    </span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-3 py-2.5 bg-white">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Role</p>
                    <p className="text-sm font-semibold text-slate-700">Landlord</p>
                  </div>
                  <div className="px-3 py-2.5 border-t border-slate-100 bg-white">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Contact</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{user?.phone || 'Not set'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutRequest}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-semibold"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[1px] p-4">
          <div className="min-h-full flex items-center justify-center">
            <section className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
              <h3 className="text-lg font-bold text-[#132238]">Confirm Logout</h3>
              <p className="mt-2 text-sm text-gray-600">Are you sure you want to logout from your account?</p>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardHeader;
