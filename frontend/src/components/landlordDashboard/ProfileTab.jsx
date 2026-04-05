import React, { useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  FileText,
  IdCard,
  ImagePlus,
  Info,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  User,
} from 'lucide-react';
import ConfirmModal from '../ConfirmModal';

const ProfileTab = ({
  profileForm,
  handleProfileChange,
  handleProfileSubmit,
  savingProfile,
  profileImageInputRef,
  profileKycDocumentInputRef,
  handleProfileImageSelect,
  clearProfileImage,
  handleLandlordKycDocumentSelect,
  clearLandlordKycDocument,
}) => {
  const [showSaveProfileConfirm, setShowSaveProfileConfirm] = useState(false);
  const [showRemoveProfilePhotoConfirm, setShowRemoveProfilePhotoConfirm] = useState(false);
  const [showRemoveKycDocumentConfirm, setShowRemoveKycDocumentConfirm] = useState(false);

  const kycStatus = String(profileForm.landlordKycStatus || 'not_submitted').toLowerCase();
  const isKycVerified = Boolean(profileForm.isLandlordVerified);

  const kycStatusClass =
    kycStatus === 'verified'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : kycStatus === 'rejected'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : kycStatus === 'pending'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-slate-200 bg-slate-50 text-slate-600';

  const kycStatusLabel = isKycVerified ? 'Verified' : kycStatus.replace('_', ' ');

  const triggerProfileImageSelect = () => {
    if (profileImageInputRef?.current) {
      profileImageInputRef.current.click();
    }
  };

  const triggerKycImageSelect = () => {
    if (profileKycDocumentInputRef?.current) {
      profileKycDocumentInputRef.current.click();
    }
  };

  const openSaveProfileConfirm = (event) => {
    event.preventDefault();
    if (savingProfile) return;
    setShowSaveProfileConfirm(true);
  };

  const closeSaveProfileConfirm = () => {
    if (savingProfile) return;
    setShowSaveProfileConfirm(false);
  };

  const confirmSaveProfile = async () => {
    await handleProfileSubmit();
    setShowSaveProfileConfirm(false);
  };

  const handleRemoveProfilePhotoRequest = () => {
    setShowRemoveProfilePhotoConfirm(true);
  };

  const handleConfirmRemoveProfilePhoto = () => {
    clearProfileImage();
    setShowRemoveProfilePhotoConfirm(false);
  };

  const handleRemoveKycDocumentRequest = () => {
    setShowRemoveKycDocumentConfirm(true);
  };

  const handleConfirmRemoveKycDocument = () => {
    clearLandlordKycDocument();
    setShowRemoveKycDocumentConfirm(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={openSaveProfileConfirm} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-5">
              <div className="text-[#3A5AFF]">
                <User size={18} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Account Settings</h3>
            </div>

            <div className="space-y-8 p-8">
              <div className="flex flex-col items-center gap-6 border-b border-slate-100 pb-8 sm:flex-row sm:items-start">
                <div className="relative">
                  <button
                    type="button"
                    onClick={triggerProfileImageSelect}
                    className="group relative h-32 w-32 overflow-hidden rounded-full bg-transparent outline-none focus:outline-none focus-visible:outline-none"
                    aria-label="Upload profile photo"
                  >
                    {profileForm.profilePhoto ? (
                      <img src={profileForm.profilePhoto} alt="Owner profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User size={46} className="text-slate-300" />
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-700/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <ImagePlus size={24} className="text-white" />
                    </div>
                  </button>
                </div>

                <div className="text-center sm:text-left">
                  <h4 className="font-bold text-slate-800">Profile Picture</h4>
                  <p className="mb-4 mt-1 text-xs text-slate-400">PNG, JPG or WEBP. Max 10MB.</p>

                  <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <button
                      type="button"
                      onClick={triggerProfileImageSelect}
                      className="kb-btn kb-btn-primary kb-btn-sm"
                    >
                      Upload New
                    </button>

                    {profileForm.profilePhoto ? (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePhotoRequest}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest text-rose-500 transition-colors hover:text-rose-600"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={handleProfileChange('name')}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Contact Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={handleProfileChange('phone')}
                    placeholder="e.g. +977-98XXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            <input
              ref={profileImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageSelect}
              className="hidden"
            />
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="text-emerald-600">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Identity Verification</h3>
              </div>

              <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${kycStatusClass}`}>
                {isKycVerified ? <CheckCircle2 size={14} /> : <FileText size={14} />}
                <span className="text-[10px] font-black uppercase tracking-widest">{kycStatusLabel}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-10 p-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Document Type</label>
                  <div className="relative">
                    <select
                      value={profileForm.landlordKycDocumentType || 'citizenship'}
                      onChange={handleProfileChange('landlordKycDocumentType')}
                      className="w-full appearance-none cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="citizenship">Citizenship</option>
                      <option value="license">Driver&apos;s License</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-slate-400" size={18} />
                  </div>
                </div>

                <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <Info size={20} className="mt-0.5 shrink-0 text-blue-500" />
                  <p className="text-xs font-medium leading-relaxed text-blue-700">
                    Please upload a clear document photo. Keep all corners visible and make sure text is readable.
                  </p>
                </div>

                {profileForm.landlordKycReviewNote ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">Admin Note</p>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-amber-800">{profileForm.landlordKycReviewNote}</p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Verification Document</label>

                <div
                  className="group relative aspect-16/10 cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50"
                  onClick={triggerKycImageSelect}
                >
                  {profileForm.landlordKycDocumentImage ? (
                    <img
                      src={profileForm.landlordKycDocumentImage}
                      className="h-full w-full object-cover opacity-75"
                      alt="KYC document preview"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                      <UploadCloud size={30} className="mb-2" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Upload Document</span>
                    </div>
                  )}

                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <UploadCloud size={30} className="mb-2" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Change File</span>
                  </div>
                </div>

                <input
                  ref={profileKycDocumentInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLandlordKycDocumentSelect}
                  className="hidden"
                />

                {profileForm.landlordKycDocumentImage ? (
                  <button
                    type="button"
                    onClick={handleRemoveKycDocumentRequest}
                    className="kb-btn kb-btn-soft-danger w-full"
                  >
                    <Trash2 size={14} /> Remove Document
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={triggerKycImageSelect}
                    className="kb-btn kb-btn-secondary w-full"
                  >
                    <UploadCloud size={14} /> Upload Document
                  </button>
                )}
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="kb-btn kb-btn-primary kb-btn-lg shadow-xl shadow-slate-200 active:scale-95"
            >
              <Save size={18} /> {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <h3 className="mb-2 px-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Profile Notes</h3>

          <div className="group flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md">
            <div className="h-fit rounded-xl bg-blue-50 p-3 text-blue-500 transition-transform group-hover:scale-110">
              <Phone size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Contact Ready</h4>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-400">Keep owner number updated for renter calls.</p>
            </div>
          </div>

          <div className="group flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md">
            <div className="h-fit rounded-xl bg-purple-50 p-3 text-purple-500 transition-transform group-hover:scale-110">
              <ImagePlus size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Image Quality</h4>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-400">Listings with photos get 3x better engagement.</p>
            </div>
          </div>

          <div className="group flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md">
            <div className="h-fit rounded-xl bg-indigo-50 p-3 text-indigo-500 transition-transform group-hover:scale-110">
              <MapPin size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Location Detail</h4>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-400">Specific locality improves your search visibility.</p>
            </div>
          </div>

          <div className="group flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md">
            <div className="h-fit rounded-xl bg-emerald-50 p-3 text-emerald-500 transition-transform group-hover:scale-110">
              {isKycVerified ? <BadgeCheck size={18} /> : <IdCard size={18} />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Trust Badge</h4>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-400">
                {isKycVerified
                  ? 'Your verified badge is active in Explore 3D.'
                  : 'Upload a valid ID so admin can verify your account.'}
              </p>
            </div>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-3xl bg-[#3A5AFF] p-6 text-white">
            <div className="relative z-10">
              <AlertCircle className="mb-4 opacity-60" />
              <h4 className="mb-1 font-bold">Need assistance?</h4>
              <p className="text-xs leading-relaxed opacity-85">Our support team is available 24/7 to help you manage your rental inventory.</p>
              <button
                type="button"
                className="mt-4 rounded-lg bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#3A5AFF]"
              >
                Get Help
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          </div>
        </aside>
      </form>

      <ConfirmModal
        open={showSaveProfileConfirm}
        title="Save profile changes"
        message="Are you sure you want to save these profile updates?"
        onCancel={closeSaveProfileConfirm}
        onConfirm={confirmSaveProfile}
        cancelLabel="Cancel"
        confirmLabel={savingProfile ? 'Saving...' : 'Save Profile'}
        isBusy={savingProfile}
      />

      <ConfirmModal
        open={showRemoveProfilePhotoConfirm}
        title="Remove profile photo"
        message="Are you sure you want to remove your profile photo?"
        onCancel={() => setShowRemoveProfilePhotoConfirm(false)}
        onConfirm={handleConfirmRemoveProfilePhoto}
        cancelLabel="Cancel"
        confirmLabel="Remove"
        confirmVariant="danger"
      />

      <ConfirmModal
        open={showRemoveKycDocumentConfirm}
        title="Remove KYC document"
        message="Are you sure you want to remove your uploaded KYC document?"
        onCancel={() => setShowRemoveKycDocumentConfirm(false)}
        onConfirm={handleConfirmRemoveKycDocument}
        cancelLabel="Cancel"
        confirmLabel="Remove"
        confirmVariant="danger"
      />
    </div>
  );
};

export default ProfileTab;
