const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx'],
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
  },
  extractedText: {
    type: String,
  },
  parsedData: {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    experience: [{
      company: String,
      title: String,
      startDate: String,
      endDate: String,
      description: String,
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      graduationYear: String,
    }],
    projects: [{
      title: String,
      description: String,
      technologies: [String],
    }],
    certifications: [String],
    languages: [String],
    summary: String,
  },
  isProcessed: {
    type: Boolean,
    default: false,
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

resumeSchema.virtual('reports', {
  ref: 'Report',
  localField: '_id',
  foreignField: 'resume',
});

module.exports = mongoose.model('Resume', resumeSchema);
