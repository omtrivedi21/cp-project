const mongoose = require('mongoose');
const Order = require('./models/Order');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        const order = await Order.findOne({ orderId: "1775881807087" });
        console.log("DEBUG Order 1775881807087:", JSON.stringify(order, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
