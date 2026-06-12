const SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php',
  'ruby', 'swift', 'kotlin', 'dart', 'html', 'css', 'sass', 'tailwind',
  'react', 'redux', 'next.js', 'angular', 'vue', 'frontend', 'responsive design',
  'accessibility', 'ui', 'ux', 'node.js', 'express', 'nestjs',
  'django', 'flask', 'fastapi', 'spring', '.net', 'laravel',
  'mongodb', 'mysql', 'postgresql', 'sql', 'redis', 'elasticsearch', 'firebase',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible',
  'jenkins', 'github actions', 'gitlab ci', 'ci/cd', 'git', 'linux', 'nginx',
  'rest api', 'graphql', 'grpc', 'microservices', 'websocket',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow',
  'pytorch', 'scikit-learn', 'pandas', 'numpy', 'matplotlib', 'power bi',
  'tableau', 'excel', 'data analysis', 'data science',
  'figma', 'testing', 'manual testing', 'selenium', 'cypress', 'jest', 'postman',
  'cybersecurity', 'network security', 'penetration testing',
  'agile', 'scrum', 'jira', 'project management', 'communication', 'leadership',
  'problem solving', 'teamwork', 'analytical thinking', 'security',
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSkill = (skill) => skill
  .toLowerCase()
  .replace(/\bnodejs\b/g, 'node.js')
  .replace(/\bnextjs\b/g, 'next.js')
  .replace(/\brest\b/g, 'rest api')
  .trim();

const extractSkills = (text = '') => {
  const lowered = text.toLowerCase();
  const found = new Set();

  SKILLS.forEach((skill) => {
    const pattern = new RegExp(`(^|[^a-z0-9+#.])${escapeRegExp(skill)}([^a-z0-9+#.]|$)`, 'i');
    if (pattern.test(lowered)) found.add(skill);
  });

  if (/\bfront[-\s]?end\b|\breact\s+developer\b|\bui\s+developer\b/.test(lowered)) {
    ['frontend', 'javascript', 'html', 'css', 'react', 'responsive design', 'git'].forEach(skill => found.add(skill));
  }

  if (/\bfull[-\s]?stack\b/.test(lowered)) {
    ['frontend', 'javascript', 'html', 'css', 'react', 'node.js', 'express', 'mongodb', 'rest api', 'git'].forEach(skill => found.add(skill));
  }

  return [...found].sort();
};

module.exports = { SKILLS, extractSkills, normalizeSkill };
