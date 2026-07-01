const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { createGroup, getGroups, getGroupDetails, updateGroup, inviteMember, addGroupExpense, getGroupExpenses, deleteGroup, updateMemberRole, removeMember, createSettlement, getSettlements, updateSettlementStatus } = require('../controllers/groupController');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getGroups)
    .post(createGroup);

router.route('/:id')
    .get(getGroupDetails)
    .put(updateGroup)
    .delete(deleteGroup);

router.post('/:id/invite', inviteMember);

router.route('/:id/expenses')
    .get(getGroupExpenses)
    .post(addGroupExpense);

router.route('/:id/members/:userId')
    .delete(removeMember);

router.put('/:id/members/:userId/role', updateMemberRole);

router.route('/:id/settlements')
    .get(getSettlements)
    .post(createSettlement);

router.put('/:id/settlements/:settlementId', updateSettlementStatus);

module.exports = router;
