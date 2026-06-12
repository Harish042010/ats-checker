# ResumeLens AI - API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

### Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| PUT | `/api/auth/password` | Change password | Yes |

### Register
```json
POST /api/auth/register
Body: { "name": "John", "email": "john@example.com", "password": "password123" }
Response: { "success": true, "token": "...", "user": { "id": "...", "name": "...", "email": "...", "role": "user" } }
```

### Login
```json
POST /api/auth/login
Body: { "email": "john@example.com", "password": "password123" }
Response: { "success": true, "token": "...", "user": { ... } }
```

### Resume Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/resume/upload` | Upload resume (multipart) | Yes |
| GET | `/api/resume` | Get all user resumes | Yes |
| GET | `/api/resume/:id` | Get resume by ID | Yes |
| DELETE | `/api/resume/:id` | Delete resume | Yes |

### Upload Resume
```
POST /api/resume/upload
Content-Type: multipart/form-data
Body: resume: <file.pdf or file.docx>
```

### Job Description Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/jd` | Create job description | Yes |
| GET | `/api/jd` | Get all user JDs | Yes |
| GET | `/api/jd/:id` | Get JD by ID | Yes |
| DELETE | `/api/jd/:id` | Delete JD | Yes |

### Create Job Description
```json
POST /api/jd
Body: { "title": "Software Engineer", "company": "Tech Corp", "description": "..." }
```

### Analysis Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/analyze` | Run ATS analysis | Yes |
| GET | `/api/analyze/reports` | Get all reports | Yes |
| GET | `/api/analyze/report/:id` | Get report details | Yes |
| GET | `/api/analyze/result/:id` | Get analysis result | Yes |

### Run Analysis
```json
POST /api/analyze
Body: { "resumeId": "...", "jdId": "..." }
Response: { "success": true, "atsResult": { ... }, "report": { ... } }
```

### Dashboard Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/stats` | Get user dashboard stats | Yes |
| GET | `/api/dashboard/admin` | Get admin dashboard stats | Admin |

### Health Check
```json
GET /api/health
Response: { "success": true, "message": "ResumeLens AI API is running", "timestamp": "..." }
```

## Error Responses
```json
{ "success": false, "message": "Error description" }
{ "success": false, "errors": [{ "msg": "Error", "param": "field" }] }
```

## ML Service Endpoints
Base: `http://localhost:5001/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | ML service health |
| POST | `/api/analyze` | ML-based resume-JD matching |
| POST | `/api/extract` | Extract keywords from text |
| POST | `/api/train` | Train/retrain ML model |
