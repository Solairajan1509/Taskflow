const express = require('express');
const router = express.Router();
const { sendMessage, getProjectMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', sendMessage);
router.get('/:projectId', getProjectMessages);

module.exports = router;
