const express = require('express');
const router = express.Router();
const {
  getTaskComments,
  addComment,
  editComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:taskId', getTaskComments);
router.post('/:taskId', addComment);
router.put('/:commentId', editComment);
router.delete('/:commentId', deleteComment);

module.exports = router;
