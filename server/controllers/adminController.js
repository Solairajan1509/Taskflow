const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      users,
      projects,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Project.countDocuments(),
      Task.countDocuments(),
      Task.countDocuments({ status: 'Done' }),
      User.find({ role: 'user' }).select('name email avatar status createdAt'),
      Project.find().populate('owner', 'name email').sort({ createdAt: -1 }).limit(10),
      ActivityLog.find().sort({ createdAt: -1 }).limit(20).populate('user', 'name avatar'),
    ]);

    const taskStatusDistribution = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const projectsByStatus = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const userTaskStats = await Task.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { 'user.name': 1, 'user.email': 1, 'user.avatar': 1, total: 1, completed: 1 } },
      { $sort: { total: -1 } },
    ]);

    res.json({
      totalUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      taskStatusDistribution,
      projectsByStatus,
      userTaskStats,
      recentUsers: users,
      recentProjects: projects,
      recentActivities,
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    await Task.updateMany({ assignedTo: req.params.id }, { assignedTo: null });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminStats, getAllUsers, deleteUser };
