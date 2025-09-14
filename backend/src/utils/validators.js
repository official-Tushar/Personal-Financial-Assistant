import validator from 'validator';

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
  if (!category || validator.isEmpty(String(category))) errors.push('Category is required');
  const numAmount = Number(amount);
  if (Number.isNaN(numAmount) || numAmount < 0) errors.push('Amount must be a non-negative number');
  if (!date || isNaN(new Date(date).getTime())) errors.push('Valid date is required');
  return errors;
}

