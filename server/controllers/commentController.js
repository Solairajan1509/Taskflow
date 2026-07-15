const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');

const getTaskComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  const { content } = req.body;
  try {
    if (!content) {
      res.status(400);
      throw new Error('Please provide comment content');
    }
    const comment = await Comment.create({
      task: req.params.taskId,
      user: req.user._id,
      content,
    });
    const populated = await Comment.findById(comment._id)
      .populate('user', 'name email avatar');

    await ActivityLog.create({
      user: req.user._id,
      action: 'Added comment',
      task: req.params.taskId,
      description: `${req.user.name} added a comment`,
    });

    const io = req.app.get('io');
    io.to(`task:${req.params.taskId}`).emit('comment:added', populated);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const editComment = async (req, res, next) => {
  const { content } = req.body;
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this comment');
    }
    comment.content = content;
    await comment.save();
    const populated = await Comment.findById(comment._id)
      .populate('user', 'name email avatar');

    const io = req.app.get('io');
    io.to(`task:${comment.task}`).emit('comment:updated', populated);

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      res.status(404);
      throw new Error('Comment not found');
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this comment');
    }
    const taskId = comment.task;
    await Comment.deleteOne({ _id: comment._id });

    const io = req.app.get('io');
    io.to(`task:${taskId}`).emit('comment:deleted', { commentId: req.params.commentId });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTaskComments, addComment, editComment, deleteComment };
