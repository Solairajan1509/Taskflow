import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Loader, Users, FolderKanban, CheckSquare, BarChart3, Activity, Trash2, AlertCircle,
  Shield, UserCheck, UserX, X, Search,
} from 'lucide-react';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'teams', label: 'Teams', icon: Shield },
];

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const requests = { dashboard: loadDashboard, users: loadUsers, projects: loadProjects, tasks: loadTasks, teams: loadTeams };
      if (requests[activeTab]) await requests[activeTab]();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    const { data } = await api.get('/admin/stats');
    setStats(data);
  };

  const loadUsers = async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  };

  const loadProjects = async () => {
    const { data } = await api.get('/admin/projects');
    setProjects(data);
  };

  const loadTasks = async () => {
    const { data } = await api.get('/admin/tasks');
    setTasks(data);
  };

  const loadTeams = async () => {
    const { data } = await api.get('/admin/teams');
    setTeams(data);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and unassign all their tasks?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleUpdateRole = async (id, role) => {
    const newRole = role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      const { data } = await api.patch(`/admin/users/${id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u._id === id ? data : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/status`);
      setUsers((prev) => prev.map((u) => (u._id === id ? data : u)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/admin/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Delete this team?')) return;
    try {
      await api.delete(`/admin/teams/${id}`);
      setTeams((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete team');
    }
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Projects', value: stats.totalProjects, icon: FolderKanban, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Teams', value: stats.totalTeams, icon: Shield, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
    { label: 'Completed Tasks', value: stats.completedTasks, icon: CheckSquare, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: BarChart3, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
  ] : [];

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTasks = tasks.filter((t) =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTeams = teams.filter((t) =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-10 w-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{s.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${s.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" /> User Task Performance
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats?.userTaskStats?.length === 0 ? (
              <p className="text-sm text-slate-400">No task data yet.</p>
            ) : (
              stats?.userTaskStats?.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {u.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{u.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{u.total} tasks · {u.completed} completed</p>
                    </div>
                  </div>
                  <div className="text-xs font-bold">
                    <span className={u.total > 0 && u.completed / u.total >= 0.7 ? 'text-emerald-600' : 'text-amber-600'}>
                      {u.total > 0 ? Math.round((u.completed / u.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" /> Recent Activity
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats?.recentActivities?.length === 0 ? (
              <p className="text-sm text-slate-400">No recent activity.</p>
            ) : (
              stats?.recentActivities?.map((act) => (
                <div key={act._id} className="flex items-center gap-3 text-sm pb-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {act.user?.name?.charAt(0) || '?'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 flex-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{act.user?.name}</span> {act.description}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">{new Date(act.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Recent Projects</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {stats?.recentProjects?.length === 0 ? (
              <p className="text-sm text-slate-400">No projects yet.</p>
            ) : (
              stats?.recentProjects?.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="h-4 w-4 text-indigo-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.owner?.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Recent Teams</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {stats?.recentTeams?.length === 0 ? (
              <p className="text-sm text-slate-400">No teams yet.</p>
            ) : (
              stats?.recentTeams?.map((t) => (
                <div key={t._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.name}</p>
                      <p className="text-xs text-slate-400">Leader: {t.leader?.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">{t.members?.length || 0} members</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4 animate-fade-in">
      {loading ? (
        <div className="flex justify-center py-10"><Loader className="h-8 w-8 text-emerald-500 animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Joined</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {u.name?.charAt(0) || '?'}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleUpdateRole(u._id, u.role)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded-lg transition-colors"
                          title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u._id)}
                          className={`p-1.5 rounded-lg transition-colors ${u.status === 'active' ? 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'}`}
                          title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {u.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No users found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-4 animate-fade-in">
      {loading ? (
        <div className="flex justify-center py-10"><Loader className="h-8 w-8 text-emerald-500 animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Project</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Owner</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Members</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Created</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredProjects.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FolderKanban className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.owner?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        p.status === 'In Progress' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' :
                        p.status === 'On Hold' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{p.members?.length || 0}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteProject(p._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProjects.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No projects found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-4 animate-fade-in">
      {loading ? (
        <div className="flex justify-center py-10"><Loader className="h-8 w-8 text-emerald-500 animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Task</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Project</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Assigned To</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Created</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredTasks.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CheckSquare className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{t.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.project?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.assignedTo?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        t.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' :
                        t.priority === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        t.status === 'Done' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        t.status === 'In Progress' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' :
                        t.status === 'Review' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteTask(t._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTasks.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No tasks found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderTeams = () => (
    <div className="space-y-4 animate-fade-in">
      {loading ? (
        <div className="flex justify-center py-10"><Loader className="h-8 w-8 text-emerald-500 animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Team</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Leader</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Members</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Created</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredTeams.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-purple-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.leader?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{t.members?.length || 0}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteTeam(t._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        title="Delete team"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTeams.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No teams found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">System overview, user management, and analytics.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab !== 'dashboard' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'projects' && renderProjects()}
      {activeTab === 'tasks' && renderTasks()}
      {activeTab === 'teams' && renderTeams()}
    </div>
  );
};

export default Admin;