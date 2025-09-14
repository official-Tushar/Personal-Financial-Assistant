import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';

function buildDateMatch(start, end) {
  const match = {};
  if (start && !isNaN(new Date(start).getTime())) match.$gte = new Date(start);
  if (end && !isNaN(new Date(end).getTime())) match.$lte = new Date(end);
  return Object.keys(match).length ? match : null;
}

export async function summary(req, res, next) {
  try {
    const { start, end } = req.query || {};
    const match = { userId: new mongoose.Types.ObjectId(req.user.id) };
    const dateMatch = buildDateMatch(start, end);
    if (dateMatch) match.date = dateMatch;

    const result = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    const totals = { income: 0, expense: 0 };
    for (const r of result) {
      totals[r._id] = r.total;
    }
    return res.json({
      income: totals.income,
      expense: totals.expense,
      net: totals.income - totals.expense,
    });
  } catch (err) {
    next(err);
  }
}

export async function byCategory(req, res, next) {
  try {
    const { start, end } = req.query || {};
    const match = { userId: new mongoose.Types.ObjectId(req.user.id), type: 'expense' };
    const dateMatch = buildDateMatch(start, end);
    if (dateMatch) match.date = dateMatch;

    const result = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $project: { _id: 0, category: '$_id', total: 1 } },
      { $sort: { total: -1 } },
    ]);

    return res.json({ categories: result });
  } catch (err) {
    next(err);
  }
}

export async function timeline(req, res, next) {
  try {
    const { start, end, interval = 'month' } = req.query || {};
    const match = { userId: new mongoose.Types.ObjectId(req.user.id) };
    const dateMatch = buildDateMatch(start, end);
    if (dateMatch) match.date = dateMatch;

    const format = interval === 'day' ? '%Y-%m-%d' : '%Y-%m';

    const [{ income = [], expenses = [] }] = await Transaction.aggregate([
      { $match: match },
      {
        $addFields: {
          dateStr: { $dateToString: { format, date: '$date' } },
        },
      },
      {
        $facet: {
          income: [
            { $match: { type: 'income' } },
            { $group: { _id: '$dateStr', total: { $sum: '$amount' } } },
            { $project: { _id: 0, date: '$_id', total: 1 } },
            { $sort: { date: 1 } },
          ],
          expenses: [
            { $match: { type: 'expense' } },
            { $group: { _id: { date: '$dateStr', category: '$category' }, total: { $sum: '$amount' } } },
            { $project: { _id: 0, date: '$_id.date', category: '$_id.category', total: 1 } },
            { $sort: { date: 1 } },
          ],
        },
      },
    ]);

    const map = new Map();
    for (const row of income) {
      const obj = map.get(row.date) || { date: row.date };
      obj.income = row.total;
      map.set(row.date, obj);
    }
    for (const row of expenses) {
      const obj = map.get(row.date) || { date: row.date };
      obj[row.category] = (obj[row.category] || 0) + row.total;
      map.set(row.date, obj);
    }

    const series = Array.from(map.keys())
      .sort()
      .map((k) => map.get(k));
    return res.json({ series });
  } catch (err) {
    next(err);
  }
}
