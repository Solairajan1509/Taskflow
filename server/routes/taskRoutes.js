const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  updateTaskStatus,
  updateTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getTasks).post(createTask);
router.patch('/:id/status', updateTaskStatus);
router.put('/:id', updateTask);

module.exports = router;
