const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        console.log("Adding missing addresses to Order collection...");
        const orders = await Order.find({ $or: [{ address: { $exists: false } }, { address: null }] });

        for (const o of orders) {
            const user = await User.findById(o.customer.id);
            if (user && user.savedAddresses && user.savedAddresses.length > 0) {
                o.address = user.savedAddresses[0];
                await o.save();
                console.log(`Updated order ${o.orderId} with address.`);
            }
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
