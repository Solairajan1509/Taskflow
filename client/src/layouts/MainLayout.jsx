import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationApi';
import api from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import {
  LayoutGrid, FolderKanban, CheckSquare, Columns, CalendarDays, Users, Settings, Shield,
  LogOut, Bell, Menu, X, User as UserIcon, Search,
} from 'lucide-react';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('notification:new', () => {
      loadUnreadCount();
    });
    return () => socket.off('notification:new');
  }, [socket]);

  useEffect(() => {
    if (showNotifications) loadNotifications();
  }, [showNotifications]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/search?q=${searchQuery}`);
        setSearchResults([...(data.projects || []), ...(data.tasks || []), ...(data.users || [])]);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const { data } = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutGrid },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Kanban', path: '/kanban', icon: Columns },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
    ...(user?.role === 'admin' ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
  ];

  const getPageTitle = () => {
    const item = navItems.find((nav) => nav.path === location.pathname);
    return item ? item.name : 'TaskFlow';
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 text-slate-800 dark:text-slate-100">
      <aside className="hidden md:flex md:w-64 bg-white dark:bg-slate-800 border-r border-slate-200/60 dark:border-slate-700/50 flex-col justify-between p-6 shrink-0 transition-colors duration-200">
        <div className="space-y-8">
          <div className="flex items-center space-x-3 px-2">
            <div className="bg-emerald-600 p-2 rounded-xl text-white">
              <FolderKanban className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">TaskFlow</span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 space-y-4">
          <div className="flex items-center space-x-3 px-2">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full border object-cover border-slate-200 dark:border-slate-700" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <UserIcon className="h-5 w-5" />
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">{user?.name}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-sm">
          <div className="fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-800 p-6 flex flex-col justify-between border-r border-slate-200 dark:border-slate-700 animate-slide-in">
            <div className="space-y-8">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-600 p-2 rounded-xl text-white">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">TaskFlow</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-1.5" onClick={() => setMobileMenuOpen(false)}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.name} to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                        }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 space-y-4">
              <div className="flex items-center space-x-3 px-2">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <button onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 md:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center space-x-3 relative">
            <button onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
              title="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {showSearch && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden z-40 animate-fade-in-down">
                <div className="p-3">
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects, tasks, people..."
                    className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-64 overflow-y-auto">
                  {searching ? (
                    <div className="p-4 text-sm text-slate-400">Searching...</div>
                  ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                    <div className="p-4 text-sm text-slate-400">No results found</div>
                  ) : (
                    searchResults.slice(0, 8).map((result) => (
                      <div
                        key={result._id}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 cursor-pointer text-sm"
                        onClick={() => {
                          if (result.title) navigate('/tasks');
                          else if (result.name && result.email) navigate('/team');
                          else if (result.name) navigate('/projects');
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                      >
                        <p className="font-semibold text-slate-800 dark:text-white">{result.title || result.name}</p>
                        <p className="text-xs text-slate-400">{result.email || result.project?.name || result.description?.substring(0, 50) || ''}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <ThemeToggle />

            <button onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/50 overflow-hidden z-40 animate-fade-in-down">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                  <span className="font-bold text-sm">Notifications</span>
                  <button onClick={markAllAsRead} className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-64 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No notifications yet.</div>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification._id}
                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 text-sm transition-colors ${notification.isRead ? 'bg-slate-50 dark:bg-slate-900/60' : 'bg-white dark:bg-slate-800'}`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-snug">{notification.message}</p>
                          </div>
                          <button onClick={() => markAsRead(notification._id)}
                            className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold shrink-0"
                          >
                            {notification.isRead ? 'Read' : 'Mark'}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
