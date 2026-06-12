const fs = require('fs');
const path = require('path');
const { extractText } = require('../utils/textExtractor');
const { parseResume } = require('../utils/resumeParser');
const { parseJobDescription } = require('../utils/jdParser');
const { buildRoleProfile } = require('../utils/roleProfile');
const { calculateATSScore } = require('../services/atsEngine');
const { analyzeWithML } = require('../services/mlService');

const cleanupFile = (file) => {
  if (file?.path) fs.unlink(file.path, () => {});
};

const buildAdvice = (atsData) => {
  const advice = [
    ...atsData.skillAnalysis.missingSkills.slice(0, 6).map(skill => `Add or emphasize ${skill} if you have real experience with it.`),
    ...atsData.missingKeywords.slice(0, 6).map(keyword => `Use the job keyword "${keyword}" naturally in your resume.`),
  ];

  if (!atsData.formattingAnalysis.hasSummary) advice.push('Add a short professional summary at the top.');
  if (!atsData.formattingAnalysis.hasProjects) advice.push('Include 1-3 relevant projects with tools, outcomes, and links if available.');
  if (!atsData.formattingAnalysis.bulletPointsUsed) advice.push('Use bullet points with action verbs and measurable impact.');

  return [...new Set(advice)].slice(0, 12);
};

const directAnalyze = async (req, res, next) => {
  const resumeFile = req.file;

  try {
    const resumeTextFromBody = req.body.resumeText || '';
    const jdText = req.body.jdText || '';
    const jobTitle = req.body.jobTitle || '';
    const company = req.body.company || '';

    if (!resumeFile && !resumeTextFromBody.trim()) {
      return res.status(400).json({ success: false, message: 'Upload a resume file or paste resume text.' });
    }

    let resumeText = resumeTextFromBody;
    let fileName = 'Pasted resume';
    let fileType = 'text';

    if (resumeFile) {
      const ext = path.extname(resumeFile.originalname).toLowerCase();
      fileType = ext === '.pdf' ? 'pdf' : 'docx';
      fileName = resumeFile.originalname;
      resumeText = await extractText(resumeFile.path, fileType);
    }

    const resumeParsedData = parseResume(resumeText);
    const roleProfile = !jdText.trim() ? buildRoleProfile(jobTitle) : null;
    const effectiveJdText = jdText.trim() || roleProfile?.text || '';
    const hasJobTarget = Boolean(effectiveJdText.trim());
    const jdParsedData = hasJobTarget ? parseJobDescription(effectiveJdText) : {
      requiredSkills: [],
      preferredSkills: [],
      experienceRequired: '',
      educationRequired: '',
      responsibilities: [],
      keywords: [],
      industry: '',
    };

    const resumeData = {
      originalName: fileName,
      fileType,
      extractedText: resumeText,
      parsedData: resumeParsedData,
    };

    const jdData = {
      title: jobTitle || (hasJobTarget ? 'Target Role' : 'Whole Resume'),
      company,
      description: effectiveJdText,
      parsedData: jdParsedData,
    };

    const atsData = calculateATSScore(resumeData, jdData);
    const mlData = hasJobTarget ? await analyzeWithML({
      resumeText,
      jdText: effectiveJdText,
      resumeSkills: resumeParsedData.skills,
      jdSkills: [...jdParsedData.requiredSkills, ...jdParsedData.preferredSkills],
    }) : null;

    const score = mlData?.success
      ? Math.round((atsData.overallScore * 0.55) + (mlData.match_percentage * 0.45))
      : atsData.overallScore;

    res.json({
      success: true,
      mode: hasJobTarget ? 'job-fit' : 'resume-only',
      source: mlData?.success ? 'local-engine-and-ml-service' : 'local-engine',
      score,
      localScore: atsData.overallScore,
      mlScore: mlData?.success ? Math.round(mlData.match_percentage) : null,
      matchPercentage: atsData.matchPercentage,
      categoryScores: atsData.categoryScores,
      matchedSkills: atsData.skillAnalysis.matchedSkills,
      missingSkills: atsData.skillAnalysis.missingSkills,
      additionalSkills: atsData.skillAnalysis.additionalSkills,
      matchedKeywords: atsData.matchedKeywords,
      missingKeywords: atsData.missingKeywords,
      sectionAnalysis: atsData.sectionAnalysis,
      formattingAnalysis: atsData.formattingAnalysis,
      recommendations: buildAdvice(atsData),
      resume: {
        fileName,
        wordCount: resumeText.split(/\s+/).filter(Boolean).length,
        extractedSkills: resumeParsedData.skills,
        emailFound: Boolean(resumeParsedData.email),
        phoneFound: Boolean(resumeParsedData.phone),
      },
      job: {
        title: jdData.title,
        company,
        extractedSkills: jdParsedData.requiredSkills,
        keywords: jdParsedData.keywords,
        generatedFromTitle: Boolean(roleProfile),
      },
    });
  } catch (error) {
    next(error);
  } finally {
    cleanupFile(resumeFile);
  }
};

module.exports = { directAnalyze };
