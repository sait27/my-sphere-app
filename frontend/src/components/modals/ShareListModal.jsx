import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Clock } from 'lucide-react';

const ShareListModal = ({ isOpen, onClose, list }) => {

  const createShare = async () => {
    if (!newShare.email) {
      toast.error('Please enter an email address');
      return;
    }
    
    if (!validateEmail(newShare.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setCreating(true);
    try {
      await shareList(list.id, newShare.email, newShare.permission);
      setNewShare({ email: '', permission: 'view', expires_in_days: 30 });
      toast.success('List shared successfully!');
    } catch (error) {
      console.error('Error creating share:', error);
    } finally {
      setCreating(false);
    }
  };
  
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const deleteShare = async (shareId) => {
    try {
      await removeSharing(shareId);
      toast.success('Share removed successfully');
    } catch (error) {
      console.error('Error deleting share:', error);
    }
  };

  const updateShare = async (shareId, permission) => {
    try {
      await updateSharing(shareId, permission);
      toast.success('Share permissions updated');
    } catch (error) {
      console.error('Error updating share:', error);
    }
  };

  const copyShareLink = (shareUrl) => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  const revokeShare = async (shareId) => {
    if (!window.confirm('Are you sure you want to revoke this share link?')) {
      return;
    }

    try {
      await removeSharing(shareId);
      toast.success('Share link revoked successfully');
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('Failed to revoke share link');
    }
  };

  const getPermissionIcon = (permission) => {
    return permission === 'edit' ? <Edit3 size={16} /> : <Eye size={16} />;
  };

  const getPermissionColor = (permission) => {
    return permission === 'edit' 
      ? 'text-orange-400 bg-orange-500/20' 
      : 'text-blue-400 bg-blue-500/20';
  };

  const formatExpiryDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  if (!list) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-2xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Share2 className="text-blue-400" size={20} />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Share List
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Coming Soon!</h3>
                <p className="text-slate-400 max-w-md">
                  List sharing functionality is currently under development. Stay tuned for updates!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-700/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareListModal;
