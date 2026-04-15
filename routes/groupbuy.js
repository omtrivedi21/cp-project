const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GroupBuy = require('../models/GroupBuy');
const crypto = require('crypto');

// Helper to generate 6-char random code
function generateCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Create Group
router.post('/create', async (req, res) => {
    console.log("Create Group Request Body:", JSON.stringify(req.body, null, 2));
    try {
        const { leaderEmail, leaderPhone, leaderInfo, leaderCart } = req.body;
        const inviteCode = generateCode();

        const newGroup = new GroupBuy({
            inviteCode,
            leaderEmail: leaderEmail || "",
            leaderPhone: leaderPhone || (leaderInfo && (leaderInfo.phone || leaderInfo.mobile)),
            members: [{
                ...leaderInfo,
                name: (leaderInfo && leaderInfo.name) || "User",
                phone: (leaderInfo && (leaderInfo.phone || leaderInfo.mobile)) || leaderPhone,
                email: leaderEmail || "",
                pincode: (leaderInfo && leaderInfo.pincode) || "000000",
                city: (leaderInfo && leaderInfo.city) || "City",
                state: (leaderInfo && leaderInfo.state) || "State",
                cart: leaderCart || [],
                isLeader: true,
                isDone: false
            }]
        });

        await newGroup.save();
        res.status(201).json(newGroup);
    } catch (err) {
        const fs = require('fs');
        const errorLog = `[${new Date().toISOString()}] Create Group Error: ${err.message}\nStack: ${err.stack}\nData: ${JSON.stringify(req.body)}\n---\n`;
        fs.appendFileSync('server_errors.log', errorLog);
        console.error("Create Group Error Details:", err);
        res.status(500).json({
            error: 'Failed to create group',
            details: err.message,
            fields: err.errors ? Object.keys(err.errors) : []
        });
    }
});

// Join Group
router.post('/join', async (req, res) => {
    try {
        const { inviteCode, memberInfo } = req.body;
        const group = await GroupBuy.findOne({ inviteCode, status: 'active' });

        if (!group) return res.status(404).json({ error: 'Group not found or expired' });
        if (group.members.length >= group.maxMembers) {
            return res.status(400).json({ error: 'Group is already full' });
        }

        // Add new member (neighbor)
        group.members.push({
            ...memberInfo,
            cart: [], // Start with empty cart
            isLeader: false,
            isDone: false
        });

        if (group.members.length >= group.maxMembers) {
            // Potentially trigger a status change, but we'll stick to 'active' 
            // until the leader finalizes or we reach the cap.
            // For now, let's keep it active but full.
        }

        await group.save();
        res.json(group);
    } catch (err) {
        console.error("Join Group Error:", err);
        res.status(500).json({ error: 'Failed to join group: ' + err.message });
    }
});

// Update Individual Cart in Group
router.post('/update-cart', async (req, res) => {
    try {
        const { inviteCode, phone, email, name, cart } = req.body;
        const group = await GroupBuy.findOne({ inviteCode });

        if (!group) return res.status(404).json({ error: 'Group not found' });

        let member = null;
        if (email) member = group.members.find(m => m.email === email && m.name === name);
        if (!member && name) member = group.members.find(m => m.name === name && m.phone === phone);
        if (!member) member = group.members.find(m => m.phone === phone);

        if (!member) return res.status(404).json({ error: 'Member not found in group' });

        member.cart = cart;
        await group.save();

        res.json(group);
    } catch (err) {
        console.error("Sync Cart Error:", err);
        res.status(500).json({ error: 'Failed to sync cart' });
    }
});

