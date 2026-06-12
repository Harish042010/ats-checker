import os
import json
import re
import sys
import time
import urllib.error
import urllib.request
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score
from sklearn.preprocessing import StandardScaler
import joblib

ML_SERVICE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(ML_SERVICE_DIR)
if ML_SERVICE_DIR not in sys.path:
    sys.path.append(ML_SERVICE_DIR)

from preprocessing.text_processor import TextProcessor
from scoring import ATSScorer


class ModelTrainer:
    def __init__(self):
        self.model_dir = os.path.join(ML_SERVICE_DIR, 'models')
        os.makedirs(self.model_dir, exist_ok=True)
        self.regressor = GradientBoostingRegressor(
            n_estimators=350,
            learning_rate=0.04,
            max_depth=3,
            min_samples_leaf=4,
            subsample=0.85,
            random_state=42
        )
        self.classifier = GradientBoostingClassifier(
            n_estimators=250,
            learning_rate=0.04,
            max_depth=3,
            min_samples_leaf=4,
            subsample=0.85,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.text_processor = TextProcessor()
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

    def generate_sample_data(self, n_samples=2000):
        np.random.seed(42)
        data = []

        for _ in range(n_samples):
            is_non_resume = np.random.random() < 0.12
            if is_non_resume:
                tfidf_sim = np.random.beta(1, 7)
                skill_match = np.random.beta(1, 8)
                keyword_match = np.random.beta(1, 8)
                exp_years = 0
                edu_level = np.random.choice([0, 1], p=[0.75, 0.25])
                has_projects = 0
                num_skills = np.random.randint(0, 4)
                text_length = np.random.randint(60, 450)
                document_confidence = np.random.beta(1, 8)
                structure_score = np.random.beta(1, 7)
                impact_score = np.random.beta(1, 8)
                word_count = np.random.randint(12, 90)
                bullet_count = np.random.randint(0, 2)
                required_years = np.random.randint(0, 8)
                jd_skill_count = np.random.randint(3, 14)
                matched_skill_count = int(round(skill_match * jd_skill_count))
                missing_skill_count = max(jd_skill_count - matched_skill_count, 0)
                matched_keyword_count = np.random.randint(0, 3)
                missing_keyword_count = np.random.randint(6, 22)
                experience_match_score = 0
                section_count = np.random.randint(0, 2)
                has_contact = 0
            else:
                tfidf_sim = np.random.beta(2.2, 2.4)
                skill_match = np.random.beta(2.5, 2.0)
                keyword_match = np.random.beta(2.2, 2.2)
                exp_years = np.random.randint(0, 16)
                edu_level = np.random.choice([0, 1, 2, 3], p=[0.08, 0.46, 0.34, 0.12])
                has_projects = np.random.choice([0, 1], p=[0.25, 0.75])
                num_skills = np.random.randint(1, 28)
                word_count = np.random.randint(80, 950)
                text_length = word_count * np.random.randint(5, 8)
                bullet_count = np.random.poisson(6)
                section_strength = (
                    0.30 * min(word_count / 450, 1) +
                    0.25 * min(num_skills / 14, 1) +
                    0.20 * has_projects +
                    0.15 * min(bullet_count / 8, 1) +
                    0.10 * min(exp_years / 5, 1)
                )
                document_confidence = np.clip(section_strength + np.random.normal(0, 0.08), 0, 1)
                structure_score = np.clip(section_strength + np.random.normal(0, 0.10), 0, 1)
                impact_score = np.clip(
                    0.45 * min(bullet_count / 8, 1) +
                    0.35 * min(exp_years / 5, 1) +
                    0.20 * np.random.beta(2, 2),
                    0,
                    1
                )
                required_years = np.random.choice([0, 1, 2, 3, 4, 5, 7, 10], p=[0.12, 0.08, 0.18, 0.20, 0.14, 0.16, 0.08, 0.04])
                jd_skill_count = np.random.randint(4, 18)
                matched_skill_count = int(round(skill_match * jd_skill_count))
                missing_skill_count = max(jd_skill_count - matched_skill_count, 0)
                matched_keyword_count = int(round(keyword_match * np.random.randint(10, 28)))
                missing_keyword_count = max(np.random.randint(10, 28) - matched_keyword_count, 0)
                experience_match_score = 0.75 if not required_years else min(exp_years / required_years, 1)
                section_count = int(document_confidence > 0.35) + int(structure_score > 0.45) + int(has_projects) + int(num_skills >= 8) + int(word_count >= 250)
                has_contact = int(np.random.random() < np.clip(document_confidence + 0.15, 0, 1))
            ats_score = (
                36 * skill_match +
                24 * keyword_match +
                12 * tfidf_sim +
                10 * experience_match_score +
                5 * document_confidence +
                4 * structure_score +
                4 * impact_score +
                2 * has_contact +
                1.5 * edu_level / 3 +
                1.5 * has_projects
            ) + np.random.normal(0, 4)
            if document_confidence < 0.35:
                ats_score = min(ats_score, np.random.uniform(5, 32))
            elif document_confidence < 0.55:
                ats_score = min(ats_score, np.random.uniform(28, 50))
            if jd_skill_count >= 5 and missing_skill_count / jd_skill_count > 0.70:
                ats_score = min(ats_score, np.random.uniform(28, 55))
            if skill_match < 0.20 and keyword_match < 0.25:
                ats_score = min(ats_score, np.random.uniform(18, 48))
            if ats_score > 82 and (skill_match < 0.70 or keyword_match < 0.55 or document_confidence < 0.65):
                ats_score = np.random.uniform(68, 81)
            ats_score = max(0, min(100, ats_score))
            match_pct = (
                tfidf_sim * 25 +
                skill_match * 35 +
                keyword_match * 25 +
                document_confidence * 15
            ) + np.random.normal(0, 5)
            if document_confidence < 0.35:
                match_pct = min(match_pct, np.random.uniform(5, 35))
            match_pct = max(0, min(100, match_pct))

            hired = 1 if ats_score > 60 + np.random.normal(0, 10) else 0

            data.append({
                'tfidf_similarity': tfidf_sim,
                'skill_match_score': skill_match,
                'keyword_match_score': keyword_match,
                'experience_years': exp_years,
                'education_level': edu_level,
                'has_projects': has_projects,
                'num_skills': num_skills,
                'text_length': text_length,
                'document_confidence': document_confidence,
                'structure_score': structure_score,
                'impact_score': impact_score,
                'word_count': word_count,
                'bullet_count': bullet_count,
                'required_experience_years': required_years,
                'experience_match_score': experience_match_score,
                'matched_skill_count': matched_skill_count,
                'missing_skill_count': missing_skill_count,
                'jd_skill_count': jd_skill_count,
                'matched_keyword_count': matched_keyword_count,
                'missing_keyword_count': missing_keyword_count,
                'section_count': section_count,
                'has_contact': has_contact,
                'ats_score': ats_score,
                'match_percentage': match_pct,
                'hired': hired,
            })

        self.df = pd.DataFrame(data)

        csv_path = os.path.join(ML_SERVICE_DIR, 'datasets', 'training_data.csv')
        os.makedirs(os.path.dirname(csv_path), exist_ok=True)
        self.df.to_csv(csv_path, index=False)
        print(f'Generated {n_samples} training samples -> {csv_path}')
        return self.df

    def load_env_file(self, path):
        if not os.path.exists(path):
            return
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                os.environ.setdefault(key, value)

    def get_gemini_api_key(self, api_key=None):
        if api_key:
            return api_key
        self.load_env_file(os.path.join(PROJECT_ROOT, 'backend', '.env'))
        self.load_env_file(os.path.join(ML_SERVICE_DIR, '.env'))
        return (
            os.environ.get('GEMINI_API_KEY') or
            os.environ.get('GOOGLE_API_KEY') or
            os.environ.get('GOOGLE_GENERATIVE_AI_API_KEY')
        )

    def _extract_json_array(self, text):
        if not text:
            return []
        cleaned = re.sub(r'^```(?:json)?|```$', '', text.strip(), flags=re.I | re.M).strip()
        match = re.search(r'\[[\s\S]*\]', cleaned)
        if not match:
            return []
        return json.loads(match.group(0))

    def _call_gemini(self, prompt, api_key, model, retries=3):
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
        payload = {
            'contents': [{
                'parts': [{'text': prompt}]
            }],
            'generationConfig': {
                'temperature': 0.35,
                'responseMimeType': 'application/json',
            },
        }
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        for attempt in range(retries + 1):
            try:
                with urllib.request.urlopen(request, timeout=60) as response:
                    body = json.loads(response.read().decode('utf-8'))
                break
            except urllib.error.HTTPError as exc:
                error_body = exc.read().decode('utf-8', errors='replace')
                if exc.code == 429 and attempt < retries:
                    wait_seconds = 20 * (attempt + 1)
                    print(f'Gemini rate limited. Retrying in {wait_seconds}s...')
                    time.sleep(wait_seconds)
                    continue
                raise RuntimeError(f'Gemini HTTP {exc.code}: {error_body[:800]}') from exc
        parts = body.get('candidates', [{}])[0].get('content', {}).get('parts', [])
        return ''.join(part.get('text', '') for part in parts)

    def _load_seed_examples(self):
        resumes_path = os.path.join(ML_SERVICE_DIR, 'datasets', 'sample_resumes.json')
        jd_path = os.path.join(ML_SERVICE_DIR, 'datasets', 'sample_jd.json')
        with open(resumes_path, 'r', encoding='utf-8') as f:
            resumes = json.load(f)
        with open(jd_path, 'r', encoding='utf-8') as f:
            jobs = json.load(f)
        return resumes, jobs

    def _build_feature_row(self, resume_text, jd_text, resume_skills, jd_skills, ats_score, hired=None):
        resume_skills = resume_skills or self.text_processor.extract_skills(resume_text)
        jd_skills = jd_skills or self.text_processor.extract_skills(jd_text)
        resume_set = {s.lower() for s in resume_skills}
        jd_set = {s.lower() for s in jd_skills}
        matched_skills = resume_set & jd_set

        resume_keywords = self.text_processor.extract_keywords(resume_text)
        jd_keywords = self.text_processor.extract_keywords(jd_text)
        matched_keywords = set(resume_keywords) & set(jd_keywords)

        skill_score = len(matched_skills) / len(jd_set) if jd_set else 0.6
        keyword_score = len(matched_keywords) / len(jd_keywords) if jd_keywords else 0.6
        resume_quality = self.ats_scorer.score_resume_only(resume_text, resume_skills, resume_keywords)
        stats = self.ats_scorer.text_stats(resume_text)
        required_years = self.ats_scorer.infer_required_years(jd_text)
        experience_years = self._extract_years(resume_text)
        sections = self.ats_scorer.detect_sections(resume_text)
        experience_match_score = 0.75 if not required_years else min(experience_years / required_years, 1)
        row = {
            'tfidf_similarity': self.text_processor.calculate_tfidf_similarity(resume_text, jd_text),
            'skill_match_score': skill_score,
            'keyword_match_score': keyword_score,
            'experience_years': experience_years,
            'education_level': self._extract_education_level(resume_text),
            'has_projects': 1 if 'project' in resume_text.lower() else 0,
            'num_skills': len(resume_skills),
            'text_length': len(resume_text),
            'document_confidence': resume_quality['document_confidence'] / 100.0,
            'structure_score': resume_quality['structure_score'] / 100.0,
            'impact_score': resume_quality['impact_score'] / 100.0,
            'word_count': stats['word_count'],
            'bullet_count': stats['bullet_count'],
            'required_experience_years': required_years,
            'experience_match_score': experience_match_score,
            'matched_skill_count': len(matched_skills),
            'missing_skill_count': max(len(jd_set) - len(matched_skills), 0),
            'jd_skill_count': len(jd_set),
            'matched_keyword_count': len(matched_keywords),
            'missing_keyword_count': max(len(jd_keywords) - len(matched_keywords), 0),
            'section_count': sum(1 for present in sections.values() if present),
            'has_contact': 1 if self.ats_scorer.has_contact(resume_text) else 0,
            'ats_score': max(0, min(100, float(ats_score))),
            'match_percentage': max(0, min(100, float(ats_score))),
            'hired': int(hired if hired is not None else float(ats_score) >= 65),
        }
        return row

    def _extract_years(self, text):
        years = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', text, re.I)
        return max([int(y) for y in years], default=0)

    def _extract_education_level(self, text):
        text_lower = text.lower()
        if any(k in text_lower for k in ['phd', 'doctorate']):
            return 3
        if any(k in text_lower for k in ['master', 'mba', 'm.tech', 'ms', 'm.s']):
            return 2
        if any(k in text_lower for k in ['bachelor', 'b.tech', 'b.e', 'bs', 'ba']):
            return 1
        return 0

    def generate_gemini_training_data(self, n_batches=8, rows_per_batch=20, model='gemini-2.0-flash', api_key=None):
        key = self.get_gemini_api_key(api_key)
        if not key:
            raise RuntimeError('GEMINI_API_KEY was not found in environment, backend/.env, or ml-service/.env')

        resumes, jobs = self._load_seed_examples()
        rows = []

        for batch_index in range(n_batches):
            prompt = f"""
You are an expert ATS resume scoring engine. Generate {rows_per_batch} diverse labeled training examples for an ATS checker.

Return ONLY a JSON array. Each item must have:
- resume_text: realistic resume summary text, 120-450 words
- jd_text: realistic job description, 80-260 words
- resume_skills: array of normalized skills
- jd_skills: array of normalized required skills
- ats_score: integer 0-100, calibrated like commercial ATS tools
- hired: 0 or 1

Scoring rules:
- 75-90 means strong fit with most required skills and readable structure
- 55-74 means partial fit with several missing role requirements
- below 55 means weak fit or wrong role
- Include frontend, backend, full-stack, data, ML, DevOps, cybersecurity, product, and beginner cases
- Include both title-only/simple JDs and detailed JDs
- Do not make every example high score

Seed resumes:
{json.dumps(resumes, ensure_ascii=False)[:4500]}

Seed jobs:
{json.dumps(jobs, ensure_ascii=False)[:4500]}

Batch number: {batch_index + 1}
"""
            try:
                text = self._call_gemini(prompt, key, model)
                examples = self._extract_json_array(text)
            except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
                raise RuntimeError(f'Gemini training batch {batch_index + 1} failed: {exc}') from exc

            for item in examples:
                if not all(k in item for k in ['resume_text', 'jd_text', 'ats_score']):
                    continue
                rows.append(self._build_feature_row(
                    item.get('resume_text', ''),
                    item.get('jd_text', ''),
                    item.get('resume_skills') or [],
                    item.get('jd_skills') or [],
                    item.get('ats_score', 0),
                    item.get('hired'),
                ))
            print(f'Gemini batch {batch_index + 1}/{n_batches}: collected {len(rows)} rows')

        if not rows:
            raise RuntimeError('Gemini returned no usable training rows')

        self.df = pd.DataFrame(rows)
        csv_path = os.path.join(ML_SERVICE_DIR, 'datasets', 'gemini_training_data.csv')
        self.df.to_csv(csv_path, index=False)
        print(f'Generated {len(self.df)} Gemini-labeled samples -> {csv_path}')
        return self.df

    def blend_with_sample_data(self, n_samples=2000):
        gemini_df = self.df.copy() if hasattr(self, 'df') else pd.DataFrame()
        synthetic_df = self.generate_sample_data(n_samples)
        if not gemini_df.empty:
            self.df = pd.concat([gemini_df, synthetic_df], ignore_index=True)
            csv_path = os.path.join(ML_SERVICE_DIR, 'datasets', 'training_data.csv')
            self.df.to_csv(csv_path, index=False)
            print(f'Blended Gemini + synthetic data -> {len(self.df)} total rows')
        return self.df

    def train(self):
        if not hasattr(self, 'df'):
            self.generate_sample_data()

        X = self.df[self.feature_cols].values
        y_score = self.df['ats_score'].values
        y_hired = self.df['hired'].values

        X_scaled = self.scaler.fit_transform(X)

        X_train, X_test, y_train, y_test, y_hired_train, y_hired_test = train_test_split(
            X_scaled, y_score, y_hired, test_size=0.2, random_state=42
        )

        self.regressor.fit(X_train, y_train)
        y_pred = self.regressor.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        print(f'Score Prediction Model - MSE: {mse:.4f}, R2: {r2:.4f}')

        self.classifier.fit(X_train, y_hired_train)
        y_hired_pred = self.classifier.predict(X_test)
        acc = accuracy_score(y_hired_test, y_hired_pred)
        print(f'Hired Classification Model - Accuracy: {acc:.4f}')

        self.feature_importance = dict(zip(self.feature_cols, self.regressor.feature_importances_))
        print('Feature importances:', self.feature_importance)

    def save_model(self):
        model_path = os.path.join(self.model_dir, 'resume_matcher.pkl')
        joblib.dump({
            'regressor': self.regressor,
            'classifier': self.classifier,
            'scaler': self.scaler,
            'feature_importance': self.feature_importance,
            'feature_cols': self.feature_cols,
        }, model_path)
        print(f'Model saved to {model_path}')

        metadata = {
            'model_type': 'GradientBoostingRegressor + GradientBoostingClassifier',
            'model_version': '4.0-role-fit-gradient-boosted',
            'features': list(self.feature_importance.keys()),
            'feature_importance': self.feature_importance,
            'training_rows': int(len(self.df)) if hasattr(self, 'df') else None,
            'n_estimators_regressor': 350,
            'n_estimators_classifier': 250,
            'max_depth': 3,
            'learning_rate': 0.04,
        }
        meta_path = os.path.join(self.model_dir, 'model_metadata.json')
        with open(meta_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f'Metadata saved to {meta_path}')


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Train the ResumeLens ATS model')
    parser.add_argument('--gemini', action='store_true', help='Use Gemini API to generate expert-labeled ATS training rows')
    parser.add_argument('--gemini-batches', type=int, default=8)
    parser.add_argument('--rows-per-batch', type=int, default=20)
    parser.add_argument('--gemini-model', default=os.environ.get('GEMINI_MODEL', 'gemini-2.0-flash'))
    parser.add_argument('--synthetic-samples', type=int, default=2000)
    args = parser.parse_args()

    trainer = ModelTrainer()
    if args.gemini:
        try:
            trainer.generate_gemini_training_data(
                n_batches=args.gemini_batches,
                rows_per_batch=args.rows_per_batch,
                model=args.gemini_model,
            )
            trainer.blend_with_sample_data(args.synthetic_samples)
        except RuntimeError as exc:
            print(f'Gemini-assisted generation unavailable: {exc}')
            print('Falling back to full synthetic ATS training data.')
            trainer.generate_sample_data(args.synthetic_samples)
    else:
        trainer.generate_sample_data(args.synthetic_samples)
    trainer.train()
    trainer.save_model()
    print('Training complete!')
