const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    senderType: { 
        type: String, 
        enum: ['user', 'admin'], 
        required: true 
    },
    senderId: String, // userId or socketId for guests
    content: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

const SupportChatSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true,
        unique: true // One support thread per user/guest session
    },
    userName: String,
    lastMessage: String,
    lastMessageAt: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        enum: ['active', 'closed'], 
        default: 'active' 
    },
    messages: [MessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('SupportChat', SupportChatSchema);
