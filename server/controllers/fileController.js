const File = require('../models/File');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const isCloudinaryConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return name && key && secret && !name.includes('dummy') && !key.includes('dummy') && !secret.includes('dummy');
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `taskflow/${folder}`, resource_type: 'auto' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const getMemberRole = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  if (project.owner.toString() === userId.toString()) return 'project_leader';
  const member = project.members.find((m) => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

const saveToDisk = (buffer, originalname) => {
  return new Promise((resolve, reject) => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(originalname);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFile(filePath, buffer, (err) => {
      if (err) reject(err);
      else {
        const port = process.env.PORT || 5000;
        resolve(`http://localhost:${port}/uploads/${uniqueName}`);
      }
    });
  });
};

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const { projectId, taskId } = req.body;
    let userRole = null;

    if (taskId) {
      const task = await Task.findById(taskId).populate('project');
      if (!task) {
        res.status(404);
        throw new Error('Task not found');
      }
      userRole = await getMemberRole(task.project._id, req.user._id);
    } else if (projectId) {
      userRole = await getMemberRole(projectId, req.user._id);
    }

    const isLeader = userRole === 'project_leader';
    if (!projectId && !taskId) {
      res.status(400);
      throw new Error('Project or task ID is required');
    }

    let fileUrl;
    if (isCloudinaryConfigured()) {
      const result = await uploadToCloudinary(req.file.buffer, req.body.folder || 'general');
      fileUrl = result.secure_url;
    } else {
      fileUrl = await saveToDisk(req.file.buffer, req.file.originalname);
    }

    const file = await File.create({
      name: req.file.originalname,
      url: fileUrl,
      fileType: req.file.mimetype,
      size: req.file.size,
      project: projectId || null,
      task: taskId || null,
      uploadedBy: req.user._id,
      verified: isLeader,
      verifiedBy: isLeader ? req.user._id : null,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'Uploaded file',
      project: projectId || (taskId ? null : null),
      task: taskId,
      description: `${req.user.name} uploaded ${req.file.originalname}`,
    });

    const populated = await File.findById(file._id).populate('uploadedBy', 'name avatar').populate('verifiedBy', 'name avatar');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

const verifyFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      res.status(404);
      throw new Error('File not found');
    }

    const projectId = file.project || (file.task ? (await Task.findById(file.task)).project : null);
    if (!projectId) {
      res.status(400);
      throw new Error('Cannot determine project for this file');
    }

    const userRole = await getMemberRole(projectId, req.user._id);
    if (userRole !== 'project_leader') {
      res.status(403);
      throw new Error('Only project leaders can verify files');
    }

    const { verified } = req.body;
    file.verified = verified;
    file.verifiedBy = verified ? req.user._id : null;
    await file.save();

    const populated = await File.findById(file._id).populate('uploadedBy', 'name avatar').populate('verifiedBy', 'name avatar');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

const getProjectFiles = async (req, res, next) => {
  try {
    const files = await File.find({ project: req.params.projectId })
      .populate('uploadedBy', 'name avatar')
      .populate('verifiedBy', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    next(error);
  }
};

const getTaskFiles = async (req, res, next) => {
  try {
    const files = await File.find({ task: req.params.taskId })
      .populate('uploadedBy', 'name avatar')
      .populate('verifiedBy', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      res.status(404);
      throw new Error('File not found');
    }

    const projectId = file.project || (file.task ? (await Task.findById(file.task)).project : null);
    const userRole = projectId ? await getMemberRole(projectId, req.user._id) : null;
    const isOwner = file.uploadedBy.toString() === req.user._id.toString();
    const isLeader = userRole === 'project_leader';

    if (!isOwner && !isLeader) {
      res.status(403);
      throw new Error('Not authorized to delete this file');
    }

    if (file.url.includes('cloudinary')) {
      const publicId = file.url.split('/').pop().split('.')[0];
      const folder = file.url.includes('taskflow/') ? file.url.split('taskflow/')[1].split('/')[0] : 'general';
      await cloudinary.uploader.destroy(`taskflow/${folder}/${publicId}`);
    } else {
      const filename = file.url.split('/uploads/').pop();
      const filePath = path.join(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await File.deleteOne({ _id: file._id });
    res.json({ message: 'File deleted' });
  } catch (error) {
    next(error);
  }
};

const renameFile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400);
      throw new Error('Please provide a file name');
    }

    const file = await File.findById(req.params.id);
    if (!file) {
      res.status(404);
      throw new Error('File not found');
    }

    const projectId = file.project || (file.task ? (await Task.findById(file.task)).project : null);
    const userRole = projectId ? await getMemberRole(projectId, req.user._id) : null;
    const isOwner = file.uploadedBy.toString() === req.user._id.toString();
    const isLeader = userRole === 'project_leader';

    if (!isOwner && !isLeader) {
      res.status(403);
      throw new Error('Not authorized to rename this file');
    }

    file.name = name.trim();
    await file.save();

    const populated = await File.findById(file._id).populate('uploadedBy', 'name avatar').populate('verifiedBy', 'name avatar');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile, getProjectFiles, getTaskFiles, deleteFile, verifyFile, renameFile };
