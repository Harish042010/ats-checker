const config = require('../config');
const logger = require('../utils/logger');

const analyzeWithML = async ({ resumeText, jdText, resumeSkills, jdSkills }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${config.mlServiceUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume_text: resumeText,
        jd_text: jdText,
        resume_skills: resumeSkills,
        jd_skills: jdSkills,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ML service responded with ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.warn(`ML service unavailable, using local ATS engine: ${error.message}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { analyzeWithML };
