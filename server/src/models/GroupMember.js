const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    runningBalance: { type: Number, default: 0 } // positive means they are owed, negative means they owe
}, { timestamps: true });

module.exports = mongoose.model('GroupMember', groupMemberSchema);
