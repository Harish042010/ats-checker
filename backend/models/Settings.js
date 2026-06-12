const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  atsWeights: {
    skillMatch: { type: Number, default: 35 },
    keywordMatch: { type: Number, default: 25 },
    experienceMatch: { type: Number, default: 15 },
    educationMatch: { type: Number, default: 10 },
    projectRelevance: { type: Number, default: 10 },
    resumeStructure: { type: Number, default: 5 },
  },
  notificationPreferences: {
    emailReports: { type: Boolean, default: true },
    analysisComplete: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
  },
  analysisPreferences: {
    useMLService: { type: Boolean, default: true },
    useAIRecommendations: { type: Boolean, default: true },
    autoParseResume: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Settings', settingsSchema);
