import { ApiError } from '../utils/ApiError.js';

/**
 * Zod-based request validation middleware.
 * Usage: validate({ body: schema, query: schema, params: schema })
 * On success, replaces req[part] with the parsed (and coerced) value.
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    for (const part of ['body', 'query', 'params']) {
      if (schemas[part]) {
        const result = schemas[part].safeParse(req[part]);
        if (!result.success) {
          const details = result.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          }));
          throw ApiError.unprocessable('Validation failed', { details });
        }
        // req.query/params getters can be read-only depending on Express version;
        // assign defensively.
        try {
          req[part] = result.data;
        } catch {
          Object.defineProperty(req, part, { value: result.data, writable: true, configurable: true });
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default validate;
