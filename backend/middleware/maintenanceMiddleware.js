const SystemSetting = require('../models/SystemSetting');

let cachedMaintenance = false;
let lastCheck = 0;

exports.checkMaintenance = async (req, res, next) => {
  const path = req.originalUrl || req.path || '';

  // Skip maintenance enforcement for health checks, auth login/refresh, and admin routes
  if (
    path.includes('/health') ||
    path.includes('/api/auth/login') ||
    path.includes('/api/auth/refresh') ||
    path.includes('/api/admin')
  ) {
    return next();
  }

  // Refresh cached maintenance status every 5 seconds to avoid DB query per request
  const now = Date.now();
  if (now - lastCheck > 5000) {
    try {
      const setting = await SystemSetting.findOne({ key: 'maintenance_mode' }).lean();
      cachedMaintenance = Boolean(setting?.value);
      lastCheck = now;
    } catch {
      // If DB read fails, keep prior cache state
    }
  }

  if (cachedMaintenance) {
    // If request has authenticated user who is founder, allow bypass
    const u = req.user;
    if (u && u.role === 'admin' && (u.isFounder || u.email === 'teamuniversal49@gmail.com')) {
      return next();
    }

    // Freeze non-founder write requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return res.status(503).json({
        success: false,
        maintenance: true,
        message: 'Platform is currently undergoing scheduled emergency maintenance. Operations are temporarily frozen.'
      });
    }
  }

  next();
};

exports.setMaintenanceState = async (isActive) => {
  cachedMaintenance = Boolean(isActive);
  lastCheck = Date.now();
  await SystemSetting.findOneAndUpdate(
    { key: 'maintenance_mode' },
    { value: Boolean(isActive) },
    { upsert: true, new: true }
  );
  return cachedMaintenance;
};

exports.getMaintenanceState = async () => {
  try {
    const setting = await SystemSetting.findOne({ key: 'maintenance_mode' }).lean();
    cachedMaintenance = Boolean(setting?.value);
    lastCheck = Date.now();
    return cachedMaintenance;
  } catch {
    return cachedMaintenance;
  }
};
