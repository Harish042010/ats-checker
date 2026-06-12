import os
import sys
import json
import re
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.append(os.path.dirname(os.path.abspath(__file__)))


app = Flask(__name__)
CORS(app)

from preprocessing.text_processor import TextProcessor
from prediction.predictor import ResumeMatcher
from scoring import ATSScorer

text_processor = TextProcessor()
resume_matcher = ResumeMatcher()
ats_scorer = ATSScorer()

model_loaded = False

ROLE_PROFILES = [
    {
        'patterns': [r'web developer', r'web development', r'front[-\s]?end', r'\bui developer\b'],
        'skills': ['javascript', 'typescript', 'html', 'css', 'responsive design', 'accessibility', 'git'],
        'keywords': ['web', 'frontend', 'component', 'browser', 'responsive', 'accessibility', 'ui'],
    },
    {
        'patterns': [r'\breact\b'],
        'skills': ['javascript', 'typescript', 'react', 'html', 'css', 'responsive design', 'git'],
        'keywords': ['react', 'component', 'frontend', 'state', 'hooks', 'browser'],
    },
    {
        'patterns': [r'\bangular\b'],
        'skills': ['javascript', 'typescript', 'angular', 'html', 'css', 'responsive design', 'git'],
        'keywords': ['angular', 'component', 'frontend', 'typescript', 'browser', 'spa'],
    },
    {
        'patterns': [r'\bvue\b'],
        'skills': ['javascript', 'typescript', 'vue', 'html', 'css', 'responsive design', 'git'],
        'keywords': ['vue', 'component', 'frontend', 'state', 'browser', 'spa'],
    },
    {
        'patterns': [r'back[-\s]?end', r'\bnode\b', r'\bapi\b', r'server[-\s]?side'],
        'skills': ['node', 'express', 'rest', 'sql', 'mongodb', 'docker', 'git'],
        'keywords': ['backend', 'api', 'database', 'server', 'authentication', 'microservices'],
    },
    {
        'patterns': [r'full[-\s]?stack', r'\bmern\b', r'\bmean\b'],
        'skills': ['javascript', 'typescript', 'react', 'node', 'express', 'mongodb', 'rest', 'git'],
        'keywords': ['full stack', 'frontend', 'backend', 'api', 'database', 'deployment'],
    },
    {
        'patterns': [r'\bjava\b', r'\bspring\b'],
        'skills': ['java', 'spring', 'sql', 'rest', 'microservices', 'docker', 'git'],
        'keywords': ['java', 'spring', 'backend', 'api', 'database', 'microservices'],
    },
    {
        'patterns': [r'\bpython\b', r'\bdjango\b', r'\bflask\b'],
        'skills': ['python', 'django', 'flask', 'sql', 'rest', 'git'],
        'keywords': ['python', 'backend', 'api', 'database', 'automation', 'testing'],
    },
    {
        'patterns': [r'data analyst', r'business analyst', r'business intelligence', r'\bbi\b'],
        'skills': ['sql', 'python', 'excel', 'power bi', 'tableau', 'data analysis', 'pandas'],
        'keywords': ['analytics', 'dashboard', 'reporting', 'insights', 'metrics', 'visualization'],
    },
    {
        'patterns': [r'data scientist', r'machine learning', r'\bml\b', r'\bai\b'],
        'skills': ['python', 'machine learning', 'scikit-learn', 'pandas', 'numpy', 'tensorflow', 'pytorch'],
        'keywords': ['modeling', 'prediction', 'features', 'experiments', 'statistics', 'ml'],
    },
    {
        'patterns': [r'devops', r'cloud', r'site reliability', r'\bsre\b'],
        'skills': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'linux'],
        'keywords': ['cloud', 'deployment', 'monitoring', 'automation', 'infrastructure', 'pipeline'],
    },
    {
        'patterns': [r'ui[\s/.-]*ux', r'ux designer', r'ui designer', r'product designer', r'web designer'],
        'skills': ['ui', 'ux', 'figma', 'responsive design', 'accessibility', 'html', 'css'],
        'keywords': ['wireframe', 'prototype', 'design', 'usability', 'interface', 'user research'],
    },
    {
        'patterns': [r'\bqa\b', r'quality assurance', r'test engineer', r'software tester', r'automation tester'],
        'skills': ['testing', 'manual testing', 'selenium', 'cypress', 'jest', 'postman', 'jira'],
        'keywords': ['test cases', 'automation', 'regression', 'defect', 'bug tracking', 'quality'],
    },
    {
        'patterns': [r'cyber', r'security analyst', r'information security', r'penetration', r'soc analyst'],
        'skills': ['cybersecurity', 'network security', 'penetration testing', 'linux', 'python', 'security'],
        'keywords': ['vulnerability', 'threat', 'incident', 'risk', 'monitoring', 'compliance'],
    },
    {
        'patterns': [r'database', r'\bdba\b', r'sql developer'],
        'skills': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'data analysis'],
        'keywords': ['database', 'query', 'schema', 'performance', 'backup', 'optimization'],
    },
    {
        'patterns': [r'product manager', r'project manager', r'scrum master'],
        'skills': ['project management', 'agile', 'scrum', 'jira', 'communication', 'leadership'],
        'keywords': ['roadmap', 'stakeholder', 'planning', 'delivery', 'requirements', 'coordination'],
    },
]


