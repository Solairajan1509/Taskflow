import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Plus, Mail, X, Loader, AlertCircle } from 'lucide-react';

const Team = () => {
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Form states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch projects and extract unique members
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/projects');
      setProjects(data);

      // Collect all unique members across all projects
      const membersMap = {};
      data.forEach((project) => {
        // Add owner
        if (project.owner && project.owner._id) {
          membersMap[project.owner._id] = {
            ...project.owner,
            projects: new Set([...(membersMap[project.owner._id]?.projects || []), project.name]),
            roles: new Set([...(membersMap[project.owner._id]?.roles || []), 'project_leader']),
          };
        }
        // Add members
        if (project.members) {
          project.members.forEach((m) => {
            const user = m.user || m;
            if (user && user._id) {
              membersMap[user._id] = {
                ...user,
                projects: new Set([...(membersMap[user._id]?.projects || []), project.name]),
                roles: new Set([...(membersMap[user._id]?.roles || []), m.role || 'team_member']),
              };
            }
          });
        }
      });

      // Convert map to array and format project names/roles list
      const membersList = Object.values(membersMap).map((m) => ({
        ...m,
        projectsList: Array.from(m.projects).join(', '),
        role: Array.from(m.roles).join(', '),
      }));

      setMembers(membersList);
      
      if (data.length > 0) {
        setSelectedProjectId(data[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch team collaborators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !selectedProjectId) return;

    setIsSubmitting(true);
    setError('');
    setInviteSuccessMessage('');

    try {
      const { data } = await api.post(`/projects/${selectedProjectId}/invite`, {
        email: inviteEmail,
      });
      setInviteSuccessMessage(data.message || 'Invitation sent successfully!');
      
      // Refresh database records
      await fetchData();

      setTimeout(() => {
        setShowInviteModal(false);
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send workspace invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-80 h-80 rounded-full bg-emerald-500/10 filter blur-3xl"></div>
        <div className="absolute top-0 left-1/3 w-64 h-64 rounded-full bg-indigo-500/10 filter blur-3xl"></div>

        <div className="z-10 space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center space-x-2">
            <Users className="h-6 w-6 text-emerald-400" />
            <span>Team Collaborators</span>
          </h1>
          <p className="text-sm text-slate-400">
            View team members, roles, and project allocations across your active workspaces.
          </p>
        </div>
        
        {projects.length > 0 && (
          <button
            onClick={() => {
              setInviteEmail('');
              setInviteSuccessMessage('');
              setError('');
              setShowInviteModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-5 py-3 text-sm font-bold flex items-center space-x-2 shadow-lg shadow-emerald-700/25 active:scale-95 transition-all z-10"
          >
            <Plus className="h-4 w-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {error && !showInviteModal && (
        <div className="flex items-center space-x-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Collaborators List Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader className="h-10 w-10 text-emerald-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading team members...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 p-12 text-center shadow-sm space-y-4">
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-700/50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Users className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">No collaborators found</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">Create a project workspace and invite team members to start working together.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700/40 text-xs font-bold uppercase text-slate-400 tracking-wider">
                  <th className="p-4 pl-6">Collaborator</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Active Projects</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
                {members.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/10 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-800 dark:text-white">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">{member.email}</td>
                    <td className="p-4 font-bold text-xs text-slate-700 dark:text-slate-300 capitalize">{member.role?.replace(/_/g, ' ')}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">{member.projectsList}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                        member.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-900/30 dark:text-slate-500'
                      }`}>
                        {member.status === 'active' ? 'Active' : 'Pending Verification'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Invite member */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 dark:border-slate-700/50 relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-black mb-1 flex items-center space-x-2">
              <Mail className="h-5 w-5 text-emerald-500" />
              <span>Invite Team Member</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">Send workspace invite link to join your team projects.</p>

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
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="you@gmail.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-bold">Select Project Workspace</label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
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
                  <span>Send Workspace Invite</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Team;
