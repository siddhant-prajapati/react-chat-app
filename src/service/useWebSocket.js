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

    // Message callback
    const handleMessage = useCallback((message) => {
        setMessages(prev => [...prev, message]);
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
            return webSocketService.sendPrivateMessage(receiverUsername, content, additionalData);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, []);

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

    // Disconnect
    const disconnect = useCallback(() => {
        webSocketService.disconnect();
    }, []);

    // Clear messages
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    // Filter messages by receiver (like your original requirement)
    const getMessagesByReceiver = useCallback((receiverUsername) => {
        return messages.filter(msg => msg.receiverUsername === receiverUsername);
    }, [messages]);

    // Filter messages by sender
    const getMessagesBySender = useCallback((senderUsername) => {
        return messages.filter(msg => msg.senderUsername === senderUsername);
    }, [messages]);

    // Get conversation between two users
    const getConversation = useCallback((otherUsername) => {
        return messages.filter(msg => 
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

        // Add callbacks to service
        webSocketService.onMessage(handleMessage);
        webSocketService.onConnectionChange(handleConnectionChange);
        webSocketService.onError(handleError);

        // Get initial connection status
        const status = webSocketService.getConnectionStatus();
        setConnected(status.connected);
        setConnecting(status.connecting);

        // Auto-connect if user is provided
        if (currentUser && !status.connected && !status.connecting) {
            connect();
        }

        // Cleanup on unmount
        return () => {
            webSocketService.offMessage(messageCallbackRef.current);
            webSocketService.offConnectionChange(connectionCallbackRef.current);
            webSocketService.offError(errorCallbackRef.current);
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
        clearMessages,
        getMessagesByReceiver,
        getMessagesBySender,
        getConversation,
        
        // Actions
        connect,
        disconnect,
        sendPrivateMessage,
        sendTopicMessage,
        subscribeToTopic
    };
};