// src/components/ConfirmModal.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-500/20' : type === 'warning' ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                  <AlertTriangle size={20} className={`${type === 'danger' ? 'text-red-400' : type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`} />
                </div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-slate-300 leading-relaxed">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 bg-slate-900/50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors font-medium"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${getButtonStyles()}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmModal;