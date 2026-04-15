const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    const now = new Date();
    const sixteenMinsAgo = new Date(Date.now() - 16 * 60 * 1000);

    // Fix future-dated orders (Month/Day flip caused some to be in November)
    const result = await mongoose.connection.collection('orders').updateMany(
        { createdAt: { $gt: now } },
        { $set: { createdAt: sixteenMinsAgo } }
    );
    console.log(`Fixed ${result.modifiedCount} future-dated orders.`);

    // Also check for any orders exactly at 'pending' that were missed
    const pendingResult = await mongoose.connection.collection('orders').updateMany(
        { status: 'pending', createdAt: { $lte: sixteenMinsAgo } },
        { $set: { status: 'delivered', paymentStatus: 'Completed' } }
    );
    console.log(`Manually processed ${pendingResult.modifiedCount} stuck orders.`);

    process.exit(0);
});
