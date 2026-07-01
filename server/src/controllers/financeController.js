const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

// --- CATEGORIES ---
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ userId: req.user._id });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCategory = async (req, res) => {
    const { name, colorToken, icon, monthlyLimit } = req.body;
    try {
        const category = await Category.create({
            userId: req.user._id,
            name,
            colorToken,
            icon,
            monthlyLimit: Math.round(monthlyLimit * 100), // convert to cents
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateCategory = async (req, res) => {
    const { name, monthlyLimit } = req.body;
    try {
        const category = await Category.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { name, monthlyLimit: Math.round(monthlyLimit * 100) },
            { new: true }
        );
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- TRANSACTIONS ---
const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id })
            .populate('categoryId', 'name colorToken icon')
            .sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createTransaction = async (req, res) => {
    const { categoryId, amount, date, note, type } = req.body;
    try {
        const transaction = await Transaction.create({
            userId: req.user._id,
            categoryId,
            amount: Math.round(amount * 100), // convert to cents
            date: date || Date.now(),
            note,
            type
        });
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- DASHBOARD STATS ---
const getDashboardStats = async (req, res) => {
    try {
        // Aggregate spending per category for the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const spending = await Transaction.aggregate([
            {
                $match: {
                    userId: req.user._id,
                    type: 'expense',
                    date: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: '$categoryId',
                    totalSpent: { $sum: '$amount' }
                }
            }
        ]);

        const categories = await Category.find({ userId: req.user._id });

        const stats = categories.map(cat => {
            const spentItem = spending.find(s => s._id.toString() === cat._id.toString());
            const spent = spentItem ? spentItem.totalSpent : 0;
            return {
                category: cat,
                spent,
                limit: cat.monthlyLimit,
                percentage: cat.monthlyLimit > 0 ? Math.min(100, Math.round((spent / cat.monthlyLimit) * 100)) : 0
            };
        });

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    getTransactions,
    createTransaction,
    getDashboardStats
};
