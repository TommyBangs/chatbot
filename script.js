document.addEventListener("DOMContentLoaded", function () {
	const micButton = document.getElementById("micButton");
	const newChatButton = document.getElementById("newChatButton");
	const sendButton = document.getElementById("sendButton");
	const userInput = document.getElementById("userInput");
	const chatMessages = document.getElementById("chatMessages");
	const chatList = document.getElementById("chatList");

	// Speech Recognition Setup
	const SpeechRecognition =
		window.SpeechRecognition || window.webkitSpeechRecognition;
	const recognition = new SpeechRecognition();
	recognition.continuous = false;
	recognition.interimResults = false;

	// Recent Chats Data
	let recentChats = [];

	const API_URL = "http://localhost:3000/ask";

	// Add at the top with other state variables
	let conversations = new Map(); // Store all conversations
	let currentConversationId = null;

	// Add this constant at the top of your file
	const AI_AVATAR_PATH = "/path/to/your/avatar.png"; // Update this path to match your image location

	// Add these storage helper functions at the top
	function saveToStorage() {
		// Convert Map to array of entries for storage
		const conversationsArray = Array.from(conversations.entries());

		// Save conversations and recent chats
		localStorage.setItem("conversations", JSON.stringify(conversationsArray));
		localStorage.setItem("recentChats", JSON.stringify(recentChats));
		localStorage.setItem("currentConversationId", currentConversationId);
	}

	function loadFromStorage() {
		try {
			// Load conversations
			const savedConversations = localStorage.getItem("conversations");
			if (savedConversations) {
				conversations = new Map(
					JSON.parse(savedConversations).map((entry) => {
						entry[1] = entry[1].map((msg) => ({
							...msg,
							timestamp: new Date(msg.timestamp),
						}));
						return entry;
					})
				);
			} else {
				conversations = new Map();
			}

			// Load recent chats
			const savedRecentChats = localStorage.getItem("recentChats");
			if (savedRecentChats) {
				recentChats = JSON.parse(savedRecentChats);
			} else {
				recentChats = [];
			}

			// Load current conversation ID
			currentConversationId = localStorage.getItem("currentConversationId");

			if (currentConversationId && conversations.has(currentConversationId)) {
				loadConversation(currentConversationId);
			} else {
				// Always start with a new chat if no valid conversation exists
				startNewChat();
			}
		} catch (error) {
			console.error("Error loading from storage:", error);
			conversations = new Map();
			recentChats = [];
			startNewChat();
		}
	}

	// Handle Send Message
	async function sendMessage() {
		const message = userInput.value.trim();
		if (message) {
			// Start new conversation if there isn't one
			if (!currentConversationId) {
				currentConversationId = Date.now().toString();
				conversations.set(currentConversationId, []);
				addToRecentChats(message, currentConversationId);
			}

			// Add user message to conversation
			const userMessageObj = { sender: "user", message, timestamp: new Date() };
			conversations.get(currentConversationId).push(userMessageObj);
			addMessageToChat("user", message);
			userInput.value = "";

			const typingIndicator = showTypingIndicator();

			try {
				const response = await fetch(API_URL, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ query: message }),
				});

				if (!response.ok) {
					throw new Error("Network response was not ok");
				}

				// Process the response as a stream
				const reader = response.body.getReader();
				const decoder = new TextDecoder("utf-8");
				let fullResponse = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					// Decode the current chunk and add it to fullResponse
					const chunk = decoder.decode(value, { stream: true });
					fullResponse += chunk;
				}

				// Now that we've received all chunks, parse and display the complete response
				const dataLines = fullResponse.split("\n").filter((line) => line.trim());
				let finalMessage = "";

				for (const line of dataLines) {
					if (line === "data: [DONE]") {
						break; // End of stream
					}

					if (line.startsWith("data: ")) {
						const data = JSON.parse(line.replace("data: ", ""));
						finalMessage += data; // Append each parsed chunk to finalMessage
					}
				}

				// After receiving AI response, store it in conversation
				const aiMessageObj = {
					sender: "ai",
					message: finalMessage,
					timestamp: new Date(),
				};
				conversations.get(currentConversationId).push(aiMessageObj);
				typingIndicator.remove();
				addMessageToChat("ai", finalMessage);

				// Save after each message exchange
				saveToStorage();
			} catch (error) {
				console.error("Error:", error);
				typingIndicator.remove();
				addMessageToChat("ai", "Sorry, I encountered an error. Please try again.");
				saveToStorage();
			}
		}
	}

	// Add Message to Chat
	function addMessageToChat(sender, message) {
		const messageDiv = document.createElement("div");
		messageDiv.className = `message ${sender}-message`;

		const currentDate = new Date();
		const dateStr = currentDate.toLocaleDateString();

		let messageGroup = document.querySelector(
			`.message-group[data-date="${dateStr}"]`
		);
		if (!messageGroup) {
			messageGroup = document.createElement("div");
			messageGroup.className = "message-group";
			messageGroup.setAttribute("data-date", dateStr);
			chatMessages.appendChild(messageGroup);
		}

		const avatarContent =
			sender === "ai"
				? `<img src="${AI_AVATAR_PATH}" alt="AI" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTIgMTJoMjAiLz48L3N2Zz4='"/>`
				: '<i class="fas fa-user"></i>';

		messageDiv.innerHTML = `
            <div class="avatar">
                ${avatarContent}
            </div>
            <div class="message-content">
                <p>${message}</p>
                <span class="timestamp">${currentDate.toLocaleTimeString([], {
																	hour: "2-digit",
																	minute: "2-digit",
																})}</span>
            </div>
        `;

		messageGroup.appendChild(messageDiv);
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	function showTypingIndicator() {
		const typingDiv = document.createElement("div");
		typingDiv.className = "message ai-message";
		typingDiv.innerHTML = `
            <div class="avatar">
                <img src="${AI_AVATAR_PATH}" alt="AI" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTIgMTJoMjAiLz48L3N2Zz4='"/>
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
	function addToRecentChats(message, conversationId) {
		const preview = message.substring(0, 30) + (message.length > 30 ? "..." : "");
		// Remove existing chat with same ID if exists
		recentChats = recentChats.filter((chat) => chat.id !== conversationId);
		// Add new chat to beginning
		recentChats.unshift({
			id: conversationId,
			preview: preview,
			timestamp: new Date().toLocaleString(),
		});
		updateRecentChatsList();
		saveToStorage();
	}

	// Update Recent Chats List
	function updateRecentChatsList() {
		chatList.innerHTML = "";
		recentChats.forEach((chat) => {
			const chatItem = document.createElement("div");
			chatItem.className = "chat-item";
			if (chat.id === currentConversationId) {
				chatItem.classList.add("active");
			}
			chatItem.innerHTML = `
                <div>${chat.preview}</div>
                <small>${chat.timestamp}</small>
            `;
			chatItem.addEventListener("click", () => {
				loadConversation(chat.id);
			});
			chatList.appendChild(chatItem);
		});
	}

	// Add new function to load conversations
	function loadConversation(conversationId) {
		currentConversationId = conversationId;
		chatMessages.innerHTML = ""; // Clear current messages

		// Remove active class from all chat items
		document.querySelectorAll(".chat-item").forEach((item) => {
			item.classList.remove("active");
		});

		// Get conversation history
		const conversation = conversations.get(conversationId);
		if (conversation) {
			// Group messages by date
			const messagesByDate = new Map();

			conversation.forEach((msg) => {
				const dateStr = msg.timestamp.toLocaleDateString();
				if (!messagesByDate.has(dateStr)) {
					messagesByDate.set(dateStr, []);
				}
				messagesByDate.get(dateStr).push(msg);
			});

			// Render messages grouped by date
			messagesByDate.forEach((messages, dateStr) => {
				const messageGroup = document.createElement("div");
				messageGroup.className = "message-group";
				messageGroup.setAttribute("data-date", dateStr);

				messages.forEach((msg) => {
					const messageDiv = document.createElement("div");
					messageDiv.className = `message ${msg.sender}-message`;

					const avatarContent =
						msg.sender === "ai"
							? '<img src="1-removebg-preview.png" alt="AI">'
							: '<i class="fas fa-user"></i>';

					messageDiv.innerHTML = `
						<div class="avatar">
							${avatarContent}
						</div>
						<div class="message-content">
							<p>${msg.message}</p>
							<span class="timestamp">${msg.timestamp.toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})}</span>
						</div>
					`;

					messageGroup.appendChild(messageDiv);
				});

				chatMessages.appendChild(messageGroup);
			});
		}

		updateRecentChatsList(); // This will update the active state in the list
		chatMessages.scrollTop = chatMessages.scrollHeight;
	}

	// Speech Recognition
	micButton.addEventListener("click", () => {
		recognition.start();
		micButton.classList.add("recording");
	});

	recognition.onresult = (event) => {
		const transcript = event.results[0][0].transcript;
		userInput.value = transcript;
		micButton.style.backgroundColor = "#f8f9fa";
	};

	recognition.onend = () => {
		micButton.style.backgroundColor = "#f8f9fa";
		micButton.classList.remove("recording");
	};

	recognition.onerror = () => {
		micButton.style.backgroundColor = "#f8f9fa";
		micButton.classList.remove("recording");
	};

	// Event Listeners
	sendButton.addEventListener("click", sendMessage);
	userInput.addEventListener("keypress", (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	});
	newChatButton.addEventListener("click", startNewChat);

	// Initialize with a welcome message
	addMessageToChat(
		"ai",
		"Welcome to Justice AI! How can I assist you with your legal questions today?"
	);

	// Hamburger Menu Functionality
	const hamburgerMenu = document.getElementById("hamburgerMenu");
	const sidebar = document.querySelector(".sidebar");
	const overlay = document.getElementById("overlay");

	function toggleMenu() {
		hamburgerMenu.classList.toggle("active");
		sidebar.classList.toggle("active");
		overlay.classList.toggle("active");
		document.body.style.overflow = sidebar.classList.contains("active")
			? "hidden"
			: "auto";
	}

	hamburgerMenu.addEventListener("click", toggleMenu);
	overlay.addEventListener("click", toggleMenu);

	// Close menu when window is resized beyond mobile breakpoint
	window.addEventListener("resize", () => {
		if (window.innerWidth > 768 && sidebar.classList.contains("active")) {
			toggleMenu();
		}
	});

	// Auto-resize textarea
	function autoResize() {
		userInput.style.height = "auto";
		userInput.style.height = userInput.scrollHeight + "px";
	}

	// Add event listeners for auto-resize
	userInput.addEventListener("input", autoResize);
	userInput.addEventListener("focus", autoResize);

	// Reset height when cleared
	const originalHeight = userInput.style.height;
	userInput.addEventListener("blur", function () {
		if (userInput.value === "") {
			userInput.style.height = originalHeight;
		}
	});

	// Add new function to handle starting new chats
	function startNewChat() {
		currentConversationId = null;
		chatMessages.innerHTML = "";

		const welcomeMsg =
			"Welcome to Justice AI! How can I assist you with your legal questions today?";
		addMessageToChat("ai", welcomeMsg);

		// Don't create a conversation until user sends first message
		updateRecentChatsList();
	}

	// Add clear history function
	function clearHistory() {
		localStorage.clear();
		conversations = new Map();
		recentChats = [];
		currentConversationId = null;
		startNewChat();
		updateRecentChatsList();
	}

	// Load saved conversations and chats
	loadFromStorage();

	// Add clear history button event listener if you have one
	const clearHistoryBtn = document.getElementById("clearHistoryBtn");
	if (clearHistoryBtn) {
		clearHistoryBtn.addEventListener("click", clearHistory);
	}

	// Add this to your existing JavaScript
	function initializeTextarea() {
		const textarea = document.getElementById("userInput");

		function autoResize() {
			// Reset height to auto first to get the correct scrollHeight
			textarea.style.height = "auto";

			// Set new height based on scrollHeight
			const newHeight = Math.min(textarea.scrollHeight, 150); // Max height of 150px
			textarea.style.height = `${newHeight}px`;
		}

		// Add event listeners
		textarea.addEventListener("input", autoResize);
		textarea.addEventListener("focus", autoResize);

		// Reset height when cleared
		textarea.addEventListener("blur", function () {
			if (textarea.value === "") {
				textarea.style.height = "44px"; // Reset to initial height
			}
		});

		// Initialize height
		autoResize();
	}

	// Add to your DOMContentLoaded event listener
	document.addEventListener("DOMContentLoaded", function () {
		// ... existing initialization code ...
		initializeTextarea();
	});

	// Add this function to handle send button state
	function updateSendButtonState() {
		const sendButton = document.getElementById("sendButton");
		const userInput = document.getElementById("userInput");

		// Disable button if textarea is empty or only contains whitespace
		sendButton.disabled = !userInput.value.trim();
	}

	// Update the initialization
	document.addEventListener("DOMContentLoaded", function () {
		// ... existing initialization code ...

		const userInput = document.getElementById("userInput");

		// Add input event listener to update button state
		userInput.addEventListener("input", updateSendButtonState);

		// Initial button state
		updateSendButtonState();
	});
});
