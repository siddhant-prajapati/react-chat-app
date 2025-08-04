import { Client } from '@stomp/stompjs';

// WebSocket state
let client = null;
let connected = false;
let connecting = false;
let currentUser = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Callback arrays
let messageCallbacks = [];
let connectionCallbacks = [];
let errorCallbacks = [];
let customEventCallbacks = new Map(); // For custom event listeners

/**
 * Initialize and connect to WebSocket
 * @param {string} username - Current user's username
 * @param {Object} options - Connection options
 */
export const connect = async (username, options = {}) => {
    if (connected || connecting) {
        console.warn('WebSocket is already connected or connecting');
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            const error = 'No JWT token found';
            console.error(error);
            notifyError(error);
            reject(new Error(error));
            return;
        }

        if (!username) {
            const error = 'Username is required';
            console.error(error);
            notifyError(error);
            reject(new Error(error));
            return;
        }

        currentUser = username;
        connecting = true;

        console.log('🔄 Connecting to WebSocket...', { user: username });

        // Default configuration
        const config = {
            brokerURL: options.brokerURL || 'ws://localhost:9080/chat',
            reconnectDelay: options.reconnectDelay || 5000,
            heartbeatIncoming: options.heartbeatIncoming || 10000,
            heartbeatOutgoing: options.heartbeatOutgoing || 10000,
            ...options
        };

        client = new Client({
            brokerURL: config.brokerURL,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            reconnectDelay: config.reconnectDelay,
            heartbeatIncoming: config.heartbeatIncoming,
            heartbeatOutgoing: config.heartbeatOutgoing,
            
            onConnect: (frame) => {
                console.log('✅ WebSocket connected successfully');
                console.log('Connection frame:', frame);
                connected = true;
                connecting = false;
                reconnectAttempts = 0;
                
                // Subscribe to user-specific message queue
                client.subscribe('/user/queue/messages', (message) => {
                    handleIncomingMessage(message);
                });
                
                console.log('📡 Subscribed to /user/queue/messages');
                notifyConnection(true, 'Connected');
                resolve();
            },

            onStompError: (frame) => {
                console.error('❌ STOMP error:', frame);
                connected = false;
                connecting = false;
                const errorMsg = `STOMP Error: ${frame.headers?.message || 'Unknown error'}`;
                notifyError(errorMsg);
                notifyConnection(false, errorMsg);
                reject(new Error(errorMsg));
            },

            onWebSocketError: (error) => {
                console.error('❌ WebSocket error:', error);
                connected = false;
                connecting = false;
                notifyError('WebSocket Error');
                notifyConnection(false, 'WebSocket Error');
                reject(error);
            },

            onDisconnect: (frame) => {
                console.log('🔌 WebSocket disconnected:', frame);
                connected = false;
                connecting = false;
                notifyConnection(false, 'Disconnected');
                
                // Auto-reconnect logic
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    console.log(`🔄 Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
                    setTimeout(() => {
                        connect(currentUser, options);
                    }, config.reconnectDelay);
                }
            }
        });

        // Enable debug logging in development
        if (process.env.NODE_ENV === 'development') {
            client.debug = (str) => {
                console.log('STOMP Debug:', str);
            };
        }

        client.activate();
    });
};

/**
 * Send a private message to another user
 * @param {string} receiverUsername - Username of the receiver
 * @param {string} content - Message content
 * @param {Object} additionalData - Any additional data to send
 */
export const sendPrivateMessage = (receiverUsername, content, additionalData = {}) => {
    if (!connected) {
        throw new Error('WebSocket is not connected');
    }

    if (!receiverUsername || !receiverUsername.trim()) {
        throw new Error('Receiver username is required');
    }

    if (!content || !content.trim()) {
        throw new Error('Message content is required');
    }

    const message = {
        receiverUsername: receiverUsername.trim(),
        content: content.trim(),
        timestamp: new Date().toISOString(),
        ...additionalData
    };

    console.log('📤 Sending private message:', message);

    try {
        client.publish({
            destination: '/app/chat.private',
            body: JSON.stringify(message),
        });

        console.log('✅ Message sent successfully');
        return true;
    } catch (error) {
        console.error('❌ Error sending message:', error);
        notifyError(`Failed to send message: ${error.message}`);
        throw error;
    }
};

/**
 * Send a message to a topic (group chat)
 * @param {string} topic - Topic name
 * @param {string} content - Message content
 * @param {Object} additionalData - Any additional data to send
 */
export const sendTopicMessage = (topic, content, additionalData = {}) => {
    if (!connected) {
        throw new Error('WebSocket is not connected');
    }

    const message = {
        content: content.trim(),
        timestamp: new Date().toISOString(),
        sender: currentUser,
        ...additionalData
    };

    console.log(`📤 Sending topic message to ${topic}:`, message);

    try {
        client.publish({
            destination: `/app/topic/${topic}`,
            body: JSON.stringify(message),
        });

        console.log('✅ Topic message sent successfully');
        return true;
    } catch (error) {
        console.error('❌ Error sending topic message:', error);
        notifyError(`Failed to send topic message: ${error.message}`);
        throw error;
    }
};

/**
 * Subscribe to a topic
 * @param {string} topic - Topic name to subscribe to
 * @param {Function} callback - Callback function for messages
 */
export const subscribeToTopic = (topic, callback) => {
    if (!connected) {
        throw new Error('WebSocket is not connected');
    }

    const subscription = client.subscribe(`/topic/${topic}`, (message) => {
        try {
            const parsedMessage = JSON.parse(message.body);
            callback(parsedMessage);
        } catch (error) {
            console.error('Error parsing topic message:', error);
        }
    });

    console.log(`📡 Subscribed to topic: ${topic}`);
    return subscription;
};

/**
 * Add custom event listener (simulates socket.on behavior)
 * @param {string} eventName - Event name to listen for
 * @param {Function} callback - Callback function
 */
export const addEventListener = (eventName, callback) => {
    if (!customEventCallbacks.has(eventName)) {
        customEventCallbacks.set(eventName, []);
    }
    customEventCallbacks.get(eventName).push(callback);
    
    return () => removeEventListener(eventName, callback);
};

/**
 * Remove custom event listener
 * @param {string} eventName - Event name
 * @param {Function} callback - Callback function to remove
 */
export const removeEventListener = (eventName, callback) => {
    if (customEventCallbacks.has(eventName)) {
        const callbacks = customEventCallbacks.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
            customEventCallbacks.delete(eventName);
        }
    }
};

/**
 * Trigger custom event listeners
 * @param {string} eventName - Event name
 * @param {*} data - Data to pass to listeners
 */
const triggerCustomEvent = (eventName, data) => {
    if (customEventCallbacks.has(eventName)) {
        customEventCallbacks.get(eventName).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in custom event callback for ${eventName}:`, error);
            }
        });
    }
};

