const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    paidById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    paidToId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);
