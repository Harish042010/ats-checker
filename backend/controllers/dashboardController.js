const Report = require('../models/Report');
const Resume = require('../models/Resume');
const JobDescription = require('../models/JobDescription');
const ATSResult = require('../models/ATSResult');
const ActivityLog = require('../models/ActivityLog');

const getDashboardStats = async (req, res, next) => {
  try {
    const [reportCount, resumeCount, jdCount, recentReports, recentActivity] = await Promise.all([
      Report.countDocuments({ user: req.user._id }),
      Resume.countDocuments({ user: req.user._id, isActive: true }),
      JobDescription.countDocuments({ user: req.user._id, isActive: true }),
      Report.find({ user: req.user._id })
        .sort('-createdAt')
        .limit(5)
        .populate('atsResult', 'overallScore matchPercentage categoryScores')
        .populate('resume', 'originalName')
        .populate('jobDescription', 'title company'),
      ActivityLog.find({ user: req.user._id })
        .sort('-createdAt')
        .limit(10),
    ]);

    const results = await ATSResult.find({ user: req.user._id }).select('overallScore categoryScores createdAt');
    const avgScore = results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.overallScore, 0) / results.length)
      : 0;

    const scoreDistribution = {
      excellent: results.filter(r => r.overallScore >= 80).length,
      good: results.filter(r => r.overallScore >= 60 && r.overallScore < 80).length,
      average: results.filter(r => r.overallScore >= 40 && r.overallScore < 60).length,
      poor: results.filter(r => r.overallScore < 40).length,
    };

    const scoresOverTime = results
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-20)
      .map(r => ({
        date: r.createdAt.toISOString().split('T')[0],
        score: r.overallScore,
      }));

    const allMissingKeywords = results.flatMap(r => r.missingKeywords || []);
    const keywordFrequency = allMissingKeywords.reduce((acc, kw) => {
      acc[kw] = (acc[kw] || 0) + 1;
      return acc;
    }, {});
    const topMissingKeywords = Object.entries(keywordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    res.json({
      success: true,
      stats: {
        totalReports: reportCount,
        totalResumes: resumeCount,
        totalJDs: jdCount,
        averageScore: avgScore,
        scoreDistribution,
        scoresOverTime: aggregateScoresByDate(scoresOverTime),
      },
      recentReports,
      recentActivity,
      topMissingKeywords,
    });
  } catch (error) {
    next(error);
  }
};

const aggregateScoresByDate = (scores) => {
  const map = {};
  scores.forEach(s => {
    if (!map[s.date]) map[s.date] = [];
    map[s.date].push(s.score);
  });
  return Object.entries(map).map(([date, scores]) => ({
    date,
    score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));
};

const getAdminStats = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const [userCount, reportCount, resumeCount, recentUsers, systemStats] = await Promise.all([
      User.countDocuments(),
      Report.countDocuments(),
      Resume.countDocuments({ isActive: true }),
      User.find().sort('-createdAt').limit(10).select('name email role createdAt'),
      ATSResult.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$overallScore' }, maxScore: { $max: '$overallScore' }, minScore: { $min: '$overallScore' }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: userCount,
        totalReports: reportCount,
        totalResumes: resumeCount,
        averageScore: systemStats[0]?.avgScore ? Math.round(systemStats[0].avgScore) : 0,
        maxScore: systemStats[0]?.maxScore || 0,
        minScore: systemStats[0]?.minScore || 0,
        totalAnalyses: systemStats[0]?.count || 0,
      },
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getAdminStats };
