const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  totalAnalyses: {
    type: Number,
    default: 0,
  },
  totalResumes: {
    type: Number,
    default: 0,
  },
  averageScore: {
    type: Number,
    default: 0,
  },
  scoreHistory: [{
    score: Number,
    date: { type: Date, default: Date.now },
  }],
  topMissingSkills: [{
    skill: String,
    count: Number,
  }],
  topMatchedSkills: [{
    skill: String,
    count: Number,
  }],
  analysesByDay: [{
    date: String,
    count: Number,
  }],
  popularJobTitles: [{
    title: String,
    count: Number,
  }],
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Analytics', analyticsSchema);
