const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        const user = await User.findOne({ email: 'snehavasava@gmail.com' });
        if (user && user.orderHistory) {
            console.log(JSON.stringify(user.orderHistory[0], null, 2));
        } else {
            console.log("No order history found");
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
