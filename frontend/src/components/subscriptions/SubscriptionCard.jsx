import React, { useState } from 'react';
import { Calendar, DollarSign, Pause, Play, X, MoreVertical, Zap, Globe, Music, Video, ShoppingBag, Coffee, Edit3 } from 'lucide-react';
import { useSubscriptions } from '../../hooks/useSubscriptions';

const SubscriptionCard = ({ subscription, onUpdate, onEdit, onSelect, isSelected = false, index = 0, viewMode = 'grid' }) => {
  const [showActions, setShowActions] = useState(false);
  const { pauseSubscription, resumeSubscription, cancelSubscription, loading } = useSubscriptions();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    }
  };

  const getProviderIcon = (provider) => {
    const iconMap = {
      'Netflix': <Video size={20} className="text-red-400" />,
      'Spotify': <Music size={20} className="text-green-400" />,
      'Amazon': <ShoppingBag size={20} className="text-orange-400" />,
      'Disney': <Video size={20} className="text-blue-400" />,
      'YouTube': <Video size={20} className="text-red-400" />,
      'Apple': <Music size={20} className="text-slate-400" />,
      'Microsoft': <Globe size={20} className="text-blue-400" />,
      'Adobe': <Globe size={20} className="text-red-400" />,
    };
    return iconMap[provider] || <Globe size={20} className="text-slate-400" />;
  };

  const getProviderGradient = (provider) => {
    const gradientMap = {
      'Netflix': 'from-red-500/20 to-red-600/10',
      'Spotify': 'from-green-500/20 to-green-600/10',
      'Amazon': 'from-orange-500/20 to-orange-600/10',
      'Disney': 'from-blue-500/20 to-blue-600/10',
      'YouTube': 'from-red-500/20 to-red-600/10',
      'Apple': 'from-slate-500/20 to-slate-600/10',
      'Microsoft': 'from-blue-500/20 to-blue-600/10',
      'Adobe': 'from-red-500/20 to-red-600/10',
    };
    return gradientMap[provider] || 'from-slate-500/20 to-slate-600/10';
  };

  const handlePause = async () => {
    await pauseSubscription(subscription.subscription_id);
    onUpdate();
    setShowActions(false);
  };

  const handleResume = async () => {
    await resumeSubscription(subscription.subscription_id);
    onUpdate();
    setShowActions(false);
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      await cancelSubscription(subscription.subscription_id);
      onUpdate();
      setShowActions(false);
    }
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 animate-slideInUp ${
        isSelected
          ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/40 shadow-lg shadow-cyan-500/20'
          : 'bg-gradient-to-br from-slate-800/50 to-slate-700/30 hover:from-slate-700/60 hover:to-slate-600/40 border-slate-600/30 hover:border-slate-500/50'
      } ${viewMode === 'list' ? 'flex items-center' : ''}`}
      style={{animationDelay: `${0.1 * index}s`}}
    >
      {/* Provider Color Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getProviderGradient(subscription.provider)}`}></div>
      
      <div className={`${viewMode === 'list' ? 'flex items-center w-full p-4' : 'p-5'}`}>
        <div className={`flex items-start justify-between ${viewMode === 'list' ? 'w-full' : 'mb-4'}`}>
          <div className="flex items-center gap-3">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(subscription.subscription_id)}
                className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
              />
            )}
            <div className={`${viewMode === 'list' ? 'p-2' : 'p-3'} rounded-xl bg-gradient-to-br ${getProviderGradient(subscription.provider)}`}>
              {getProviderIcon(subscription.provider)}
            </div>
            <div>
              <h4 className={`font-bold text-white ${viewMode === 'list' ? 'text-base' : 'text-lg'} mb-1`}>{subscription.name}</h4>
              <p className="text-sm text-slate-400">{subscription.provider}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
              {subscription.status}
            </span>
            {onEdit && (
              <button
                onClick={() => onEdit(subscription)}
                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                title="Edit subscription"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all duration-200"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`space-y-3 ${viewMode === 'list' ? 'ml-auto flex items-center gap-6' : 'mb-4'}`}>
          <div className={`flex items-center ${viewMode === 'list' ? 'gap-6' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-white font-semibold">
                ₹{subscription.amount}/{subscription.billing_cycle}
              </span>
            </div>
            <div className="text-right">
              <p className={`${viewMode === 'list' ? 'text-base' : 'text-lg'} font-bold text-white`}>
                ₹{subscription.monthly_cost?.toFixed(2)}
              </p>
              <p className="text-xs text-slate-400">per month</p>
            </div>
          </div>
          
          {viewMode !== 'list' && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>Next billing: {new Date(subscription.next_billing_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {viewMode !== 'list' && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {subscription.status === 'active' && (
              <button
                onClick={handlePause}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            {subscription.status === 'paused' && (
              <button
                onClick={handleResume}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}

        {/* Dropdown Actions */}
        {showActions && (
          <div className="absolute top-16 right-4 bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-xl shadow-2xl p-2 z-20 min-w-32">
            {subscription.status === 'active' && (
              <button
                onClick={handlePause}
                disabled={loading}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            {subscription.status === 'paused' && (
              <button
                onClick={handleResume}
                disabled={loading}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full px-3 py-2 text-left text-sm text-red-300 hover:text-red-200 hover:bg-red-500/20 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;