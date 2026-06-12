const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  company: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
  },
  rawText: {
    type: String,
  },
  parsedData: {
    requiredSkills: [String],
    preferredSkills: [String],
    experienceRequired: String,
    educationRequired: String,
    responsibilities: [String],
    keywords: [String],
    industry: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

jobDescriptionSchema.virtual('reports', {
  ref: 'Report',
  localField: '_id',
  foreignField: 'jobDescription',
});

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
