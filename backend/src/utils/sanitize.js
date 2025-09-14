// Keep sanitization minimal for non-HTML contexts. React escapes output by default,
// so storing raw characters like '&' is safe and avoids double-encoding.
export function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value.trim();
}
