const mongoose = require('mongoose');
const GroupBuy = require('./models/GroupBuy');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        const groups = await GroupBuy.find({ status: 'active' });
        for (let group of groups) {
            const originalLength = group.members.length;
            group.members = group.members.filter(m => {
                const name = m.name.toLowerCase();
                return !(name === 'test' || name === 'test2' || name === 'user');
            });
            if (group.members.length !== originalLength) {
                await group.save();
                console.log(`Removed extra members from group ${group.inviteCode}`);
            }
        }
        console.log("Cleanup complete!");
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
