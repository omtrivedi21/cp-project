const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        const user = await User.findOne({ email: 'snehavasava@gmail.com' });
        if (user && user.orderHistory) {
            fs.writeFileSync('db_out.json', JSON.stringify(user.orderHistory[0].items, null, 2));
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