/**
 * Handle incoming private messages
 */
const handleIncomingMessage = (message) => {
    console.log('📨 Received message:', message.body);
    try {
        const parsedMessage = JSON.parse(message.body);
        
        // Transform message format to match ChatComponent expectations
        const transformedMessage = {
            message: parsedMessage.content || parsedMessage.message,
            sender: parsedMessage.senderUsername || parsedMessage.sender,
            receiver: parsedMessage.receiverUsername || parsedMessage.receiver || currentUser,
            sendTime: parsedMessage.timestamp || parsedMessage.sendTime || new Date().toISOString(),
            ...parsedMessage
        };
        
        console.log('🔄 Transformed message:', transformedMessage);
        
        // Notify regular message callbacks (for useWebSocket hook)
        notifyMessage(transformedMessage);
        
        // Trigger custom events that ChatComponent listens for
        triggerCustomEvent('privateMessage', transformedMessage);
        triggerCustomEvent('message', transformedMessage);
        triggerCustomEvent('newMessage', transformedMessage);
        
    } catch (error) {
        console.error('Error parsing incoming message:', error);
    }
};

/**
 * Get socket instance (simulate socket-like interface for compatibility)
 */
export const getSocket = () => {
    return {
        on: addEventListener,
        off: removeEventListener,
        emit: (eventName, data) => {
            console.warn('Socket emit not supported in STOMP implementation');
        },
        connected: () => connected,
        disconnect: disconnect
    };
};

