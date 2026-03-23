import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { UserCircle2, Pencil, Check, X, Upload, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { isLandlordRole, resolveRole } from '../utils/roles';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, token, user, logout, updateUser } = useAuth();
  const activeRole = resolveRole(user?.role, token);
  const dashboardPath = isLandlordRole(activeRole) ? '/landlord/dashboard' : '/rental/dashboard';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingField, setEditingField] = useState('');
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [tempPhotoPreview, setTempPhotoPreview] = useState(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useAutoDismiss(saveError, () => setSaveError(''));

  useEffect(() => {
    setNameInput(user?.name || '');
    setPhoneInput(user?.phone || '');
    setEditingField('');
    setIsMenuOpen(false);
    setSaveError('');
    setIsEditingPhoto(false);
    setTempPhotoPreview(null);
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
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setEditingField('');
    setSaveError('');
    navigate('/', { state: { logoutSuccess: true } });
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
            <div className="absolute right-0 mt-3 w-80 rounded-md border border-gray-700 bg-[#111826] shadow-xl p-4 z-20">
              <p className="text-xs uppercase tracking-wider text-gray-400">Signed in as</p>
              <p className="text-sm font-semibold text-white truncate mb-4">{user?.email}</p>

              {/* Profile Photo Section */}
              <div className="rounded-md bg-[#1f2937] border border-gray-700 p-4 mb-3">
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
                          className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-60 text-xs font-bold text-white transition-colors"
                        >
                          <Check size={14} /> Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelPhotoEdit}
                          disabled={isSavingPhoto}
                          className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-60 text-xs font-bold text-white transition-colors"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                      {saveError && (
                        <p className="w-full text-xs text-red-400 bg-red-900/20 border border-red-700/50 rounded px-2 py-1.5 text-center">
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
                        <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                          <UserCircle2 size={40} className="text-gray-500" />
                        </div>
                      )}
                      <div className="flex gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSavingPhoto}
                          className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-md bg-[#3b82f6] hover:bg-blue-700 disabled:opacity-60 text-xs font-bold text-white transition-colors"
                        >
                          <Upload size={14} /> Upload
                        </button>
                        {user?.profilePhoto && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={isSavingPhoto}
                            className="flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-60 text-xs font-bold text-white transition-colors"
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
                <div className="rounded-md bg-[#1f2937] border border-gray-700 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-gray-400">Name</p>
                      {editingField === 'name' ? (
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => {
                            setNameInput(e.target.value);
                            setSaveError('');
                          }}
                          className="mt-1 w-full px-2 py-1.5 rounded-md bg-[#111826] border border-gray-600 text-sm text-white outline-none focus:border-[#3b82f6]"
                        />
                      ) : (
                        <p className="text-sm text-white truncate">{user?.name || 'Not set'}</p>
                      )}
                    </div>

                    {editingField === 'name' ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveField('name')}
                          disabled={isSaving}
                          className="text-green-300 hover:text-green-200 disabled:opacity-60"
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
                          className="text-gray-300 hover:text-white"
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
                        className="text-gray-300 hover:text-white"
                        aria-label="Edit name"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-md bg-[#1f2937] border border-gray-700 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-gray-400">Contact Number</p>
                      {editingField === 'phone' ? (
                        <input
                          type="text"
                          value={phoneInput}
                          onChange={(e) => {
                            setPhoneInput(e.target.value);
                            setSaveError('');
                          }}
                          className="mt-1 w-full px-2 py-1.5 rounded-md bg-[#111826] border border-gray-600 text-sm text-white outline-none focus:border-[#3b82f6]"
                          placeholder="e.g. +977-98XXXXXXXX"
                        />
                      ) : (
                        <p className="text-sm text-white truncate">{user?.phone || 'Not set'}</p>
                      )}
                    </div>

                    {editingField === 'phone' ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveField('phone')}
                          disabled={isSaving}
                          className="text-green-300 hover:text-green-200 disabled:opacity-60"
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
                          className="text-gray-300 hover:text-white"
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
                        className="text-gray-300 hover:text-white"
                        aria-label="Edit contact number"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-md bg-[#1f2937] border border-gray-700 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400">Email</p>
                  <p className="text-sm text-white truncate">{user?.email}</p>
                </div>
              </div>

              {saveError && <p className="mt-3 text-xs text-red-400">{saveError}</p>}

              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 w-full text-left text-sm font-medium text-red-300 hover:text-red-200"
              >
                Logout
              </button>
            </div>
          )}
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
    </nav>
  );
};

export default Navbar;