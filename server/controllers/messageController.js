const Message = require('../models/Message');
const Project = require('../models/Project');

const sendMessage = async (req, res, next) => {
  const { content, projectId } = req.body;

  try {
    if (!content || !projectId) {
      res.status(400);
      throw new Error('Please provide message content and project');
    }

    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      res.status(404);
      throw new Error('Project not found');
    }

    const isMember = projectDoc.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isOwner = projectDoc.owner.toString() === req.user._id.toString();

    if (!isOwner && !isMember) {
      res.status(403);
      throw new Error('Not authorized to send messages in this project');
    }

    const message = await Message.create({
      sender: req.user._id,
      project: projectId,
      content,
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const getProjectMessages = async (req, res, next) => {
  const { projectId } = req.params;

  try {
    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      res.status(404);
      throw new Error('Project not found');
    }

    const isMember = projectDoc.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    const isOwner = projectDoc.owner.toString() === req.user._id.toString();

    if (!isOwner && !isMember) {
      res.status(403);
      throw new Error('Not authorized to view messages in this project');
    }

    const messages = await Message.find({ project: projectId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getProjectMessages };
