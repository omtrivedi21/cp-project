const mongoose = require('mongoose');
const User = require('./models/User');
const GroupBuy = require('./models/GroupBuy');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        console.log("Fixing 9999999999 leaderPhones in GroupBuy collection...");
        const groups = await GroupBuy.find({ leaderPhone: "9999999999" });

        for (const g of groups) {
            const user = await User.findOne({ email: g.leaderEmail });
            if (user && user.phone && user.phone !== "9999999999") {
                g.leaderPhone = user.phone;
                if (g.members && g.members.length > 0 && g.members[0].isLeader) {
                    g.members[0].phone = user.phone;
                }
                await g.save();
                console.log(`Updated group ${g.inviteCode} with leader phone ${user.phone}`);
            }
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
