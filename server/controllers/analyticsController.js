const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

const getDashboardStats = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    });

    const projectIds = projects.map((p) => p._id);

    const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });
    const completedTasks = await Task.countDocuments({ project: { $in: projectIds }, status: 'Done' });
    const pendingTasks = await Task.countDocuments({ project: { $in: projectIds }, status: { $in: ['To Do', 'In Progress', 'Review'] } });
    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      project: { $in: projectIds },
      dueDate: { $lt: now },
      status: { $ne: 'Done' },
    });

    const tasksByStatus = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const tasksByMember = await Task.aggregate([
      { $match: { project: { $in: projectIds }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } } } },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { 'user.password': 0 } },
    ]);

    const projectProgress = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        const doneCount = await Task.countDocuments({ project: project._id, status: 'Done' });
        return {
          _id: project._id,
          name: project.name,
          progress: taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0,
        };
      })
    );

    res.json({
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasksByStatus,
      tasksByMember,
      projectProgress,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
