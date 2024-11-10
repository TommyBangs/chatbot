document.addEventListener('DOMContentLoaded', function() {
    const micButton = document.getElementById('micButton');
    const sendButton = document.getElementById('sendButton');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatList = document.getElementById('chatList');

    // Speech Recognition Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    // Recent Chats Data
    let recentChats = [];

    const API_URL = 'http://localhost:3000/ask';

    // Handle Send Message
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessageToChat('user', message);
            // Add to recent chats
            addToRecentChats(message);
            // Clear input
            userInput.value = '';
            
            // Show typing indicator
            const typingIndicator = showTypingIndicator();
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: message })
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                typingIndicator.remove();
                addMessageToChat('ai', data.response);
                
            } catch (error) {
                console.error('Error:', error);
                typingIndicator.remove();
                addMessageToChat('ai', 'Sorry, I encountered an error. Please try again.');
            }
        }
    }

    // Add Message to Chat
    function addMessageToChat(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const currentDate = new Date();
        const dateStr = currentDate.toLocaleDateString();
        
        // Check if we need a new message group
        let messageGroup = document.querySelector(`.message-group[data-date="${dateStr}"]`);
        if (!messageGroup) {
            messageGroup = document.createElement('div');
            messageGroup.className = 'message-group';
            messageGroup.setAttribute('data-date', dateStr);
            chatMessages.appendChild(messageGroup);
        }
        
        const avatarContent = sender === 'ai' 
            ? '<img src="1-removebg-preview.png" alt="AI">'
            : '<i class="fas fa-user"></i>';
        
        messageDiv.innerHTML = `
            <div class="avatar">
                ${avatarContent}
            </div>
            <div class="message-content">
                <p>${message}</p>
                <span class="timestamp">${currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `;
        
        messageGroup.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.innerHTML = `
            <div class="avatar">
                <img src="1-removebg-preview.png" alt="AI">
            </div>
            <div class="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    // Add to Recent Chats
    function addToRecentChats(message) {
        const preview = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        recentChats.unshift({
            id: Date.now(),
            preview: preview,
            timestamp: new Date().toLocaleString()
        });
        updateRecentChatsList();
    }

    // Update Recent Chats List
    function updateRecentChatsList() {
        chatList.innerHTML = '';
        recentChats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.innerHTML = `
                <div>${chat.preview}</div>
                <small>${chat.timestamp}</small>
            `;
            chatList.appendChild(chatItem);
        });
    }

    // Speech Recognition
    micButton.addEventListener('click', () => {
        recognition.start();
        micButton.classList.add('recording');
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        micButton.style.backgroundColor = '#f8f9fa';
    };

    recognition.onend = () => {
        micButton.style.backgroundColor = '#f8f9fa';
        micButton.classList.remove('recording');
    };

    recognition.onerror = () => {
        micButton.style.backgroundColor = '#f8f9fa';
        micButton.classList.remove('recording');
    };

    // Event Listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Initialize with a welcome message
    addMessageToChat('ai', 'Welcome to Justice AI! How can I assist you with your legal questions today?');

    // Hamburger Menu Functionality
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');

    function toggleMenu() {
        hamburgerMenu.classList.toggle('active');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : 'auto';
    }

    hamburgerMenu.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // Close menu when window is resized beyond mobile breakpoint
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
            toggleMenu();
        }
    });

    // Auto-resize textarea
    function autoResize() {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    }

    // Add event listeners for auto-resize
    userInput.addEventListener('input', autoResize);
    userInput.addEventListener('focus', autoResize);

    // Reset height when cleared
    const originalHeight = userInput.style.height;
    userInput.addEventListener('blur', function() {
        if (userInput.value === '') {
            userInput.style.height = originalHeight;
        }
    });
}); 