import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { CheckCircle, Clock, AlertTriangle, Users, Loader } from 'lucide-react';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get('/analytics/stats'),
          api.get('/activities'),
        ]);
        setStats(statsRes.data);
        setActivities(activityRes.data.slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const statCards = [
    { name: 'Active Projects', value: stats?.totalProjects || 0, icon: Clock, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { name: 'Completed Tasks', value: stats?.completedTasks || 0, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { name: 'Overdue Tasks', value: stats?.overdueTasks || 0, icon: AlertTriangle, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
    { name: 'Completion', value: stats ? `${stats.completionPercentage}%` : '0%', icon: Users, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
  ];

  const statusMap = { 'To Do': 0, 'In Progress': 0, 'Review': 0, 'Done': 0 };
  stats?.tasksByStatus?.forEach((s) => { statusMap[s._id] = s.count; });

  const doughnutData = {
    labels: Object.keys(statusMap),
    datasets: [{
      data: Object.values(statusMap),
      backgroundColor: ['rgba(148, 163, 184, 0.75)', 'rgba(59, 130, 246, 0.75)', 'rgba(245, 158, 11, 0.75)', 'rgba(16, 185, 129, 0.75)'],
      borderColor: ['#cbd5e1', '#bfdbfe', '#fde68a', '#a7f3d0'],
      borderWidth: 1,
    }],
  };

  const barData = {
    labels: stats?.projectProgress?.map((p) => p.name) || [],
    datasets: [{
      label: 'Progress %',
      data: stats?.projectProgress?.map((p) => p.progress) || [],
      backgroundColor: 'rgba(16, 185, 129, 0.65)',
      borderRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { color: 'rgba(148, 163, 184, 1)', font: { family: 'Inter', size: 11 } } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'rgba(148, 163, 184, 0.8)' } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: 'rgba(148, 163, 184, 0.8)' }, beginAtZero: true, max: 100 },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-10 w-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-emerald-600 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20"></div>
        <div className="z-10 space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-emerald-100/80 text-sm max-w-lg font-light leading-relaxed">
            Here's a snapshot of your team's tasks and deliverable health.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-6 flex items-center justify-between transition-all hover:-translate-y-0.5 duration-200">
              <div className="space-y-1">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{stat.name}</span>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4 sm:p-6 flex flex-col justify-between">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 sm:mb-6">Task Breakdown</h3>
          <div className="max-w-[240px] mx-auto w-full h-64 sm:h-72">
            <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom', labels: { color: 'rgba(148, 163, 184, 1)' } } }, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4 sm:p-6 xl:col-span-2">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 sm:mb-6">Project Progress</h3>
          <div className="h-64 sm:h-72">
            <Bar data={barData} options={{ ...chartOptions, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4 sm:p-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet. Start by creating a project.</p>
            ) : (
              activities.map((act) => (
                <div key={act._id} className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start text-sm pb-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{act.user?.name}</span>{' '}
                      {act.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{new Date(act.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 p-4 sm:p-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-6">Team Productivity</h3>
          {stats?.tasksByMember?.length === 0 ? (
            <p className="text-sm text-slate-400">No task data yet.</p>
          ) : (
            <div className="space-y-4">
              {stats?.tasksByMember?.map((m) => (
                <div key={m._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {m.user?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{m.user?.name || 'Unknown'}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-emerald-600">{m.completed}</span>/{m.total} done
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
