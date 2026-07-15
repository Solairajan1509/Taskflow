const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const result = await uploadToCloudinary(req.file.buffer, req.body.folder || 'general');

    const file = await File.create({
      name: req.file.originalname,
      url: result.secure_url,
      fileType: req.file.mimetype,
      size: req.file.size,
      project: req.body.projectId || null,
      task: req.body.taskId || null,
      uploadedBy: req.user._id,
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'Uploaded file',
      project: req.body.projectId,
      task: req.body.taskId,
      description: `${req.user.name} uploaded ${req.file.originalname}`,
    });

    res.status(201).json(file);
  } catch (error) {
    next(error);
  }
};

const getProjectFiles = async (req, res, next) => {
  try {
    const files = await File.find({ project: req.params.projectId })
      .populate('uploadedBy', 'name avatar')
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
    const publicId = file.url.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`taskflow/general/${publicId}`);
    await File.deleteOne({ _id: file._id });
    res.json({ message: 'File deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile, getProjectFiles, getTaskFiles, deleteFile };
