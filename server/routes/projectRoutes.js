const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  inviteMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').post(createProject).get(getProjects);
router.get('/:id', getProjectById);
router.post('/:id/invite', inviteMember);

module.exports = router;
