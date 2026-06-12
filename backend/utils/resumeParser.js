const { extractSkills } = require('./skillExtractor');

const parseResume = (text) => {
  const lines = text.split('\n').filter(l => l.trim());
  const email = text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || '';
  const phone = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] || '';

  const sections = {
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
  };

  let currentSection = 'summary';
  const sectionKeywords = {
    'experience|work|employment|professional background': 'experience',
    'education|academic|qualification|university|college|school': 'education',
    'skills|technical skills|core competencies|expertise': 'skills',
    'projects|project|personal projects|academic projects': 'projects',
    'certifications|certification|certificate|licenses': 'certifications',
    'languages|language': 'languages',
    'summary|profile|objective|about me|professional summary': 'summary',
  };

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    let matched = false;
    for (const [pattern, section] of Object.entries(sectionKeywords)) {
      if (new RegExp(pattern, 'i').test(lower)) {
        currentSection = section;
        matched = true;
        break;
      }
    }
    if (!matched && currentSection === 'skills') {
      line.split(/[,|•\n]/).forEach(s => {
        const skill = s.trim();
        if (skill && !sections.skills.includes(skill)) {
          sections.skills.push(skill);
        }
      });
    } else if (!matched && currentSection === 'experience') {
      sections.experience.push({ raw: line.trim() });
    } else if (!matched && currentSection === 'education') {
      sections.education.push({ raw: line.trim() });
    } else if (!matched && currentSection === 'projects') {
      sections.projects.push({ raw: line.trim() });
    } else if (!matched && currentSection === 'summary') {
      sections.summary += line.trim() + ' ';
    }
  }

  const skillsFromText = extractSkills(text);

  return {
    name: lines[0] || '',
    email,
    phone,
    skills: [...new Set([...sections.skills.map(s => s.trim()).filter(Boolean), ...skillsFromText])],
    experience: sections.experience.slice(0, 20),
    education: sections.education.slice(0, 10),
    projects: sections.projects.slice(0, 10),
    certifications: sections.certifications,
    languages: sections.languages,
    summary: sections.summary.trim(),
  };
};

module.exports = { parseResume };
