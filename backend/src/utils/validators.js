import validator from 'validator';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories.js';

export function canonicalizeCategory(category) {
  if (!category && category !== 0) return category;
  let s = String(category);
  // Decode common HTML entities repeatedly to collapse double-encodings
  for (let i = 0; i < 3; i++) {
    const prev = s;
    s = s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => ({
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
    })[m] || m);
    if (s === prev) break;
  }
  // Remove any trailing qualifier in parentheses, keep the base
  const i = s.indexOf('(');
  s = i >= 0 ? s.slice(0, i) : s;
  // Replace ampersands with the word 'and' for consistency
  s = s.replace(/\s*&\s*/g, ' and ');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function validateRegisterInput({ name, email, password }) {
  const errors = [];
  if (!name || validator.isEmpty(String(name))) errors.push('Name is required');
  if (!email || !validator.isEmail(String(email))) errors.push('Valid email is required');
  if (!password || String(password).length < 8) errors.push('Password must be at least 8 characters');
  return errors;
}

export function validateLoginInput({ email, password }) {
  const errors = [];
  if (!email || !validator.isEmail(String(email))) errors.push('Valid email is required');
  if (!password) errors.push('Password is required');
  return errors;
}

export function validateTransactionInput({ type, category, amount, date }) {
  const errors = [];
  if (!['income', 'expense'].includes(type)) errors.push('Type must be income or expense');
  const cat = canonicalizeCategory(category);
  if (!cat || validator.isEmpty(String(cat))) errors.push('Category is required');
  const numAmount = Number(amount);
  if (Number.isNaN(numAmount) || numAmount < 0) errors.push('Amount must be a non-negative number');
  if (!date || isNaN(new Date(date).getTime())) errors.push('Valid date is required');
  // Category whitelist validation
  if (cat) {
    const allowed = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!allowed.includes(cat)) {
      errors.push('Category is not allowed');
    }
  }
  return errors;
}
