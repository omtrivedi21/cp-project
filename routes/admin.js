const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SupportChat = require('../models/SupportChat');
const GroupBuy = require('../models/GroupBuy');
const jwt = require('jsonwebtoken');

const SECRET_KEY = "your_secret_key_123";

// Middleware to verify Admin
const adminAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.id);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// ADMIN LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. You are not an admin.' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1d' });

        res.json({
            msg: 'Admin Login Successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// GET DASHBOARD STATS
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });
        
        const orders = await Order.find();
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const carbonSaved = orders.reduce((sum, order) => sum + (order.carbonSaved || 0), 0);

        // Weekly Revenue Aggregation
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        
        const weeklyData = await Order.aggregate([
            { $match: { createdAt: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    dailyRevenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue,
            carbonSaved,
            weeklyRevenue: weeklyData
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// PRODUCT CRUD
router.get('/products', adminAuth, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.post('/products', adminAuth, async (req, res) => {
    try {
        const product = new Product(req.body);
        if(!product.id) {
           const lastProd = await Product.findOne().sort({id: -1});
           product.id = (lastProd?.id || 0) + 1;
        }
        await product.save();
        res.json(product);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

router.put('/products/:id', adminAuth, async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(product);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.delete('/products/:id', adminAuth, async (req, res) => {
    try {
        await Product.findOneAndDelete({ id: req.params.id });
        res.json({ msg: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ORDER MANAGEMENT
router.get('/orders', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

router.put('/orders/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        
        // If status is cancelled, delete the order from database
        if (status === 'cancelled') {
            await Order.findByIdAndDelete(req.params.id);
            return res.json({ msg: 'Order cancelled and deleted from database' });
        }

        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(order);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// USER MANAGEMENT
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// SUSTAINABILITY DATA
router.get('/sustainability', adminAuth, async (req, res) => {
    try {
        const orders = await Order.find();
        const totalCarbon = orders.reduce((sum, o) => sum + (o.carbonSaved || 0), 0);
        
        res.json({
            totalCarbon,
            chartData: [
                { name: 'Warehouse Efficiency', value: 85 },
                { name: 'Logistics Optimization', value: 15 }
            ]
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// GROUP ORDERS
router.get('/group-orders', adminAuth, async (req, res) => {
    try {
        const groupOrders = await GroupBuy.find().sort({ createdAt: -1 });
        res.json(groupOrders);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// SUPPORT CHATS
router.get('/chats', adminAuth, async (req, res) => {
    try {
        const chats = await SupportChat.find()
            .sort({ lastMessageAt: -1 })
            .select('-messages'); // Only list metadata
        res.json(chats);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
