import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function EditExpenseModal({ isOpen, onClose, expense, onUpdate }) {
  const [formData, setFormData] = useState(expense || {});
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
      // The onUpdate function (from ExpensesPage) is async and returns a promise
      await onUpdate(formData);
      toast.success("Expense updated successfully!");
      onClose(); // Close the modal on success
    } catch (error) {
      toast.error("Failed to update expense.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="p-8 bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">Edit Expense</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
                <select
                  value={formData.payment_method || 'cash'}
                  onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="wallet">Digital Wallet</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Travel">Travel</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Expense Type</label>
                <select
                  value={formData.expense_type || 'personal'}
                  onChange={(e) => setFormData({...formData, expense_type: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="personal">Personal</option>
                  <option value="business">Business</option>
                  <option value="shared">Shared</option>
                  <option value="reimbursable">Reimbursable</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Vendor</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Store or vendor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                rows="2"
                placeholder="What did you buy?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Transaction Date</label>
                <input
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Where was this expense?"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tax Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_amount || '0'}
                  onChange={(e) => setFormData({...formData, tax_amount: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Discount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_amount || '0'}
                  onChange={(e) => setFormData({...formData, discount_amount: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tip (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tip_amount || '0'}
                  onChange={(e) => setFormData({...formData, tip_amount: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                rows="2"
                placeholder="Additional notes or comments"
              />
            </div>
          </div>
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