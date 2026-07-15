import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Calendar, Clock, AlertCircle, RefreshCw, Send, MessageCircle, User, Trash2, X, Loader } from 'lucide-react';
import { fetchTasks, createTask } from '../../services/taskApi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ project: '', title: '', description: '', priority: 'Medium', dueDate: '', duration: '', assignedTo: '' });
  const [projectMembers, setProjectMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) setSelectedProjectId(data[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) loadChatMessages(selectedProjectId);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!socket || !selectedTask) return;
    socket.emit('join:task', selectedTask._id);

    const onAdded = (comment) => {
      if (comment.task === selectedTask._id) setComments((prev) => [...prev, comment]);
    };
    const onDeleted = ({ commentId }) => {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    };

    socket.on('comment:added', onAdded);
    socket.on('comment:deleted', onDeleted);

    return () => {
      socket.emit('leave:task', selectedTask._id);
      socket.off('comment:added', onAdded);
      socket.off('comment:deleted', onDeleted);
    };
  }, [socket, selectedTask]);

  const loadComments = async (taskId) => {
    try {
      const { data } = await api.get(`/comments/${taskId}`);
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openTask = (task) => {
    setSelectedTask(task);
    loadComments(task._id);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedTask) return;
    setCommentLoading(true);
    try {
      const { data } = await api.post(`/comments/${selectedTask._id}`, { content: commentInput.trim() });
      setComments((prev) => [...prev, data]);
      setCommentInput('');
      toast.success('Comment added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const ledProjects = projects.filter((p) => p.owner?._id === user?._id || p.members?.some((m) => m.user?._id === user?._id && m.role === 'project_leader'));

  const openCreateModal = () => {
    const projectId = ledProjects[0]?._id || '';
    setCreateForm({ project: projectId, title: '', description: '', priority: 'Medium', dueDate: '', duration: '', assignedTo: '' });
    setShowCreateModal(true);
    if (projectId) loadProjectMembers(projectId);
  };

  const handleCreateFormChange = (e) => {
    const updated = { ...createForm, [e.target.name]: e.target.value };
    setCreateForm(updated);
    if (e.target.name === 'project') loadProjectMembers(e.target.value);
  };

  const loadProjectMembers = async (projectId) => {
    if (!projectId) { setProjectMembers([]); return; }
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      const allMembers = [
        { _id: data.owner._id, name: data.owner.name, email: data.owner.email, role: 'project_leader' },
        ...data.members.map((m) => ({ ...m.user, role: m.role })),
      ];
      setProjectMembers(allMembers);
    } catch (err) {
      console.error(err);
      setProjectMembers([]);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createForm.project || !createForm.title) {
      toast.error('Project and title are required');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        project: createForm.project,
        title: createForm.title,
        description: createForm.description,
        priority: createForm.priority,
        dueDate: createForm.dueDate || undefined,
        duration: createForm.duration ? Number(createForm.duration) : 0,
        assignedTo: createForm.assignedTo || undefined,
      };
      const { data } = await createTask(payload);
      setTasks((prev) => [data, ...prev]);
      setShowCreateModal(false);
      toast.success('Task created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const loadChatMessages = async (projectId) => {
    try {
      const { data } = await api.get(`/messages/${projectId}`);
      setChatMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedProjectId) return;
    setChatLoading(true);
    setChatError('');
    try {
      const { data } = await api.post('/messages', { content: chatInput.trim(), projectId: selectedProjectId });
      setChatMessages((prev) => [...prev, data]);
      setChatInput('');
    } catch (err) {
      setChatError(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">All Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review tasks, add comments, and chat with your team.</p>
        </div>
        <div className="flex items-center gap-3">
          {ledProjects.length > 0 && (
            <button onClick={openCreateModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Plus className="h-4 w-4" /> Create Task
            </button>
          )}
          <button onClick={loadTasks}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-300 p-4 text-sm">
          <AlertCircle className="inline h-4 w-4 mr-2 align-text-bottom" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_0.8fr] gap-6">
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex space-x-4 mb-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-700/50">
              <p className="text-slate-400 text-sm">No tasks yet. Create tasks from the project dashboard.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task._id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                  selectedTask?._id === task._id ? 'ring-2 ring-emerald-500' : ''
                }`}
                onClick={() => openTask(task)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800 dark:text-white">{task.title}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' :
                          task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700'
                        }`}>{task.priority || 'Medium'}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{task.description || 'No description'}</p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                        {task.duration > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{task.duration}h</span>}
                        {task.assignedTo && <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignedTo.name}</span>}
                        <span className={`font-semibold ${
                          task.status === 'Done' ? 'text-emerald-600' : task.status === 'In Progress' ? 'text-blue-600' : 'text-slate-500'
                        }`}>{task.status}</span>
                      </div>
                    </div>
                  </div>

                  {selectedTask?._id === task._id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Comments ({comments.length})</h4>
                      <div className="space-y-3 mb-3 max-h-48 overflow-y-auto">
                        {comments.length === 0 ? (
                          <p className="text-xs text-slate-400">No comments yet.</p>
                        ) : (
                          comments.map((comment) => (
                            <div key={comment._id} className="flex gap-2">
                              <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {comment.user?.name?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{comment.user?.name}</span>
                                  <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                                  {comment.user?._id === user?._id && (
                                    <button onClick={() => handleDeleteComment(comment._id)} className="ml-auto text-red-400 hover:text-red-600">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <form onSubmit={handleCommentSubmit} className="flex gap-2">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-500"
                        />
                        <button type="submit" disabled={commentLoading || !commentInput.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-2 disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              Team Chat
            </h3>
            <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}
              className="mt-2 w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-1.5 px-3 text-xs outline-none focus:border-emerald-500"
            >
              {projects.map((p) => (<option key={p._id} value={p._id}>{p.name}</option>))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No messages yet.</p>
            ) : (
              chatMessages.map((msg) => {
                const isMine = msg.sender?._id === user?._id;
                const isLeader = msg.sender?._id === projects.find((p) => p._id === selectedProjectId)?.owner?._id;
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-emerald-500 text-white' : isLeader ? 'bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30' : 'bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/50'}`}>
                      <p className="text-[11px] font-semibold mb-0.5 opacity-70">
                        {isMine ? 'You' : msg.sender?.name}{isLeader && !isMine ? ' (Leader)' : ''}
                      </p>
                      <p className="text-xs">{msg.content}</p>
                      <p className="text-[10px] mt-1 opacity-50">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-100 dark:border-slate-700/50">
            {chatError && <p className="text-[11px] text-red-500 mb-2">{chatError}</p>}
            <div className="flex gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                placeholder="Reply to team leader..."
                className="flex-1 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2 px-3 text-xs outline-none focus:border-emerald-500"
              />
              <button type="submit" disabled={chatLoading || !chatInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-2 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700/50 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700/50">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Create Task</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project</label>
                <select name="project" value={createForm.project} onChange={handleCreateFormChange} required
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">Select project</option>
                  {ledProjects.map((p) => (<option key={p._id} value={p._id}>{p.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Title</label>
                <input type="text" name="title" value={createForm.title} onChange={handleCreateFormChange} required
                  placeholder="Task title"
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea name="description" value={createForm.description} onChange={handleCreateFormChange} rows={3}
                  placeholder="Optional description"
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                  <select name="priority" value={createForm.priority} onChange={handleCreateFormChange}
                    className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duration (hrs)</label>
                  <input type="number" name="duration" value={createForm.duration} onChange={handleCreateFormChange} min="0"
                    placeholder="0"
                    className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
                <input type="date" name="dueDate" value={createForm.dueDate} onChange={handleCreateFormChange}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              {createForm.project && projectMembers.length > 0 && projectMembers.some((m) => m._id === user?._id && m.role === 'project_leader') && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assign To</label>
                  <select name="assignedTo" value={createForm.assignedTo} onChange={handleCreateFormChange}
                    className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.filter((m) => m._id !== user?._id).map((m) => (
                      <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="pt-2">
                <button type="submit" disabled={creating}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {creating ? <><Loader className="h-4 w-4 animate-spin" /> Creating...</> : <><Plus className="h-4 w-4" /> Create Task</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
