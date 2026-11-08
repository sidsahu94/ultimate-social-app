// backend/middleware/validate.js
const { ZodError } = require('zod');

/**
 * Enterprise validation middleware parsing incoming request streams securely.
 * Mitigates unhandled engine crashes on invalid or entirely absent payload contexts.
 */
module.exports = (schema) => {
  return async (req, res, next) => {
    try {
      // Hardened initialization ensures structural evaluation blocks are objects
      const payload = {
        body: req.body && typeof req.body === 'object' ? req.body : {},
        query: req.query && typeof req.query === 'object' ? req.query : {},
        params: req.params && typeof req.params === 'object' ? req.params : {},
      };

      const validated = await schema.parseAsync(payload);
      
      // Safe context re-assignment preventing payload corruption
      req.body = validated.body ?? req.body;
      req.query = validated.query ?? req.query;
      req.params = validated.params ?? req.params;
      
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          type: 'ValidationError',
          message: 'Validation failed',
          errors: err.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      return next(err);
    }
  };
};