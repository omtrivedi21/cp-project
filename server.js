require('dotenv').config();
const dns = require('dns');
const apiKey = process.env.GEMINI_API_KEY;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const twilio = require("twilio");
const compression = require('compression');

dns.setServers(['8.8.8.8', '8.8.4.4']);


const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: "*" } });
const PORT = 3000;

// Initialize Socket Manager
require('./js/socket-manager')(io);

// Middleware
app.use(compression());
app.use(cors());
app.use((req, res, next) => {
    next();
});
app.use(bodyParser.json());

// Routes
app.use('/api', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/groupbuy', require('./routes/groupbuy'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error('❌ MONGO_URI is not defined');
    process.exit(1);
}

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
    })
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        const errorMsg = `[${new Date().toISOString()}] DB Connection Error: ${err.message}\n`;
        fs.appendFileSync('server_errors.log', errorMsg);
        console.error('❌ MongoDB Connection Error:', err);
    });

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve home.html on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// OTP Simulation Feed (for remote phone testing)
const Otp = require('./models/Otp');
app.get('/api/otp-feed', async (req, res) => {
    try {
        const otps = await Otp.find().sort({ createdAt: -1 }).limit(10);
        res.json(otps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve frontend files (Caching disabled for development)
app.use(express.static(path.join(__dirname, '.'), {
    maxAge: 0,
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
}));


// Fallback for frontend
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'home.html'));
// });

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Close the other process or change PORT.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);

    // Background Task: Auto-Deliver orders after 15 minutes
    setInterval(async () => {
        try {
            const Order = require('./models/Order');
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

            // Update orders that are pending and older than 15 mins
            const result = await Order.updateMany(
                {
                    status: 'pending',
                    createdAt: { $lte: fifteenMinsAgo }
                },
                {
                    $set: {
                        status: 'delivered',
                        paymentStatus: 'Completed'
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`[AUTO-DELIVER] Processed ${result.modifiedCount} orders.`);
            }

            // ALSO Update GroupBuy sessions that are pending and older than 15 mins
            const GroupBuy = require('./models/GroupBuy');
            const gbResult = await GroupBuy.updateMany(
                {
                    status: 'pending',
                    createdAt: { $lte: fifteenMinsAgo }
                },
                {
                    $set: {
                        status: 'delivered',
                        paymentStatus: 'Completed'
                    }
                }
            );

            if (gbResult.modifiedCount > 0) {
                console.log(`[AUTO-DELIVER] Processed ${gbResult.modifiedCount} group buys.`);
            }
        } catch (err) {
            console.error('Auto-delivery background task failed:', err);
        }
    }, 60000); // Check every minute
});

process.on('uncaughtException', (err) => {
    const errorMsg = `[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.stack || err}\n`;
    fs.appendFileSync('server_errors.log', errorMsg);
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    const errorMsg = `[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}\n`;
    fs.appendFileSync('server_errors.log', errorMsg);
    console.error('UNHANDLED REJECTION:', reason);
});
