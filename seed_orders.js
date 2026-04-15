const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./models/Order');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grosync');
        console.log('Connected to MongoDB for seeding...');

        // Clear existing mock data if needed (optional, but better to just add)
        // await Order.deleteMany({ orderId: { $regex: /^MOCK_/ } });

        const days = 7;
        const ordersPerDay = 3;
        const mockedOrders = [];

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            for (let j = 0; j < ordersPerDay; j++) {
                const amount = Math.floor(Math.random() * 1000) + 200;
                mockedOrders.push({
                    orderId: `MOCK_${Date.now()}_${i}_${j}`,
                    customer: {
                        name: "Test User",
                        email: "test@example.com",
                        mobile: "9876543210"
                    },
                    items: [
                        { name: "Organic Apples", price: 150, quantity: 2 },
                        { name: "Fresh Milk", price: 60, quantity: 1 }
                    ],
                    totalAmount: amount,
                    status: 'delivered',
                    paymentMethod: 'UPI',
                    paymentStatus: 'Completed',
                    address: "123 Green Street, Eco City, 400001",
                    carbonSaved: (Math.random() * 2).toFixed(2),
                    createdAt: date
                });
            }
        }

        await Order.insertMany(mockedOrders);
        console.log(`✅ Successfully seeded ${mockedOrders.length} mock orders for the last 7 days!`);
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