def build_role_profile_text(title):
    title = (title or '').strip()
    if not title:
        return ''

    matched = [
        profile for profile in ROLE_PROFILES
        if any(re.search(pattern, title, re.I) for pattern in profile['patterns'])
    ]
    if not matched:
        words = [word for word in re.findall(r'[a-zA-Z][a-zA-Z+#.-]{2,}', title.lower())]
        skills = ['communication', 'problem solving', 'teamwork', 'project management', 'git']
        keywords = words or ['role', 'requirements']
    else:
        skills = sorted({skill for profile in matched for skill in profile['skills']})
        keywords = sorted({keyword for profile in matched for keyword in profile['keywords']})

    return ' '.join([
        f'Target role: {title}.',
        f'Required skills: {", ".join(skills)}.',
        f'Responsibilities include {", ".join(keywords)} and delivering role-specific projects.',
        'Experience with practical projects, collaboration, clear documentation, and measurable outcomes is preferred.',
    ])

def load_model_once():
    global model_loaded
    if model_loaded:
        return True
    try:
        resume_matcher.load_model()
        model_loaded = True
        print('ML model loaded successfully')
        return True
    except Exception as exc:
        print(f'No pre-trained model found. Use /api/train endpoint to train a new model. ({exc})')
        return False

load_model_once()

