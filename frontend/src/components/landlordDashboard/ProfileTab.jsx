import React from 'react';
import { UserCircle2, Save, XCircle, Phone, ImagePlus, MapPin } from 'lucide-react';

const ProfileTab = ({
  profileForm,
  handleProfileChange,
  handleProfileSubmit,
  savingProfile,
  profileImageInputRef,
  handleProfileImageSelect,
  clearProfileImage,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle2 size={18} className="text-[#2563eb]" />
          <h3 className="text-lg font-bold text-[#132238]">Owner Profile</h3>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <label className="block cursor-pointer">
            <div className="h-24 w-24 mx-auto rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center hover:border-blue-300 transition-colors">
              {profileForm.profilePhoto ? (
                <img src={profileForm.profilePhoto} alt="Owner profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 size={40} className="text-gray-400" />
              )}
            </div>
            <p className="mt-2 text-[11px] text-center text-gray-500">Click photo to upload</p>
            <input
              ref={profileImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageSelect}
              className="hidden"
            />
          </label>

          {profileForm.profilePhoto && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={clearProfileImage}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
              >
                <XCircle size={13} /> Remove Photo
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={handleProfileChange('name')}
              placeholder="Your full name"
              className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Contact Number</label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={handleProfileChange('phone')}
              placeholder="e.g. +977-98XXXXXXXX"
              className="mt-1 w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#132238] text-white text-sm font-semibold hover:bg-[#0b1627] disabled:opacity-60"
          >
            <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      <section className="bg-white p-6 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-[#132238] mb-4">Profile Notes</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <Phone size={16} className="text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Contact Ready</p>
              <p className="text-xs text-gray-500">Keep owner number updated for renter calls.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <ImagePlus size={16} className="text-indigo-600" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Image Quality</p>
              <p className="text-xs text-gray-500">Listings with photos get better engagement.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <MapPin size={16} className="text-teal-600" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Location Detail</p>
              <p className="text-xs text-gray-500">Specific locality improves search visibility.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfileTab;
