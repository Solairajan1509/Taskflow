const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

const globalSearch = async (req, res, next) => {
  const { q, type, priority, status, projectId, assignedTo } = req.query;
  try {
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    }).select('_id');
    const projectIds = userProjects.map((p) => p._id);

    const results = { projects: [], tasks: [], users: [] };

    if (!type || type === 'projects') {
      const query = {};
      if (q) query.name = { $regex: q, $options: 'i' };
      query._id = { $in: projectIds };
      results.projects = await Project.find(query)
        .populate('owner', 'name email avatar')
        .limit(10);
    }

    if (!type || type === 'tasks') {
      const query = { project: { $in: projectIds } };
      if (q) query.title = { $regex: q, $options: 'i' };
      if (priority) query.priority = priority;
      if (status) query.status = status;
      if (projectId) query.project = projectId;
      if (assignedTo) query.assignedTo = assignedTo;
      results.tasks = await Task.find(query)
        .populate('project', 'name')
        .populate('assignedTo', 'name email avatar')
        .limit(20);
    }

    if (!type || type === 'users') {
      if (q) {
        results.users = await User.find({
          _id: { $ne: req.user._id },
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
          ],
        }).select('name email avatar status').limit(10);
      }
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
};

module.exports = { globalSearch };
