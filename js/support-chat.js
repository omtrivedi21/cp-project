/* =========================
   SUPPORT CHAT FRONTEND
   ========================= */

(function() {
    // 1. Core State
    const userStr = localStorage.getItem('grosyncLoggedUser');
    const user = userStr ? JSON.parse(userStr) : null;
    
    // For non-logged in users, use a persistent guest ID
    let guestId = localStorage.getItem('supportGuestId');
    if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('supportGuestId', guestId);
    }

    const userId = user ? (user._id || user.id) : guestId;
    const userName = user ? user.name : 'Guest User';
    
    console.log('Support initialized for:', userName, 'ID:', userId);
    
    let socket = null;
    let isWindowActive = false;

    // 2. Initialize UI
    const chatContainer = document.createElement('div');
    chatContainer.className = 'support-chat-wrapper';
    chatContainer.innerHTML = `
        <button class="chat-toggle-btn" id="chatToggle">
            <i class="ri-customer-service-2-line"></i>
        </button>
        <div class="chat-window" id="chatWindow">
            <div class="chat-header">
                <div>
                    <span class="status-dot"></span>
                    <h4>Eco-Support Live</h4>
                </div>
                <button id="closeChat" style="background:none; border:none; color:#fff; cursor:pointer;">
                    <i class="ri-close-line"></i>
                </button>
            </div>
            <div class="chat-body" id="chatBody">
                <div class="message admin">
                    Hello! Welcome to GroSync. How can we help you today?
                    <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
            <div id="typingIndicator" class="typing-indicator" style="padding: 0 20px 10px;">Admin is typing...</div>
            <div class="chat-footer">
                <input type="text" class="chat-input" id="chatInput" placeholder="Type a message...">
                <button class="chat-send-btn" id="chatSend">
                    <i class="ri-send-plane-2-fill"></i>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(chatContainer);

    const toggleBtn = document.getElementById('chatToggle');
    const closeBtn = document.getElementById('closeChat');
    const chatWindow = document.getElementById('chatWindow');
    const chatBody = document.getElementById('chatBody');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const typingIndicator = document.getElementById('typingIndicator');

    // 3. Socket.io Integration
    function initSocket() {
        if (socket) return;

        // Ensure Socket.io client library is loaded before initializing
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = '/socket.io/socket.io.js';
            script.onload = () => setupSocketEvents();
            document.head.appendChild(script);
        } else {
            setupSocketEvents();
        }
    }

    function setupSocketEvents() {
        socket = io();

        // Join user room
        socket.emit('join_chat', { userId, userName });

        // Load History
        socket.on('chat_history', (history) => {
            if (history && history.length > 0) {
                chatBody.innerHTML = ''; // Clear default welcome if history exists
                history.forEach(msg => appendMessage(msg));
            }
        });

        // Receive Message
        socket.on('receive_message', (msg) => {
            console.log('Message received:', msg);
            appendMessage(msg);
            if (!isWindowActive) {
                toggleBtn.style.animation = 'pulse 1s infinite';
            }
        });

        // Typing indicator
        socket.on('user_typing', ({ isTyping }) => {
            typingIndicator.style.display = isTyping ? 'block' : 'none';
        });
    }

    // 4. UI Actions
    function appendMessage(msg) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.senderType}`;
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        msgDiv.innerHTML = `
            ${msg.content}
            <span class="message-time">${time}</span>
        `;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function sendMessage() {
        const content = chatInput.value.trim();
        if (!content) return;

        console.log('Attempting to send message:', content, 'Socket active:', !!socket);

        if (socket && socket.connected) {
            socket.emit('send_message', {
                userId,
                content,
                senderType: 'user',
                senderId: userId
            });
            chatInput.value = '';
        } else {
            console.error('Socket not connected. Attempting to reconnect...');
            initSocket();
        }
    }

    // Event listeners
    toggleBtn.addEventListener('click', () => {
        isWindowActive = !isWindowActive;
        chatWindow.classList.toggle('active');
        toggleBtn.style.animation = 'none';
        if (isWindowActive) {
            initSocket();
            chatInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        isWindowActive = false;
        chatWindow.classList.remove('active');
    });

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Typing activity
    let typingTimer;
    chatInput.addEventListener('input', () => {
        if (socket) {
            socket.emit('typing', { userId, userName, isTyping: true });
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                socket.emit('typing', { userId, userName, isTyping: false });
            }, 2000);
        }
    });

})();
