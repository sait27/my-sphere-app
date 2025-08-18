import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

const KeyboardShortcuts = ({ 
  onCreateTask, 
  onSearch, 
  onToggleView, 
  onBulkMode,
  onShowShortcuts,
  isVisible 
}) => {
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  useEffect(() => {
    const handleKeydown = (e) => {
      // Don't trigger shortcuts when user is typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Prevent default for our shortcuts
      const shortcuts = {
        'KeyN': () => { e.preventDefault(); onCreateTask?.(); },
        'KeyS': () => { e.preventDefault(); onSearch?.(); },
        'KeyV': () => { e.preventDefault(); onToggleView?.(); },
        'KeyB': () => { e.preventDefault(); onBulkMode?.(); },
        'KeyH': () => { e.preventDefault(); setShowShortcutsModal(true); },
        'Escape': () => { setShowShortcutsModal(false); }
      };

      // Check for Ctrl/Cmd + key combinations
      if ((e.ctrlKey || e.metaKey) && shortcuts[e.code]) {
        shortcuts[e.code]();
      } 
      // Check for single key shortcuts (when not in input)
      else if (!e.ctrlKey && !e.metaKey && !e.altKey && shortcuts[e.code]) {
        shortcuts[e.code]();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [onCreateTask, onSearch, onToggleView, onBulkMode]);

  const shortcuts = [
    { key: 'Ctrl/⌘ + N', action: 'Create new task', description: 'Opens the task creation modal' },
    { key: 'Ctrl/⌘ + S', action: 'Focus search', description: 'Focuses the search input field' },
    { key: 'Ctrl/⌘ + V', action: 'Toggle view', description: 'Switches between grid and list view' },
    { key: 'Ctrl/⌘ + B', action: 'Bulk mode', description: 'Toggles bulk selection mode' },
    { key: 'Ctrl/⌘ + H', action: 'Show shortcuts', description: 'Shows this help dialog' },
    { key: 'Escape', action: 'Close modal', description: 'Closes any open modal or dialog' },
    { key: '↑/↓', action: 'Navigate tasks', description: 'Navigate through tasks (coming soon)' },
    { key: 'Enter', action: 'Select/Edit task', description: 'Select or edit focused task (coming soon)' },
    { key: 'Space', action: 'Complete task', description: 'Toggle completion status (coming soon)' },
    { key: 'Delete', action: 'Delete task', description: 'Delete selected task (coming soon)' }
  ];

  useEffect(() => {
    if (isVisible) {
      setShowShortcutsModal(true);
    }
  }, [isVisible]);

  return (
    <>
      {/* Keyboard shortcuts indicator */}
      <button
        onClick={() => setShowShortcutsModal(true)}
        className="fixed bottom-4 right-4 p-3 bg-slate-800/80 backdrop-blur-xl rounded-full border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 text-slate-400 hover:text-cyan-400 z-40"
        title="Keyboard shortcuts (Ctrl/⌘ + H)"
      >
        <Keyboard size={20} />
      </button>

      {/* Shortcuts modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                    <Keyboard className="text-purple-400" size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white">{shortcut.action}</div>
                      <div className="text-sm text-slate-400">{shortcut.description}</div>
                    </div>
                    <div className="ml-4">
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-sm font-mono">
                        {shortcut.key}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-slate-700/20 rounded-lg">
                <h3 className="text-sm font-medium text-white mb-2">💡 Pro Tips</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Use Ctrl (or ⌘ on Mac) + key combinations for main actions</li>
                  <li>• Single key shortcuts work when not typing in inputs</li>
                  <li>• More navigation shortcuts coming in future updates</li>
                  <li>• Press Escape to close any modal or cancel current action</li>
                </ul>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg transition-all duration-200"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KeyboardShortcuts;
