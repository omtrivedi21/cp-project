const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    await mongoose.connection.collection('orders').updateMany({}, { $unset: { groupMembers: "" } });
    console.log('Successfully purged groupMembers from all orders.');
    process.exit(0);
});
