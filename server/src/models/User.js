const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String },
    avatarUrl: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
