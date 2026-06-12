const Resume = require('../models/Resume');
const JobDescription = require('../models/JobDescription');
const ATSResult = require('../models/ATSResult');
const Report = require('../models/Report');
const { calculateATSScore } = require('../services/atsEngine');
const { generateRecommendations } = require('../services/aiService');
const { logActivity } = require('../services/activityService');

const analyze = async (req, res, next) => {
  try {
    const { resumeId, jdId } = req.body;

    if (!resumeId || !jdId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resumeId and jdId',
      });
    }

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id, isActive: true });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const jd = await JobDescription.findOne({ _id: jdId, user: req.user._id, isActive: true });
    if (!jd) {
      return res.status(404).json({ success: false, message: 'Job description not found' });
    }

    const atsData = calculateATSScore(resume, jd);

    const aiRecommendations = await generateRecommendations(resume, jd);

    const atsResult = await ATSResult.create({
      user: req.user._id,
      resume: resume._id,
      jobDescription: jd._id,
      overallScore: atsData.overallScore,
      matchPercentage: atsData.matchPercentage,
      categoryScores: atsData.categoryScores,
      matchedKeywords: atsData.matchedKeywords,
      missingKeywords: atsData.missingKeywords,
      skillAnalysis: atsData.skillAnalysis,
      experienceAnalysis: atsData.experienceAnalysis || { yearsMatch: false, requiredYears: 0, candidateYears: 0, relevantRoles: [] },
      educationAnalysis: atsData.educationAnalysis || { match: false, required: '', candidate: '' },
      sectionAnalysis: atsData.sectionAnalysis,
      formattingAnalysis: atsData.formattingAnalysis,
      recommendations: [
        ...atsData.missingKeywords.slice(0, 5).map(k => `Add keyword "${k}" to your resume`),
        ...atsData.skillAnalysis.missingSkills.slice(0, 5).map(s => `Highlight "${s}" skills in your experience section`),
        'Use bullet points with quantifiable achievements',
        'Ensure consistent formatting throughout',
      ],
      aiRecommendations,
    });

    const report = await Report.create({
      user: req.user._id,
      resume: resume._id,
      jobDescription: jd._id,
      atsResult: atsResult._id,
      title: `ATS Report - ${jd.title} - ${resume.originalName}`,
      summary: `Your resume scored ${atsData.overallScore}/100 for the ${jd.title} position.`,
    });

    await logActivity({
      user: req.user._id,
      action: 'analysis_completed',
      details: {
        resumeName: resume.originalName,
        jdTitle: jd.title,
        score: atsData.overallScore,
        reportId: report._id,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      atsResult,
      report,
    });
  } catch (error) {
    next(error);
  }
};

const getReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, user: req.user._id })
      .populate({
        path: 'atsResult',
        populate: [
          { path: 'resume', select: 'originalName fileType fileUrl parsedData' },
          { path: 'jobDescription', select: 'title company description parsedData' },
        ],
      })
      .populate('resume', 'originalName fileType fileUrl')
      .populate('jobDescription', 'title company description');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reports = await Report.find({ user: req.user._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('resume', 'originalName')
      .populate('jobDescription', 'title company')
      .populate('atsResult', 'overallScore matchPercentage');

    const total = await Report.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      count: reports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      reports,
    });
  } catch (error) {
    next(error);
  }
};

const getAnalysisResult = async (req, res, next) => {
  try {
    const result = await ATSResult.findOne({ _id: req.params.id, user: req.user._id })
      .populate('resume', 'originalName fileType fileUrl parsedData')
      .populate('jobDescription', 'title company description parsedData');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Analysis result not found' });
    }

    res.json({ success: true, result });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyze, getReport, getReports, getAnalysisResult };
