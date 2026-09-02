import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
  details?: Array<{ label: string; value: string | number }>;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  type = 'primary',
  onConfirm,
  onCancel,
  details,
}) => {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30';
      default:
        return 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30';
    }
  };

  return (
    <div
      id="confirmation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        id="confirmation-modal-container"
        className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden text-white"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  type === 'danger'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {type === 'danger' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 id="modal-title" className="text-lg font-semibold text-white">
                  {title}
                </h3>
                <p id="modal-message" className="text-sm text-slate-300 mt-0.5">
                  {message}
                </p>
              </div>
            </div>
            <button
              id="modal-close-button"
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {details && details.length > 0 && (
            <div className="mt-4 p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
              {details.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              id="modal-cancel-btn"
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 rounded-xl transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              id="modal-confirm-btn"
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2 text-sm font-bold rounded-xl transition-colors cursor-pointer ${getButtonStyles()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
