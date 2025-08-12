import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function EditExpenseModal({ isOpen, onClose, expense, onSave }) {
  const [formData, setFormData] = useState({ ...expense });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // When the expense prop changes, update the form data
    if (expense) {
      setFormData({ ...expense });
    }
  }, [expense]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // The onSave function (from ExpensesPage) is async and returns a promise
      await onSave(formData);
      toast.success("Expense updated successfully!");
      onClose(); // Close the modal on success
    } catch (error) {
      toast.error("Failed to update expense.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="p-8 bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-white">Edit Expense</h2>
        <form onSubmit={handleSubmit}>
          {/* Amount Field */}
          <div className="mb-4">
            <label htmlFor="amount" className="block text-slate-400 text-sm font-bold mb-2">Amount</label>
            <input type="number" step="0.01" id="amount" name="amount" value={formData.amount || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
          </div>
          {/* Category Field */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-slate-400 text-sm font-bold mb-2">Category</label>
            <input type="text" id="category" name="category" value={formData.category || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
          </div>
          {/* Vendor Field */}
          <div className="mb-6">
            <label htmlFor="vendor" className="block text-slate-400 text-sm font-bold mb-2">Vendor</label>
            <input type="text" id="vendor" name="vendor" value={formData.vendor || ''} onChange={handleChange} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg"/>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditExpenseModal;