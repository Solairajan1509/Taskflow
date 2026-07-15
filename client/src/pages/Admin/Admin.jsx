import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { Loader, Users, FolderKanban, CheckSquare, BarChart3, Activity, Trash2, AlertCircle } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and unassign all their tasks?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (user?.role !== 'admin') return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-10 w-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Projects', value: stats?.totalProjects || 0, icon: FolderKanban, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: CheckSquare, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Completion Rate', value: `${stats?.completionRate || 0}%`, icon: BarChart3, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">System overview, user management, and analytics.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
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
            <Users className="h-4 w-4 text-emerald-500" /> All Users
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {users.filter((u) => u.role === 'user').map((u) => (
              <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {u.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-slate-100 text-slate-500'}`}>
                    {u.status}
                  </span>
                  <button onClick={() => handleDeleteUser(u._id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

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
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5">
        <h2 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" /> Recent Activity
        </h2>
        <div className="space-y-3 max-h-60 overflow-y-auto">
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
  );
};

export default Admin;
