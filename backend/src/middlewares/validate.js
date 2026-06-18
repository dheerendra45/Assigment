import { Errors } from '../utils/AppError.js';

function formatIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

// Validates body/query/params against zod schemas; validated query goes on req.validatedQuery.
export const validate = (schema) => (req, _res, next) => {
  try {
    if (schema.body) req.body = schema.body.parse(req.body);
    if (schema.query) req.validatedQuery = schema.query.parse(req.query);
    if (schema.params) req.params = schema.params.parse(req.params);
    next();
  } catch (err) {
    if (err.issues) {
      const fields = formatIssues(err);
      return next(Errors.validation(fields[0]?.message ?? 'Validation failed', fields));
    }
    return next(err);
  }
};
