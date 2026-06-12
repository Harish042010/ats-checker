const JobDescription = require('../models/JobDescription');
const { logActivity } = require('../services/activityService');
const { parseJobDescription } = require('../utils/jdParser');

const uploadJD = async (req, res, next) => {
  try {
    const { title, company, description } = req.body;

    const text = description;
    const parsedData = parseJobDescription(text);

    const jd = await JobDescription.create({
      user: req.user._id,
      title,
      company: company || '',
      description: text,
      rawText: text,
      parsedData,
    });

    await logActivity({
      user: req.user._id,
      action: 'jd_uploaded',
      details: { title, company },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ success: true, jd });
  } catch (error) {
    next(error);
  }
};

const getJDs = async (req, res, next) => {
  try {
    const jds = await JobDescription.find({ user: req.user._id, isActive: true })
      .sort('-createdAt')
      .select('title company isActive createdAt');
    res.json({ success: true, count: jds.length, jds });
  } catch (error) {
    next(error);
  }
};

const getJD = async (req, res, next) => {
  try {
    const jd = await JobDescription.findOne({ _id: req.params.id, user: req.user._id });
    if (!jd) {
      return res.status(404).json({ success: false, message: 'Job description not found' });
    }
    res.json({ success: true, jd });
  } catch (error) {
    next(error);
  }
};

const deleteJD = async (req, res, next) => {
  try {
    const jd = await JobDescription.findOne({ _id: req.params.id, user: req.user._id });
    if (!jd) {
      return res.status(404).json({ success: false, message: 'Job description not found' });
    }
    jd.isActive = false;
    await jd.save();

    await logActivity({
      user: req.user._id,
      action: 'jd_deleted',
      details: { title: jd.title },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Job description deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadJD, getJDs, getJD, deleteJD };
