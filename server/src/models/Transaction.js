const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    amount: { type: Number, required: true }, // Stored in cents
    date: { type: Date, required: true, default: Date.now },
    note: { type: String },
    type: { type: String, enum: ['expense', 'income'], default: 'expense' },
    linkedGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' } // for Phase 3
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