/**
 * Add callback for incoming messages
 * @param {Function} callback - Function to call when message is received
 */
export const onMessage = (callback) => {
    if (typeof callback === 'function') {
        messageCallbacks.push(callback);
    }
};

/**
 * Add callback for connection status changes
 * @param {Function} callback - Function to call when connection status changes
 */
export const onConnectionChange = (callback) => {
    if (typeof callback === 'function') {
        connectionCallbacks.push(callback);
    }
};

/**
 * Add callback for errors
 * @param {Function} callback - Function to call when error occurs
 */
export const onError = (callback) => {
    if (typeof callback === 'function') {
        errorCallbacks.push(callback);
    }
};

/**
 * Remove message callback
 */
export const offMessage = (callback) => {
    messageCallbacks = messageCallbacks.filter(cb => cb !== callback);
};

/**
 * Remove connection callback
 */
export const offConnectionChange = (callback) => {
    connectionCallbacks = connectionCallbacks.filter(cb => cb !== callback);
};

/**
 * Remove error callback
 */
export const offError = (callback) => {
    errorCallbacks = errorCallbacks.filter(cb => cb !== callback);
};

/**
 * Get current connection status
 */
export const getConnectionStatus = () => {
    return {
        connected,
        connecting,
        currentUser
    };
};

/**
 * Disconnect from WebSocket
 */
export const disconnect = () => {
    if (client) {
        console.log('🔌 Disconnecting WebSocket...');
        client.deactivate();
        client = null;
    }
    connected = false;
    connecting = false;
    currentUser = null;
    reconnectAttempts = 0;
    customEventCallbacks.clear();
    notifyConnection(false, 'Manually disconnected');
};

/**
 * Clear all callbacks (useful for cleanup)
 */
export const clearAllCallbacks = () => {
    messageCallbacks = [];
    connectionCallbacks = [];
    errorCallbacks = [];
    customEventCallbacks.clear();
};

/**
 * Check if WebSocket is connected
 */
export const isConnected = () => connected;

/**
 * Check if WebSocket is connecting
 */
export const isConnecting = () => connecting;

/**
 * Get current user
 */
export const getCurrentUser = () => currentUser;

// Internal helper functions
const notifyMessage = (message) => {
    messageCallbacks.forEach(callback => {
        try {
            callback(message);
        } catch (error) {
            console.error('Error in message callback:', error);
        }
    });
};

const notifyConnection = (isConnected, status) => {
    connectionCallbacks.forEach(callback => {
        try {
            callback(isConnected, status);
        } catch (error) {
            console.error('Error in connection callback:', error);
        }
    });
};

const notifyError = (error) => {
    errorCallbacks.forEach(callback => {
        try {
            callback(error);
        } catch (error) {
            console.error('Error in error callback:', error);
        }
    });
};

// Default export object for convenience
const webSocketService = {
    connect,
    disconnect,
    sendPrivateMessage,
    sendTopicMessage,
    subscribeToTopic,
    onMessage,
    onConnectionChange,
    onError,
    offMessage,
    offConnectionChange,
    offError,
    getConnectionStatus,
    clearAllCallbacks,
    isConnected,
    isConnecting,
    getCurrentUser,
    getSocket, // Add this for socket access
    addEventListener,
    removeEventListener
};

export default webSocketService;