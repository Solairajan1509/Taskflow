const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const mailService = require('../utils/mailService');
const crypto = require('crypto');

const createProject = async (req, res, next) => {
  const { name, description, category, status } = req.body;

  try {
    if (!name) {
      res.status(400);
      throw new Error('Please provide a project name');
    }

    const project = await Project.create({
      name,
      description: description || '',
      category: category || 'General',
      status: status || 'Not Started',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'project_leader' }],
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar status');

    const notification = await Notification.create({
      recipient: req.user._id,
      type: 'general',
      title: `Project created: ${name}`,
      message: `You successfully created the project "${name}".`,
      link: `/projects`,
    });
    const io = req.app.get('io');
    io.to(`user:${req.user._id}`).emit('notification:new', notification);

    await ActivityLog.create({
      user: req.user._id,
      action: 'Created project',
      project: project._id,
      description: `${req.user.name} created project "${name}"`,
    });

    mailService.sendProjectCreatedEmail(req.user.email, req.user.name, name).catch((e) => console.error('Project created email failed:', e.message));

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    }).populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar status');

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

const inviteMember = async (req, res, next) => {
  const { email } = req.body;
  const projectId = req.params.id;

  try {
    if (!email) {
      res.status(400);
      throw new Error('Please provide an email to invite');
    }

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const memberEntry = project.members.find((m) => m.user.toString() === req.user._id.toString());
    const isProjectLeader = memberEntry && memberEntry.role === 'project_leader';

    if (!isOwner && !isProjectLeader) {
      res.status(403);
      throw new Error('Only the project owner or project leaders can invite members');
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
      const generatedName = email.split('@')[0];

      user = await User.create({
        name: generatedName,
        email: email,
        password: randomPassword,
        status: 'inactive',
      });
    }

    const alreadyMember = project.members.some(
      (m) => m.user.toString() === user._id.toString()
    );

    if (alreadyMember) {
      res.status(400);
      throw new Error('User is already a member of this project');
    }

    project.members.push({ user: user._id, role: 'team_member' });
    await project.save();

    const notification = await Notification.create({
      recipient: user._id,
      sender: req.user._id,
      type: 'project_invite',
      title: `Project invitation: ${project.name}`,
      message: `${req.user.name} invited you to join ${project.name}.`,
      link: `/projects/${project._id}`,
    });

    const io = req.app.get('io');
    io.to(`user:${user._id}`).emit('notification:new', notification);

    await mailService.sendProjectInviteEmail(email, req.user.name, project.name);

    await ActivityLog.create({
      user: req.user._id,
      action: 'Invited member',
      project: projectId,
      description: `${req.user.name} invited ${user.name} to ${project.name}`,
    });

    const updatedProject = await Project.findById(projectId)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar status');

    res.json({
      message: `Invitation successfully sent to ${email}`,
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar status');

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    const isMember = project.owner._id.toString() === req.user._id.toString() ||
      project.members.some((m) => m.user._id.toString() === req.user._id.toString());

    if (!isMember) {
      res.status(403);
      throw new Error('Not authorized to view this project');
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  inviteMember,
};
