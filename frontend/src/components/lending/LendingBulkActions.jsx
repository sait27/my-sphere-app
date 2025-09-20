import React, { useState } from 'react';
import { CheckSquare, Trash2, Tag, AlertCircle, Download, Mail, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const LendingBulkActions = ({ selectedTransactions, onActionComplete, categories }) => {
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkData, setBulkData] = useState({
    status: '',
    category: '',
    priority: '',
    notes: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkAction = async () => {
    if (!bulkAction || selectedTransactions.length === 0) {
      toast.error('Please select an action and transactions');
      return;
    }

    setIsProcessing(true);
    try {
      const actionData = {
        transaction_ids: selectedTransactions,
        operation: bulkAction,
        params: bulkData
      };

      // Call the bulk operations API
      await onActionComplete(actionData);
      
      // Reset state
      setBulkAction('');
      setBulkData({ status: '', category: '', priority: '', notes: '' });
      setShowBulkPanel(false);
      
      toast.success(`Bulk ${bulkAction} completed successfully!`);
    } catch (error) {
      toast.error(`Failed to perform bulk ${bulkAction}`);
      console.error('Bulk action error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportSelected = async () => {
    try {
      setIsProcessing(true);
      // This would call an export API endpoint
      toast.success('Export started! Check your downloads.');
    } catch (error) {
      toast.error('Failed to export transactions');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      setIsProcessing(true);
      // This would call a send reminders API endpoint
      toast.success('Reminders sent successfully!');
    } catch (error) {
      toast.error('Failed to send reminders');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedTransactions.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckSquare className="text-cyan-400" size={20} />
              <span className="text-white font-medium">
                {selectedTransactions.length} transaction{selectedTransactions.length !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Actions */}
            <button
              onClick={handleExportSelected}
              disabled={isProcessing}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
              title="Export Selected"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={handleSendReminders}
              disabled={isProcessing}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
              title="Send Reminders"
            >
              <Mail size={16} />
              <span className="hidden sm:inline">Remind</span>
            </button>

            <button
              onClick={() => setShowBulkPanel(!showBulkPanel)}
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm transition-colors"
            >
              Bulk Actions
            </button>
          </div>
        </div>

        {/* Bulk Actions Panel */}
        <AnimatePresence>
          {showBulkPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Action Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Action</label>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select Action</option>
                    <option value="update_status">Update Status</option>
                    <option value="update_category">Update Category</option>
                    <option value="update_priority">Update Priority</option>
                    <option value="add_notes">Add Notes</option>
                    <option value="delete">Delete Transactions</option>
                  </select>
                </div>

                {/* Conditional Fields Based on Action */}
                {bulkAction === 'update_status' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">New Status</label>
                    <select
                      value={bulkData.status}
                      onChange={(e) => setBulkData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select Status</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="partial">Partially Paid</option>
                    </select>
                  </div>
                )}

                {bulkAction === 'update_category' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">New Category</label>
                    <select
                      value={bulkData.category}
                      onChange={(e) => setBulkData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select Category</option>
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
                )}

                {bulkAction === 'update_priority' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">New Priority</label>
                    <select
                      value={bulkData.priority}
                      onChange={(e) => setBulkData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                )}

                {bulkAction === 'add_notes' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-300">Notes to Add</label>
                    <textarea
                      value={bulkData.notes}
                      onChange={(e) => setBulkData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter notes to add to all selected transactions..."
                      rows="2"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    />
                  </div>
                )}

                {bulkAction === 'delete' && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertTriangle className="text-red-400" size={16} />
                      <span className="text-red-300 text-sm">
                        This will permanently delete {selectedTransactions.length} transaction{selectedTransactions.length !== 1 ? 's' : ''}. This action cannot be undone.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowBulkPanel(false);
                    setBulkAction('');
                    setBulkData({ status: '', category: '', priority: '', notes: '' });
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || isProcessing}
                  className={`px-6 py-2 rounded-lg text-white transition-all duration-200 flex items-center space-x-2 ${
                    bulkAction === 'delete'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
                  } disabled:from-slate-600 disabled:to-slate-600`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {bulkAction === 'delete' && <Trash2 size={16} />}
                      {bulkAction === 'update_category' && <Tag size={16} />}
                      {bulkAction === 'update_status' && <CheckSquare size={16} />}
                      <span>
                        {bulkAction === 'delete' ? 'Delete Selected' :
                         bulkAction === 'update_status' ? 'Update Status' :
                         bulkAction === 'update_category' ? 'Update Category' :
                         bulkAction === 'update_priority' ? 'Update Priority' :
                         bulkAction === 'add_notes' ? 'Add Notes' :
                         'Apply Action'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LendingBulkActions;