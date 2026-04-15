const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        console.log("Replacing 'Standard Delivery' with actual user addresses...");
        const ordersColl = mongoose.connection.collection('orders');
        const usersColl = mongoose.connection.collection('users');

        const orders = await ordersColl.find({ address: "Standard Delivery" }).toArray();
        console.log(`Found ${orders.length} orders with placeholder address.`);

        for (const o of orders) {
            const user = await usersColl.findOne({ _id: o.customer.id });
            if (user && user.savedAddresses && user.savedAddresses.length > 0) {
                // Find default address or just take the first one
                const realAddr = user.savedAddresses.find(a => a.isDefault) || user.savedAddresses[0];
                await ordersColl.updateOne({ _id: o._id }, { $set: { address: realAddr } });
                console.log(`Fixed Order ${o.orderId} with user's real address.`);
            }
        }
        console.log("Cleanup finished.");
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
