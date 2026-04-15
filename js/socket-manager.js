const SupportChat = require('../models/SupportChat');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('⚡ New connection:', socket.id);

        // 1. Join a support room
        socket.on('join_chat', async ({ userId, userName }) => {
            socket.join(userId);
            console.log(`👤 User ${userName} (${userId}) joined chat.`);

            // Update or create chat document
            let chat = await SupportChat.findOne({ userId });
            if (!chat) {
                chat = new SupportChat({ userId, userName: userName || 'Guest User', messages: [] });
                await chat.save();
            } else if (chat.userName === 'Guest User' && userName && userName !== 'Guest User') {
                // Upgrade guest name to real name
                chat.userName = userName;
                await chat.save();
            }
            
            socket.emit('chat_history', chat.messages);
        });

        // 2. Admin joins specific user room
        socket.on('admin_join_chat', async ({ userId }) => {
            socket.join(userId);
            console.log(`🛠 Admin joined room: ${userId}`);

            // Fetch history for admin
            const chat = await SupportChat.findOne({ userId });
            if (chat) {
                socket.emit('chat_history', chat.messages);
            } else {
                socket.emit('chat_history', []);
            }
        });

        // 3. Send message
        socket.on('send_message', async ({ userId, content, senderType, senderId }) => {
            const message = {
                senderType,
                senderId,
                content,
                timestamp: new Date()
            };

            // Persist to database
            const chat = await SupportChat.findOneAndUpdate(
                { userId },
                { 
                    $push: { messages: message },
                    $set: { 
                        lastMessage: content, 
                        lastMessageAt: new Date(), 
                        status: 'active'
                    },
                    $setOnInsert: { userName: (senderType === 'user' ? 'Guest User' : 'Admin') }
                },
                { new: true, upsert: true }
            );

            // Emit to both user and admin in that room
            io.to(userId).emit('receive_message', message);
        });

        // 4. Typing indicator
        socket.on('typing', ({ userId, userName, isTyping }) => {
            socket.to(userId).emit('user_typing', { userName, isTyping });
        });

        socket.on('disconnect', () => {
            console.log('🔥 User disconnected:', socket.id);
        });
    });
};
