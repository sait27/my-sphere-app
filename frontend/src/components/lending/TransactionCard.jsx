import React, { useState } from 'react';
import { 
  Edit3, Trash2, CheckCircle, Clock, AlertTriangle, DollarSign, 
  Calendar, User, Phone, Mail, MapPin, Tag, CreditCard, 
  TrendingUp, TrendingDown, MoreHorizontal, Plus, FileText 
} from 'lucide-react';
import { motion } from 'framer-motion';

const TransactionCard = ({ 
  transaction, 
  onEdit, 
  onDelete, 
  onMarkCompleted, 
  onAddPayment,
  isSelected,
  onSelect 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      overdue: 'bg-red-500/20 text-red-300 border-red-500/30',
      cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      partial: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    };
    return colors[status] || colors.active;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-500/20 text-gray-300',
      medium: 'bg-blue-500/20 text-blue-300',
      high: 'bg-orange-500/20 text-orange-300',
      urgent: 'bg-red-500/20 text-red-300'
    };
    return colors[priority] || colors.medium;
  };

  const getTypeIcon = (type) => {
    return type === 'lend' ? (
      <TrendingUp className="text-green-400" size={20} />
    ) : (
      <TrendingDown className="text-orange-400" size={20} />
    );
  };

  const getTypeColor = (type) => {
    return type === 'lend' 
      ? 'bg-green-500/10 border-green-500/30' 
      : 'bg-orange-500/10 border-orange-500/30';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysOverdue = () => {
    if (!transaction.due_date || transaction.status !== 'active') return 0;
    const today = new Date();
    const dueDate = new Date(transaction.due_date);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isOverdue = getDaysOverdue() > 0;
  const remainingAmount = transaction.amount - (transaction.amount_paid || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 ${
        isSelected
          ? 'bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-cyan-500/40 shadow-lg shadow-cyan-500/20'
          : `bg-gradient-to-br from-slate-800/50 to-slate-700/30 hover:from-slate-700/60 hover:to-slate-600/40 border-slate-600/30 hover:border-slate-500/50 ${getTypeColor(transaction.transaction_type)}`
      }`}
    >
      {/* Priority/Status Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isOverdue ? 'bg-red-500' : 
        transaction.status === 'completed' ? 'bg-green-500' : 
        transaction.priority === 'urgent' ? 'bg-red-500' :
        transaction.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
      }`}></div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(transaction.lending_id)}
              className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
            />
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                transaction.transaction_type === 'lend' 
                  ? 'bg-green-500/20' 
                  : 'bg-orange-500/20'
              }`}>
                {getTypeIcon(transaction.transaction_type)}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-600/50 text-slate-400 font-mono text-xs rounded-md">
                    {transaction.display_id}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                  {isOverdue && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                      {getDaysOverdue()} days overdue
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-xl transition-all duration-200"
              title="View Details"
            >
              <MoreHorizontal size={16} />
            </button>
            
            {transaction.status === 'active' && (
              <button
                onClick={() => onAddPayment(transaction)}
                className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-xl transition-all duration-200"
                title="Add Payment"
              >
                <Plus size={16} />
              </button>
            )}
            
            <button
              onClick={() => onEdit(transaction)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-xl transition-all duration-200"
              title="Edit Transaction"
            >
              <Edit3 size={16} />
            </button>
            
            {transaction.status === 'active' && (
              <button
                onClick={() => onMarkCompleted(transaction.lending_id)}
                className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-xl transition-all duration-200"
                title="Mark as Completed"
              >
                <CheckCircle size={16} />
              </button>
            )}
            
            <button
              onClick={() => onDelete(transaction.lending_id)}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-200"
              title="Delete Transaction"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-white text-lg sm:text-xl truncate mb-1 flex items-center gap-2">
                <User size={18} className="text-slate-400" />
                {transaction.person_name}
              </h4>
              <p className="text-sm text-slate-400 truncate">
                {transaction.description || `${transaction.transaction_type === 'lend' ? 'Lent to' : 'Borrowed from'} ${transaction.person_name}`}
              </p>
            </div>
            
            <div className="text-left sm:text-right">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {formatCurrency(transaction.amount)}
              </div>
              {transaction.amount_paid > 0 && (
                <div className="text-sm text-green-400">
                  Paid: {formatCurrency(transaction.amount_paid)}
                </div>
              )}
              {remainingAmount > 0 && remainingAmount < transaction.amount && (
                <div className="text-sm text-orange-400">
                  Remaining: {formatCurrency(remainingAmount)}
                </div>
              )}
            </div>
          </div>

          {/* Tags and Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(transaction.priority)}`}>
                {transaction.priority.toUpperCase()}
              </span>
              
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Tag size={12} className="mr-1" />
                {transaction.category}
              </span>

              {transaction.interest_rate > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {transaction.interest_rate}% {transaction.interest_type}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center">
                <Calendar size={12} className="mr-1" />
                <span>{formatDate(transaction.transaction_date)}</span>
              </div>
              {transaction.due_date && (
                <div className={`flex items-center ${isOverdue ? 'text-red-400' : ''}`}>
                  <Clock size={12} className="mr-1" />
                  <span>Due: {formatDate(transaction.due_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Expandable Details */}
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-600/30 pt-4 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {transaction.person_contact && (
                  <div className="flex items-center text-slate-300">
                    <Phone size={14} className="mr-2 text-slate-400" />
                    <span>{transaction.person_contact}</span>
                  </div>
                )}
                
                {transaction.person_email && (
                  <div className="flex items-center text-slate-300">
                    <Mail size={14} className="mr-2 text-slate-400" />
                    <span>{transaction.person_email}</span>
                  </div>
                )}
                
                {transaction.location && (
                  <div className="flex items-center text-slate-300">
                    <MapPin size={14} className="mr-2 text-slate-400" />
                    <span>{transaction.location}</span>
                  </div>
                )}
                
                {transaction.payment_method && (
                  <div className="flex items-center text-slate-300">
                    <CreditCard size={14} className="mr-2 text-slate-400" />
                    <span>{transaction.payment_method.replace('_', ' ').toUpperCase()}</span>
                  </div>
                )}
              </div>

              {transaction.notes && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex items-start">
                    <FileText size={14} className="mr-2 text-slate-400 mt-0.5" />
                    <p className="text-sm text-slate-300">{transaction.notes}</p>
                  </div>
                </div>
              )}

              {/* Interest Calculation */}
              {transaction.interest_rate > 0 && transaction.status === 'active' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <div className="text-sm text-amber-300">
                    <strong>Interest Info:</strong> {transaction.interest_rate}% {transaction.interest_type} interest
                    {transaction.total_with_interest && (
                      <div className="mt-1">
                        Total with interest: {formatCurrency(transaction.total_with_interest)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionCard;