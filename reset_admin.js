const mongoose = require('mongoose');
const User = require('./models/User');

const resetAdmin = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/grosync');
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@grosync.com';
        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            admin.password = 'admin123';
            admin.role = 'admin';
            await admin.save();
            console.log('Admin password reset to: admin123');
        } else {
            admin = new User({
                name: 'GroSync Admin',
                email: adminEmail,
                password: 'admin123',
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created: admin@grosync.com / admin123');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmin();
