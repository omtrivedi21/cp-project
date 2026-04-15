const mongoose = require('mongoose');
const fs = require('fs');
const GroupBuy = require('./models/GroupBuy');
mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        const groups = await GroupBuy.find({ status: 'active' });
        fs.writeFileSync('out2.json', JSON.stringify(groups, null, 2));
        console.log("Written to out2.json");
    } catch (err) { console.error(err); }
    process.exit(0);
});
