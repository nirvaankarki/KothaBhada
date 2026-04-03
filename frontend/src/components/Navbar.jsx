import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { UserCircle2, Pencil, Check, X, Upload, Trash2, Bell } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { getDashboardPathByRole, isLandlordRole, resolveRole } from '../utils/roles';
import { getNotificationTargetPath } from '../utils/notificationNavigation';
import ConfirmModal from './ConfirmModal';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, token, user, logout, updateUser } = useAuth();
  const activeRole = resolveRole(user?.role, token);
  const dashboardPath = getDashboardPathByRole(activeRole);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingField, setEditingField] = useState('');
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [tempPhotoPreview, setTempPhotoPreview] = useState(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showClearNotificationsConfirm, setShowClearNotificationsConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  useAutoDismiss(saveError, () => setSaveError(''));

  useEffect(() => {
    setNameInput(user?.name || '');
    setPhoneInput(user?.phone || '');
    setEditingField('');
    setIsMenuOpen(false);
    setSaveError('');
    setIsEditingPhoto(false);
    setTempPhotoPreview(null);
    setNotifications([]);
    setUnreadNotifications(0);
    setIsNotificationOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [user]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setEditingField('');
        setSaveError('');
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    let stopped = false;

    const pullNotifications = async () => {
      try {
        const response = await api.get('/user/notifications');
        if (stopped) return;

        setNotifications(response.data?.notifications || []);
        setUnreadNotifications(response.data?.unreadCount || 0);
      } catch {
        // Silent polling fail in navbar.
      }
    };

    pullNotifications();
    const intervalId = setInterval(pullNotifications, 15000);

    return () => {
      stopped = true;
      clearInterval(intervalId);
    };
  }, [isAuthenticated, authLoading]);

  const handleMarkNotificationRead = async (notificationId) => {
    if (!notificationId) return;

    setNotifications((prev) => prev.map((item) => (
      item._id === notificationId ? { ...item, isRead: true } : item
    )));
    setUnreadNotifications((prev) => Math.max(0, prev - 1));

    try {
      await api.post(`/user/notifications/${notificationId}/read`);
    } catch {
      // ignore
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadNotifications(0);

    try {
      await api.post('/user/notifications/read-all');
    } catch {
      // ignore
    }
  };

  const handleClearAllNotifications = async () => {
    if (!notifications.length) return;

    const previousNotifications = notifications;
    const previousUnreadCount = unreadNotifications;

    setNotifications([]);
    setUnreadNotifications(0);

    try {
      await api.delete('/user/notifications');
    } catch {
      setNotifications(previousNotifications);
      setUnreadNotifications(previousUnreadCount);
    }
  };

  const handleClearNotificationsRequest = () => {
    setShowClearNotificationsConfirm(true);
  };

  const handleConfirmClearNotifications = async () => {
    await handleClearAllNotifications();
    setShowClearNotificationsConfirm(false);
    setIsNotificationOpen(false);
  };

  const handleNotificationNavigate = (notification) => {
    navigate(getNotificationTargetPath({ notification, isLandlord: isLandlordRole(activeRole) }));
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setEditingField('');
    setSaveError('');
    setShowLogoutConfirm(false);
    navigate('/', { state: { logoutSuccess: true } });
  };

  const handleLogoutRequest = () => {
    setIsMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleSaveField = async (field) => {
    const payload = {};
    if (field === 'name') {
      const trimmedName = nameInput.trim();
      if (!trimmedName) {
        setSaveError('Name cannot be empty');
        return;
      }
      payload.name = trimmedName;
    }

    if (field === 'phone') {
      payload.phone = phoneInput.trim();
    }

    setIsSaving(true);
    setSaveError('');
    try {
      const response = await api.put('/auth/me', payload);
      updateUser(response.data?.user || user);
      setEditingField('');
    } catch (error) {
      setSaveError(error?.response?.data?.message || 'Could not update profile field');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveError('Please select an image file');
      return;
    }

    // Validate file size (5MB max before compression)
    if (file.size > 5242880) {
      setSaveError('Photo size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result;
      img.onload = () => {
        // Compress image using canvas
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with quality compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setTempPhotoPreview(compressedBase64);
        setIsEditingPhoto(true);
        setSaveError('');
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!tempPhotoPreview) return;

    setIsSavingPhoto(true);
    setSaveError('');
    try {
      const response = await api.put('/auth/me', {
        profilePhoto: tempPhotoPreview
      });
      updateUser(response.data?.user || user);
      setIsEditingPhoto(false);
      setTempPhotoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setSaveError(error?.response?.data?.message || 'Could not upload photo');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsSavingPhoto(true);
    try {
      const response = await api.put('/auth/me', {
        profilePhoto: null
      });
      updateUser(response.data?.user || user);
      setIsEditingPhoto(false);
      setTempPhotoPreview(null);
      setSaveError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setSaveError(error?.response?.data?.message || 'Could not remove photo');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleCancelPhotoEdit = () => {
    setIsEditingPhoto(false);
    setTempPhotoPreview(null);
    setSaveError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <nav className="bg-[#1a222e] text-white px-10 py-6 flex items-center justify-between font-sans">
      {/* Logo Section */}
      <Link to="/" className="text-2xl font-bold tracking-tight">
        <span>Kotha</span>
        <span className="text-[#3b82f6]">Bhada</span>
      </Link>

      {/* Navigation Links */}
      <div className="flex space-x-12 items-center">
        <NavLink 
          to="/about" 
          className={({ isActive }) =>
            `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
          }
        >
          ABOUT
        </NavLink>
        <NavLink
          to="/viewlisting"
          className={({ isActive }) =>
            `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
          }
        >
          VIEW LISTING
        </NavLink>
        {isAuthenticated && (
          <NavLink
            to={dashboardPath}
            className={({ isActive }) =>
              `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
            }
          >
            DASHBOARD
          </NavLink>
        )}
        <NavLink 
          to="/contact" 
          className={({ isActive }) =>
            `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
          }
        >
          CONTACT
        </NavLink>
      </div>

      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Open notifications"
            >
              <Bell size={20} className="text-white" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1.5 bg-red-500 text-white text-[10px] rounded-full border-2 border-white inline-flex items-center justify-center">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-3 w-96 max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] p-3 z-20">
                <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800">Notifications</h4>
                  <div className="flex items-center gap-3">
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearNotificationsRequest}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Clear all
                      </button>
                    )}
                    {unreadNotifications > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsRead}
                        className="text-xs font-semibold text-[#3b82f6] hover:text-blue-700"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 max-h-80 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-500 px-2 py-6 text-center">No notifications yet.</p>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          if (!item.isRead) {
                            handleMarkNotificationRead(item._id);
                          }
                          handleNotificationNavigate(item);
                          setIsNotificationOpen(false);
                        }}
                        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                          item.isRead ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/60'
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{item.message}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef} key={user?.id || user?.email || 'anon'}>
            {authLoading ? (
              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/10">
                <div className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span className="text-sm font-semibold text-white/80">Loading...</span>
              </div>
            ) : (
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Open profile menu"
            >
              {user?.profilePhoto ? (
                <img 
                  src={user.profilePhoto} 
                  alt={user?.name} 
                  className="w-6 h-6 rounded-full object-cover border border-white/20"
                />
              ) : (
                <UserCircle2 size={23} className="text-white" />
              )}
              <span className="text-sm font-semibold text-white max-w-28 truncate">{user?.name || 'Profile'}</span>
            </button>
            )}

            {isMenuOpen && !authLoading && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] p-3 z-20">
                <div className="rounded-xl bg-linear-to-r from-[#f3f7ff] to-[#eef4ff] border border-blue-100 px-3 py-3 mb-3">
                  <div className="flex items-center gap-3">
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user?.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm">
                        <UserCircle2 size={22} className="text-slate-500" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'Profile'}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || 'Email unavailable'}</p>
                    </div>
                  </div>
                </div>

                {/* Profile Photo Section */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-3">
                  <div className="flex flex-col items-center justify-center gap-3">
                    {isEditingPhoto ? (
                      <>
                        <img 
                          src={tempPhotoPreview} 
                          alt="Preview" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-[#3b82f6]"
                        />
                        <p className="text-xs text-gray-400">Photo preview</p>
                        <div className="flex gap-2 w-full">
                          <button
                            type="button"
                            onClick={handleSavePhoto}
                            disabled={isSavingPhoto}
                            className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-xs font-bold text-white transition-colors"
                          >
                            <Check size={14} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelPhotoEdit}
                            disabled={isSavingPhoto}
                            className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 disabled:opacity-60 text-xs font-bold text-white transition-colors"
                          >
                            <X size={14} /> Cancel
                          </button>
                        </div>
                        {saveError && (
                          <p className="w-full text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 text-center">
                            {saveError}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        {user?.profilePhoto ? (
                          <img 
                            src={user.profilePhoto} 
                            alt={user?.name} 
                            className="w-20 h-20 rounded-full object-cover border-2 border-[#3b82f6]"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300">
                            <UserCircle2 size={40} className="text-slate-500" />
                          </div>
                        )}
                        <div className="flex gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSavingPhoto}
                            className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-blue-700 disabled:opacity-60 text-xs font-bold text-white transition-colors"
                          >
                            <Upload size={14} /> Upload
                          </button>
                          {user?.profilePhoto && (
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              disabled={isSavingPhoto}
                              className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-xs font-bold text-white transition-colors"
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileSelect}
                          className="hidden"
                          aria-label="Upload profile photo"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-slate-400">Name</p>
                        {editingField === 'name' ? (
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => {
                              setNameInput(e.target.value);
                              setSaveError('');
                            }}
                            className="mt-1 w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-700 outline-none focus:border-[#3b82f6]"
                          />
                        ) : (
                          <p className="text-sm text-slate-800 truncate">{user?.name || 'Not set'}</p>
                        )}
                      </div>

                      {editingField === 'name' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveField('name')}
                            disabled={isSaving}
                            className="text-green-600 hover:text-green-500 disabled:opacity-60"
                            aria-label="Save name"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingField('');
                              setNameInput(user?.name || '');
                              setSaveError('');
                            }}
                            className="text-slate-400 hover:text-slate-700"
                            aria-label="Cancel editing name"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingField('name');
                            setSaveError('');
                          }}
                          className="text-slate-400 hover:text-slate-700"
                          aria-label="Edit name"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-slate-400">Contact Number</p>
                        {editingField === 'phone' ? (
                          <input
                            type="text"
                            value={phoneInput}
                            onChange={(e) => {
                              setPhoneInput(e.target.value);
                              setSaveError('');
                            }}
                            className="mt-1 w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-700 outline-none focus:border-[#3b82f6]"
                            placeholder="e.g. +977-98XXXXXXXX"
                          />
                        ) : (
                          <p className="text-sm text-slate-800 truncate">{user?.phone || 'Not set'}</p>
                        )}
                      </div>

                      {editingField === 'phone' ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveField('phone')}
                            disabled={isSaving}
                            className="text-green-600 hover:text-green-500 disabled:opacity-60"
                            aria-label="Save contact number"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingField('');
                              setPhoneInput(user?.phone || '');
                              setSaveError('');
                            }}
                            className="text-slate-400 hover:text-slate-700"
                            aria-label="Cancel editing contact number"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingField('phone');
                            setSaveError('');
                          }}
                          className="text-slate-400 hover:text-slate-700"
                          aria-label="Edit contact number"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400">Email</p>
                    <p className="text-sm text-slate-800 truncate">{user?.email}</p>
                  </div>
                </div>

                {saveError && <p className="mt-3 text-xs text-red-600">{saveError}</p>}

                <button
                  type="button"
                  onClick={handleLogoutRequest}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-semibold"
                >
                  <Trash2 size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <Link
            to="/signup"
            className="text-base font-semibold hover:text-gray-400 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      )}

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

      <ConfirmModal
        open={showClearNotificationsConfirm}
        title="Clear all notifications"
        message="This will permanently remove all notifications. This action cannot be undone."
        onCancel={() => setShowClearNotificationsConfirm(false)}
        onConfirm={handleConfirmClearNotifications}
        cancelLabel="Cancel"
        confirmLabel="Clear all"
        confirmVariant="danger"
      />
    </nav>
  );
};

export default Navbar;