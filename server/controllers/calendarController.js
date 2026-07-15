const Task = require('../models/Task');
const Project = require('../models/Project');

const getCalendarEvents = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');
    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({
      project: { $in: projectIds },
      dueDate: { $ne: null },
    })
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar');

    const now = new Date();
    const events = tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      start: task.dueDate,
      allDay: true,
      project: task.project?.name || 'Unlinked',
      status: task.status,
      assignedTo: task.assignedTo,
      priority: task.priority,
      overdue: task.dueDate < now && task.status !== 'Done',
      backgroundColor:
        task.status === 'Done' ? '#10b981' :
        task.dueDate < now ? '#ef4444' :
        task.status === 'In Progress' ? '#3b82f6' :
        '#f59e0b',
    }));

    res.json(events);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCalendarEvents };
