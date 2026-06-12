const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const config = require('./config');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { initializeAI } = require('./services/aiService');

const app = express();
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

connectDB();
configureCloudinary();
initializeAI();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/', apiLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/jd', require('./routes/jd'));
app.use('/api/direct-analyze', require('./routes/directAnalysis'));
app.use('/api/analyze', require('./routes/analysis'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ResumeLens AI API is running', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`ResumeLens AI Backend running on port ${PORT} in ${config.nodeEnv} mode`);
});

module.exports = app;