// Get Group Status
router.get('/:code', async (req, res) => {
    try {
        const group = await GroupBuy.findOne({ inviteCode: req.params.code });
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark Member as Done
router.post('/mark-done', async (req, res) => {
    try {
        const { inviteCode, phone, isDone } = req.body;
        const group = await GroupBuy.findOne({ inviteCode });

        if (!group) return res.status(404).json({ error: 'Group not found' });

        const member = group.members.find(m => m.phone === phone);
        if (!member) return res.status(404).json({ error: 'Member not found' });

        member.isDone = isDone;
        await group.save();

        res.json(group);
    } catch (err) {
        console.error("Mark Done Error:", err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Finalize Group Buy (Sync order to all members' history)
const User = require('../models/User');
const Cart = require('../models/Cart');

router.post('/finalize', async (req, res) => {
    try {
        const { inviteCode, leaderPhone, orderDetails } = req.body;
        const group = await GroupBuy.findOne({ inviteCode, status: 'active' });

        if (!group) return res.status(404).json({ error: 'Active group not found' });

        // Check if requester is leader
        const leader = group.members.find(m => m.isLeader && m.phone === leaderPhone);
        if (!leader) return res.status(403).json({ error: 'Only the leader can finalize the group buy' });

        if (group.members.length <= 1) {
            return res.status(400).json({ error: 'Wait for members to join. Group buy requires more than 1 member to finalize in order to get discounts' });
        }

        // Aggregate items from all members for the shared order history
        const allItems = [];
        const stockUpdates = new Map(); // productId -> totalQty

        group.members.forEach(member => {
            (member.cart || []).forEach(item => {
                const pid = item.id || item._id;
                const qty = parseInt(item.qty || item.quantity || 0);

                // Aggregate for shared history
                const itemData = item.toObject ? item.toObject() : item;
                allItems.push({
                    ...itemData,
                    orderedBy: member.name
                });

                // Aggregate for stock update
                if (pid && qty > 0) {
                    stockUpdates.set(String(pid), (stockUpdates.get(String(pid)) || 0) + qty);
                }
            });
        });

        // Apply Stock Updates
        const Product = require('../models/Product');
        for (const [pid, totalQty] of stockUpdates.entries()) {
            try {
                let query = {};
                if (mongoose.Types.ObjectId.isValid(pid)) {
                    query = { _id: pid };
                } else if (!isNaN(pid)) {
                    query = { id: Number(pid) };
                } else {
                    continue;
                }

                const product = await Product.findOne(query);
                if (product) {
                    product.stock = Math.max(0, (product.stock || 0) - totalQty);
                    await product.save();
                    console.log(`📉 Group Buy Stock Adjusted: ${product.name} (-${totalQty})`);
                }
            } catch (err) { console.error(`Failed to update stock for ${pid}`, err); }
        }

        const sharedOrder = {
            id: `GROUP-${inviteCode}-${Date.now()}`,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            total: orderDetails.total,
            items: allItems,
            address: orderDetails.address,
            status: "pending",
            paymentMethod: orderDetails.paymentMethod || 'COD',
            paymentStatus: (orderDetails.paymentMethod && orderDetails.paymentMethod.toUpperCase() !== 'COD') ? 'Completed' : 'Pending',
            isGroupOrder: true,
            groupCode: inviteCode,
            groupMembers: group.members.map(m => ({
                name: m.name,
                email: m.email,
                phone: m.phone,
                address: {
                    fullName: m.fullName,
                    mobile: m.mobile,
                    pincode: m.pincode,
                    houseNo: m.houseNo,
                    area: m.area,
                    landmark: m.landmark,
                    city: m.city,
                    state: m.state
                }
            }))
        };

        // Update every member's order history and clear their carts
        for (const member of group.members) {
            // Find user by phone OR email
            const user = await User.findOne({
                $or: [
                    { email: member.email },
                    { "savedAddresses.mobile": member.phone }
                ]
            });

            if (user) {
                user.orderHistory = user.orderHistory || [];
                user.orderHistory.unshift(sharedOrder);
                user.savedCart = {}; // Clear user's local cart record
                await user.save();

                // Clear from Cart collection too
                if (user.email) {
                    await Cart.updateOne({ email: user.email }, { products: [] });
                }
            }
        }

        // Complete the group
        console.log(`[GROUP-FINALIZE] Updating GroupBuy record: ${inviteCode}`);
        group.status = 'pending';
        group.paymentMethod = orderDetails.paymentMethod || 'COD';
        group.paymentStatus = (orderDetails.paymentMethod && orderDetails.paymentMethod.toUpperCase() !== 'COD') ? 'Completed' : 'Pending';

        await group.save();
        console.log(`[GROUP-FINALIZE] GroupBuy saved with status: ${group.status}, Payment: ${group.paymentStatus}`);

        // PERSIST TO GLOBAL ORDER COLLECTION (for Admin Visibility)
        const Order = require('../models/Order');
        try {
            const newOrder = new Order({
                orderId: sharedOrder.id,
                customer: {
                    name: "Group Buy: " + inviteCode,
                    email: leader.email,
                    mobile: leader.phone
                },
                items: sharedOrder.items.map(item => ({
                    productId: item.id || item._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.qty || item.quantity,
                    image: item.image,
                    orderedBy: item.orderedBy
                })),
                totalAmount: Number(sharedOrder.total || 0),
                status: 'pending',
                paymentMethod: sharedOrder.paymentMethod || 'COD',
                paymentStatus: sharedOrder.paymentStatus || 'Pending',
                address: sharedOrder.address || "Group Delivery",
                carbonSaved: Number(sharedOrder.total || 0) * 0.05 // Mock calculation
            });
            await newOrder.save();
            console.log(`[GROUP-FINALIZE] Persisted Group Buy order to global Order collection: ${sharedOrder.id}`);
        } catch (err) {
            console.error("[GROUP-FINALIZE] Failed to persist to global Order collection:", err.message);
        }

        res.json({ message: 'Group buy finalized successfully', order: sharedOrder });
    } catch (err) {
        console.error("Finalize Group Error:", err);
        res.status(500).json({ error: 'Failed to finalize group buy: ' + err.message });
    }
});

// Cancel or Leave Group Buy
router.post('/cancel', async (req, res) => {
    try {
        const { inviteCode, phone } = req.body;
        const group = await GroupBuy.findOne({ inviteCode, status: 'active' });

        if (!group) return res.status(404).json({ error: 'Active group not found' });

        const memberIndex = group.members.findIndex(m => m.phone === phone);
        if (memberIndex === -1) return res.status(404).json({ error: 'Member not found in group' });

        const isLeader = group.members[memberIndex].isLeader;

        if (isLeader) {
            // Cancel entire group
            group.status = 'cancelled';
            await group.save();
            // Alternatively, delete the group: await GroupBuy.deleteOne({ _id: group._id });
            return res.json({ message: 'Group cancelled' });
        } else {
            // Member leaves
            group.members.splice(memberIndex, 1);
            await group.save();
            return res.json({ message: 'Successfully left the group' });
        }
    } catch (err) {
        console.error("Cancel Group Error:", err);
        res.status(500).json({ error: 'Failed to process cancellation' });
    }
});

module.exports = router;
