import re
import warnings
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    NLTK_AVAILABLE = True
except Exception:
    NLTK_AVAILABLE = False

warnings.filterwarnings('ignore')


def _ensure_nltk():
    if not NLTK_AVAILABLE:
        return False
    try:
        nltk.data.find('tokenizers/punkt')
    except Exception:
        try:
            nltk.download('punkt', quiet=True)
        except Exception:
            pass
    try:
        nltk.data.find('corpora/stopwords')
    except Exception:
        try:
            nltk.download('stopwords', quiet=True)
        except Exception:
            pass
    try:
        nltk.data.find('corpora/wordnet')
    except Exception:
        try:
            nltk.download('wordnet', quiet=True)
        except Exception:
            pass
    return True


_ensure_nltk()


class TextProcessor:
    def __init__(self):
        self._lemmatizer = None
        self._stop_words = None
        self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')

        self.skill_keywords = [
            'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue',
            'node', 'express', 'django', 'flask', 'spring', 'dotnet', 'csharp', 'c++',
            'go', 'rust', 'swift', 'kotlin', 'ruby', 'php', 'html', 'css', 'sass',
            'tailwind', 'sql',
            'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'aws', 'azure',
            'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'git',
            'github', 'gitlab', 'ci/cd', 'rest', 'graphql', 'grpc', 'kafka', 'rabbitmq',
            'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow',
            'pytorch', 'keras', 'scikit-learn', 'data science', 'data analysis', 'pandas',
            'numpy', 'tableau', 'power bi', 'excel', 'agile', 'scrum', 'jira', 'confluence',
            'figma', 'testing', 'manual testing', 'selenium', 'cypress', 'jest', 'postman',
            'cybersecurity', 'network security', 'penetration testing',
            'linux', 'unix', 'bash', 'powershell', 'networking', 'security', 'devops',
            'frontend', 'backend', 'full stack', 'responsive design', 'accessibility',
            'ui', 'ux', 'api', 'microservices', 'saas',
            'communication', 'leadership', 'teamwork', 'problem solving', 'analytical',
            'project management', 'time management', 'critical thinking', 'creativity',
        ]

    def _get_lemmatizer(self):
        if self._lemmatizer is None and NLTK_AVAILABLE:
            try:
                self._lemmatizer = WordNetLemmatizer()
            except Exception:
                self._lemmatizer = None
        return self._lemmatizer

    def _get_stopwords(self):
        if self._stop_words is None:
            if NLTK_AVAILABLE:
                try:
                    self._stop_words = set(stopwords.words('english'))
                except Exception:
                    self._stop_words = set()
            else:
                self._stop_words = set()
        return self._stop_words

    def clean_text(self, text):
        if not text:
            return ''
        text = text.lower()
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\d+', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def tokenize(self, text):
        if NLTK_AVAILABLE:
            try:
                return nltk.word_tokenize(text)
            except Exception:
                pass
        return text.split()

    def remove_stopwords(self, tokens):
        stop_words = self._get_stopwords()
        return [t for t in tokens if t not in stop_words and len(t) > 2]

    def lemmatize(self, tokens):
        lemmatizer = self._get_lemmatizer()
        if lemmatizer:
            try:
                return [lemmatizer.lemmatize(t) for t in tokens]
            except Exception:
                pass
        return tokens

    def preprocess(self, text):
        cleaned = self.clean_text(text)
        tokens = self.tokenize(cleaned)
        tokens = self.remove_stopwords(tokens)
        tokens = self.lemmatize(tokens)
        return ' '.join(tokens)

    def extract_keywords(self, text, top_n=30):
        if not text:
            return []
        processed = self.preprocess(text)
        words = processed.split()
        freq = {}
        for w in words:
            freq[w] = freq.get(w, 0) + 1
        sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [w for w, _ in sorted_words[:top_n]]

    def extract_skills(self, text):
        if not text:
            return []
        text_lower = text.lower()
        found = []
        for skill in self.skill_keywords:
            pattern = r'(^|[^a-z0-9+#.])' + re.escape(skill) + r'([^a-z0-9+#.]|$)'
            if re.search(pattern, text_lower):
                found.append(skill)
        if re.search(r'\bfront[-\s]?end\b|\breact\s+developer\b|\bui\s+developer\b', text_lower):
            found.extend(['frontend', 'javascript', 'html', 'css', 'react', 'responsive design', 'git'])
        if re.search(r'\bfull[-\s]?stack\b', text_lower):
            found.extend(['frontend', 'javascript', 'html', 'css', 'react', 'node', 'express', 'mongodb', 'rest', 'git'])
        return list(set(found))

    def extract_entities(self, text):
        entities = {
            'skills': self.extract_skills(text),
            'email': re.findall(r'[\w.-]+@[\w.-]+\.\w+', text)[:5],
            'phone': re.findall(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)[:3],
            'years_experience': re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', text, re.I)[:3],
        }
        return entities

    def calculate_tfidf_similarity(self, text1, text2):
        try:
            corpus = [text1, text2]
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(corpus)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            return float(similarity[0][0])
        except Exception:
            return 0.0

    def calculate_skill_similarity(self, resume_skills, jd_skills):
        if not jd_skills:
            return 1.0
        if not resume_skills:
            return 0.0
        resume_set = set(s.lower() for s in resume_skills)
        jd_set = set(s.lower() for s in jd_skills)
        intersection = resume_set & jd_set
        return len(intersection) / len(jd_set) if jd_set else 0.0
