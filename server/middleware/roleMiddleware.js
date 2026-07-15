const Project = require('../models/Project');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error('Not authorized, no user session found'));
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`User role '${req.user.role}' is not authorized to access this resource`));
    }

    next();
  };
};

const projectRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id || req.body.project;
      if (!projectId) {
        res.status(400);
        return next(new Error('Project ID is required'));
      }

      const project = await Project.findById(projectId);
      if (!project) {
        res.status(404);
        return next(new Error('Project not found'));
      }

      if (project.owner.toString() === req.user._id.toString()) {
        return next();
      }

      const member = project.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );

      if (!member || !allowedRoles.includes(member.role)) {
        res.status(403);
        return next(new Error('Not authorized for this action in this project'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { authorize, projectRole };
