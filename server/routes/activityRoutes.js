const express = require('express');
const router = express.Router();
const { getProjectActivity, getAllActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getAllActivity);
router.get('/:projectId', getProjectActivity);

module.exports = router;
