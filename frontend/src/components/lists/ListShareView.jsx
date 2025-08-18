// components/lists/ListShareView.jsx

import React, { useEffect, useState } from 'react';
import { Share2, Users, UserCheck, UserX, Clock, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ListShareView = ({ sharedLists, mySharedLists, loading, error, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('shared_with_me');

  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [activeTab, onRefresh]);

  const getPermissionBadge = (permission) => {
    switch (permission) {
      case 'view':
        return (
          <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full">
            View only
          </span>
        );
      case 'edit':
        return (
          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
            Can edit
          </span>
        );
      case 'admin':
        return (
          <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full">
            Admin
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="border-b border-slate-700">
        <div className="flex">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'shared_with_me' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('shared_with_me')}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCheck size={18} />
              <span>Shared with me</span>
            </div>
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'my_shared_lists' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}
            onClick={() => setActiveTab('my_shared_lists')}
          >
            <div className="flex items-center justify-center gap-2">
              <Share2 size={18} />
              <span>My shared lists</span>
            </div>
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : activeTab === 'shared_with_me' ? (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserCheck className="text-cyan-400" size={20} />
              Lists shared with me
            </h3>
            
            {mySharedLists.length === 0 ? (
              <div className="bg-slate-700/30 rounded-lg p-6 text-center">
                <Users className="mx-auto text-slate-500 mb-2" size={32} />
                <p className="text-slate-400">No lists have been shared with you yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedLists.map((share) => (
                  <div key={share.id} className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{share.list.name}</h4>
                      {getPermissionBadge(share.permission)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-slate-400 flex items-center gap-1">
                        <UserCheck size={14} />
                        <span>Shared by {share.owner_email}</span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDistanceToNow(new Date(share.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Share2 className="text-cyan-400" size={20} />
              Lists I've shared
            </h3>
            
            {sharedLists.length === 0 ? (
              <div className="bg-slate-700/30 rounded-lg p-6 text-center">
                <Share2 className="mx-auto text-slate-500 mb-2" size={32} />
                <p className="text-slate-400">You haven't shared any lists yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group by list */}
                {Object.entries(mySharedLists.reduce((acc, share) => {
                  const listId = share.list.id;
                  if (!acc[listId]) {
                    acc[listId] = {
                      list: share.list,
                      shares: []
                    };
                  }
                  acc[listId].shares.push(share);
                  return acc;
                }, {})).map(([listId, data]) => (
                  <div key={listId} className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3 flex items-center justify-between">
                      <span>{data.list.name}</span>
                      <span className="text-xs text-slate-400">
                        Shared with {data.shares.length} {data.shares.length === 1 ? 'person' : 'people'}
                      </span>
                    </h4>
                    
                    <div className="space-y-2">
                      {data.shares.map((share) => (
                        <div key={share.id} className="bg-slate-800 rounded p-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserCheck size={16} className="text-cyan-400" />
                            <span className="text-white text-sm">{share.user_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPermissionBadge(share.permission)}
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(share.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListShareView;