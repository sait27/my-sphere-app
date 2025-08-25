import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Search, FileText, Tag, Calendar, Star, Users, Hash, Info, CheckCircle2, XCircle, Edit, Trash2, Copy, Eye, EyeOff, Settings, Clock, Repeat, Link, Paperclip, MessageSquare, DollarSign, List, LayoutGrid, ListFilter, SlidersHorizontal, Share2, Download, Upload, RefreshCw, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTodos } from '../../hooks/useTodos';

const TodoTemplates = () => {
  const { templates, createTemplate, createTaskFromTemplate, recurringTemplates, createRecurringTemplate, generateRecurringTasks } = useTodos();

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    priority: 'medium',
    due_date_offset_days: 0,
    tags: [],
    assigned_to: [],
    is_public: false,
    task_type: 'task',
    subtasks: [],
    attachments: [],
    comments: [],
    estimated_time_minutes: 0,
    recurring_pattern: null,
    custom_fields: [],
  });

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await createTemplate(newTemplate);
      toast.success('Todo template created successfully!');
      setNewTemplate({
        name: '',
        description: '',
        priority: 'medium',
        due_date_offset_days: 0,
        tags: [],
        assigned_to: [],
        is_public: false,
        task_type: 'task',
        subtasks: [],
        attachments: [],
        comments: [],
        estimated_time_minutes: 0,
        recurring_pattern: null,
        custom_fields: [],
      });
    } catch (error) {
      toast.error(error.message || 'Failed to create todo template.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 mb-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Todo Templates</h2>

      {/* Create New Template Form */}
      <div className="mb-8 p-6 bg-slate-700/50 rounded-lg border border-slate-600/50">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <PlusCircle size={20} className="text-green-400" />
          Create New Todo Template
        </h3>
        <form onSubmit={handleCreateTemplate} className="space-y-4">
          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-slate-300 mb-1">Template Name</label>
            <input
              type="text"
              id="templateName"
              className="w-full p-2 rounded-md bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Daily Standup Agenda, Project Kickoff Checklist"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="templateDescription" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              id="templateDescription"
              rows="3"
              className="w-full p-2 rounded-md bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Briefly describe what this template is for..."
              value={newTemplate.description}
              onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            ></textarea>
          </div>
          {/* Add more fields for priority, due_date_offset_days, tags, etc. as needed */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out flex items-center justify-center gap-2"
          >
            <PlusCircle size={20} />
            Create Template
          </button>
        </form>
      </div>

      {/* Existing Templates List */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FileText size={20} className="text-purple-400" />
          Your Todo Templates
        </h3>
        {templates.length === 0 ? (
          <p className="text-slate-400">No todo templates created yet. Start by creating one above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <motion.div
                key={template.id}
                className="bg-slate-700/50 p-4 rounded-lg border border-slate-600/50 flex flex-col justify-between"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <h4 className="font-bold text-white text-lg mb-1">{template.name}</h4>
                  <p className="text-slate-400 text-sm mb-3">{template.description || 'No description provided.'}</p>
                  {/* Display other template properties like priority, tags, etc. */}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    onClick={() => toast.info('Functionality to use template coming soon!')}
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    onClick={() => toast.info('Functionality to edit template coming soon!')}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="text-red-400 hover:text-red-300 transition-colors"
                    onClick={() => toast.info('Functionality to delete template coming soon!')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recurring Templates Section (Optional, based on backend support) */}
      <div className="mt-8 p-6 bg-slate-700/50 rounded-lg border border-slate-600/50">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Repeat size={20} className="text-orange-400" />
          Recurring Todo Templates
        </h3>
        {recurringTemplates.length === 0 ? (
          <p className="text-slate-400">No recurring todo templates created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recurringTemplates.map(template => (
              <motion.div
                key={template.id}
                className="bg-slate-700/50 p-4 rounded-lg border border-slate-600/50 flex flex-col justify-between"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <h4 className="font-bold text-white text-lg mb-1">{template.name}</h4>
                  <p className="text-slate-400 text-sm mb-3">{template.description || 'No description provided.'}</p>
                  <p className="text-slate-500 text-xs">Pattern: {template.recurring_pattern?.type || 'N/A'}</p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    onClick={() => toast.info('Functionality to generate tasks from recurring template coming soon!')}
                  >
                    <Play size={18} />
                  </button>
                  <button
                    className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    onClick={() => toast.info('Functionality to edit recurring template coming soon!')}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className="text-red-400 hover:text-red-300 transition-colors"
                    onClick={() => toast.info('Functionality to delete recurring template coming soon!')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TodoTemplates;