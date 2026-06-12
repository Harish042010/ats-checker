const { extractSkills } = require('../utils/skillExtractor');

const STOP_WORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'also', 'and', 'are', 'because',
  'been', 'being', 'between', 'both', 'candidate', 'company', 'description',
  'experience', 'from', 'have', 'into', 'must', 'our', 'requirements', 'role',
  'should', 'that', 'their', 'there', 'this', 'with', 'work', 'will', 'years',
  'your', 'you', 'using', 'target', 'required', 'skills', 'responsibilities',
  'include', 'delivering', 'role-specific', 'practical', 'collaboration',
  'clear', 'documentation', 'outcomes', 'preferred',
]);

const SECTION_PATTERNS = {
  summary: /\b(summary|profile|objective|about me|professional summary)\b/i,
  skills: /\b(skills|technical skills|core competencies|technologies|tools)\b/i,
  experience: /\b(experience|employment|work history|internship|professional experience)\b/i,
  education: /\b(education|academic|qualification|university|college|bachelor|master|b\.?tech|degree)\b/i,
  projects: /\b(projects?|portfolio|capstone)\b/i,
  certifications: /\b(certifications?|licenses?|certificate)\b/i,
};

const ACTION_VERBS = [
  'achieved', 'automated', 'built', 'created', 'delivered', 'designed',
  'developed', 'improved', 'implemented', 'increased', 'launched', 'led',
  'managed', 'optimized', 'reduced', 'resolved', 'shipped', 'streamlined',
];

const CERTIFICATE_TERMS = [
  'certificate', 'certifies', 'certified that', 'has completed', 'completion',
  'course', 'issued', 'awarded', 'credential id',
];

const RESUME_TERMS = [
  'summary', 'skills', 'experience', 'education', 'projects', 'internship',
  'responsibilities', 'achievements', 'technologies', 'github', 'linkedin',
];

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const normalizeList = (items = []) => [...new Set(
  items.map(item => String(item || '').trim().toLowerCase()).filter(Boolean),
)].sort();

const getResumeText = (resume = {}) => (
  resume.extractedText ||
  resume.text ||
  resume.content ||
  resume.parsedData?.rawText ||
  ''
);

const getJdText = (jd = {}) => (
  jd.description ||
  jd.text ||
  jd.content ||
  ''
);

const getStats = (text) => {
  const words = text.match(/\b[\w+#.-]+\b/g) || [];
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const bulletCount = (text.match(/(^|\n)\s*(?:[-*•]|\d+[.)])\s+/g) || []).length;
  const uniqueRatio = new Set(words.map(word => word.toLowerCase())).size / Math.max(words.length, 1);
  return { wordCount: words.length, lineCount: lines.length, bulletCount, uniqueRatio };
};

const detectSections = (text) => Object.fromEntries(
  Object.entries(SECTION_PATTERNS).map(([name, pattern]) => [name, pattern.test(text)])
);

const hasContact = (text) => (
  /[\w.-]+@[\w.-]+\.\w+/.test(text) ||
  /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text)
);

const extractYears = (text) => {
  const years = [...text.matchAll(/(\d+)\+?\s*(?:years?|yrs?)/gi)].map(match => Number(match[1]));
  return years.length ? Math.max(...years) : 0;
};

const educationLevel = (text) => {
  const lower = text.toLowerCase();
  if (/(phd|doctorate)/.test(lower)) return 3;
  if (/(master|mba|m\.tech|ms|m\.s)/.test(lower)) return 2;
  if (/(bachelor|b\.tech|b\.e|bs|ba|degree)/.test(lower)) return 1;
  return 0;
};

const keywordList = (text, limit = 35) => {
  const words = (text.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) || [])
    .map(word => word.replace(/^[.+-]+|[.+-]+$/g, ''))
    .filter(Boolean);
  const counts = new Map();
  words
    .filter(word => !STOP_WORDS.has(word) && Number.isNaN(Number(word)))
    .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
};

const resumeConfidence = (text, sections, stats) => {
  const lower = text.toLowerCase();
  const sectionHits = Object.values(sections).filter(Boolean).length;
  const resumeTerms = RESUME_TERMS.filter(term => lower.includes(term)).length;
  const certificateTerms = CERTIFICATE_TERMS.filter(term => lower.includes(term)).length;

  let confidence = 0;
  confidence += Math.min(sectionHits * 14, 56);
  confidence += Math.min(resumeTerms * 4, 20);
  confidence += hasContact(text) ? 10 : 0;
  confidence += stats.wordCount >= 120 && sectionHits >= 2 ? 10 : 0;
  confidence += stats.bulletCount >= 3 ? 8 : 0;
  confidence -= Math.min(certificateTerms * 14, 45);
  confidence -= stats.wordCount < 80 ? 18 : 0;
  confidence -= stats.uniqueRatio < 0.35 ? 10 : 0;
  return clamp(confidence);
};

const impactScore = (text) => {
  const metricCount = (text.match(/\b\d+%|\b\d+\+|\b\d+x|\b\d+\s*(users|clients|projects|months|years|seconds|hours|revenue|sales|requests|records)\b/gi) || []).length;
  const verbCount = ACTION_VERBS.filter(verb => new RegExp(`\\b${verb}\\b`, 'i').test(text)).length;
  return clamp(Math.min(metricCount * 18, 60) + Math.min(verbCount * 5, 40));
};

const structureScore = (text, sections, stats) => clamp(
  (hasContact(text) ? 15 : 0) +
  (sections.summary ? 12 : 0) +
  (sections.skills ? 15 : 0) +
  (sections.experience ? 18 : 0) +
  (sections.education ? 12 : 0) +
  (sections.projects ? 10 : 0) +
  (stats.bulletCount >= 4 ? 8 : 0) +
  (stats.wordCount >= 250 && stats.wordCount <= 900 ? 5 : 0) +
  (stats.lineCount >= 8 ? 5 : 0)
);

const sectionAnalysis = (sections) => {
  const labels = {
    summary: 'Professional Summary',
    skills: 'Skills',
    experience: 'Experience',
    education: 'Education',
    projects: 'Projects',
    certifications: 'Certifications',
  };

  return Object.entries(sections).map(([section, present]) => ({
    section: labels[section],
    present,
    score: present ? 100 : 0,
    suggestions: present ? 'Present' : `Add a clear ${labels[section].toLowerCase()} section.`,
  }));
};

const formattingAnalysis = (text, sections, stats, confidence, score) => ({
  hasContactInfo: hasContact(text),
  hasSummary: sections.summary,
  hasSkills: sections.skills,
  hasExperience: sections.experience,
  hasEducation: sections.education,
  hasProjects: sections.projects,
  hasCertifications: sections.certifications,
  bulletPointsUsed: stats.bulletCount >= 3,
  atsFriendly: confidence >= 55 && score >= 55,
  score,
});

const buildRecommendations = (sections, stats, skills, impact, confidence, missingSkills, missingKeywords) => {
  const recommendations = [];
  if (confidence < 55) recommendations.push('Upload a full resume, not a certificate, mark sheet, or single-page credential.');
  if (!sections.summary) recommendations.push('Add a short professional summary tailored to the target role.');
  if (skills.length < 8) recommendations.push('Add a dedicated skills section with relevant tools, languages, and frameworks.');
  if (!sections.experience) recommendations.push('Add work experience or internships with role, company, dates, and responsibilities.');
  if (!sections.projects) recommendations.push('Add 1-3 projects with tools used, your contribution, and outcomes.');
  if (!sections.education) recommendations.push('Add education with degree, institution, and graduation year.');
  if (stats.bulletCount < 4) recommendations.push('Use bullet points so ATS and recruiters can scan achievements quickly.');
  if (impact < 40) recommendations.push('Add measurable results such as percentages, users, revenue, time saved, or scale.');
  missingSkills.slice(0, 6).forEach(skill => recommendations.push(`Add or emphasize ${skill} if you have real experience with it.`));
  missingKeywords.slice(0, 5).forEach(keyword => recommendations.push(`Use the job keyword "${keyword}" naturally in your resume.`));
  return [...new Set(recommendations)].slice(0, 12);
};

