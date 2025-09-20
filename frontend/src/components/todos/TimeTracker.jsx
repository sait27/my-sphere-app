import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { todosAPI } from '../../api/todos';
import { toast } from 'react-hot-toast';

const TimeTracker = ({ taskId, onTimeUpdate }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning && activeEntry) {
      interval = setInterval(() => {
        const startTime = new Date(activeEntry.start_time);
        const now = new Date();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activeEntry]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = async () => {
    try {
      const response = await todosAPI.timeEntries.startTimer(taskId);
      setActiveEntry(response.data);
      setIsRunning(true);
      setElapsedTime(0);
      toast.success('Timer started');
    } catch (error) {
      toast.error('Failed to start timer');
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;
    
    try {
      await todosAPI.timeEntries.stopTimer(activeEntry.id);
      setIsRunning(false);
      setActiveEntry(null);
      setElapsedTime(0);
      onTimeUpdate?.();
      toast.success('Timer stopped');
    } catch (error) {
      toast.error('Failed to stop timer');
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-700/40 to-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-600/30">
      <div className="flex items-center gap-2">
        <Clock size={18} className={`${isRunning ? 'text-blue-400 animate-pulse' : 'text-slate-400'} transition-colors`} />
        <span className="text-lg font-mono font-bold text-white min-w-[80px] bg-slate-900/50 px-2 py-1 rounded-lg">
          {formatTime(elapsedTime)}
        </span>
      </div>
      
      {!isRunning ? (
        <button
          onClick={startTimer}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 hover:from-green-500/30 hover:to-green-600/30 text-green-400 rounded-lg text-sm font-semibold border border-green-500/30 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20"
        >
          <Play size={14} />
          Start
        </button>
      ) : (
        <button
          onClick={stopTimer}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-400 rounded-lg text-sm font-semibold border border-red-500/30 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20 animate-pulse"
        >
          <Square size={14} />
          Stop
        </button>
      )}
    </div>
  );
};

export default TimeTracker;