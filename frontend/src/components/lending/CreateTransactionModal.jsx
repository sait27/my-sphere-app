import React, { useState, useEffect } from 'react';
import { X, User, DollarSign, Calendar, Tag, AlertCircle, Phone, Mail, MapPin, FileText, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CreateTransactionModal = ({ isOpen, onClose, onSubmit, categories, contacts }) => {
  const [formData, setFormData] = useState({
    transaction_type: 'lend',
    person_name: '',
    person_contact: '',
    person_email: '',
    amount: '',
    interest_rate: '0',
    interest_type: 'simple',
    category: 'Personal',
    custom_category: '',
    priority: 'medium',
    transaction_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
    notes: '',
    location: '',
    payment_method: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        transaction_type: 'lend',
        person_name: '',
        person_contact: '',
        person_email: '',
        amount: '',
        interest_rate: '0',
        interest_type: 'simple',
        category: 'Personal',
        custom_category: '',
        priority: 'medium',
        transaction_date: new Date().toISOString().split('T')[0],
        due_date: '',
        description: '',
        notes: '',
        location: '',
        payment_method: ''
      });
      setSelectedContact(null);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setFormData(prev => ({
      ...prev,
      person_name: contact.name,
      person_contact: contact.phone || '',
      person_email: contact.email || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const errors = [];
    if (!formData.person_name.trim()) {
      errors.push('Person name is required');
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.push('Valid amount is required');
    }
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean up the data before sending
      const cleanData = {
        ...formData,
        amount: parseFloat(formData.amount),
        interest_rate: parseFloat(formData.interest_rate || 0),
        // Handle empty fields properly
        person_contact: formData.person_contact || '',
        person_email: formData.person_email || '',
        due_date: formData.due_date || null,
        description: formData.description || '',
        notes: formData.notes || '',
        location: formData.location || '',
        payment_method: formData.payment_method || ''
      };
      
      // Remove custom_category if it's empty
      if (!cleanData.custom_category) {
        delete cleanData.custom_category;
      }
      
      console.log('Sending transaction data:', cleanData);
      await onSubmit(cleanData);
      onClose();
    } catch (error) {
      console.error('Error creating transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Create New Transaction</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Transaction Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Transaction Type <span className="text-red-400">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="transaction_type"
                      value="lend"
                      checked={formData.transaction_type === 'lend'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-green-400">I'm Lending</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="transaction_type"
                      value="borrow"
                      checked={formData.transaction_type === 'borrow'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-orange-600 bg-slate-700 border-slate-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-orange-400">I'm Borrowing</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Person Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <User className="mr-2" size={20} />
                Person Details
              </h3>
              
              {/* Contact Selection */}
              {contacts.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Select Existing Contact</label>
                  <div className="flex flex-wrap gap-2">
                    {contacts.slice(0, 5).map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleContactSelect(contact)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          selectedContact?.id === contact.id
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {contact.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center">
                    <User className="mr-1" size={16} />
                    Person Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="person_name"
                    value={formData.person_name}
                    onChange={handleInputChange}
                    placeholder="Enter person's name"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center">
                    <Phone className="mr-1" size={16} />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="person_contact"
                    value={formData.person_contact}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center">
                    <Mail className="mr-1" size={16} />
                    Email
                  </label>
                  <input
                    type="email"
                    name="person_email"
                    value={formData.person_email}
                    onChange={handleInputChange}
                    placeholder="Email address"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <DollarSign className="mr-2" size={20} />
                Financial Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Amount <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center">
                    <Percent className="mr-1" size={16} />
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    name="interest_rate"
                    value={formData.interest_rate}
                    onChange={handleInputChange}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Interest Type</label>
                  <select
                    name="interest_type"
                    value={formData.interest_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="simple">Simple Interest</option>
                    <option value="compound">Compound Interest</option>
                    <option value="flat">Flat Rate</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Payment Method</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select Method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="check">Check</option>
                    <option value="digital_wallet">Digital Wallet</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category and Dates */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center">
                    <Tag className="mr-1" size={16} />
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Business">Business</option>
                    <option value="Family">Family</option>
                    <option value="Emergency">Emergency</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center">
                    <Calendar className="mr-1" size={16} />
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center">
                    <AlertCircle className="mr-1" size={16} />
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 flex items-center">
                    <FileText className="mr-1" size={16} />
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the transaction"
                    rows="3"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes or terms"
                    rows="3"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center">
                  <MapPin className="mr-1" size={16} />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Where did this transaction take place?"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Transaction</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateTransactionModal;