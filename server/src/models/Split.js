const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
    expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupExpense', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amountOwed: { type: Number, required: true }, // in cents
}, { timestamps: true });

module.exports = mongoose.model('Split', splitSchema);
