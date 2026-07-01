const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const User = require('../models/User');

const createGroup = async (req, res) => {
    const { name, description } = req.body;
    try {
        const group = await Group.create({ name, description, createdById: req.user._id });
        await GroupMember.create({ groupId: group._id, userId: req.user._id, role: 'admin' });
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getGroups = async (req, res) => {
    try {
        const memberships = await GroupMember.find({ userId: req.user._id }).populate('groupId');
        const groups = memberships.map(m => ({ ...m.groupId.toObject(), myBalance: m.runningBalance }));
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getGroupDetails = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        const members = await GroupMember.find({ groupId: req.params.id }).populate('userId', 'name email avatarUrl');
        
        const currentMember = members.find(m => m.userId._id.toString() === req.user._id.toString());
        const currentUserRole = currentMember ? currentMember.role : 'member';

        res.json({ group, members, currentUserRole });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteGroup = async (req, res) => {
    try {
        const currentMember = await GroupMember.findOne({ groupId: req.params.id, userId: req.user._id });
        if (!currentMember || currentMember.role !== 'admin') return res.status(403).json({ message: 'Only admins can delete the group' });
        
        await Group.findByIdAndDelete(req.params.id);
        await GroupMember.deleteMany({ groupId: req.params.id });
        await GroupExpense.deleteMany({ groupId: req.params.id });
        res.json({ message: 'Group deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateGroup = async (req, res) => {
    try {
        const currentMember = await GroupMember.findOne({ groupId: req.params.id, userId: req.user._id });
        if (!currentMember || currentMember.role !== 'admin') return res.status(403).json({ message: 'Only admins can edit the group' });
        
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { name: req.body.name, avatarUrl: req.body.avatarUrl },
            { new: true }
        );
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateMemberRole = async (req, res) => {
    try {
        const currentMember = await GroupMember.findOne({ groupId: req.params.id, userId: req.user._id });
        if (!currentMember || currentMember.role !== 'admin') return res.status(403).json({ message: 'Only admins can change roles' });
        
        const member = await GroupMember.findOneAndUpdate(
            { groupId: req.params.id, userId: req.params.userId },
            { role: req.body.role },
            { new: true }
        );
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const removeMember = async (req, res) => {
    try {
        const currentMember = await GroupMember.findOne({ groupId: req.params.id, userId: req.user._id });
        if (!currentMember || currentMember.role !== 'admin') return res.status(403).json({ message: 'Only admins can remove members' });
        
        await GroupMember.findOneAndDelete({ groupId: req.params.id, userId: req.params.userId });
        res.json({ message: 'Member removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const nodemailer = require('nodemailer');

const inviteMember = async (req, res) => {
    const { email } = req.body;
    try {
        // Check if current user is admin
        const currentMember = await GroupMember.findOne({ groupId: req.params.id, userId: req.user._id });
        if (!currentMember || currentMember.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can invite new members' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found in system' });
        
        const existing = await GroupMember.findOne({ groupId: req.params.id, userId: user._id });
        if (existing) return res.status(400).json({ message: 'User already in group' });

        const member = await GroupMember.create({ groupId: req.params.id, userId: user._id, role: 'member' });
        
        const group = await Group.findById(req.params.id);

        // Send Email via Nodemailer
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: `You have been invited to ${group.name}`,
                text: `Hello, you've been invited to join the expense group "${group.name}". Log into your account to view it!`
            });
            console.log(`Invite email sent to ${email}`);
        } catch (mailErr) {
            console.error('Failed to send invite email', mailErr);
        }

        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const GroupExpense = require('../models/GroupExpense');
const Split = require('../models/Split');

const addGroupExpense = async (req, res) => {
    const { amount, description, splits } = req.body; 
    // splits is array of { userId, amountOwed }
    try {
        const amountInCents = Math.round(amount * 100);
        const expense = await GroupExpense.create({
            groupId: req.params.id,
            paidById: req.user._id,
            amount: amountInCents,
            description
        });

        // Create Splits and Update Balances
        for (let split of splits) {
            const splitAmount = Math.round(split.amountOwed * 100);
            await Split.create({
                expenseId: expense._id,
                userId: split.userId,
                amountOwed: splitAmount
            });

            // Update balance: If they owe money, balance goes down
            if (split.userId.toString() !== req.user._id.toString()) {
                await GroupMember.findOneAndUpdate(
                    { groupId: req.params.id, userId: split.userId },
                    { $inc: { runningBalance: -splitAmount } }
                );
                // The person who paid gets their balance increased
                await GroupMember.findOneAndUpdate(
                    { groupId: req.params.id, userId: req.user._id },
                    { $inc: { runningBalance: splitAmount } }
                );
            }
        }

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getGroupExpenses = async (req, res) => {
    try {
        const expenses = await GroupExpense.find({ groupId: req.params.id })
            .populate('paidById', 'name email')
            .sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const Settlement = require('../models/Settlement');

const createSettlement = async (req, res) => {
    const { paidToId, amount } = req.body;
    try {
        const settlement = await Settlement.create({
            groupId: req.params.id,
            paidById: req.user._id,
            paidToId,
            amount: Math.round(amount * 100)
        });
        res.status(201).json(settlement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSettlements = async (req, res) => {
    try {
        const settlements = await Settlement.find({ groupId: req.params.id })
            .populate('paidById', 'name email avatarUrl')
            .populate('paidToId', 'name email avatarUrl')
            .sort({ createdAt: -1 });
        res.json(settlements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateSettlementStatus = async (req, res) => {
    const { status } = req.body; // 'accepted' or 'rejected'
    try {
        const settlement = await Settlement.findById(req.params.settlementId);
        if (!settlement) return res.status(404).json({ message: 'Settlement not found' });
        
        // Only the receiver can accept/reject
        if (settlement.paidToId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to accept this settlement' });
        }

        if (settlement.status !== 'pending') {
            return res.status(400).json({ message: 'Settlement already processed' });
        }

        settlement.status = status;
        await settlement.save();

        if (status === 'accepted') {
            // Adjust balances
            await GroupMember.findOneAndUpdate(
                { groupId: req.params.id, userId: settlement.paidById },
                { $inc: { runningBalance: settlement.amount } }
            );
            await GroupMember.findOneAndUpdate(
                { groupId: req.params.id, userId: settlement.paidToId },
                { $inc: { runningBalance: -settlement.amount } }
            );
        }

        res.json(settlement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createGroup, getGroups, getGroupDetails, updateGroup, inviteMember, addGroupExpense, getGroupExpenses, deleteGroup, updateMemberRole, removeMember, createSettlement, getSettlements, updateSettlementStatus };
