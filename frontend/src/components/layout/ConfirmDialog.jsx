import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

let _resolve = null;

const ConfirmDialog = () => {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    window.__confirmDialogMount = (message, title) => {
      return new Promise((resolve) => {
        _resolve = resolve;
        setDialog({ message, title });
      });
    };
    return () => {
      delete window.__confirmDialogMount;
    };
  }, []);

  const handleResponse = (value) => {
    setDialog(null);
    if (_resolve) {
      _resolve(value);
      _resolve = null;
    }
  };

  if (!dialog) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        {dialog.title && (
          <h3 className="text-lg font-bold text-slate-800 mb-2">{dialog.title}</h3>
        )}
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{dialog.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => handleResponse(false)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleResponse(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Programmatic confirm dialog.
 * Usage: const confirmed = await customConfirm('Are you sure?', 'Delete Item');
 */
export const customConfirm = (message, title = '') => {
  if (window.__confirmDialogMount) {
    return window.__confirmDialogMount(message, title);
  }
  // Fallback to native confirm
  return Promise.resolve(window.confirm(message));
};

export default ConfirmDialog;
