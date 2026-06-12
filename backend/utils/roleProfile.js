const ROLE_PROFILES = [
  {
    patterns: [/web developer/i, /web development/i, /front[\s-]?end/i, /\bui developer\b/i],
    skills: ['javascript', 'typescript', 'html', 'css', 'responsive design', 'accessibility', 'git'],
    keywords: ['web', 'frontend', 'component', 'browser', 'responsive', 'accessibility', 'ui'],
  },
  {
    patterns: [/\breact\b/i],
    skills: ['javascript', 'typescript', 'react', 'html', 'css', 'responsive design', 'git'],
    keywords: ['react', 'component', 'frontend', 'state', 'hooks', 'browser'],
  },
  {
    patterns: [/\bangular\b/i],
    skills: ['javascript', 'typescript', 'angular', 'html', 'css', 'responsive design', 'git'],
    keywords: ['angular', 'component', 'frontend', 'typescript', 'browser', 'spa'],
  },
  {
    patterns: [/\bvue\b/i],
    skills: ['javascript', 'typescript', 'vue', 'html', 'css', 'responsive design', 'git'],
    keywords: ['vue', 'component', 'frontend', 'state', 'browser', 'spa'],
  },
  {
    patterns: [/back[\s-]?end/i, /\bnode\b/i, /\bapi\b/i, /server[\s-]?side/i],
    skills: ['node.js', 'express', 'rest api', 'sql', 'mongodb', 'docker', 'git'],
    keywords: ['backend', 'api', 'database', 'server', 'authentication', 'microservices'],
  },
  {
    patterns: [/full[\s-]?stack/i, /\bmern\b/i, /\bmean\b/i],
    skills: ['javascript', 'typescript', 'react', 'node.js', 'express', 'mongodb', 'rest api', 'git'],
    keywords: ['full stack', 'frontend', 'backend', 'api', 'database', 'deployment'],
  },
  {
    patterns: [/\bjava\b/i, /\bspring\b/i],
    skills: ['java', 'spring', 'sql', 'rest api', 'microservices', 'docker', 'git'],
    keywords: ['java', 'spring', 'backend', 'api', 'database', 'microservices'],
  },
  {
    patterns: [/\bpython\b/i, /\bdjango\b/i, /\bflask\b/i],
    skills: ['python', 'django', 'flask', 'fastapi', 'sql', 'rest api', 'git'],
    keywords: ['python', 'backend', 'api', 'database', 'automation', 'testing'],
  },
  {
    patterns: [/data analyst/i, /business analyst/i, /business intelligence/i, /\bbi\b/i],
    skills: ['sql', 'python', 'excel', 'power bi', 'tableau', 'data analysis', 'pandas'],
    keywords: ['analytics', 'dashboard', 'reporting', 'insights', 'metrics', 'visualization'],
  },
  {
    patterns: [/data scientist/i, /machine learning/i, /\bml\b/i, /\bai\b/i],
    skills: ['python', 'machine learning', 'scikit-learn', 'pandas', 'numpy', 'tensorflow', 'pytorch'],
    keywords: ['modeling', 'prediction', 'features', 'experiments', 'statistics', 'ml'],
  },
  {
    patterns: [/devops/i, /cloud/i, /site reliability/i, /\bsre\b/i],
    skills: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'linux'],
    keywords: ['cloud', 'deployment', 'monitoring', 'automation', 'infrastructure', 'pipeline'],
  },
  {
    patterns: [/mobile/i, /android/i, /flutter/i],
    skills: ['kotlin', 'java', 'dart', 'firebase', 'git'],
    keywords: ['mobile', 'android', 'app', 'ui', 'release', 'performance'],
  },
  {
    patterns: [/ui[\s/.-]*ux/i, /ux designer/i, /ui designer/i, /product designer/i, /web designer/i],
    skills: ['ui', 'ux', 'figma', 'responsive design', 'accessibility', 'html', 'css'],
    keywords: ['wireframe', 'prototype', 'design', 'usability', 'interface', 'user research'],
  },
  {
    patterns: [/qa\b/i, /quality assurance/i, /test engineer/i, /software tester/i, /automation tester/i],
    skills: ['testing', 'manual testing', 'selenium', 'cypress', 'jest', 'postman', 'jira'],
    keywords: ['test cases', 'automation', 'regression', 'defect', 'bug tracking', 'quality'],
  },
  {
    patterns: [/cyber/i, /security analyst/i, /information security/i, /penetration/i, /soc analyst/i],
    skills: ['cybersecurity', 'network security', 'penetration testing', 'linux', 'python', 'security'],
    keywords: ['vulnerability', 'threat', 'incident', 'risk', 'monitoring', 'compliance'],
  },
  {
    patterns: [/database/i, /\bdba\b/i, /sql developer/i],
    skills: ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'data analysis'],
    keywords: ['database', 'query', 'schema', 'performance', 'backup', 'optimization'],
  },
  {
    patterns: [/product manager/i, /project manager/i, /scrum master/i],
    skills: ['project management', 'agile', 'scrum', 'jira', 'communication', 'leadership'],
    keywords: ['roadmap', 'stakeholder', 'planning', 'delivery', 'requirements', 'coordination'],
  },
];

const buildRoleProfile = (title = '') => {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) return null;

  const matchedProfiles = ROLE_PROFILES.filter(profile =>
    profile.patterns.some(pattern => pattern.test(normalizedTitle))
  );

  const profiles = matchedProfiles.length
    ? matchedProfiles
    : [{
      skills: ['communication', 'problem solving', 'teamwork', 'project management', 'git'],
      keywords: normalizedTitle.toLowerCase().split(/\s+/).filter(word => word.length > 2),
    }];

  const skills = [...new Set(profiles.flatMap(profile => profile.skills))];
  const keywords = [...new Set(profiles.flatMap(profile => profile.keywords))];

  return {
    skills,
    keywords,
    text: [
      `Target role: ${normalizedTitle}.`,
      `Required skills: ${skills.join(', ')}.`,
      `Responsibilities include ${keywords.join(', ')} and delivering role-specific projects.`,
      'Experience with practical projects, collaboration, clear documentation, and measurable outcomes is preferred.',
    ].join(' '),
  };
};

module.exports = { buildRoleProfile };
