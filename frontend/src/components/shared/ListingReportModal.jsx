import React from 'react';

const reasonOptions = [
  { value: 'fake_listing', label: 'Fake Listing' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

const ListingReportModal = ({
  open,
  listingTitle,
  reasonCategory,
  description,
  onChangeReason,
  onChangeDescription,
  onCancel,
  onSubmit,
  isSubmitting = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[1px] p-4">
      <div className="min-h-full flex items-center justify-center">
        <section className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
          <h3 className="text-lg font-bold text-[#132238]">Report Property</h3>
          <p className="mt-2 text-sm text-gray-600">
            Report "{listingTitle || 'this listing'}" for review by landlord and admin.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Provide clear details so admin can act quickly and fairly.
          </p>

          <div className="mt-4 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Reason Category
              <select
                value={reasonCategory}
                onChange={(event) => onChangeReason(event.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3b66ff]/25"
              >
                {reasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Description
              <textarea
                rows={4}
                maxLength={1200}
                value={description}
                onChange={(event) => onChangeDescription(event.target.value)}
                placeholder="Please describe what looks fake, fraudulent, or suspicious."
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3b66ff]/25"
              />
            </label>
            <p className="text-[11px] text-slate-500 text-right">
              {String(description || '').length}/1200
            </p>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ListingReportModal;
