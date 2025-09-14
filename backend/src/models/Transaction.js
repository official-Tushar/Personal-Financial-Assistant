import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true, trim: true, maxlength: 128 },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    description: { type: String, default: '', trim: true, maxlength: 256 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Ensure no two transactions are exact duplicates for a user
transactionSchema.index(
  { userId: 1, type: 1, category: 1, amount: 1, date: 1, description: 1 },
  { unique: true, name: 'unique_transaction_per_user' }
);

// Note: input sanitization is handled in controllers. Avoid escaping here
// to prevent double-encoding like `&` -> `&amp;` -> `&amp;amp;`.

export const Transaction = mongoose.model('Transaction', transactionSchema);
