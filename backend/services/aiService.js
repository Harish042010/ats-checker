const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const logger = require('../utils/logger');

let genAI, model;

const initializeAI = () => {
  if (config.geminiApiKey && config.geminiApiKey !== 'your-gemini-api-key') {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
};

const generateRecommendations = async (resumeData, jdData) => {
  try {
    if (!model) {
      initializeAI();
      if (!model) {
        return getFallbackRecommendations(resumeData, jdData);
      }
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) optimization consultant. Analyze this resume against the job description and provide detailed recommendations.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Job Description Data:
${JSON.stringify(jdData, null, 2)}

Provide a JSON response with exactly this structure:
{
  "optimization": ["tip1", "tip2", "tip3"],
  "missingSkills": ["skill1", "skill2"],
  "projectImprovements": ["improvement1", "improvement2"],
  "summaryEnhancement": "A rewritten professional summary optimized for ATS",
  "interviewPrep": ["question1", "question2"],
  "atsTips": ["tip1", "tip2", "tip3"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return getFallbackRecommendations(resumeData, jdData);
  } catch (error) {
    logger.error('AI recommendation generation failed:', error);
    return getFallbackRecommendations(resumeData, jdData);
  }
};

const getFallbackRecommendations = (resumeData, jdData) => {
  const missingSkills = [];
  const jdSkills = jdData.parsedData?.requiredSkills || [];
  const resumeSkills = resumeData.parsedData?.skills || [];

  jdSkills.forEach(skill => {
    if (!resumeSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))) {
      missingSkills.push(skill);
    }
  });

  return {
    optimization: [
      'Include more industry-specific keywords from the job description',
      'Quantify achievements with metrics and numbers',
      'Use standard section headings for better ATS parsing',
    ],
    missingSkills,
    projectImprovements: [
      'Add links to live projects and GitHub repositories',
      'Describe project impact using the STAR method',
      'Highlight technologies that match the job requirements',
    ],
    summaryEnhancement: `Professional with expertise in ${(resumeSkills || []).slice(0, 3).join(', ')} seeking to leverage skills in a challenging role.`,
    interviewPrep: [
      'Prepare to discuss your experience with key technologies mentioned in the JD',
      'Have specific examples ready for behavioral questions',
      'Research the company and prepare thoughtful questions',
    ],
    atsTips: [
      'Use a clean, single-column resume layout',
      'Avoid headers, footers, tables, and graphics',
      'Save and upload as PDF for consistent formatting',
    ],
  };
};

module.exports = { generateRecommendations, initializeAI };
