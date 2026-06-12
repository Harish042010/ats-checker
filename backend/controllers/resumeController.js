const fs = require('fs');
const Resume = require('../models/Resume');
const { extractText } = require('../utils/textExtractor');
const { parseResume } = require('../utils/resumeParser');
const { uploadFile, deleteFile } = require('../services/cloudinaryService');
const { logActivity } = require('../services/activityService');
const logger = require('../utils/logger');

const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const file = req.file;
    const fileType = file.originalname.endsWith('.pdf') ? 'pdf' : 'docx';

    const extractedText = await extractText(file.path, fileType);
    const parsedData = parseResume(extractedText);

    let fileUrl = '';
    let publicId = '';
    try {
      const uploaded = await uploadFile(file.path);
      fileUrl = uploaded.url;
      publicId = uploaded.publicId;
    } catch (uploadError) {
      logger.warn('Cloudinary upload failed, using local file');
      fileUrl = `/uploads/${file.filename}`;
    }

    const resume = await Resume.create({
      user: req.user._id,
      originalName: file.originalname,
      fileName: file.filename,
      fileType,
      fileSize: file.size,
      fileUrl,
      publicId,
      extractedText,
      parsedData,
      isProcessed: true,
    });

    fs.unlink(file.path, (err) => {
      if (err) logger.warn('Temp file cleanup failed:', err);
    });

    await logActivity({
      user: req.user._id,
      action: 'resume_uploaded',
      details: { fileName: file.originalname, fileType, fileSize: file.size },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      resume,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id, isActive: true })
      .sort('-createdAt')
      .select('originalName fileType fileSize fileUrl isProcessed createdAt');
    res.json({ success: true, count: resumes.length, resumes });
  } catch (error) {
    next(error);
  }
};

const getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    res.json({ success: true, resume });
  } catch (error) {
    next(error);
  }
};

const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    if (resume.publicId) {
      await deleteFile(resume.publicId);
    }

    resume.isActive = false;
    await resume.save();

    await logActivity({
      user: req.user._id,
      action: 'resume_deleted',
      details: { fileName: resume.originalName },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadResume, getResumes, getResume, deleteResume };
