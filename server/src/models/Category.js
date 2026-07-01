const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    colorToken: { type: String, default: 'bg-blue-500' },
    icon: { type: String, default: 'tag' },
    monthlyLimit: { type: Number, required: true, default: 0 }, // Stored in cents for exact math
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
