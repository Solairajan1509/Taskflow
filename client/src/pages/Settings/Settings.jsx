import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name: name.trim() });
      setUser(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black">Account Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure profile details and workspace parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Profile Card Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Profile Specifications</h3>

          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  disabled
                  className="w-full bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-md shadow-emerald-600/10 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Loader className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Parameters'}
            </button>
          </form>
        </div>

        {/* Configurations toggles */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-white text-base">Alert Preferences</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Notifications</span>
                <p className="text-[10px] text-slate-400">Receive summaries of assigned tasks.</p>
              </div>
              <input type="checkbox" defaultChecked className="accent-emerald-600 h-4 w-4" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Real-Time Sync</span>
                <p className="text-[10px] text-slate-400">Receive notifications immediately.</p>
              </div>
              <input type="checkbox" defaultChecked className="accent-emerald-600 h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
