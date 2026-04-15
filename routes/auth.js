const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Cart = require('../models/Cart'); // Import Cart model
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const SECRET_KEY = "your_secret_key_123"; // In production use .env

// PASSWORD VALIDATION HELPER
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    return password.length >= minLength && hasUpperCase && hasNumber && hasSymbol;
};

// SIGNUP
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        // Password Validation
        if (!validatePassword(password)) {
            return res.status(400).json({ msg: 'Password must be 8+ chars and contain at least one uppercase letter, one number, and one special character.' });
        }

        // Check if user exists
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            name,
            email: normalizedEmail,
            password // Plain text for now
        });

        await user.save();
        res.json({ msg: 'User registered successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// LOGIN
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

        user.lastLogin = new Date();
        await user.save();

        const cartDoc = await Cart.findOne({ email: normalizedEmail });
        const userObj = user.toObject();
        delete userObj.password;

        if (cartDoc && cartDoc.products) {
            userObj.savedCart = cartDoc.products;
        } else {
            userObj.savedCart = [];
        }

        let token = null;
        if (user.role === 'admin') {
            const SECRET_KEY = "your_secret_key_123";
            token = jwt.sign({ id: user._id, role: user.role }, SECRET_KEY, { expiresIn: '1d' });
        }

        res.json({ msg: 'Login Successful', user: userObj, token });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// SYNC
router.post('/sync', async (req, res) => {
    try {
        const { email, savedCart, savedAddresses, orderHistory } = req.body;
        if (!email) return res.status(400).json({ msg: 'Email required' });

        const normalizedEmail = email.toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.log(`[SYNC] User not found: ${normalizedEmail}`);
            return res.status(404).json({ msg: 'User not found' });
        }

        // 1. Sync User fields (Addresses & History)
        if (savedAddresses && Array.isArray(savedAddresses)) {
            console.log(`[SYNC] Updating ${savedAddresses.length} addresses for ${normalizedEmail}`);
            user.savedAddresses = savedAddresses;
            user.markModified('savedAddresses');
        }

        if (orderHistory && Array.isArray(orderHistory)) {
            user.orderHistory = orderHistory;
            user.markModified('orderHistory');

            // Persist to global Order collection for Admin visibility
            const Order = require('../models/Order');
            for (const orderData of orderHistory) {
                // Map frontend names to backend Order schema
                const orderId = orderData.id || orderData.orderId || orderData.orderNo;
                if (!orderId) continue;

                const exists = await Order.findOne({ orderId });
                if (!exists) {
                    try {
                        const newOrder = new Order({
                            orderId: orderId,
                            customer: {
                                id: user._id,
                                name: orderData.customer || user.name || "User",
                                email: user.email,
                                mobile: orderData.phone || user.mobile || user.phone || "9999999999"
                            },
                            items: (orderData.items || []).map(item => ({
                                productId: item.id || item.productId,
                                name: item.name,
                                price: item.price,
                                quantity: item.qty || item.quantity,
                                image: item.image,
                                orderedBy: item.orderedBy // Capture who ordered what
                            })),
                            totalAmount: Number(orderData.total || orderData.totalAmount || 0),
                            status: 'pending', // Default to valid enum value
                            paymentMethod: orderData.payment || 'COD',
                            paymentStatus: (orderData.payment && orderData.payment.toUpperCase() !== 'COD') ? 'Completed' : 'Pending',
                            address: orderData.address || "Standard Delivery",
                            createdAt: orderData.timestamp ? new Date(orderData.timestamp) : (orderData.date ? new Date(orderData.date) : new Date())
                        });

                        // Calculate some default sustainability metrics if missing
                        newOrder.carbonSaved = newOrder.totalAmount * 0.05; // Mock calculation

                        await newOrder.save();
                        console.log(`[SYNC] Persisted new global order: ${orderId}`);
                    } catch (err) {
                        console.error(`[SYNC] Failed to save global order ${orderId}:`, err.message);
                    }
                } else {
                    // Update existing order status if it changed (e.g. from Pending to Cancelled)
                    console.log(`[SYNC] Checking status for ${orderId}: DB=${exists.status}, Local=${orderData.status}`);
                    if (orderData.status && (exists.status !== orderData.status.toLowerCase())) {
                        const oldStatus = exists.status;
                        exists.status = orderData.status.toLowerCase();
                        exists.paymentStatus = orderData.paymentStatus || exists.paymentStatus;
                        await exists.save();
                        console.log(`[SYNC] STATUS CHANGE: ${orderId} | ${oldStatus} -> ${exists.status}`);
                    }
                }
            }
        }

        const savedUser = await user.save();
        console.log(`[SYNC] Saved user ${normalizedEmail}. Addresses: ${savedUser.savedAddresses ? savedUser.savedAddresses.length : 0}`);

        if (savedCart) {
            // Update separate Cart collection - ONLY if it's an array of product objects
            if (Array.isArray(savedCart)) {
                let cartDoc = await Cart.findOne({ email: normalizedEmail });
                if (cartDoc) {
                    cartDoc.products = savedCart;
                    cartDoc.updatedAt = Date.now();
                    await cartDoc.save();
                } else {
                    cartDoc = new Cart({ email: normalizedEmail, products: savedCart });
                    await cartDoc.save();
                }
            }

            // ALSO update savedCart in User model (can store either object or array)
            user.savedCart = savedCart;
            user.markModified('savedCart');
            await user.save();
        }

        res.json({ msg: 'User Synced', user: savedUser });
    } catch (err) {
        console.error("CRITICAL SYNC ERROR:", err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// UPDATE PROFILE
router.post('/update-profile', async (req, res) => {
    try {
        const { currentEmail, name, email, password } = req.body;

        const normalizedEmail = currentEmail.toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (name) user.name = name;
        if (password) {
            if (!validatePassword(password)) {
                return res.status(400).json({ msg: 'New password does not meet requirements (8+ chars, uppercase, number, symbol).' });
            }
            user.password = password;
        }

        if (email && email.toLowerCase() !== user.email) {
            const newNormalized = email.toLowerCase();
            const exists = await User.findOne({ email: newNormalized });
            if (exists) return res.status(400).json({ msg: 'Email already in use' });
            user.email = newNormalized;
        }

        await user.save();
        res.json({ msg: 'Profile Updated', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// DELETE USER
router.delete('/users/:email', async (req, res) => {
    try {
        const email = req.params.email.toLowerCase();

        // Delete User document
        const userDeleted = await User.findOneAndDelete({ email });

        // Delete Cart document
        const cartDeleted = await Cart.findOneAndDelete({ email });

        if (!userDeleted) {
            return res.status(404).json({ msg: 'User not found' });
        }

        console.log(`[DELETE] Deleted user and cart for: ${email}`);
        res.json({ msg: 'Account and associated data deleted successfully' });
    } catch (err) {
        console.error("DELETE ACCOUNT ERROR:", err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});


// SEND OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase();

        // Check if user exists
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ msg: 'User with this email does not exist' });
        }

        // Generate 6-digit OTP
        const otpValue = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP (Upsert: delete old one and save new one)
        await Otp.findOneAndDelete({ email: normalizedEmail });
        const otpDoc = new Otp({
            email: normalizedEmail,
            otp: otpValue
        });
        await otpDoc.save();

        console.log(`[OTP] Generated for ${normalizedEmail}: ${otpValue}`);

        // In production, send via email. For now, return in response as requested by frontend debug logic
        res.json({
            msg: 'OTP sent successfully to your email',
            otp: otpValue,
            debug: true // To match frontend if(!res.ok && !data.debug) check
        });
    } catch (err) {
        console.error("SEND-OTP ERROR:", err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// VERIFY OTP & RESET PASSWORD
router.post('/verify-otp-reset', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const normalizedEmail = email.toLowerCase();

        // Password Validation
        if (!validatePassword(newPassword)) {
            return res.status(400).json({ msg: 'New password does not meet requirements (8+ chars, uppercase, number, symbol).' });
        }

        // Verify OTP
        const otpRecord = await Otp.findOne({ email: normalizedEmail, otp });
        if (!otpRecord) {
            return res.status(400).json({ msg: 'Invalid or expired OTP' });
        }

        // Find User
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Update Password (hashed via pre-save hook in User model)
        user.password = newPassword;
        await user.save();

        // Delete used OTP
        await Otp.findByIdAndDelete(otpRecord._id);

        res.json({ msg: 'Password reset successful. You can now login.' });
    } catch (err) {
        console.error("VERIFY-OTP ERROR:", err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
