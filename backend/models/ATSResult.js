const mongoose = require('mongoose');

const atsResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  jobDescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    required: true,
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  matchPercentage: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  categoryScores: {
    skillMatch: { type: Number, default: 0 },
    keywordMatch: { type: Number, default: 0 },
    experienceMatch: { type: Number, default: 0 },
    educationMatch: { type: Number, default: 0 },
    projectRelevance: { type: Number, default: 0 },
    resumeStructure: { type: Number, default: 0 },
  },
  matchedKeywords: [String],
  missingKeywords: [String],
  skillAnalysis: {
    matchedSkills: [String],
    missingSkills: [String],
    additionalSkills: [String],
  },
  experienceAnalysis: {
    yearsMatch: Boolean,
    requiredYears: Number,
    candidateYears: Number,
    relevantRoles: [String],
  },
  educationAnalysis: {
    match: Boolean,
    required: String,
    candidate: String,
  },
  sectionAnalysis: [{
    section: String,
    present: Boolean,
    score: Number,
    suggestions: String,
  }],
  formattingAnalysis: {
    hasContactInfo: Boolean,
    hasSummary: Boolean,
    hasSkills: Boolean,
    hasExperience: Boolean,
    hasEducation: Boolean,
    hasProjects: Boolean,
    hasCertifications: Boolean,
    bulletPointsUsed: Boolean,
    atsFriendly: Boolean,
    score: Number,
  },
  recommendations: [String],
  aiRecommendations: {
    optimization: [String],
    missingSkills: [String],
    projectImprovements: [String],
    summaryEnhancement: String,
    interviewPrep: [String],
    atsTips: [String],
  },
  mlServiceUsed: {
    type: Boolean,
    default: false,
  },
  similarityScore: {
    type: Number,
    min: 0,
    max: 1,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ATSResult', atsResultSchema);
