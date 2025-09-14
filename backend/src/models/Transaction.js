import mongoose from 'mongoose';
import validator from 'validator';

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true, trim: true, maxlength: 64 },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    description: { type: String, default: '', trim: true, maxlength: 256 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

transactionSchema.pre('validate', function (next) {
  if (typeof this.category === 'string') {
    this.category = validator.escape(this.category.trim());
  }
  if (typeof this.description === 'string') {
    this.description = validator.escape(this.description.trim());
  }
  next();
});

export const Transaction = mongoose.model('Transaction', transactionSchema);

