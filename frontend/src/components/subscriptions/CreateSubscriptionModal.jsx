import React, { useState, useEffect } from 'react';
import { X, Plus, Wand2, Edit3 } from 'lucide-react';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import SmartSubscriptionInput from './SmartSubscriptionInput';
import apiClient from '../../api/axiosConfig';
import { toast } from 'react-hot-toast';

const CreateSubscriptionModal = ({ onClose, onSuccess }) => {
  const { createSubscription, loading } = useSubscriptions();
  const [mode, setMode] = useState('manual'); // 'manual' or 'ai'
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    amount: '',
    billing_cycle: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    next_billing_date: '',
    payment_method: 'card',
    description: '',
    category: '',
  });
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/subscriptions/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSubscription(formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) {
      toast.error('Please enter subscription details');
      return;
    }

    setAiLoading(true);
    try {
      // Parse with AI
      const parseResponse = await apiClient.post('/subscriptions/subscriptions/parse_nlp/', {
        query: aiInput
      });

      console.log('Parse response:', parseResponse.data);

      if (parseResponse.data.success && parseResponse.data.parsed_data) {
        const parsedData = parseResponse.data.parsed_data;
        
        // Validate required fields
        const requiredFields = ['name', 'provider', 'amount', 'billing_cycle', 'start_date', 'next_billing_date', 'payment_method'];
        const missingFields = requiredFields.filter(field => !parsedData[field]);
        
        if (missingFields.length > 0) {
          toast.error(`Missing information: ${missingFields.join(', ')}. Please provide more details.`);
          return;
        }

        // Create subscription with parsed data
        await createSubscription(parsedData);
        toast.success('Subscription created successfully!');
        onSuccess();
      } else {
        toast.error(parseResponse.data.error || 'Failed to parse subscription details');
      }
    } catch (error) {
      console.error('Failed to create subscription with AI:', error);
      toast.error('Failed to create subscription');
    } finally {
      setAiLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
              <Plus className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Add Subscription</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-xl">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              mode === 'manual'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Manual
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              mode === 'ai'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            AI Assistant
          </button>
        </div>

        {mode === 'ai' ? (
          /* AI Mode */
          <form onSubmit={handleAiSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Describe your subscription
              </label>
              <div className="relative">
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="e.g., Jio 200 monthly starting today next billing next month UPI, Netflix 15.99 monthly paid by card"
                  rows={4}
                  className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 resize-none"
                />
                <div className="absolute bottom-3 right-3">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              
              {/* Required Fields Info */}
              <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-xs font-medium text-purple-300 mb-2">📋 Required Information:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>• Service name (Netflix, Spotify)</div>
                  <div>• Amount (15.99, $9.99)</div>
                  <div>• Billing cycle (monthly, yearly)</div>
                  <div>• Start date (today, Jan 1)</div>
                  <div>• Next billing date</div>
                  <div>• Payment method (card, UPI)</div>
                </div>
                <p className="text-xs text-purple-300 mt-2">
                  💡 Include all details for best results: "Netflix 15.99 monthly starting today, next billing Jan 15, paid by card"
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                type="submit" 
                disabled={aiLoading || !aiInput.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating with AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Create with AI
                  </>
                )}
              </button>
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-slate-600/50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Manual Mode */
          <form onSubmit={handleManualSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              placeholder="Netflix, Spotify, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Provider *</label>
            <input
              type="text"
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              required
              className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              placeholder="Company name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Amount *</label>
              <input
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                placeholder="9.99"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Billing Cycle *</label>
              <select
                name="billing_cycle"
                value={formData.billing_cycle}
                onChange={handleChange}
                className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Next Billing *</label>
              <input
                type="date"
                name="next_billing_date"
                value={formData.next_billing_date}
                onChange={handleChange}
                required
                className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="paypal">PayPal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 resize-none"
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Create Subscription
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-slate-600/50"
            >
              Cancel
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default CreateSubscriptionModal;