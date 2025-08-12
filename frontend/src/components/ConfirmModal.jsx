// src/components/ConfirmModal.jsx

import React from 'react';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) {
    return null;
  }

  return (
    // Modal background overlay
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Modal Card */}
      <div className="p-8 bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700">
        <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
        <p className="text-slate-300 mb-6">{message}</p>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose} // The cancel button just closes the modal
            className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm} // The confirm button runs the action
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;