def calculate_resume_only_score(resume_text, resume_skills, resume_keywords):
    text_lower = resume_text.lower()
    words = resume_text.split()

    has_contact = bool(
        re.search(r'[\w.-]+@[\w.-]+\.\w+', resume_text) or
        re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text)
    )
    has_summary = any(k in text_lower for k in ['summary', 'profile', 'objective', 'about me'])
    has_experience = any(k in text_lower for k in ['experience', 'employment', 'internship', 'work history'])
    has_education = any(k in text_lower for k in ['education', 'bachelor', 'master', 'b.tech', 'degree', 'university'])
    has_projects = 'project' in text_lower
    has_bullets = any(marker in resume_text for marker in ['•', '- ', '* '])
    has_impact = bool(re.search(r'\b\d+%|\b\d+\+|\b\d+x|\b\d+\s*(users|clients|projects|months|years|seconds|hours|revenue|sales)\b', resume_text, re.I))

    contact_score = 100 if has_contact else 45
    summary_score = 90 if has_summary else 45
    skills_score = min(len(resume_skills) * 10, 100) if resume_skills else 0
    experience_score = 85 if has_experience else 35
    education_score = 80 if has_education else 40
    project_score = 85 if has_projects else 35
    structure_score = 50
    if len(words) >= 250:
        structure_score += 15
    if len(words) >= 450:
        structure_score += 10
    if has_bullets:
        structure_score += 15
    if has_impact:
        structure_score += 10

    score = (
        contact_score * 0.12 +
        summary_score * 0.12 +
        skills_score * 0.18 +
        experience_score * 0.18 +
        education_score * 0.10 +
        project_score * 0.10 +
        min(structure_score, 100) * 0.15 +
        (100 if has_impact else 55) * 0.15
    )

    recommendations = []
    if not has_contact:
        recommendations.append('Add clear email and phone contact details.')
    if not has_summary:
        recommendations.append('Add a short professional summary.')
    if len(resume_skills) < 8:
        recommendations.append('Add more relevant technical and role skills.')
    if not has_experience:
        recommendations.append('Add an experience or internship section.')
    if not has_projects:
        recommendations.append('Add 1-3 projects with tools and outcomes.')
    if not has_impact:
        recommendations.append('Add measurable impact such as percentages, scale, users, or time saved.')

    return {
        'score': max(0, min(100, score)),
        'structure_score': min(structure_score, 100),
        'recommendations': recommendations,
        'resume_keywords': resume_keywords[:20],
    }

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'ResumeLens AI ML Service',
        'model_loaded': model_loaded,
        'version': '1.0.0'
    })

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        resume_text = data.get('resume_text', '')
        jd_text = data.get('jd_text', '')
        target_role = data.get('job_title') or data.get('role') or data.get('branch') or ''
        generated_jd_text = ''
        if not jd_text.strip() and target_role.strip():
            generated_jd_text = build_role_profile_text(target_role)
            jd_text = generated_jd_text
        resume_skills = data.get('resume_skills') or text_processor.extract_skills(resume_text)
        jd_skills = data.get('jd_skills') or text_processor.extract_skills(jd_text)

        if not resume_text:
            return jsonify({'error': 'resume_text is required'}), 400

        resume_processed = text_processor.preprocess(resume_text)
        jd_processed = text_processor.preprocess(jd_text) if jd_text else ''

        if not jd_text.strip():
            resume_keywords = text_processor.extract_keywords(resume_text)
            resume_only = ats_scorer.score_resume_only(resume_text, resume_skills, resume_keywords)

            return jsonify({
                'success': True,
                'mode': 'resume-only',
                'match_percentage': round(resume_only['score'], 2),
                'grade': resume_only['grade'],
                'document_confidence': resume_only['document_confidence'],
                'similarity_score': 0,
                'skill_match_score': resume_only['category_scores']['skillMatch'],
                'keyword_match_score': resume_only['category_scores']['keywordMatch'],
                'matched_skills': resume_skills[:20],
                'missing_skills': [],
                'additional_skills': resume_skills,
                'matched_keywords': resume_only['resume_keywords'],
                'missing_keywords': [],
                'category_scores': resume_only['category_scores'],
                'section_analysis': resume_only['section_analysis'],
                'formatting_analysis': resume_only['formatting_analysis'],
                'ats_risks': resume_only['ats_risks'],
                'parsing_notes': resume_only['parsing_notes'],
                'rewrite_suggestions': resume_only['rewrite_suggestions'],
                'recommendations': resume_only['recommendations'],
                'ml_model_used': False,
                'resume_summary': resume_processed[:200] if resume_processed else '',
                'jd_summary': '',
            })

        tfidf_similarity = text_processor.calculate_tfidf_similarity(resume_text, jd_text)

        matched_skills = list(set(resume_skills) & set(jd_skills))
        missing_skills = list(set(jd_skills) - set(resume_skills))
        additional_skills = list(set(resume_skills) - set(jd_skills))

        resume_keywords = text_processor.extract_keywords(resume_text)
        jd_keywords = text_processor.extract_keywords(jd_text)
        matched_keywords = list(set(resume_keywords) & set(jd_keywords))
        missing_keywords = list(set(jd_keywords) - set(resume_keywords))
        keyword_match_score = (
            (len(matched_keywords) / len(jd_keywords)) * 100
            if jd_keywords else 60
        )

        result = resume_matcher.predict(
            resume_text=resume_text,
            jd_text=jd_text,
            resume_skills=resume_skills,
            jd_skills=jd_skills,
            tfidf_similarity=tfidf_similarity,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            keyword_match_score=keyword_match_score
        )
        ats_result = ats_scorer.score_job_fit(
            resume_text=resume_text,
            jd_text=jd_text,
            resume_skills=resume_skills,
            jd_skills=jd_skills,
            tfidf_similarity=tfidf_similarity,
        )
        calibrated_score = (
            ats_result['score'] * 0.75 +
            result['match_percentage'] * 0.25
        ) if model_loaded else ats_result['score']

        response = {
            'success': True,
            'mode': 'job-fit',
            'match_percentage': round(calibrated_score, 2),
            'grade': ats_scorer.grade(calibrated_score),
            'document_confidence': ats_result['document_confidence'],
            'similarity_score': round(float(tfidf_similarity), 4),
            'skill_match_score': ats_result['skill_match_score'],
            'keyword_match_score': ats_result['keyword_match_score'],
            'matched_skills': ats_result['matched_skills'],
            'missing_skills': ats_result['missing_skills'],
            'additional_skills': ats_result['additional_skills'],
            'matched_keywords': ats_result['matched_keywords'],
            'missing_keywords': ats_result['missing_keywords'],
            'category_scores': ats_result['category_scores'],
            'section_analysis': ats_result['section_analysis'],
            'formatting_analysis': ats_result['formatting_analysis'],
            'ats_risks': ats_result['ats_risks'],
            'parsing_notes': ats_result['parsing_notes'],
            'rewrite_suggestions': ats_result['rewrite_suggestions'],
            'recommendations': ats_result['recommendations'],
            'raw_model_score': round(result['match_percentage'], 2),
            'ml_model_used': model_loaded,
            'resume_summary': resume_processed[:200] if resume_processed else '',
            'jd_summary': jd_processed[:200] if jd_processed else '',
            'generated_jd_from_role': bool(generated_jd_text),
        }

        return jsonify(response)

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/extract', methods=['POST'])
def extract_text():
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400

        processed = text_processor.preprocess(text)
        keywords = text_processor.extract_keywords(text)
        entities = text_processor.extract_entities(text)

        return jsonify({
            'success': True,
            'processed_text': processed,
            'keywords': keywords[:30],
            'entities': entities,
            'word_count': len(text.split()),
            'char_count': len(text),
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/train', methods=['POST'])
def train_model():
    global model_loaded
    try:
        data = request.get_json(silent=True) or {}
        use_gemini = bool(data.get('use_gemini', True))
        gemini_batches = int(data.get('gemini_batches', 8))
        rows_per_batch = int(data.get('rows_per_batch', 20))
        synthetic_samples = int(data.get('synthetic_samples', 2000))
        gemini_model = data.get('gemini_model') or os.environ.get('GEMINI_MODEL', 'gemini-2.0-flash')

        from training.trainer import ModelTrainer
        trainer = ModelTrainer()
        gemini_error = None
        if use_gemini:
            try:
                trainer.generate_gemini_training_data(
                    n_batches=gemini_batches,
                    rows_per_batch=rows_per_batch,
                    model=gemini_model,
                )
                trainer.blend_with_sample_data(synthetic_samples)
            except RuntimeError as exc:
                gemini_error = str(exc)
                trainer.generate_sample_data(synthetic_samples)
        else:
            trainer.generate_sample_data(synthetic_samples)
        trainer.train()
        trainer.save_model()
        resume_matcher.load_model()
        model_loaded = True
        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'model_loaded': True,
            'use_gemini': use_gemini,
            'gemini_error': gemini_error,
            'training_rows': int(len(trainer.df)) if hasattr(trainer, 'df') else None,
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        import nltk
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
    except:
        pass

    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
