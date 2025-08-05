import { useEffect, useState, useCallback, useRef } from 'react';
import * as webSocketService from './websocket.service';

/**
 * Custom hook for using WebSocket service
 * @param {string} currentUser - Current user's username
 * @param {Object} options - WebSocket connection options
 */
export const useWebSocket = (currentUser, options = {}) => {
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    
    const messageCallbackRef = useRef(null);
    const connectionCallbackRef = useRef(null);
    const errorCallbackRef = useRef(null);
    const customMessageListenersRef = useRef(new Map());

    // Message callback - handles incoming WebSocket messages
    const handleMessage = useCallback((message) => {
        console.log("📨 useWebSocket received message:", message);
        setMessages(prev => {
            // Check for duplicates to avoid adding the same message twice
            const isDuplicate = prev.some(existingMsg => 
                existingMsg.message === message.message &&
                (existingMsg.sender || existingMsg.senderUsername) === (message.sender || message.senderUsername) &&
                (existingMsg.receiver || existingMsg.receiverUsername) === (message.receiver || message.receiverUsername) &&
                Math.abs(new Date(existingMsg.sendTime || existingMsg.timestamp) - new Date(message.sendTime || message.timestamp)) < 1000
            );
            
            if (!isDuplicate) {
                const updated = [...prev, message];
                console.log("✅ Message added to WebSocket state. Total messages:", updated.length);
                return updated;
            } else {
                console.log("⚠️ Duplicate message detected, skipping");
                return prev;
            }
        });
    }, []);

    // Connection callback
    const handleConnectionChange = useCallback((isConnected, status) => {
        setConnected(isConnected);
        setConnecting(false);
        setConnectionStatus(status);
        if (isConnected) {
            setError(null);
        }
    }, []);

    // Error callback
    const handleError = useCallback((errorMsg) => {
        setError(errorMsg);
        setConnecting(false);
    }, []);

    // Connect to WebSocket
    const connect = useCallback(async () => {
        if (!currentUser) {
            setError('Current user is required');
            return;
        }

        try {
            setConnecting(true);
            setError(null);
            await webSocketService.connect(currentUser, options);
        } catch (err) {
            setError(err.message);
            setConnecting(false);
        }
    }, [currentUser, options]);

    // Send private message
    const sendPrivateMessage = useCallback((receiverUsername, content, additionalData = {}) => {
        try {
            // Create optimistic message for immediate UI update
            const optimisticMessage = {
                message: content,
                sender: currentUser,
                receiver: receiverUsername,
                sendTime: new Date().toISOString(),
                ...additionalData
            };
            
            // Add to messages immediately for better UX
            setMessages(prev => [...prev, optimisticMessage]);
            
            // Send via WebSocket service
            return webSocketService.sendPrivateMessage(receiverUsername, content, additionalData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [currentUser]);

    // Send topic message
    const sendTopicMessage = useCallback((topic, content, additionalData = {}) => {
        try {
            return webSocketService.sendTopicMessage(topic, content, additionalData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Subscribe to topic
    const subscribeToTopic = useCallback((topic, callback) => {
        try {
            return webSocketService.subscribeToTopic(topic, callback);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

    // Add custom message listener (compatible with STOMP)
    const addMessageListener = useCallback((eventName, callback) => {
        try {
            const cleanup = webSocketService.addEventListener(eventName, callback);
            // Store reference for cleanup
            const key = `${eventName}_${Date.now()}_${Math.random()}`;
            customMessageListenersRef.current.set(key, { eventName, callback, cleanup });
            return cleanup;
        } catch (err) {
            setError(err.message);
        }
    }, []);

    // Remove custom message listener
    const removeMessageListener = useCallback((eventName, callback) => {
        try {
            webSocketService.removeEventListener(eventName, callback);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    // Load initial messages (from API or other source)
    const loadMessages = useCallback((messagesToLoad) => {
        console.log("📥 Loading initial messages:", messagesToLoad.length);
        setMessages(prev => {
            // Merge with existing messages, avoiding duplicates
            const combined = [...prev];
            
            messagesToLoad.forEach(newMsg => {
                const isDuplicate = combined.some(existingMsg => 
                    existingMsg.message === newMsg.message &&
                    (existingMsg.sender || existingMsg.senderUsername) === (newMsg.sender || newMsg.senderUsername) &&
                    (existingMsg.receiver || existingMsg.receiverUsername) === (newMsg.receiver || newMsg.receiverUsername) &&
                    Math.abs(new Date(existingMsg.sendTime || existingMsg.timestamp) - new Date(newMsg.sendTime || newMsg.timestamp)) < 1000
                );
                
                if (!isDuplicate) {
                    combined.push(newMsg);
                }
            });
            
            // Sort by timestamp
            combined.sort((a, b) => new Date(a.sendTime || a.timestamp) - new Date(b.sendTime || b.timestamp));
            
            console.log("📊 Total messages after loading:", combined.length);
            return combined;
        });
    }, []);

    // Get socket instance (returns socket-like interface)
    const getSocket = useCallback(() => {
        return webSocketService.getSocket();
    }, []);

    // Disconnect
    const disconnect = useCallback(() => {
        // Clean up custom listeners
        customMessageListenersRef.current.forEach(({ cleanup }) => {
            if (cleanup && typeof cleanup === 'function') {
                cleanup();
            }
        });
        customMessageListenersRef.current.clear();
        webSocketService.disconnect();
    }, []);

    // Clear messages
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    // Filter messages by receiver
    const getMessagesByReceiver = useCallback((receiverUsername) => {
        return messages.filter(msg => 
            (msg.receiverUsername === receiverUsername) || (msg.receiver === receiverUsername)
        );
    }, [messages]);

    // Filter messages by sender
    const getMessagesBySender = useCallback((senderUsername) => {
        return messages.filter(msg => 
            (msg.senderUsername === senderUsername) || (msg.sender === senderUsername)
        );
    }, [messages]);

    // Get conversation between two users
    const getConversation = useCallback((otherUsername) => {
        return messages.filter(msg => 
            (msg.sender === currentUser && msg.receiver === otherUsername) ||
            (msg.sender === otherUsername && msg.receiver === currentUser) ||
            (msg.senderUsername === currentUser && msg.receiverUsername === otherUsername) ||
            (msg.senderUsername === otherUsername && msg.receiverUsername === currentUser)
        );
    }, [messages, currentUser]);

    // Setup callbacks on mount
    useEffect(() => {
        // Store refs to callbacks for cleanup
        messageCallbackRef.current = handleMessage;
        connectionCallbackRef.current = handleConnectionChange;
        errorCallbackRef.current = handleError;

        // Add callbacks to service - these will receive messages from STOMP
        webSocketService.onMessage(handleMessage);
        webSocketService.onConnectionChange(handleConnectionChange);
        webSocketService.onError(handleError);

        // Get initial connection status
        const status = webSocketService.getConnectionStatus();
        setConnected(status.connected);
        setConnecting(status.connecting);
        setConnectionStatus(status.connected ? 'Connected' : 'Disconnected');

        // Auto-connect if user is provided
        if (currentUser && !status.connected && !status.connecting) {
            connect();
        }

        // Cleanup on unmount
        return () => {
            // Clean up custom listeners
            customMessageListenersRef.current.forEach(({ cleanup }) => {
                if (cleanup && typeof cleanup === 'function') {
                    cleanup();
                }
            });
            customMessageListenersRef.current.clear();

            // Remove service callbacks
            webSocketService.offMessage(handleMessage);
            webSocketService.offConnectionChange(handleConnectionChange);
            webSocketService.offError(handleError);
        };
    }, [currentUser, connect, handleMessage, handleConnectionChange, handleError]);

    return {
        // Connection state
        connected,
        connecting,
        connectionStatus,
        error,
        
        // Messages
        messages,
        loadMessages, // NEW: Load initial messages
        clearMessages,
        getMessagesByReceiver,
        getMessagesBySender,
        getConversation,
        
        // Actions
        connect,
        disconnect,
        sendPrivateMessage,
        sendTopicMessage,
        subscribeToTopic,
        
        // Advanced usage (socket-like interface)
        socket: getSocket(), // Returns socket-like object
        addMessageListener,
        removeMessageListener,
        getSocket
    };
};