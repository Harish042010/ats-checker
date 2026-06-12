const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ user, action, details, ipAddress, userAgent }) => {
  try {
    await ActivityLog.create({ user, action, details, ipAddress, userAgent });
  } catch (error) {
    console.error('Activity log failed:', error);
  }
};

module.exports = { logActivity };
