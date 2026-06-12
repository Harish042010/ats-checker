const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });

const logger = {
  info: (message) => {
    const log = `[INFO] ${new Date().toISOString()}: ${message}`;
    console.log(log);
    logStream.write(log + '\n');
  },
  error: (message, error) => {
    const log = `[ERROR] ${new Date().toISOString()}: ${message} ${error?.stack || error || ''}`;
    console.error(log);
    logStream.write(log + '\n');
  },
  warn: (message) => {
    const log = `[WARN] ${new Date().toISOString()}: ${message}`;
    console.warn(log);
    logStream.write(log + '\n');
  },
};

module.exports = logger;
