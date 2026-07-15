import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { Clock, Calendar as CalendarIcon, User, AlertCircle, Loader } from 'lucide-react';

const columns = [
  { id: 'To Do', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-900/40' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-950/20' },
  { id: 'Review', title: 'Review', color: 'bg-amber-50 dark:bg-amber-950/20' },
  { id: 'Done', title: 'Completed', color: 'bg-emerald-50 dark:bg-emerald-950/20' },
];

const priorityColor = {
  High: 'text-red-600 bg-red-50 dark:bg-red-950/20',
  Medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20',
  Low: 'text-slate-600 bg-slate-50 dark:bg-slate-900/40',
};

const Kanban = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socket = useSocket();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!socket || !selectedProjectId) return;
    socket.emit('join:project', selectedProjectId);

    const handler = (task) => {
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t._id === task._id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = task;
          return updated;
        }
        return [task, ...prev];
      });
    };

    socket.on('task:created', handler);
    socket.on('task:updated', handler);

    return () => {
      socket.emit('leave:project', selectedProjectId);
      socket.off('task:created', handler);
      socket.off('task:updated', handler);
    };
  }, [socket, selectedProjectId]);

  const loadProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
      if (data.length > 0) setSelectedProjectId(data[0]._id);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTasks = async (projectId) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/tasks');
      setTasks(data.filter((t) => t.project?._id === projectId || t.project === projectId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId;
    const task = tasks.find((t) => t._id === draggableId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: newStatus });
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t._id === draggableId ? { ...t, status: task.status } : t))
      );
    }
  };

  const getColumnTasks = (status) => tasks.filter((t) => t.status === status);

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
          <h1 className="text-2xl font-black">Kanban Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Drag and drop tasks to update their status.</p>
        </div>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 text-sm outline-none focus:border-emerald-500"
        >
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.id} className={`rounded-2xl ${col.color} p-4 min-h-[400px]`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">{col.title}</h3>
                <span className="text-xs font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {getColumnTasks(col.id).length}
                </span>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[300px] transition-colors rounded-xl p-1 ${
                      snapshot.isDraggingOver ? 'bg-white/50 dark:bg-slate-800/50' : ''
                    }`}
                  >
                    {getColumnTasks(col.id).map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 ${
                              snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColor[task.priority] || priorityColor.Medium}`}>
                                {task.priority || 'Medium'}
                              </span>
                              {task.duration > 0 && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {task.duration}h
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-sm text-slate-800 dark:text-white mb-2">{task.title}</h4>
                            {task.description && (
                              <p className="text-[11px] text-slate-400 mb-3 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                              </div>
                              {task.assignedTo && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{task.assignedTo.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default Kanban;
