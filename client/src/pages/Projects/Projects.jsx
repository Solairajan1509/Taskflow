import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Users, Folder, FolderOpen, Mail, X, Loader, AlertCircle, Sparkles } from 'lucide-react';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals visibility
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Form states
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    category: 'Web App',
    status: 'Not Started',
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch projects from MERN backend
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleNewProjectChange = (e) => {
    setNewProjectData({ ...newProjectData, [e.target.name]: e.target.value });
  };

  const handleNewProjectSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectData.name) return;

    setIsSubmitting(true);
    setError('');

    try {
      const { data } = await api.post('/projects', newProjectData);
      setProjects([data, ...projects]);
      setShowNewProjectModal(false);
      setNewProjectData({
        name: '',
        description: '',
        category: 'Web App',
        status: 'Not Started',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenInvite = (projectId) => {
    setActiveProjectId(projectId);
    setInviteEmail('');
    setInviteSuccessMessage('');
    setError('');
    setShowInviteModal(true);
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !activeProjectId) return;

    setIsSubmitting(true);
    setError('');
    setInviteSuccessMessage('');

    try {
      const { data } = await api.post(`/projects/${activeProjectId}/invite`, {
        email: inviteEmail,
      });
      setInviteSuccessMessage(data.message || 'Invitation sent successfully!');
      
      // Update state dynamically with populated members list
      if (data.project) {
        setProjects(
          projects.map((p) => (p._id === activeProjectId ? data.project : p))
        );
      }
      
      setTimeout(() => {
        setShowInviteModal(false);
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation invite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-emerald-500/10 filter blur-3xl"></div>
        <div className="absolute top-0 left-1/3 w-64 h-64 rounded-full bg-indigo-500/10 filter blur-3xl"></div>
        
        <div className="z-10 space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-emerald-400 animate-pulse" />
            <span>Workspace Projects</span>
          </h1>
          <p className="text-sm text-slate-400">
            Create project containers and invite other team members to collaborate together.
          </p>
        </div>
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-5 py-3 text-sm font-bold flex items-center space-x-2 shadow-lg shadow-emerald-700/25 active:scale-95 transition-all z-10"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {error && !showInviteModal && !showNewProjectModal && (
        <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Projects List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader className="h-10 w-10 text-emerald-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading your project workspaces...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 p-12 text-center shadow-sm space-y-4">
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-700/50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <FolderOpen className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">No projects found</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">Get started by creating your first workspace and inviting your team partners to collaborate.</p>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-600 rounded-xl px-4 py-2.5 text-xs font-bold transition-all"
          >
            Create a Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj._id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div>
                {/* Category & Status Badges */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 px-3 py-1 rounded-full">
                    {proj.category}
                  </span>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                    proj.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                    proj.status === 'In Progress' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' :
                    proj.status === 'On Hold' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                    'bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400'
                  }`}>
                    {proj.status}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="font-bold text-slate-800 dark:text-white text-base mb-2">{proj.name}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed mb-6 truncate-3-lines min-h-[4.5em]">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              {/* Members Invite Action Panel */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700/40">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-bold">
                    <Users className="h-4 w-4 text-emerald-500" />
                    <span>{proj.members?.length || 1} Members</span>
                    {proj.owner === proj.members?.[0]?.user?._id && (
                      <span className="text-[10px] font-bold text-emerald-600 ml-2">(Leader)</span>
                    )}
                  </div>
                  
                  {/* Invite button — Owner or Project Leader only */}
                  {(proj.owner?._id === user?._id || proj.members?.some((m) => m.user?._id === user?._id && m.role === 'project_leader')) && (
                    <button
                      onClick={() => handleOpenInvite(proj._id)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center space-x-1 hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>+ Invite</span>
                    </button>
                  )}
                </div>

                {/* Members list indicators */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.members?.slice(0, 5).map((m) => (
                    <div
                      key={m.user?._id}
                      title={`${m.user?.name} (${m.role?.replace('_', ' ')}) - ${m.user?.status}`}
                      className={`h-7 px-2.5 rounded-full text-[10px] font-semibold flex items-center justify-center border capitalize ${
                        m.user?.status === 'inactive'
                          ? 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30'
                      }`}
                    >
                      {m.user?.name}
                    </div>
                  ))}
                  {proj.members?.length > 5 && (
                    <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                      +{proj.members.length - 5}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Project creation */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-700/50 relative">
            <button
              onClick={() => setShowNewProjectModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-xl font-black mb-1 flex items-center space-x-2">
              <Folder className="h-5 w-5 text-emerald-500" />
              <span>Create Project Container</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">Specify project workspace settings below.</p>

            {error && (
              <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-xs mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleNewProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Project Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. TaskFlow System"
                  value={newProjectData.name}
                  onChange={handleNewProjectChange}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Workspace goal outlines..."
                  value={newProjectData.description}
                  onChange={handleNewProjectChange}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    name="category"
                    value={newProjectData.category}
                    onChange={handleNewProjectChange}
                    className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Web App">Web App</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Marketing">Marketing</option>
                    <option value="UI Design">UI Design</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Initial Status</label>
                  <select
                    name="status"
                    value={newProjectData.status}
                    onChange={handleNewProjectChange}
                    className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700/40">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="w-1/2 border border-slate-200 dark:border-slate-700 rounded-xl py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-md shadow-emerald-600/10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite member */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-700/50 relative animate-scale-up">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-black mb-1 flex items-center space-x-2">
              <Mail className="h-5 w-5 text-emerald-500" />
              <span>Invite Member</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">Add a team member to collaborate on this workspace.</p>

            {error && (
              <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/30 text-xs mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {inviteSuccessMessage && (
              <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs mb-4">
                <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>{inviteSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@gmail.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || inviteSuccessMessage}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Sending Invite...</span>
                  </>
                ) : (
                  <span>Send Invite Email</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Projects;
