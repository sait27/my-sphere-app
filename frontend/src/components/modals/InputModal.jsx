// components/InputModal.jsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const InputModal = ({ isOpen, onClose, onSubmit, title, message, inputLabel, initialValue = '', ctaText = 'Submit' }) => {
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 m-4 w-full max-w-md animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {message && <p className="text-slate-300 mb-6">{message}</p>}
          <div className="mb-6">
            <label htmlFor="input-field" className="block text-sm font-medium text-slate-300 mb-2">
              {inputLabel}
            </label>
            <input
              id="input-field"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {ctaText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputModal;
