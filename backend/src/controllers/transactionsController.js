import { Transaction } from '../models/Transaction.js';
import { sanitizeString } from '../utils/sanitize.js';
import { validateTransactionInput } from '../utils/validators.js';

export async function createTransaction(req, res, next) {
  try {
    const { type, category, amount, date, description = '' } = req.body || {};
    const errors = validateTransactionInput({ type, category, amount, date });
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    const tx = await Transaction.create({
      userId: req.user.id,
      type,
      category: sanitizeString(category),
      amount: Number(amount),
      date: new Date(date),
      description: sanitizeString(description),
    });

    return res.status(201).json({ transaction: tx });
  } catch (err) {
    next(err);
  }
}

export async function listTransactions(req, res, next) {
  try {
    const { start, end } = req.query || {};
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const filter = { userId: req.user.id };
    if (start || end) {
      filter.date = {};
      if (start && !isNaN(new Date(start).getTime())) filter.date.$gte = new Date(start);
      if (end && !isNaN(new Date(end).getTime())) filter.date.$lte = new Date(end);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ date: -1, _id: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasPrev = page > 1;
    const hasNext = page < totalPages;

    return res.json({ transactions, page, limit, total, totalPages, hasPrev, hasNext });
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { type, category, amount, date, description = '' } = req.body || {};
    const errors = validateTransactionInput({ type, category, amount, date });
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    const updated = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        type,
        category: sanitizeString(category),
        amount: Number(amount),
        date: new Date(date),
        description: sanitizeString(description),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Transaction not found' });
    return res.json({ transaction: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: 'Transaction not found' });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
