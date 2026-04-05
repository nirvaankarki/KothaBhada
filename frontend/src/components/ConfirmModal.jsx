import React from 'react';

const ConfirmModal = ({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  isBusy = false,
}) => {
  if (!open) return null;

  const confirmButtonClass =
    confirmVariant === 'danger'
      ? 'kb-btn kb-btn-danger'
      : 'kb-btn kb-btn-primary';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[1px] p-4">
      <div className="min-h-full flex items-center justify-center">
        <section className="w-full max-w-md bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
          <h3 className="text-lg font-bold text-[#132238]">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{message}</p>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isBusy}
              className="kb-btn kb-btn-secondary"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isBusy}
              className={confirmButtonClass}
            >
              {confirmLabel}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ConfirmModal;
