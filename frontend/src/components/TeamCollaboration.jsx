import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Activity, 
  Bell,
  Share2,
  Eye,
  UserCheck,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  AtSign,
  Hash
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const TeamCollaboration = ({ 
  task,
  currentUser,
  onAssignUser,
  onAddComment,
  onUpdateTaskStatus,
  teamMembers = [],
  activityLog = [],
  isVisible = false,
  onClose
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('assignee');
  const [mentions, setMentions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);

  // Real-time activity simulation
  const [recentActivity, setRecentActivity] = useState(activityLog);

  useEffect(() => {
    // Simulate real-time activity updates
    const interval = setInterval(() => {
      // In a real app, this would be from websockets or polling
      // For demo, we'll just add mock activities occasionally
      if (Math.random() > 0.95) {
        const mockActivity = {
          id: Date.now(),
          action: 'commented',
          user_username: teamMembers[Math.floor(Math.random() * teamMembers.length)]?.username || 'TeamMember',
          description: 'Added a new comment to the task',
          created_at: new Date().toISOString(),
          metadata: JSON.stringify({ type: 'realtime_update' })
        };
        setRecentActivity(prev => [mockActivity, ...prev.slice(0, 19)]);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [teamMembers]);

  const handleAssignUser = async () => {
    if (!selectedUser) return;
    
    try {
      await onAssignUser(task.id, selectedUser, selectedRole);
      setShowAssignModal(false);
      setSelectedUser('');
      setSelectedRole('assignee');
      toast.success('User assigned to task successfully!');
    } catch (error) {
      toast.error('Failed to assign user to task');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await onAddComment(task.id, newComment);
      setNewComment('');
      toast.success('Comment added successfully!');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleMention = (username) => {
    const atIndex = newComment.lastIndexOf('@');
    const beforeMention = newComment.substring(0, atIndex);
    const afterCursor = newComment.substring(newComment.length);
    setNewComment(beforeMention + `@${username} ` + afterCursor);
    setShowMentions(false);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'created': return <UserPlus size={14} className="text-green-400" />;
      case 'assigned': return <UserCheck size={14} className="text-blue-400" />;
      case 'commented': return <MessageSquare size={14} className="text-purple-400" />;
      case 'status_changed': return <CheckCircle2 size={14} className="text-cyan-400" />;
      case 'priority_changed': return <AlertCircle size={14} className="text-orange-400" />;
      case 'time_logged': return <Clock size={14} className="text-yellow-400" />;
      default: return <Activity size={14} className="text-slate-400" />;
    }
  };

  const assignedUsers = task.assignments || [];
  const isAssignedToCurrentUser = assignedUsers.some(a => a.assigned_to === currentUser?.id);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
              <Users className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Team Collaboration</h2>
              <p className="text-sm text-slate-400">{task.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Left Panel - Team & Assignments */}
          <div className="w-1/3 p-6 border-r border-slate-700 overflow-y-auto">
            <div className="space-y-6">
              {/* Assigned Team Members */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Users size={16} />
                    Assigned Team ({assignedUsers.length})
                  </h3>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                    title="Assign team member"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  {assignedUsers.length > 0 ? assignedUsers.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {assignment.assigned_to_username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{assignment.assigned_to_username}</div>
                        <div className="text-xs text-slate-400 capitalize">{assignment.role}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        assignment.is_accepted ? 'bg-green-400' : 'bg-yellow-400'
                      }`} title={assignment.is_accepted ? 'Accepted' : 'Pending'} />
                    </div>
                  )) : (
                    <div className="text-center py-8 text-slate-400">
                      <Users size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No team members assigned</p>
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 mt-2"
                      >
                        Assign someone
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Task Status for Team */}
              <div>
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity size={16} />
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {isAssignedToCurrentUser && (
                    <>
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, 'in_progress')}
                        className="w-full text-left p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
                      >
                        Mark as In Progress
                      </button>
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, 'completed')}
                        className="w-full text-left p-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
                      >
                        Mark as Complete
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowActivityLog(!showActivityLog)}
                    className="w-full text-left p-3 bg-slate-600/20 hover:bg-slate-600/30 text-slate-300 rounded-lg transition-colors text-sm"
                  >
                    {showActivityLog ? 'Hide' : 'Show'} Activity Log
                  </button>
                </div>
              </div>

              {/* Activity Log */}
              <AnimatePresence>
                {showActivityLog && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Activity size={16} />
                      Recent Activity
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recentActivity.slice(0, 10).map((activity) => (
                        <div key={activity.id} className="flex gap-3 p-2 text-sm">
                          <div className="mt-1">
                            {getActivityIcon(activity.action)}
                          </div>
                          <div className="flex-1">
                            <div className="text-slate-300">
                              <span className="font-medium">{activity.user_username}</span>
                              {' '}{activity.description}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatTimeAgo(activity.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel - Comments & Communication */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <MessageSquare size={16} />
                Team Discussion ({task.comments?.length || 0})
              </h3>
              <div className="flex items-center gap-2">
                <button className="p-1.5 bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 rounded-lg transition-colors">
                  <Bell size={14} />
                </button>
                <button className="p-1.5 bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 rounded-lg transition-colors">
                  <Share2 size={14} />
                </button>
              </div>
            </div>

            {/* Comments Area */}
            <div className="flex-1 bg-slate-700/20 rounded-lg p-4 mb-4 overflow-y-auto">
              <div className="space-y-4">
                {task.comments && task.comments.length > 0 ? task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {comment.user_username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{comment.user_username}</span>
                        <span className="text-xs text-slate-500">{formatTimeAgo(comment.created_at)}</span>
                        {comment.is_edited && (
                          <span className="text-xs text-slate-500">(edited)</span>
                        )}
                      </div>
                      <div className="text-slate-300 text-sm bg-slate-600/20 rounded-lg p-3">
                        {comment.content}
                      </div>
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-4 mt-2 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {reply.user_username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-white text-sm">{reply.user_username}</span>
                                  <span className="text-xs text-slate-500">{formatTimeAgo(reply.created_at)}</span>
                                </div>
                                <div className="text-slate-300 text-sm bg-slate-600/10 rounded-lg p-2">
                                  {reply.content}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs">Start a discussion with your team</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleCommentSubmit} className="relative">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                      // Check for @ mentions
                      const text = e.target.value;
                      const atIndex = text.lastIndexOf('@');
                      if (atIndex !== -1 && atIndex === text.length - 1) {
                        setShowMentions(true);
                      } else {
                        setShowMentions(false);
                      }
                    }}
                    placeholder="Add a comment... Use @username to mention someone"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                    rows={3}
                  />
                  
                  {/* Mentions Dropdown */}
                  {showMentions && teamMembers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 max-h-32 overflow-y-auto">
                      {teamMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleMention(member.username)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-300 flex items-center gap-2"
                        >
                          <AtSign size={14} />
                          {member.username}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Assign User Modal */}
        <AnimatePresence>
          {showAssignModal && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 rounded-2xl p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Assign Team Member</h3>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Team Member
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    >
                      <option value="">Select team member...</option>
                      {teamMembers.filter(member => 
                        !assignedUsers.some(assigned => assigned.assigned_to === member.id)
                      ).map(member => (
                        <option key={member.id} value={member.id}>{member.username}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    >
                      <option value="assignee">Assignee</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="collaborator">Collaborator</option>
                      <option value="observer">Observer</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowAssignModal(false)}
                      className="flex-1 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssignUser}
                      disabled={!selectedUser}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default TeamCollaboration;
