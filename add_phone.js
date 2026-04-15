const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        console.log("Adding phone field to all existing users in the database...");
        const users = await User.find({});

        for (const u of users) {
            // Check if they have a saved address with a mobile
            let defaultPhone = "9999999999";
            if (u.savedAddresses && u.savedAddresses.length > 0 && u.savedAddresses[0].mobile) {
                defaultPhone = u.savedAddresses[0].mobile;
            }

            // Set top-level phone
            u.phone = defaultPhone;

            // Bypass password validation issues globally for this mass update
            await mongoose.connection.collection('users').updateOne(
                { _id: u._id },
                { $set: { phone: defaultPhone } }
            );
        }
        console.log(`Successfully added phone property to ${users.length} users.`);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
