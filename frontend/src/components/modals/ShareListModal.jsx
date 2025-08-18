import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Share2, 
  Copy, 
  Users, 
  Eye, 
  Edit3, 
  Calendar,
  Link,
  UserPlus,
  Trash2,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useListSharing } from '../../hooks/useListSharing';

const ShareListModal = ({ isOpen, onClose, list }) => {
  const [creating, setCreating] = useState(false);
  const [newShare, setNewShare] = useState({
    email: '',
    permission: 'view',
    expires_in_days: 30
  });

  const { 
    shares, 
    loading, 
    error,
    shareList,
    removeSharing,
    updateSharing,
    fetchListShares
  } = useListSharing();

  useEffect(() => {
    if (isOpen && list) {
      fetchListShares(list.id);
    }
  }, [isOpen, list, fetchListShares]);

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
            <div className="p-6">
              {/* List Info */}
              {list && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <h3 className="text-lg font-medium text-white mb-1">{list.name}</h3>
                  <p className="text-sm text-slate-400">
                    {list.description || 'No description'}
                  </p>
                </div>
              )}

              {/* Create New Share */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <UserPlus size={18} className="text-blue-400" />
                  Share with others
                </h3>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Email address</label>
                    <input
                      type="email"
                      value={newShare.email}
                      onChange={(e) => setNewShare({ ...newShare, email: e.target.value })}
                      placeholder="Enter email address"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Permission</label>
                    <select
                      value={newShare.permission}
                      onChange={(e) => setNewShare({ ...newShare, permission: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50"
                    >
                      <option value="view">View only</option>
                      <option value="edit">Can edit</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={createShare}
                    disabled={creating || !newShare.email}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Sharing...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Share List
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Existing Shares */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-blue-400" />
                  People with access
                </h3>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : shares && shares.length > 0 ? (
                  <div className="space-y-4">
                    {shares.map((share) => (
                      <div 
                        key={share.id} 
                        className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-medium">
                              {share.user_email ? share.user_email[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-white">{share.user_email}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(share.created_at).toLocaleDateString()} • 
                                {share.permission === 'view' && 'Viewer'}
                                {share.permission === 'edit' && 'Editor'}
                                {share.permission === 'admin' && 'Admin'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end md:self-auto">
                          <select
                            value={share.permission}
                            onChange={(e) => updateShare(share.id, e.target.value)}
                            className="px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          >
                            <option value="view">View only</option>
                            <option value="edit">Can edit</option>
                            <option value="admin">Admin</option>
                          </select>
                          
                          <button
                            onClick={() => deleteShare(share.id)}
                            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Remove access"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="mx-auto mb-3 text-slate-500" size={32} />
                    <p>This list hasn't been shared with anyone yet</p>
                  </div>
                )}
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
