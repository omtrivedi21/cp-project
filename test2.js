const mongoose = require('mongoose');
const GroupBuy = require('./models/GroupBuy');
mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        const group = await GroupBuy.findOne({ status: 'active' });
        group.members.push({
            name: "Test2",
            phone: "9999999999",
            cart: [],
            isLeader: false,
            isDone: false
        });
        await group.save();
        console.log("Success with 9999999999");
    } catch (err) { console.error("Error:", err.message); }
    process.exit(0);
});
