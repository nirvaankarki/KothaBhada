import React from 'react';
import { ShieldAlert } from 'lucide-react';

const AuthRequiredModal = ({
  open,
  message = 'You need to log in or create an account to continue.',
  onCancel,
  onConfirm,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/45">
      <div className="w-full max-w-md bg-white rounded-sm shadow-2xl border border-gray-100 p-6 logout-success-toast">
        <div className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-red-50 text-red-600 mb-4">
          <ShieldAlert size={20} />
        </div>

        <h2 className="text-xl font-bold text-[#1f2937]">Login Required</h2>
        <p className="mt-2 text-sm text-gray-600 leading-6">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#1f2937] rounded-sm hover:bg-[#111827]"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
