import React, { useState } from 'react';
import { FileText, Plus, Edit3, Trash2, Copy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const TransactionTemplates = ({ templates, onCreateTemplate, onUpdateTemplate, onDeleteTemplate, onUseTemplate }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    transaction_type: 'lend',
    default_amount: '',
    default_category: 'Personal',
    default_interest_rate: '0',
    default_payment_method: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      if (editingTemplate) {
        await onUpdateTemplate(editingTemplate.id, formData);
        toast.success('Template updated successfully!');
      } else {
        await onCreateTemplate(formData);
        toast.success('Template created successfully!');
      }
      
      resetForm();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      transaction_type: 'lend',
      default_amount: '',
      default_category: 'Personal',
      default_interest_rate: '0',
      default_payment_method: ''
    });
    setEditingTemplate(null);
    setIsCreateModalOpen(false);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      transaction_type: template.transaction_type,
      default_amount: template.default_amount || '',
      default_category: template.default_category || 'Personal',
      default_interest_rate: template.default_interest_rate || '0',
      default_payment_method: template.default_payment_method || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await onDeleteTemplate(templateId);
        toast.success('Template deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      await onUseTemplate(template);
      toast.success('Transaction created from template!');
    } catch (error) {
      toast.error('Failed to create transaction from template');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg">
            <FileText className="text-indigo-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Transaction Templates</h3>
            <p className="text-slate-400 text-sm">Create reusable templates for common transactions</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>New Template</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 p-5 hover:border-indigo-500/30 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  template.transaction_type === 'lend' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white">{template.name}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    template.transaction_type === 'lend'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  }`}>
                    {template.transaction_type === 'lend' ? 'Lending' : 'Borrowing'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors"
                  title="Use Template"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/20 rounded transition-colors"
                  title="Edit Template"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  title="Delete Template"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {template.description && (
              <p className="text-slate-300 text-sm mb-4">{template.description}</p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Default Amount:</span>
                <span className="text-white font-medium">{formatCurrency(template.default_amount)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="text-white">{template.default_category}</span>
              </div>
              
              {template.default_interest_rate > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Interest Rate:</span>
                  <span className="text-white">{template.default_interest_rate}%</span>
                </div>
              )}
              
              {template.default_payment_method && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Method:</span>
                  <span className="text-white">{template.default_payment_method.replace('_', ' ').toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Usage Stats */}
            <div className="mt-4 pt-3 border-t border-slate-600/30 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="text-yellow-400" size={14} />
                <span className="text-slate-400 text-xs">Used {template.use_count || 0} times</span>
              </div>
              
              <button
                onClick={() => handleUseTemplate(template)}
                className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded text-xs transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No templates yet</h3>
          <p className="text-slate-500 mb-4">Create your first template to speed up transaction creation</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200"
          >
            Create First Template
          </button>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Template Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Monthly Rent Payment"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Transaction Type</label>
                    <select
                      name="transaction_type"
                      value={formData.transaction_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="lend">Lending</option>
                      <option value="borrow">Borrowing</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of this template..."
                    rows="2"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Default Amount</label>
                    <input
                      type="number"
                      name="default_amount"
                      value={formData.default_amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Default Category</label>
                    <select
                      name="default_category"
                      value={formData.default_category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Personal">Personal</option>
                      <option value="Business">Business</option>
                      <option value="Family">Family</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Interest Rate (%)</label>
                    <input
                      type="number"
                      name="default_interest_rate"
                      value={formData.default_interest_rate}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Default Payment Method</label>
                  <select
                    name="default_payment_method"
                    value={formData.default_payment_method}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="check">Check</option>
                    <option value="digital_wallet">Digital Wallet</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200"
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionTemplates;