const { extractSkills } = require('./skillExtractor');

const STOP_WORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'also', 'and', 'are', 'because',
  'been', 'being', 'between', 'both', 'candidate', 'company', 'description',
  'experience', 'from', 'have', 'into', 'must', 'our', 'requirements', 'role',
  'should', 'that', 'their', 'there', 'this', 'with', 'work', 'will', 'years',
  'your', 'you', 'using',
]);

const parseJobDescription = (text = '') => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const skills = extractSkills(text);
  const keywords = text
    .toLowerCase()
    .replace(/[^\w+#.\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 3 && !STOP_WORDS.has(w) && Number.isNaN(Number(w)))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

  const topKeywords = Object.entries(keywords)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 35)
    .map(([word]) => word);

  const expMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s*of)?\s*(?:experience|exp)?/i);
  const eduMatch = text.match(/(?:bachelor|master|phd|doctorate|b\.tech|m\.tech|mba|bs|ms|ba|associate|diploma)[^,\n]*/i);

  return {
    requiredSkills: skills.slice(0, 20),
    preferredSkills: [],
    experienceRequired: expMatch ? expMatch[0] : '',
    educationRequired: eduMatch ? eduMatch[0] : '',
    responsibilities: lines.filter(l => l.length > 20).slice(0, 12),
    keywords: topKeywords,
    industry: '',
  };
};

module.exports = { parseJobDescription };
