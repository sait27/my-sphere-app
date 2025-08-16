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
import apiClient from '../../api/axiosConfig';

const ShareListModal = ({ isOpen, onClose, list }) => {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newShare, setNewShare] = useState({
    permission: 'view',
    expires_in_days: 30
  });

  useEffect(() => {
    if (isOpen && list) {
      fetchShares();
    }
  }, [isOpen, list]);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/lists/${list.id}/share/`);
      setShares(response.data);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast.error('Failed to load shares');
    } finally {
      setLoading(false);
    }
  };

  const createShare = async () => {
    setCreating(true);
    try {
      const response = await apiClient.post(`/api/v1/lists/${list.id}/share/`, newShare);
      setShares(prev => [response.data, ...prev]);
      toast.success('Share link created successfully!');
    } catch (error) {
      console.error('Error creating share:', error);
      toast.error('Failed to create share link');
    } finally {
      setCreating(false);
    }
  };

  const copyShareLink = (shareUrl) => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Share link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const revokeShare = async (shareId) => {
    if (!window.confirm('Are you sure you want to revoke this share link?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/lists/${list.id}/share/${shareId}/`);
      setShares(prev => prev.filter(share => share.id !== shareId));
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Share List</h2>
                  <p className="text-slate-400 text-sm">{list.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Create New Share */}
            <div className="bg-slate-700/30 rounded-xl p-4 mb-6 border border-slate-600/30">
              <h3 className="text-lg font-semibold text-white mb-4">Create Share Link</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Permission Level
                  </label>
                  <select
                    value={newShare.permission}
                    onChange={(e) => setNewShare(prev => ({ ...prev, permission: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="view">View Only</option>
                    <option value="edit">View & Edit</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expires In
                  </label>
                  <select
                    value={newShare.expires_in_days}
                    onChange={(e) => setNewShare(prev => ({ ...prev, expires_in_days: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value={1}>1 Day</option>
                    <option value={7}>1 Week</option>
                    <option value={30}>1 Month</option>
                    <option value={90}>3 Months</option>
                    <option value={365}>1 Year</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={createShare}
                disabled={creating}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Link size={16} />
                    Create Share Link
                  </>
                )}
              </button>
            </div>

            {/* Existing Shares */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Active Share Links</h3>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="animate-pulse bg-slate-700/30 rounded-lg p-4">
                      <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : shares.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto text-slate-500 mb-3" size={48} />
                  <p className="text-slate-400 mb-2">No active shares</p>
                  <p className="text-slate-500 text-sm">Create a share link to collaborate with others</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shares.map((share) => (
                    <motion.div
                      key={share.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getPermissionColor(share.permission)}`}>
                            {getPermissionIcon(share.permission)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">
                                {share.permission === 'edit' ? 'Edit Access' : 'View Only'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPermissionColor(share.permission)}`}>
                                {share.permission}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                {formatExpiryDate(share.expires_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users size={12} />
                                {share.collaborator_count} collaborator{share.collaborator_count !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyShareLink(share.share_url)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors"
                            title="Copy link"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={() => revokeShare(share.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Revoke share"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Share URL */}
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30">
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm text-slate-300 truncate">
                            {share.share_url}
                          </code>
                          <button
                            onClick={() => copyShareLink(share.share_url)}
                            className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-sm hover:bg-blue-600/30 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      
                      {/* Collaborators */}
                      {share.collaborators && share.collaborators.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-slate-400 mb-2">Collaborators:</p>
                          <div className="flex flex-wrap gap-2">
                            {share.collaborators.map((collaborator) => (
                              <div
                                key={collaborator.id}
                                className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1 border border-slate-600/30"
                              >
                                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {collaborator.first_name?.[0] || collaborator.username[0].toUpperCase()}
                                </div>
                                <span className="text-sm text-slate-300">
                                  {collaborator.first_name && collaborator.last_name 
                                    ? `${collaborator.first_name} ${collaborator.last_name}`
                                    : collaborator.username
                                  }
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2">Sharing Tips</h4>
              <ul className="text-sm text-blue-300/80 space-y-1">
                <li>• View access allows others to see the list and items</li>
                <li>• Edit access allows adding, editing, and completing items</li>
                <li>• Share links expire automatically for security</li>
                <li>• You can revoke access at any time</li>
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShareListModal;
