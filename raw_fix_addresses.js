const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        console.log("Raw Repair of Order Addresses...");
        const ordersColl = mongoose.connection.collection('orders');
        const usersColl = mongoose.connection.collection('users');

        const orders = await ordersColl.find({ address: { $exists: false } }).toArray();
        console.log(`Found ${orders.length} orders without address.`);

        for (const o of orders) {
            const user = await usersColl.findOne({ _id: o.customer.id });
            if (user && user.savedAddresses && user.savedAddresses.length > 0) {
                const addr = user.savedAddresses[0];
                await ordersColl.updateOne({ _id: o._id }, { $set: { address: addr } });
                console.log(`Updated Order ${o.orderId} with user address.`);
            } else {
                await ordersColl.updateOne({ _id: o._id }, { $set: { address: "Standard Delivery" } });
                console.log(`Updated Order ${o.orderId} with default text.`);
            }
        }
        console.log("Repair finished.");
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
