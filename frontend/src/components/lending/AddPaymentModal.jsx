import React, { useState } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AddPaymentModal = ({ isOpen, onClose, transaction, onSubmit }) => {
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const remainingAmount = transaction.amount - (transaction.amount_paid || 0);
    if (parseFloat(formData.amount) > remainingAmount) {
      toast.error(`Amount cannot exceed remaining balance of ₹${remainingAmount}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(transaction.lending_id, formData);
      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: '',
        notes: ''
      });
      onClose();
    } catch (error) {
      console.error('Error adding payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (!isOpen || !transaction) return null;

  const remainingAmount = transaction.amount - (transaction.amount_paid || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 w-full max-w-md"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Add Payment</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Transaction Summary */}
          <div className="p-6 border-b border-slate-700 bg-slate-700/20">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Transaction with:</span>
                <span className="text-white font-medium">{transaction.person_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Amount:</span>
                <span className="text-white font-bold">{formatCurrency(transaction.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Already Paid:</span>
                <span className="text-green-400 font-medium">{formatCurrency(transaction.amount_paid || 0)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-600 pt-2">
                <span className="text-slate-400">Remaining:</span>
                <span className="text-orange-400 font-bold">{formatCurrency(remainingAmount)}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Payment Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center">
                <DollarSign className="mr-1" size={16} />
                Payment Amount *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-slate-400 text-sm">₹</span>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, amount: (remainingAmount / 2).toFixed(2) }))}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Half Amount
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, amount: remainingAmount.toFixed(2) }))}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  Full Amount
                </button>
              </div>
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center">
                <Calendar className="mr-1" size={16} />
                Payment Date
              </label>
              <input
                type="date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleInputChange}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center">
                <CreditCard className="mr-1" size={16} />
                Payment Method
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="">Select Method</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="check">Check</option>
                <option value="digital_wallet">Digital Wallet</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center">
                <FileText className="mr-1" size={16} />
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any notes about this payment..."
                rows="3"
                className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.amount}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding Payment...</span>
                  </>
                ) : (
                  <span>Add Payment</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddPaymentModal;