import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { Transaction } from '../src/models/Transaction.js';
import { canonicalizeCategory } from '../src/utils/validators.js';

dotenv.config();

function needsChange(s) {
  if (typeof s !== 'string') return false;
  const canon = canonicalizeCategory(s);
  return canon !== s;
}

async function run() {
  await connectDB();
  const cursor = Transaction.find({}, { _id: 1, category: 1 }).cursor();
  let updates = 0;
  const bulk = [];
  for await (const doc of cursor) {
    const current = doc.category;
    const next = canonicalizeCategory(current);
    if (current !== next) {
      bulk.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { category: next } } } });
      updates++;
      if (bulk.length >= 1000) {
        await Transaction.bulkWrite(bulk);
        bulk.length = 0;
      }
    }
  }
  if (bulk.length) await Transaction.bulkWrite(bulk);
  console.log(`Normalized categories in ${updates} transaction(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

