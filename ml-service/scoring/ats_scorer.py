import re
from collections import Counter


class ATSScorer:
    SECTION_PATTERNS = {
        'summary': r'\b(summary|profile|objective|about me|professional summary)\b',
        'skills': r'\b(skills|technical skills|core competencies|technologies|tools)\b',
        'experience': r'\b(experience|employment|work history|internship|professional experience)\b',
        'education': r'\b(education|academic|qualification|university|college|bachelor|master|b\.?tech|degree)\b',
        'projects': r'\b(projects?|portfolio|capstone)\b',
        'certifications': r'\b(certifications?|licenses?|certificate)\b',
    }

    ACTION_VERBS = {
        'achieved', 'automated', 'built', 'created', 'delivered', 'designed',
        'developed', 'improved', 'implemented', 'increased', 'launched', 'led',
        'managed', 'optimized', 'reduced', 'resolved', 'shipped', 'streamlined',
    }

    CERTIFICATE_TERMS = {
        'certificate', 'certifies', 'certified that', 'has completed',
        'completion', 'course', 'issued', 'awarded', 'credential id',
    }

    RESUME_TERMS = {
        'summary', 'skills', 'experience', 'education', 'projects', 'internship',
        'responsibilities', 'achievements', 'technologies', 'github', 'linkedin',
    }

    STOP_WORDS = {
        'about', 'above', 'after', 'again', 'against', 'also', 'and', 'are',
        'because', 'been', 'being', 'between', 'both', 'candidate', 'company',
        'description', 'experience', 'from', 'have', 'into', 'must', 'our',
        'requirements', 'role', 'should', 'that', 'their', 'there', 'this',
        'with', 'work', 'will', 'years', 'your', 'you', 'using', 'target',
        'required', 'skills', 'responsibilities', 'include', 'delivering',
        'role-specific', 'practical', 'collaboration', 'clear',
        'documentation', 'outcomes', 'preferred',
    }

    def clamp(self, value, low=0, high=100):
        return max(low, min(high, round(float(value), 2)))

    def normalize_list(self, values):
        return sorted({str(v).strip().lower() for v in values or [] if str(v).strip()})

    def keyword_list(self, text, limit=35):
        raw_words = re.findall(r'[a-zA-Z][a-zA-Z+#.-]{2,}', text.lower())
        words = [word.strip('.+-') for word in raw_words]
        counts = Counter(w for w in words if w not in self.STOP_WORDS and not w.isdigit())
        return [word for word, _ in counts.most_common(limit)]

    def text_stats(self, text):
        words = re.findall(r'\b[\w+#.-]+\b', text)
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        bullets = len(re.findall(r'(^|\n)\s*(?:[-*•]|\d+[.)])\s+', text))
        return {
            'word_count': len(words),
            'line_count': len(lines),
            'bullet_count': bullets,
            'unique_ratio': len(set(w.lower() for w in words)) / max(len(words), 1),
        }

    def detect_sections(self, text):
        lower = text.lower()
        return {
            name: bool(re.search(pattern, lower, re.I))
            for name, pattern in self.SECTION_PATTERNS.items()
        }

    def resume_confidence(self, text, sections, stats):
        lower = text.lower()
        section_hits = sum(1 for present in sections.values() if present)
        resume_terms = sum(1 for term in self.RESUME_TERMS if term in lower)
        certificate_terms = sum(1 for term in self.CERTIFICATE_TERMS if term in lower)
        has_contact = self.has_contact(text)
        has_resume_body = stats['word_count'] >= 120 and section_hits >= 2

        confidence = 0
        confidence += min(section_hits * 14, 56)
        confidence += min(resume_terms * 4, 20)
        confidence += 10 if has_contact else 0
        confidence += 10 if has_resume_body else 0
        confidence += 8 if stats['bullet_count'] >= 3 else 0
        confidence -= min(certificate_terms * 14, 45)
        confidence -= 18 if stats['word_count'] < 80 else 0
        confidence -= 10 if stats['unique_ratio'] < 0.35 else 0
        return self.clamp(confidence)

    def has_contact(self, text):
        return bool(
            re.search(r'[\w.-]+@[\w.-]+\.\w+', text) or
            re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        )

    def impact_score(self, text):
        metrics = len(re.findall(
            r'\b\d+%|\b\d+\+|\b\d+x|\b\d+\s*(users|clients|projects|months|years|seconds|hours|revenue|sales|requests|records)\b',
            text,
            re.I,
        ))
        verbs = sum(1 for verb in self.ACTION_VERBS if re.search(rf'\b{re.escape(verb)}\b', text, re.I))
        return self.clamp(min(metrics * 18, 60) + min(verbs * 5, 40))

    def structure_score(self, text, sections, stats):
        score = 0
        score += 15 if self.has_contact(text) else 0
        score += 12 if sections['summary'] else 0
        score += 15 if sections['skills'] else 0
        score += 18 if sections['experience'] else 0
        score += 12 if sections['education'] else 0
        score += 10 if sections['projects'] else 0
        score += 8 if stats['bullet_count'] >= 4 else 0
        score += 5 if 250 <= stats['word_count'] <= 900 else 0
        score += 5 if stats['line_count'] >= 8 else 0
        return self.clamp(score)

    def experience_years(self, text):
        years = [int(y) for y in re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', text, re.I)]
        return max(years, default=0)

    def education_level(self, text):
        lower = text.lower()
        if any(k in lower for k in ['phd', 'doctorate']):
            return 3
        if any(k in lower for k in ['master', 'mba', 'm.tech', 'ms', 'm.s']):
            return 2
        if any(k in lower for k in ['bachelor', 'b.tech', 'b.e', 'bs', 'ba', 'degree']):
            return 1
        return 0

    def infer_required_years(self, jd_text):
        years = [int(y) for y in re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', jd_text, re.I)]
        return max(years, default=0)

    def score_resume_only(self, resume_text, resume_skills=None, resume_keywords=None):
        resume_skills = self.normalize_list(resume_skills)
        resume_keywords = resume_keywords or self.keyword_list(resume_text)
        sections = self.detect_sections(resume_text)
        stats = self.text_stats(resume_text)
        confidence = self.resume_confidence(resume_text, sections, stats)

        contact_score = 100 if self.has_contact(resume_text) else 0
        skills_score = self.clamp(len(resume_skills) / 12 * 100)
        section_score = self.structure_score(resume_text, sections, stats)
        impact = self.impact_score(resume_text)
        experience_score = 85 if sections['experience'] else (45 if self.experience_years(resume_text) else 0)
        education_score = 85 if sections['education'] else (50 if self.education_level(resume_text) else 0)
        project_score = 90 if sections['projects'] else 25

        raw_score = (
            contact_score * 0.10 +
            skills_score * 0.18 +
            section_score * 0.22 +
            experience_score * 0.16 +
            education_score * 0.10 +
            project_score * 0.08 +
            impact * 0.16
        )

        score = raw_score * (0.45 + confidence / 180)
        if confidence < 35:
            score = min(score, 32)
        elif confidence < 55:
            score = min(score, 48)

        recommendations = self.recommendations(sections, stats, resume_skills, impact, confidence)
        return {
            'score': self.clamp(score),
            'grade': self.grade(score),
            'document_confidence': confidence,
            'structure_score': section_score,
            'impact_score': impact,
            'section_analysis': self.section_analysis(sections),
            'formatting_analysis': self.formatting_analysis(resume_text, sections, stats, confidence, section_score),
            'ats_risks': self.ats_risks(resume_text, sections, stats, confidence, [], []),
            'parsing_notes': self.parsing_notes(sections, stats, confidence),
            'rewrite_suggestions': self.rewrite_suggestions([], [], sections, impact),
            'category_scores': {
                'skillMatch': skills_score,
                'keywordMatch': self.clamp(len(resume_keywords) / 25 * 100),
                'experienceMatch': experience_score,
                'educationMatch': education_score,
                'projectRelevance': project_score,
                'resumeStructure': section_score,
            },
            'recommendations': recommendations,
            'resume_keywords': resume_keywords[:20],
        }

    def score_job_fit(self, resume_text, jd_text, resume_skills, jd_skills, tfidf_similarity):
        resume_skills = self.normalize_list(resume_skills)
        jd_skills = self.normalize_list(jd_skills)
        resume_keywords = self.keyword_list(resume_text)
        jd_keywords = self.keyword_list(jd_text)

        matched_skills = sorted(set(resume_skills) & set(jd_skills))
        missing_skills = sorted(set(jd_skills) - set(resume_skills))
        additional_skills = sorted(set(resume_skills) - set(jd_skills))
        matched_keywords = sorted(set(resume_keywords) & set(jd_keywords))
        missing_keywords = sorted(set(jd_keywords) - set(resume_keywords))

        resume_quality = self.score_resume_only(resume_text, resume_skills, resume_keywords)
        skill_score = self.clamp(len(matched_skills) / max(len(jd_skills), 1) * 100) if jd_skills else 55
        keyword_score = self.clamp(len(matched_keywords) / max(len(jd_keywords), 1) * 100) if jd_keywords else 55
        similarity_score = self.clamp(tfidf_similarity * 100)

        required_years = self.infer_required_years(jd_text)
        candidate_years = self.experience_years(resume_text)
        experience_score = 70
        if required_years:
            experience_score = self.clamp(candidate_years / required_years * 100)

        fit_score = (
            skill_score * 0.34 +
            keyword_score * 0.22 +
            similarity_score * 0.14 +
            resume_quality['structure_score'] * 0.12 +
            resume_quality['impact_score'] * 0.10 +
            experience_score * 0.08
        )

        confidence = resume_quality['document_confidence']
        if confidence < 35:
            fit_score = min(fit_score, 30)
        elif confidence < 55:
            fit_score = min(fit_score, 45)
        elif skill_score < 20 and keyword_score < 20:
            fit_score = min(fit_score, 52)

        recommendations = list(resume_quality['recommendations'])
        recommendations.extend([f'Add or emphasize {skill} if you have real experience with it.' for skill in missing_skills[:6]])
        recommendations.extend([f'Use the job keyword "{kw}" naturally in your resume.' for kw in missing_keywords[:5]])

        return {
            'score': self.clamp(fit_score),
            'grade': self.grade(fit_score),
            'document_confidence': confidence,
            'skill_match_score': skill_score,
            'keyword_match_score': keyword_score,
            'matched_skills': matched_skills,
            'missing_skills': missing_skills,
            'additional_skills': additional_skills,
            'matched_keywords': matched_keywords[:20],
            'missing_keywords': missing_keywords[:20],
            'category_scores': {
                **resume_quality['category_scores'],
                'skillMatch': skill_score,
                'keywordMatch': keyword_score,
                'experienceMatch': experience_score,
            },
            'section_analysis': resume_quality['section_analysis'],
            'formatting_analysis': resume_quality['formatting_analysis'],
            'ats_risks': self.ats_risks(resume_text, self.detect_sections(resume_text), self.text_stats(resume_text), confidence, missing_skills, missing_keywords),
            'parsing_notes': resume_quality['parsing_notes'],
            'rewrite_suggestions': self.rewrite_suggestions(missing_skills, missing_keywords, self.detect_sections(resume_text), resume_quality['impact_score']),
            'recommendations': list(dict.fromkeys(recommendations))[:12],
        }

    def grade(self, score):
        score = float(score)
        if score >= 85:
            return 'A'
        if score >= 75:
            return 'B'
        if score >= 65:
            return 'C'
        if score >= 50:
            return 'D'
        return 'F'

    def ats_risks(self, text, sections, stats, confidence, missing_skills, missing_keywords):
        risks = []
        if confidence < 55:
            risks.append('Low parse confidence: the upload may not look like a complete resume.')
        if not self.has_contact(text):
            risks.append('Missing readable email or phone contact information.')
        if not sections.get('skills'):
            risks.append('Missing a dedicated skills section.')
        if not sections.get('experience'):
            risks.append('Missing work experience or internship details.')
        if stats['word_count'] < 180:
            risks.append('Resume is very short; ATS tools may not find enough evidence.')
        if stats['word_count'] > 1000:
            risks.append('Resume is long; trim lower-value content for faster scanning.')
        if stats['bullet_count'] < 3:
            risks.append('Few bullet points detected; achievements may be hard to scan.')
        if len(missing_skills) >= 5:
            risks.append('Several required skills from the job description are missing.')
        if len(missing_keywords) >= 8:
            risks.append('Keyword alignment is weak for this job description.')
        return risks[:8]

    def parsing_notes(self, sections, stats, confidence):
        present = [name for name, is_present in sections.items() if is_present]
        missing = [name for name, is_present in sections.items() if not is_present]
        return {
            'parseConfidence': confidence,
            'sectionsDetected': present,
            'sectionsMissing': missing,
            'wordCount': stats['word_count'],
            'bulletCount': stats['bullet_count'],
            'readability': 'good' if 250 <= stats['word_count'] <= 900 and confidence >= 55 else 'needs_review',
        }

    def rewrite_suggestions(self, missing_skills, missing_keywords, sections, impact):
        suggestions = []
        if missing_skills:
            suggestions.append(f'Tailor the skills section with relevant missing skills: {", ".join(missing_skills[:5])}.')
        if missing_keywords:
            suggestions.append(f'Work these job keywords into real achievements: {", ".join(missing_keywords[:5])}.')
        if not sections.get('summary'):
            suggestions.append('Rewrite the summary to name the target role and your strongest matching skills.')
        if not sections.get('experience'):
            suggestions.append('Add experience or internship bullets that show scope, tools, and outcomes.')
        if impact < 40:
            suggestions.append('Convert duty-based bullets into achievement bullets with numbers, scale, or business result.')
        return suggestions[:6]

    def recommendations(self, sections, stats, skills, impact, confidence):
        recs = []
        if confidence < 55:
            recs.append('Upload a full resume, not a certificate, mark sheet, or single-page credential.')
        if not sections['summary']:
            recs.append('Add a short professional summary tailored to the target role.')
        if len(skills) < 8:
            recs.append('Add a dedicated skills section with relevant tools, languages, and frameworks.')
        if not sections['experience']:
            recs.append('Add work experience or internships with role, company, dates, and responsibilities.')
        if not sections['projects']:
            recs.append('Add 1-3 projects with tools used, your contribution, and outcomes.')
        if not sections['education']:
            recs.append('Add education with degree, institution, and graduation year.')
        if stats['bullet_count'] < 4:
            recs.append('Use bullet points so ATS and recruiters can scan achievements quickly.')
        if impact < 40:
            recs.append('Add measurable results such as percentages, users, revenue, time saved, or scale.')
        return recs[:10]

    def section_analysis(self, sections):
        labels = {
            'summary': 'Professional Summary',
            'skills': 'Skills',
            'experience': 'Experience',
            'education': 'Education',
            'projects': 'Projects',
            'certifications': 'Certifications',
        }
        return [
            {
                'section': labels[name],
                'present': present,
                'score': 100 if present else 0,
                'suggestions': 'Present' if present else f'Add a clear {labels[name].lower()} section.',
            }
            for name, present in sections.items()
        ]

    def formatting_analysis(self, text, sections, stats, confidence, score):
        return {
            'hasContactInfo': self.has_contact(text),
            'hasSummary': sections['summary'],
            'hasSkills': sections['skills'],
            'hasExperience': sections['experience'],
            'hasEducation': sections['education'],
            'hasProjects': sections['projects'],
            'hasCertifications': sections['certifications'],
            'bulletPointsUsed': stats['bullet_count'] >= 3,
            'atsFriendly': confidence >= 55 and score >= 55,
            'score': score,
        }
