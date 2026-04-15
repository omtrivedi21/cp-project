const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// CREATE ORDER
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency,
            receipt: receipt || `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        console.error('Razorpay Order Error:', err);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// VERIFY SIGNATURE
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const digest = shasum.digest('hex');

        if (digest === razorpay_signature) {
            res.json({ status: 'ok' });
        } else {
            res.status(400).json({ status: 'failed', error: 'Invalid signature' });
        }
    } catch (err) {
        console.error('Verification Error:', err);
        res.status(500).json({ error: 'Signature verification failed' });
    }
});

module.exports = router;
