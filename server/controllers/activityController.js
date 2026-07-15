const ActivityLog = require('../models/ActivityLog');

const getProjectActivity = async (req, res, next) => {
  try {
    const activities = await ActivityLog.find({ project: req.params.projectId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

const getAllActivity = async (req, res, next) => {
  try {
    const activities = await ActivityLog.find({
      $or: [
        { project: { $in: req.user.projects || [] } },
        { user: req.user._id },
      ],
    })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjectActivity, getAllActivity };
