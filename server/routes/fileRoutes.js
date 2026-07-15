const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, getProjectFiles, getTaskFiles, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.use(protect);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/project/:projectId', getProjectFiles);
router.get('/task/:taskId', getTaskFiles);
router.delete('/:id', deleteFile);

module.exports = router;