const calculateATSScore = (resume = {}, jd = {}) => {
  const resumeText = getResumeText(resume);
  const jdText = getJdText(jd);
  const parsedResume = resume.parsedData || {};
  const parsedJd = jd.parsedData || {};
  const resumeSkills = normalizeList(parsedResume.skills?.length ? parsedResume.skills : extractSkills(resumeText));
  const jdSkills = normalizeList([
    ...(parsedJd.requiredSkills || []),
    ...(parsedJd.preferredSkills || []),
    ...(jdText ? extractSkills(jdText) : []),
  ]);

  const sections = detectSections(resumeText);
  const stats = getStats(resumeText);
  const confidence = resumeConfidence(resumeText, sections, stats);
  const structure = structureScore(resumeText, sections, stats);
  const impact = impactScore(resumeText);
  const resumeKeywords = keywordList(resumeText);
  const jdKeywords = keywordList(jdText);

  const matchedSkills = jdSkills.length
    ? resumeSkills.filter(skill => jdSkills.includes(skill))
    : resumeSkills;
  const missingSkills = jdSkills.filter(skill => !resumeSkills.includes(skill));
  const additionalSkills = resumeSkills.filter(skill => !jdSkills.includes(skill));
  const matchedKeywords = jdKeywords.length
    ? resumeKeywords.filter(keyword => jdKeywords.includes(keyword))
    : resumeKeywords.slice(0, 20);
  const missingKeywords = jdKeywords.filter(keyword => !resumeKeywords.includes(keyword));

  const skillMatch = jdSkills.length ? clamp((matchedSkills.length / jdSkills.length) * 100) : clamp((resumeSkills.length / 12) * 100);
  const keywordMatch = jdKeywords.length ? clamp((matchedKeywords.length / jdKeywords.length) * 100) : clamp((resumeKeywords.length / 25) * 100);
  const requiredYears = extractYears(jdText);
  const candidateYears = extractYears(resumeText);
  const experienceMatch = requiredYears ? clamp((candidateYears / requiredYears) * 100) : (sections.experience ? 85 : 0);
  const educationMatch = sections.education ? 85 : (educationLevel(resumeText) ? 50 : 0);
  const projectRelevance = sections.projects ? 90 : 25;

  let overallScore = jdText.trim()
    ? (
      skillMatch * 0.32 +
      keywordMatch * 0.20 +
      experienceMatch * 0.12 +
      educationMatch * 0.08 +
      projectRelevance * 0.08 +
      structure * 0.12 +
      impact * 0.08
    )
    : (
      skillMatch * 0.18 +
      keywordMatch * 0.10 +
      experienceMatch * 0.16 +
      educationMatch * 0.10 +
      projectRelevance * 0.08 +
      structure * 0.22 +
      impact * 0.16
    );

  overallScore *= 0.45 + (confidence / 180);
  if (confidence < 35) overallScore = Math.min(overallScore, 32);
  else if (confidence < 55) overallScore = Math.min(overallScore, 48);
  else if (jdText.trim() && skillMatch < 20 && keywordMatch < 20) overallScore = Math.min(overallScore, 52);
  overallScore = clamp(overallScore);

  return {
    overallScore,
    matchPercentage: jdText.trim() ? clamp((skillMatch * 0.6) + (keywordMatch * 0.4)) : overallScore,
    categoryScores: {
      skillMatch,
      keywordMatch,
      experienceMatch,
      educationMatch,
      projectRelevance,
      resumeStructure: structure,
    },
    matchedKeywords: matchedKeywords.slice(0, 20),
    missingKeywords: missingKeywords.slice(0, 20),
    skillAnalysis: {
      matchedSkills,
      missingSkills,
      additionalSkills,
    },
    experienceAnalysis: {
      yearsMatch: requiredYears ? candidateYears >= requiredYears : sections.experience,
      requiredYears,
      candidateYears,
      relevantRoles: [],
    },
    educationAnalysis: {
      match: Boolean(sections.education || educationLevel(resumeText)),
      required: parsedJd.educationRequired || '',
      candidate: sections.education ? 'Education section found' : '',
    },
    sectionAnalysis: sectionAnalysis(sections),
    formattingAnalysis: formattingAnalysis(resumeText, sections, stats, confidence, structure),
    recommendations: buildRecommendations(sections, stats, resumeSkills, impact, confidence, missingSkills, missingKeywords),
    documentConfidence: confidence,
  };
};

module.exports = { calculateATSScore };
