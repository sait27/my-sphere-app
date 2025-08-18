// components/lists/ShareListModal.jsx

import React, { useState, useEffect } from 'react';
import { X, Share2, UserPlus, Mail, Check, AlertCircle } from 'lucide-react';
import { useListSharing } from '../../hooks/useListSharing';

const ShareListModal = ({ isOpen, onClose, list }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [isValidEmail, setIsValidEmail] = useState(true);
  const { shareList, fetchMySharedLists, sharedLists, loading, error, removeSharing, updateSharing } = useListSharing();
  
  useEffect(() => {
    if (isOpen && list) {
      fetchMySharedLists();
    }
  }, [isOpen, list, fetchMySharedLists]);
  
  // Filter shared users for the current list
  const currentListShares = sharedLists.filter(share => share.list.id === list?.id) || [];
  
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setIsValidEmail(value === '' || validateEmail(value));
  };
  
  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setIsValidEmail(false);
      return;
    }
    
    try {
      await shareList(list.id, email, permission);
      setEmail('');
    } catch (err) {
      console.error('Share error:', err);
    }
  };
  
  const handleRemoveSharing = async (sharingId) => {
    try {
      await removeSharing(sharingId);
    } catch (err) {
      console.error('Remove sharing error:', err);
    }
  };
  
  const handleUpdatePermission = async (sharingId, newPermission) => {
    try {
      await updateSharing(sharingId, newPermission);
    } catch (err) {
      console.error('Update permission error:', err);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 size={20} className="text-cyan-400" />
            Share List
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-700 transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">{list?.name}</h3>
          <p className="text-slate-400 text-sm">
            Share this list with others by email. They'll receive access based on the permissions you set.
          </p>
        </div>
        
        <form onSubmit={handleShare} className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="user@example.com"
                className={`w-full bg-slate-700 border ${isValidEmail ? 'border-slate-600' : 'border-red-500'} rounded-lg py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
              />
              {!isValidEmail && (
                <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                  <AlertCircle size={14} />
                  <span>Please enter a valid email address</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">Permission</label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="view">View only</option>
              <option value="edit">Can edit</option>
              <option value="admin">Admin (full control)</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading || !isValidEmail || !email}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Share List</span>
              </>
            )}
          </button>
        </form>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {currentListShares.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Shared with</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {currentListShares.map((share) => (
                <div key={share.id} className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{share.user_email}</p>
                    <p className="text-slate-400 text-xs">
                      {share.permission === 'view' && 'View only'}
                      {share.permission === 'edit' && 'Can edit'}
                      {share.permission === 'admin' && 'Admin'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={share.permission}
                      onChange={(e) => handleUpdatePermission(share.id, e.target.value)}
                      className="bg-slate-800 border border-slate-600 rounded text-xs py-1 px-2 text-white"
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveSharing(share.id)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      title="Remove sharing"
                    >
                      <X size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareListModal;