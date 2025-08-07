// src/components/EditExpenseModal.jsx

import { useState, useEffect } from 'react';

function EditExpenseModal({ isOpen, onClose, expense, onSave }) {
  const [formData, setFormData] = useState({ ...expense });

  // This useEffect ensures the form updates if a different expense is selected
  useEffect(() => {
    setFormData({ ...expense });
  }, [expense]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    // Modal background
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Modal Card */}
      <div className="p-8 bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-white">Edit Expense</h2>
        <form onSubmit={handleSubmit}>
          {/* Amount Field */}
          <div className="mb-4">
            <label htmlFor="amount" className="block text-slate-400 text-sm font-bold mb-2">Amount</label>
            <input
              type="number"
              step="0.01"
              id="amount"
              name="amount"
              value={formData.amount || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          {/* Category Field */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-slate-400 text-sm font-bold mb-2">Category</label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          {/* Vendor Field */}
          <div className="mb-6">
            <label htmlFor="vendor" className="block text-slate-400 text-sm font-bold mb-2">Vendor</label>
            <input
              type="text"
              id="vendor"
              name="vendor"
              value={formData.vendor || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditExpenseModal;