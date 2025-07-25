import * as webSocketService from './websocket.service';

// Example 1: Simple message sending function
export const sendMessageToUser = async (senderUsername, receiverUsername, message) => {
    try {
        // Connect if not already connected
        if (!webSocketService.isConnected()) {
            console.log('🔄 Connecting to WebSocket...');
            await webSocketService.connect(senderUsername);
        }

        // Send the message
        const success = webSocketService.sendPrivateMessage(receiverUsername, message);
        
        if (success) {
            console.log(`✅ Message sent from ${senderUsername} to ${receiverUsername}: ${message}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Failed to send message:', error);
        throw error;
    }
};

// Example 2: Set up message listener
export const setupMessageListener = (onMessageReceived) => {
    webSocketService.onMessage((message) => {
        console.log('📨 New message received:', message);
        if (onMessageReceived) {
            onMessageReceived(message);
        }
    });
};

// Example 3: Set up connection status listener
export const setupConnectionListener = (onConnectionChange) => {
    webSocketService.onConnectionChange((connected, status) => {
        console.log(`🔌 Connection status: ${connected ? 'Connected' : 'Disconnected'} - ${status}`);
        if (onConnectionChange) {
            onConnectionChange(connected, status);
        }
    });
};

// Example 4: Initialize chat system
export const initializeChatSystem = async (username) => {
    try {
        // Set up listeners first
        setupMessageListener((message) => {
            // Handle incoming messages
            console.log('Processing message:', message);
            // You can emit events, update state, etc.
        });

        setupConnectionListener((connected, status) => {
            // Handle connection status changes
            console.log('Connection status changed:', { connected, status });
        });

        // Set up error listener
        webSocketService.onError((error) => {
            console.error('WebSocket error:', error);
            // Handle errors (show notifications, retry, etc.)
        });

        // Connect to WebSocket
        await webSocketService.connect(username);
        
        console.log('✅ Chat system initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize chat system:', error);
        throw error;
    }
};

// Example 5: Send multiple messages
export const sendBatchMessages = async (senderUsername, messages) => {
    try {
        // Ensure connection
        if (!webSocketService.isConnected()) {
            await webSocketService.connect(senderUsername);
        }

        const results = [];
        
        for (const { receiverUsername, content } of messages) {
            try {
                const success = webSocketService.sendPrivateMessage(receiverUsername, content);
                results.push({ receiverUsername, content, success });
                
                // Add small delay between messages to avoid overwhelming
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`Failed to send message to ${receiverUsername}:`, error);
                results.push({ receiverUsername, content, success: false, error: error.message });
            }
        }

        return results;
    } catch (error) {
        console.error('❌ Failed to send batch messages:', error);
        throw error;
    }
};

// Example 6: Group chat functions
export const joinGroup = async (username, groupName, onGroupMessage) => {
    try {
        // Ensure connection
        if (!webSocketService.isConnected()) {
            await webSocketService.connect(username);
        }

        // Subscribe to group topic
        const subscription = webSocketService.subscribeToTopic(groupName, (message) => {
            console.log(`📨 Group message from ${groupName}:`, message);
            if (onGroupMessage) {
                onGroupMessage(message);
            }
        });

        console.log(`📡 Joined group: ${groupName}`);
        return subscription;
    } catch (error) {
        console.error(`❌ Failed to join group ${groupName}:`, error);
        throw error;
    }
};

export const sendGroupMessage = async (username, groupName, message) => {
    try {
        // Ensure connection
        if (!webSocketService.isConnected()) {
            await webSocketService.connect(username);
        }

        const success = webSocketService.sendTopicMessage(groupName, message, {
            messageType: 'group',
            sender: username
        });

        if (success) {
            console.log(`✅ Group message sent to ${groupName}: ${message}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Failed to send group message to ${groupName}:`, error);
        throw error;
    }
};

// Example 7: Utility functions
export const getConnectionInfo = () => {
    const status = webSocketService.getConnectionStatus();
    return {
        isConnected: status.connected,
        isConnecting: status.connecting,
        currentUser: status.currentUser,
        canSendMessages: status.connected && !status.connecting
    };
};

export const disconnectFromChat = () => {
    console.log('🔌 Disconnecting from chat...');
    webSocketService.disconnect();
};

export const cleanupChatSystem = () => {
    console.log('🧹 Cleaning up chat system...');
    webSocketService.clearAllCallbacks();
    webSocketService.disconnect();
};

// Example 8: React-style usage (without hooks)
export const ChatManager = {
    // Initialize with user
    init: async (username) => {
        return await initializeChatSystem(username);
    },

    // Send message
    send: async (receiverUsername, message) => {
        const currentUser = webSocketService.getCurrentUser();
        if (!currentUser) {
            throw new Error('Chat system not initialized');
        }
        return await sendMessageToUser(currentUser, receiverUsername, message);
    },

    // Listen for messages
    listen: (callback) => {
        setupMessageListener(callback);
    },

    // Check status
    status: () => {
        return getConnectionInfo();
    },

    // Cleanup
    cleanup: () => {
        cleanupChatSystem();
    }
};

// Example 9: Simple API-like usage
export const chatAPI = {
    async connect(username) {
        return await webSocketService.connect(username);
    },

    async sendMessage(receiverUsername, content, metadata = {}) {
        return webSocketService.sendPrivateMessage(receiverUsername, content, metadata);
    },

    onMessage(callback) {
        webSocketService.onMessage(callback);
    },

    onConnectionChange(callback) {
        webSocketService.onConnectionChange(callback);
    },

    onError(callback) {
        webSocketService.onError(callback);
    },

    disconnect() {
        webSocketService.disconnect();
    },

    isConnected() {
        return webSocketService.isConnected();
    },

    getCurrentUser() {
        return webSocketService.getCurrentUser();
    }
};

// Example usage in your application:
/*
// Initialize
await initializeChatSystem('john@example.com');

// Send a message
await sendMessageToUser('john@example.com', 'jane@example.com', 'Hello Jane!');

// Listen for messages
setupMessageListener((message) => {
    console.log('New message:', message);
});

// Send multiple messages
const messages = [
    { receiverUsername: 'user1@example.com', content: 'Hello User 1' },
    { receiverUsername: 'user2@example.com', content: 'Hello User 2' }
];
await sendBatchMessages('john@example.com', messages);

// Join a group
await joinGroup('john@example.com', 'general', (message) => {
    console.log('Group message:', message);
});

// Send group message
await sendGroupMessage('john@example.com', 'general', 'Hello everyone!');

// Using ChatManager
await ChatManager.init('john@example.com');
await ChatManager.send('jane@example.com', 'Hello!');
ChatManager.listen((msg) => console.log('Message:', msg));

// Using chatAPI
await chatAPI.connect('john@example.com');
chatAPI.sendMessage('jane@example.com', 'Hello!');
chatAPI.onMessage((msg) => console.log('Received:', msg));
*/