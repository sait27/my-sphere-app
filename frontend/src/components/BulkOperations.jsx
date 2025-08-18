import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Archive, 
  Tag, 
  Calendar, 
  Flag,
  Copy,
  Move,
  X,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BulkOperations = ({ 
  selectedTasks = [], 
  onBulkComplete, 
  onBulkDelete, 
  onBulkArchive,
  onBulkAssignTag,
  onBulkUpdatePriority,
  onBulkUpdateDueDate,
  onBulkMove,
  onClearSelection,
  tags = [],
  goals = []
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');

  const selectedCount = selectedTasks.length;

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkAction = async (action, data = {}) => {
    try {
      switch (action) {
        case 'complete':
          await onBulkComplete(selectedTasks);
          toast.success(`${selectedCount} tasks marked as completed`);
          break;
        case 'incomplete':
          await onBulkComplete(selectedTasks, false);
          toast.success(`${selectedCount} tasks marked as incomplete`);
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedCount} tasks?`)) {
            await onBulkDelete(selectedTasks);
            toast.success(`${selectedCount} tasks deleted`);
          }
          break;
        case 'archive':
          await onBulkArchive(selectedTasks);
          toast.success(`${selectedCount} tasks archived`);
          break;
        case 'assign_tag':
          await onBulkAssignTag(selectedTasks, data.tagId);
          toast.success(`Tag assigned to ${selectedCount} tasks`);
          setShowTagModal(false);
          setSelectedTag('');
          break;
        case 'update_priority':
          await onBulkUpdatePriority(selectedTasks, data.priority);
          toast.success(`Priority updated for ${selectedCount} tasks`);
          setShowPriorityModal(false);
          setSelectedPriority('');
          break;
        case 'update_due_date':
          await onBulkUpdateDueDate(selectedTasks, data.dueDate);
          toast.success(`Due date updated for ${selectedCount} tasks`);
          setShowDateModal(false);
          setSelectedDate('');
          break;
        case 'move':
          await onBulkMove(selectedTasks, data.goalId);
          toast.success(`${selectedCount} tasks moved`);
          setShowMoveModal(false);
          setSelectedGoal('');
          break;
      }
    } catch (error) {
      toast.error(`Failed to perform bulk action: ${error.message}`);
    }
  };

  const quickActions = [
    {
      id: 'complete',
      label: 'Complete',
      icon: CheckCircle2,
      color: 'green',
      action: () => handleBulkAction('complete')
    },
    {
      id: 'incomplete',
      label: 'Mark Incomplete',
      icon: Circle,
      color: 'yellow',
      action: () => handleBulkAction('incomplete')
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      color: 'red',
      action: () => handleBulkAction('delete')
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: Archive,
      color: 'slate',
      action: () => handleBulkAction('archive')
    }
  ];

  const advancedActions = [
    {
      id: 'assign_tag',
      label: 'Assign Tag',
      icon: Tag,
      color: 'purple',
      action: () => setShowTagModal(true)
    },
    {
      id: 'update_priority',
      label: 'Change Priority',
      icon: Flag,
      color: 'orange',
      action: () => setShowPriorityModal(true)
    },
    {
      id: 'update_due_date',
      label: 'Set Due Date',
      icon: Calendar,
      color: 'blue',
      action: () => setShowDateModal(true)
    },
    {
      id: 'move',
      label: 'Move to Goal',
      icon: Move,
      color: 'cyan',
      action: () => setShowMoveModal(true)
    }
  ];

  return (
    <>
      {/* Bulk Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/20 p-4">
          <div className="flex items-center gap-4">
            {/* Selection Count */}
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">
                {selectedCount}
              </div>
              <span className="text-sm font-medium">
                {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                      action.color === 'green' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                      action.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' :
                      action.color === 'red' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                      'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
                    }`}
                    title={action.label}
                  >
                    <Icon size={16} />
                  </button>
                );
              })}
            </div>

            {/* More Actions */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="flex items-center gap-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded-lg transition-colors"
              >
                More
                <ChevronDown 
                  size={16} 
                  className={`transition-transform ${showActions ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-full mb-2 right-0 bg-slate-800 rounded-xl border border-slate-700/50 shadow-xl min-w-48"
                  >
                    {advancedActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={action.action}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:text-white hover:bg-slate-700/50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                        >
                          <Icon size={16} className={`
                            ${action.color === 'purple' ? 'text-purple-400' :
                              action.color === 'orange' ? 'text-orange-400' :
                              action.color === 'blue' ? 'text-blue-400' :
                              action.color === 'cyan' ? 'text-cyan-400' :
                              'text-slate-400'}
                          `} />
                          {action.label}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clear Selection */}
            <button
              onClick={onClearSelection}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tag Assignment Modal */}
      <AnimatePresence>
        {showTagModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Assign Tag</h3>
                <button
                  onClick={() => setShowTagModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select tag to assign to {selectedCount} tasks
                  </label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="">Choose a tag...</option>
                    {tags.map(tag => (
                      <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTagModal(false)}
                    className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => selectedTag && handleBulkAction('assign_tag', { tagId: selectedTag })}
                    disabled={!selectedTag}
                    className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Assign Tag
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Priority Update Modal */}
      <AnimatePresence>
        {showPriorityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Change Priority</h3>
                <button
                  onClick={() => setShowPriorityModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Set priority for {selectedCount} tasks
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="">Choose priority...</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPriorityModal(false)}
                    className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => selectedPriority && handleBulkAction('update_priority', { priority: selectedPriority })}
                    disabled={!selectedPriority}
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Update Priority
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Due Date Update Modal */}
      <AnimatePresence>
        {showDateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Set Due Date</h3>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Set due date for {selectedCount} tasks
                  </label>
                  <input
                    type="datetime-local"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDateModal(false)}
                    className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => selectedDate && handleBulkAction('update_due_date', { dueDate: selectedDate })}
                    disabled={!selectedDate}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Set Due Date
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Move to Goal Modal */}
      <AnimatePresence>
        {showMoveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Move to Goal</h3>
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Move {selectedCount} tasks to goal
                  </label>
                  <select
                    value={selectedGoal}
                    onChange={(e) => setSelectedGoal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="">Choose a goal...</option>
                    <option value="none">No Goal</option>
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMoveModal(false)}
                    className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => selectedGoal !== '' && handleBulkAction('move', { goalId: selectedGoal === 'none' ? null : selectedGoal })}
                    disabled={selectedGoal === ''}
                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Move Tasks
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BulkOperations;
