import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { Loader, AlertCircle } from 'lucide-react';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/calendar/events');
      setEvents(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.start).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => new Date(a) - new Date(b));

  const statusColor = (status, overdue) => {
    if (overdue) return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
    switch (status) {
      case 'Done': return 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
      case 'In Progress': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'Review': return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20';
      default: return 'border-l-slate-400 bg-slate-50 dark:bg-slate-900/40';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="h-10 w-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View all task deadlines across your projects.</p>
        </div>
        <button
          onClick={loadEvents}
          className="text-xs font-semibold text-emerald-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {sortedDates.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700/50">
              <p className="text-slate-400 text-sm">No tasks with due dates yet.</p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700/50">
                  <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {groupedEvents[date].map((event) => (
                    <div
                      key={event._id}
                      className={`p-4 border-l-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/10 transition-colors ${statusColor(event.status, event.overdue)}`}
                      onClick={() => setSelectedEvent(selectedEvent?._id === event._id ? null : event)}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-white">{event.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-500">
                          {event.project}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] font-semibold ${
                          event.status === 'Done' ? 'text-emerald-600' :
                          event.overdue ? 'text-red-600' :
                          event.status === 'In Progress' ? 'text-blue-600' :
                          'text-amber-600'
                        }`}>
                          {event.status} {event.overdue ? '(Overdue)' : ''}
                        </span>
                        {event.assignedTo && (
                          <span className="text-[10px] text-slate-400">Assigned to {event.assignedTo.name}</span>
                        )}
                      </div>
                      {selectedEvent?._id === event._id && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                          <p className="text-xs text-slate-500">Priority: {event.priority}</p>
                          <p className="text-xs text-slate-500">Due: {new Date(event.start).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 h-fit sticky top-6">
          <h3 className="font-bold text-sm mb-4">Legend</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">Completed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">In Progress</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">Pending</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-xs text-slate-600 dark:text-slate-400">Overdue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
