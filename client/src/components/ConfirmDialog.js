import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="animate-fade-in relative w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertTriangle size={20} />
        </div>
        <h2 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
        <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
