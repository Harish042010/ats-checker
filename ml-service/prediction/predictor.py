import os
import numpy as np
import joblib
from scoring import ATSScorer


class ResumeMatcher:
    def __init__(self):
        self.model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
        self.regressor = None
        self.classifier = None
        self.scaler = None
        self.feature_importance = None
        self.model_loaded = False
        self.ats_scorer = ATSScorer()
        self.feature_cols = [
            'tfidf_similarity', 'skill_match_score', 'keyword_match_score',
            'experience_years', 'education_level', 'has_projects',
            'num_skills', 'text_length', 'document_confidence',
            'structure_score', 'impact_score', 'word_count', 'bullet_count',
            'required_experience_years', 'experience_match_score',
            'matched_skill_count', 'missing_skill_count', 'jd_skill_count',
            'matched_keyword_count', 'missing_keyword_count', 'section_count',
            'has_contact'
        ]

    def load_model(self):
        model_path = os.path.join(self.model_dir, 'resume_matcher.pkl')
        if os.path.exists(model_path):
            data = joblib.load(model_path)
            self.regressor = data['regressor']
            self.classifier = data['classifier']
            self.scaler = data['scaler']
            self.feature_importance = data.get('feature_importance', {})
            self.feature_cols = data.get('feature_cols', self.feature_cols)
            self.model_loaded = True
            print(f'Model loaded from {model_path}')
        else:
            raise FileNotFoundError(f'Model not found at {model_path}')

    def predict(self, resume_text, jd_text, resume_skills, jd_skills,
                tfidf_similarity, matched_skills, missing_skills,
                keyword_match_score=0):
        skill_match_score = 0
        if jd_skills and len(jd_skills) > 0:
            skill_match_score = (len(matched_skills) / len(jd_skills)) * 100

        experience_years = self._extract_years(resume_text)
        education_level = self._extract_education_level(resume_text)
        has_projects = 1 if 'project' in resume_text.lower() else 0
        num_skills = len(resume_skills)
        text_length = len(resume_text)
        resume_quality = self.ats_scorer.score_resume_only(resume_text, resume_skills, [])
        stats = self.ats_scorer.text_stats(resume_text)
        required_years = self.ats_scorer.infer_required_years(jd_text)
        experience_match_score = 0.75 if not required_years else min(experience_years / required_years, 1)
        sections = self.ats_scorer.detect_sections(resume_text)
        matched_keyword_count = 0
        missing_keyword_count = 0
        if jd_text:
            resume_keywords = self.ats_scorer.keyword_list(resume_text)
            jd_keywords = self.ats_scorer.keyword_list(jd_text)
            matched_keyword_count = len(set(resume_keywords) & set(jd_keywords))
            missing_keyword_count = max(len(jd_keywords) - matched_keyword_count, 0)

        feature_values = {
            'tfidf_similarity': tfidf_similarity,
            'skill_match_score': skill_match_score / 100.0,
            'keyword_match_score': keyword_match_score / 100.0 if keyword_match_score > 0 else 0.0,
            'experience_years': experience_years,
            'education_level': education_level,
            'has_projects': has_projects,
            'num_skills': num_skills,
            'text_length': text_length,
            'document_confidence': resume_quality['document_confidence'] / 100.0,
            'structure_score': resume_quality['structure_score'] / 100.0,
            'impact_score': resume_quality['impact_score'] / 100.0,
            'word_count': stats['word_count'],
            'bullet_count': stats['bullet_count'],
            'required_experience_years': required_years,
            'experience_match_score': experience_match_score,
            'matched_skill_count': len(matched_skills),
            'missing_skill_count': len(missing_skills),
            'jd_skill_count': len(jd_skills),
            'matched_keyword_count': matched_keyword_count,
            'missing_keyword_count': missing_keyword_count,
            'section_count': sum(1 for present in sections.values() if present),
            'has_contact': 1 if self.ats_scorer.has_contact(resume_text) else 0,
        }

        features = np.array([[feature_values[col] for col in self.feature_cols]])

        if self.model_loaded and self.scaler and self.regressor:
            features_scaled = self.scaler.transform(features)
            match_percentage = float(self.regressor.predict(features_scaled)[0])
            match_percentage = max(0, min(100, match_percentage))
        else:
            match_percentage = self._heuristic_score(
                skill_match_score, tfidf_similarity,
                len(matched_skills), len(jd_skills),
                experience_years, education_level,
                keyword_match_score
            )

        return {
            'match_percentage': match_percentage,
            'skill_match_score': round(skill_match_score, 2),
            'keyword_match_score': round(keyword_match_score, 2),
            'experience_years': experience_years,
            'education_level': education_level,
            'has_projects': has_projects,
            'num_skills': num_skills,
        }

    def _heuristic_score(self, skill_match, tfidf_sim, matched_count, total_count,
                          experience_years, education_level, keyword_match_score=0):
        skill_weight = 0.35
        tfidf_weight = 0.20
        keyword_weight = 0.15
        exp_weight = 0.15
        edu_weight = 0.10
        proj_weight = 0.05

        keyword_score = keyword_match_score or (matched_count / max(total_count, 1)) * 100
        exp_score = min(experience_years / 10, 1) * 100
        edu_score = (education_level / 3) * 100

        score = (
            skill_match * skill_weight +
            tfidf_sim * 100 * tfidf_weight +
            keyword_score * keyword_weight +
            exp_score * exp_weight +
            edu_score * edu_weight +
            60 * proj_weight
        )
        return max(0, min(100, score))

    def _extract_years(self, text):
        import re
        years = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', text, re.I)
        if years:
            return max(int(y) for y in years)
        return 0

    def _extract_education_level(self, text):
        text_lower = text.lower()
        if any(k in text_lower for k in ['phd', 'doctorate']):
            return 3
        if any(k in text_lower for k in ['master', 'mba', 'm.tech', 'ms', 'm.s']):
            return 2
        if any(k in text_lower for k in ['bachelor', 'b.tech', 'b.e', 'bs', 'ba']):
            return 1
        return 0

    def predict_batch(self, resumes_data):
        results = []
        for item in resumes_data:
            result = self.predict(
                resume_text=item.get('resume_text', ''),
                jd_text=item.get('jd_text', ''),
                resume_skills=item.get('resume_skills', []),
                jd_skills=item.get('jd_skills', []),
                tfidf_similarity=item.get('tfidf_similarity', 0),
                matched_skills=item.get('matched_skills', []),
                missing_skills=item.get('missing_skills', []),
            )
            results.append(result)
        return results
