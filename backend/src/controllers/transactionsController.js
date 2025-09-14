import { Transaction } from '../models/Transaction.js';
import { sanitizeString } from '../utils/sanitize.js';
import { validateTransactionInput, canonicalizeCategory } from '../utils/validators.js';

export async function createTransaction(req, res, next) {
  try {
    const { type, category, amount, date, description = '' } = req.body || {};
    const errors = validateTransactionInput({ type, category, amount, date });
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    const tx = await Transaction.create({
      userId: req.user.id,
      type,
      category: sanitizeString(canonicalizeCategory(category)),
      amount: Number(amount),
      date: new Date(date),
      description: sanitizeString(description),
    });

    return res.status(201).json({ transaction: tx });
  } catch (err) {
    // Duplicate key
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate transaction for this user' });
    }
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

    const txs = transactions.map((t) => {
      const o = t.toObject();
      // Decode any HTML entities stored previously, then canonicalize
      o.category = canonicalizeCategory(
        String(o.category)
          .replace(/&(amp|lt|gt|quot|#39);/g, (m) => ({
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
          })[m] || m)
      );
      return o;
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const hasPrev = page > 1;
    const hasNext = page < totalPages;

    return res.json({ transactions: txs, page, limit, total, totalPages, hasPrev, hasNext });
  } catch (err) {
    next(err);
  }
}

export async function createTransactionsBulk(req, res, next) {
  try {
    const { transactions } = req.body || {};
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ message: 'transactions must be a non-empty array' });
    }
    if (transactions.length > 100) {
      return res.status(400).json({ message: 'Too many items; max 100 at once' });
    }

    const results = [];
    for (const t of transactions) {
      try {
        const { type, category, amount, date, description = '' } = t || {};
        const errors = validateTransactionInput({ type, category, amount, date });
        if (errors.length) {
          results.push({ ok: false, error: errors.join(', ') });
          continue;
        }
        const doc = await Transaction.create({
          userId: req.user.id,
          type,
          category: sanitizeString(canonicalizeCategory(category)),
          amount: Number(amount),
          date: new Date(date),
          description: sanitizeString(description),
        });
        results.push({ ok: true, transaction: doc });
      } catch (err) {
        if (err && err.code === 11000) {
          results.push({ ok: false, error: 'Duplicate transaction for this user' });
        } else {
          results.push({ ok: false, error: err.message || 'Failed to create' });
        }
      }
    }
    const created = results.filter((r) => r.ok).map((r) => r.transaction);
    const failed = results.filter((r) => !r.ok).map((r) => ({ error: r.error }));
    return res.status(created.length ? 201 : 400).json({ createdCount: created.length, failedCount: failed.length, created, failed });
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
        category: sanitizeString(canonicalizeCategory(category)),
        amount: Number(amount),
        date: new Date(date),
        description: sanitizeString(description),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Transaction not found' });
    return res.json({ transaction: updated });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate transaction for this user' });
    }
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
