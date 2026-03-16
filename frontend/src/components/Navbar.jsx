import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { UserCircle2, Pencil, Check, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useAutoDismiss } from '../hooks/useAutoDismiss';

const Navbar = () => {
  const { isAuthenticated, user, logout, updateUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingField, setEditingField] = useState('');
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const menuRef = useRef(null);

  useAutoDismiss(saveError, () => setSaveError(''));

  useEffect(() => {
    setNameInput(user?.name || '');
    setPhoneInput(user?.phone || '');
  }, [user?.name, user?.phone]);

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
          to="/" 
          end
          className={({ isActive }) =>
            `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
          }
        >
          HOME
        </NavLink>
        <NavLink 
          to="/explore3d" 
          className={({ isActive }) =>
            `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
          }
        >
          EXPLORE 3D
        </NavLink>
        <NavLink 
          to="/about" 
          className={({ isActive }) =>
            `text-sm font-medium tracking-widest pb-1 ${isActive ? 'border-b-4 border-[#3b82f6]' : 'hover:text-gray-400 transition-colors'}`
          }
        >
          ABOUT
        </NavLink>
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
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Open profile menu"
          >
            <UserCircle2 size={23} className="text-white" />
            <span className="text-sm font-semibold text-white max-w-28 truncate">{user?.name || 'Profile'}</span>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-80 rounded-md border border-gray-700 bg-[#111826] shadow-xl p-4 z-20">
              <p className="text-xs uppercase tracking-wider text-gray-400">Signed in as</p>
              <p className="text-sm font-semibold text-white truncate mb-3">{user?.email}</p>

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

              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="mt-4 block text-sm font-medium text-blue-300 hover:text-blue-200"
              >
                Go to Dashboard
              </Link>

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