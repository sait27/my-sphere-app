import React, { useState } from 'react';
import { X, Sparkles, Calendar, Clock, Tag, Target } from 'lucide-react';

const CreateTodoModal = ({ isOpen, onClose, onSubmit, goals = [], tags = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    task_type: 'personal',
    due_date: '',
    estimated_duration: null,
    goal: null
  });
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiText, setAiText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isAIMode) {
      onSubmit({ text: aiText, isAI: true });
    } else {
      onSubmit(formData);
    }
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      task_type: 'personal',
      due_date: '',
      estimated_duration: null,
      goal: null
    });
    setAiText('');
    setIsAIMode(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white">Create New Task</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsAIMode(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                !isAIMode ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              <Target size={16} />
              Manual
            </button>
            <button
              onClick={() => setIsAIMode(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isAIMode ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              <Sparkles size={16} />
              AI Assistant
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isAIMode ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Describe your task naturally
                </label>
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  placeholder="e.g., 'Call dentist tomorrow at 2pm for appointment, high priority'"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  rows={4}
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                    <select
                      value={formData.task_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, task_type: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="health">Health</option>
                      <option value="finance">Finance</option>
                      <option value="learning">Learning</option>
                      <option value="social">Social</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                    <input
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Duration (min)</label>
                    <input
                      type="number"
                      value={formData.estimated_duration || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="30"
                    />
                  </div>
                </div>

                {goals.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Goal</label>
                    <select
                      value={formData.goal || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value ? parseInt(e.target.value) : null }))}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">No Goal</option>
                      {goals.map(goal => (
                        <option key={goal.id} value={goal.id}>{goal.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isAIMode 
                    ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTodoModal;