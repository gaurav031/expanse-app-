const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
    getCategories,
    createCategory,
    updateCategory,
    getTransactions,
    createTransaction,
    getDashboardStats
} = require('../controllers/financeController');

const router = express.Router();

router.use(protect); // All routes below are protected

router.route('/categories')
    .get(getCategories)
    .post(createCategory);

router.put('/categories/:id', updateCategory);

router.route('/transactions')
    .get(getTransactions)
    .post(createTransaction);

router.get('/dashboard/stats', getDashboardStats);

module.exports = router;
