const User = require('../models/User');
const OTP = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const sendEmail = async (email, otp) => {
    console.log(`[DEBUG] OTP for ${email} is ${otp}`);
    
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Finance App Login OTP',
            text: `Your OTP is: ${otp}. It will expire in 5 minutes.`
        };

        await transporter.sendMail(mailOptions);
        console.log(`Real Email successfully sent to ${email}`);
    } catch (error) {
        console.error('Error sending email via Nodemailer:', error);
    }
};

const requestOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);

        // Delete existing OTPs for email
        await OTP.deleteMany({ email });

        await OTP.create({
            email,
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 mins
        });

        await sendEmail(email, otp);
        res.status(200).json({ message: 'OTP sent to email' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    try {
        const otpRecord = await OTP.findOne({ email });
        if (!otpRecord) return res.status(400).json({ message: 'OTP expired or not found' });

        const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ email });
        }

        await OTP.deleteMany({ email });
        generateToken(res, user._id);

        res.status(200).json({
            _id: user._id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl
        });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying OTP', error: error.message });
    }
};

const logout = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

const updateProfile = async (req, res) => {
    const { name, avatarUrl } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.name = name || user.name;
        user.avatarUrl = avatarUrl || user.avatarUrl;
        await user.save();
        
        res.json({ name: user.name, avatarUrl: user.avatarUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { requestOtp, verifyOtp, logout, updateProfile };
