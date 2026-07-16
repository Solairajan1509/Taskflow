const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadFile,
  getProjectFiles,
  getTaskFiles,
  deleteFile,
  verifyFile,
  renameFile,
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
});

router.use(protect);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/project/:projectId', getProjectFiles);
router.get('/task/:taskId', getTaskFiles);
router.patch('/:id/verify', verifyFile);
router.patch('/:id/rename', renameFile);
router.delete('/:id', deleteFile);

module.exports = router;
