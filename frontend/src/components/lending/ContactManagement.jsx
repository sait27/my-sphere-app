import React, { useState } from 'react';
import { User, Phone, Mail, Star, Plus, Edit3, Trash2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ContactManagement = ({ contacts, onCreateContact, onUpdateContact, onDeleteContact }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: 'other',
    preferred_contact_method: 'email',
    notes: ''
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
      toast.error('Please enter a contact name');
      return;
    }

    try {
      if (editingContact) {
        await onUpdateContact(editingContact.id, formData);
        toast.success('Contact updated successfully!');
      } else {
        await onCreateContact(formData);
        toast.success('Contact created successfully!');
      }
      
      resetForm();
    } catch (error) {
      toast.error('Failed to save contact');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      relationship: 'other',
      preferred_contact_method: 'email',
      notes: ''
    });
    setEditingContact(null);
    setIsCreateModalOpen(false);
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || '',
      relationship: contact.relationship || 'other',
      preferred_contact_method: contact.preferred_contact_method || 'email',
      notes: contact.notes || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await onDeleteContact(contactId);
        toast.success('Contact deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete contact');
      }
    }
  };

  const getRelationshipColor = (relationship) => {
    const colors = {
      family: 'bg-green-500/20 text-green-300 border-green-500/30',
      friend: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      colleague: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      business: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      other: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    };
    return colors[relationship] || colors.other;
  };

  const renderStars = (score) => {
    const stars = [];
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} size={14} className="text-yellow-400 fill-current" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" size={14} className="text-yellow-400 fill-current opacity-50" />
      );
    }

    const remainingStars = 5 - Math.ceil(score);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} size={14} className="text-slate-600" />
      );
    }

    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
            <Users className="text-purple-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Contact Management</h3>
            <p className="text-slate-400 text-sm">Manage your lending contacts and relationships</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact, index) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 rounded-xl border border-slate-600/30 p-5 hover:border-purple-500/30 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <User className="text-purple-400" size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white">{contact.name}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRelationshipColor(contact.relationship)}`}>
                    {contact.relationship?.charAt(0).toUpperCase() + contact.relationship?.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(contact)}
                  className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded transition-colors"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {contact.email && (
                <div className="flex items-center text-slate-300">
                  <Mail size={14} className="mr-2 text-slate-400" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center text-slate-300">
                  <Phone size={14} className="mr-2 text-slate-400" />
                  <span>{contact.phone}</span>
                </div>
              )}
            </div>

            {/* Reliability Score */}
            <div className="mt-4 pt-3 border-t border-slate-600/30">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Reliability</span>
                <div className="flex items-center space-x-1">
                  {renderStars(contact.reliability_score || 5)}
                  <span className="text-slate-400 text-xs ml-1">
                    {(contact.reliability_score || 5).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {contact.notes && (
              <div className="mt-3 p-2 bg-slate-700/30 rounded text-xs text-slate-300">
                {contact.notes}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No contacts yet</h3>
          <p className="text-slate-500 mb-4">Add your first contact to start managing relationships</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200"
          >
            Add First Contact
          </button>
        </div>
      )}

      {/* Create/Edit Contact Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 w-full max-w-md"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">
                  {editingContact ? 'Edit Contact' : 'Add New Contact'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Contact name"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone number"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Relationship</label>
                    <select
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="family">Family</option>
                      <option value="friend">Friend</option>
                      <option value="colleague">Colleague</option>
                      <option value="business">Business</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Preferred Contact</label>
                    <select
                      name="preferred_contact_method"
                      value={formData.preferred_contact_method}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="sms">SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes about this contact..."
                    rows="3"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
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
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200"
                  >
                    {editingContact ? 'Update Contact' : 'Add Contact'}
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

export default ContactManagement;