import validator from 'validator';

export function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return validator.escape(value.trim());
}

