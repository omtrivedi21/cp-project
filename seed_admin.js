const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const Product = require('./models/Product');

const seedAdmin = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/grosync');
        console.log('Connected to MongoDB');

        // Create Admin User
        const adminEmail = 'admin@grosync.com';
        let admin = await User.findOne({ email: adminEmail });

        if (!admin) {
            admin = new User({
                name: 'GroSync Admin',
                email: adminEmail,
                password: 'Admin@123', // In production use hashed passwords
                role: 'admin'
            });
            await admin.save();
            console.log('Admin user created: admin@grosync.com / admin123');
        } else {
            admin.role = 'admin';
            admin.password = 'Admin@123';
            await admin.save();
            console.log('Admin password updated to: Admin@123');
        }

        // Create Sample Orders if none exist
        const orderCount = await Order.countDocuments();
        if (orderCount === 0) {
            const products = await Product.find().limit(5);
            if (products.length > 0) {
                const sampleOrders = [
                    {
                        orderId: 'ORD-' + Math.floor(Math.random() * 100000),
                        customer: { name: 'Rahul Sharma', email: 'rahul@example.com' },
                        items: [{ productId: products[0].id, name: products[0].name, price: products[0].price, quantity: 2 }],
                        totalAmount: products[0].price * 2,
                        status: 'delivered',
                        assignedStore: 'Local Kirana - Delhi',
                        deliveryDistance: 2.5,
                        carbonSaved: 1.2,
                        createdAt: new Date(Date.now() - 86400000 * 2)
                    },
                    {
                        orderId: 'ORD-' + Math.floor(Math.random() * 100000),
                        customer: { name: 'Priya Verma', email: 'priya@example.com' },
                        items: [{ productId: products[1].id, name: products[1].name, price: products[1].price, quantity: 1 }],
                        totalAmount: products[1].price,
                        status: 'pending',
                        assignedStore: 'Warehouse Main',
                        deliveryDistance: 12.0,
                        carbonSaved: 0.2,
                        createdAt: new Date(Date.now() - 3600000)
                    }
                ];
                await Order.insertMany(sampleOrders);
                console.log('Sample orders seeded.');
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
