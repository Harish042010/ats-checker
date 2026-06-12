# ResumeLens AI

> AI-powered ATS Resume Checker SaaS Application

ResumeLens AI is a production-ready SaaS application that analyzes resumes against job descriptions using AI and machine learning. It provides detailed ATS compatibility scores, keyword analysis, skill gap detection, and AI-generated recommendations to help job seekers optimize their resumes.

## Architecture

```
ResumeLens-AI/
├── frontend/          # React.js (Vite) - User interface
├── backend/           # Node.js + Express - REST API
├── ml-service/        # Python Flask - ML matching engine
├── docs/              # Documentation
├── deployment/        # Docker & deployment configs
└── README.md
```

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS (dark mode)
- React Router v6
- React Hook Form
- Recharts (charts)
- Framer Motion (animations)
- Axios (HTTP client)
- React Hot Toast (notifications)
- React Icons

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication + bcrypt
- Multer (file uploads)
- pdf-parse + mammoth (text extraction)
- Cloudinary (file storage)
- Google Gemini AI (recommendations)
- express-validator + helmet + rate-limiter

### ML Service
- Python + Flask
- Scikit-learn (Random Forest)
- NLTK + SpaCy (NLP)
- TF-IDF + Cosine Similarity
- Joblib (model persistence)

### Deployment
- Docker + Docker Compose
- Nginx (reverse proxy)
- Render/GCP/AWS ready

## Features

- User registration, login, profile management
- Resume upload (PDF/DOCX) with text extraction
- Job description upload/paste
- ATS scoring engine (6 weighted categories)
- Skill extraction and keyword matching
- AI-powered recommendations (Gemini AI)
- ML-based resume-job matching
- Detailed analysis reports
- Dashboard with analytics and charts
- Dark mode support
- Responsive design
- Admin dashboard
- Rate limiting & security

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas URI
- Python 3.9+ (for ML service)
- Cloudinary account (optional)
- Google Gemini API key (optional)

### 1. Clone & Install

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run seed
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

### 2. Environment Variables

```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/resumelens
JWT_SECRET=your-super-secret-key
GEMINI_API_KEY=your-gemini-api-key
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
CORS_ORIGIN=http://localhost:5173
```

### 3. URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- ML Service: http://localhost:5001/api

### Demo Credentials
- User: user@resumelens.ai / user123456
- Admin: admin@resumelens.ai / admin123456

## ATS Scoring Criteria

| Category | Weight | Description |
|----------|--------|-------------|
| Skill Match | 35% | Matching skills against job requirements |
| Keyword Match | 25% | Keyword presence in resume |
| Experience Match | 15% | Years of relevant experience |
| Education Match | 10% | Education level requirements |
| Project Relevance | 10% | Project alignment with role |
| Resume Structure | 5% | Formatting and completeness |

## Deployment

### Docker
```bash
docker-compose -f deployment/docker-compose.yml up -d
```

### Render
1. Connect GitHub repo
2. Use render.yaml for service definitions
3. Set environment variables in dashboard
4. Deploy automatically on push

## API Endpoints

See [docs/api.md](docs/api.md) for complete API documentation.

## Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm run lint

# ML Service
cd ml-service && python -m pytest
```

## License

MIT
