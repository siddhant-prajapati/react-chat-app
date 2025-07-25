import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';

const WebSocketClient = ({ currentUser }) => {
    const [receiverUsername, setReceiverUsername] = useState('');
    const [text, setText] = useState('');
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');

    const stompClient = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No JWT token found');
            setConnectionStatus('No token found');
            return;
        }

        console.log('Attempting to connect with native WebSocket...');
        setConnectionStatus('Connecting...');

        // Try native WebSocket first (without SockJS)
        stompClient.current = new Client({
        // Use native WebSocket instead of SockJS
        brokerURL: 'ws://localhost:9080/chat',
        
        connectHeaders: {
            Authorization: `Bearer ${token}`
        },
        
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        
        onConnect: (frame) => {
            console.log('✅ Native WebSocket connected successfully');
            console.log('Connection frame:', frame);
            setConnected(true);
            setConnectionStatus('Connected (Native WebSocket)');
            
            // Subscribe to user-specific message queue
            const subscription = stompClient.current.subscribe('/user/queue/messages', (message) => {
            console.log('📨 Received message:', message.body);
            try {
                const msg = JSON.parse(message.body);
                setMessages((prev) => [...prev, msg]);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
            });
            
            console.log('📡 Subscribed to /user/queue/messages');
        },

        onStompError: (frame) => {
            console.error('❌ STOMP error:', frame);
            setConnectionStatus('STOMP Error: ' + (frame.headers?.message || 'Unknown error'));
            setConnected(false);
        },

        onWebSocketError: (error) => {
            console.error('❌ WebSocket error:', error);
            setConnectionStatus('WebSocket Error');
            setConnected(false);
        },

        onDisconnect: (frame) => {
            console.log('🔌 WebSocket disconnected:', frame);
            setConnected(false);
            setConnectionStatus('Disconnected');
        }
        });

        // Enable debug logging
        stompClient.current.debug = (str) => {
        console.log('STOMP Debug:', str);
        };

        stompClient.current.activate();

        return () => {
        if (stompClient.current && stompClient.current.connected) {
            console.log('🔌 Deactivating WebSocket connection');
            stompClient.current.deactivate();
        }
        };
    }, []);

        const sendMessage = () => {
            if (!connected) {
                alert('WebSocket not connected');
                return;
            }

            if (!text.trim() || !receiverUsername.trim()) {
                alert('Please enter both message and receiver username');
                return;
            }

            const message = {
                receiverUsername: receiverUsername.trim(),
                content: text.trim(),
            };

            console.log('📤 Sending message:', message);

            try {
                stompClient.current.publish({
                    destination: '/app/chat.private',
                    body: JSON.stringify(message),
                });

                setText('');
                console.log('✅ Message sent successfully');
            } catch (error) {
                console.error('❌ Error sending message:', error);
                alert('Failed to send message: ' + error.message);
            }
        };

    return (
        <div style={{ padding: 20 }}>
            <h2>Private Chat (Native WebSocket)</h2>
            
            {/* Connection Status */}
            <div style={{ 
                padding: 10, 
                marginBottom: 10, 
                backgroundColor: connected ? '#d4edda' : '#f8d7da',
                color: connected ? '#155724' : '#721c24',
                border: `1px solid ${connected ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: 4
            }}>
                Status: {connectionStatus}
            </div>

            <div style={{ marginBottom: 10 }}>
                <label>Current User: <strong>{currentUser?.username}</strong></label>
            </div>

            <div style={{ marginBottom: 10 }}>
                <input
                type="text"
                placeholder="Receiver username"
                value={receiverUsername}
                onChange={(e) => setReceiverUsername(e.target.value)}
                style={{ padding: 5, marginRight: 10, width: 200 }}
                />
            </div>

            {/* Messages Display */}
            <div style={{ 
                border: '1px solid #ccc', 
                height: 300, 
                overflowY: 'auto', 
                marginBottom: 10, 
                padding: 10,
                backgroundColor: '#f9f9f9'
            }}>
                {messages.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No messages yet...</p>
                ) : (
                messages.map((msg, idx) => (
                    <div key={idx} style={{ 
                    marginBottom: 10, 
                    padding: 5,
                    backgroundColor: msg.senderUsername === currentUser?.username ? '#e3f2fd' : '#fff3e0',
                    borderRadius: 4,
                    border: '1px solid #ddd'
                    }}>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                        {msg.senderUsername} → {msg.receiverUsername}
                    </div>
                    <div style={{ margin: '5px 0' }}>{msg.content}</div>
                    <div style={{ fontSize: '0.8em', color: '#666' }}>
                        {new Date(msg.timestamp).toLocaleString()}
                    </div>
                    </div>
                ))
                )}
            </div>

            {/* Message Input */}
            <div style={{ display: 'flex', gap: 10 }}>
                <input
                type="text"
                value={text}
                placeholder="Type a message"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                style={{ flex: 1, padding: 8 }}
                disabled={!connected}
                />
                <button 
                onClick={sendMessage}
                disabled={!connected}
                style={{ 
                    padding: '8px 16px',
                    backgroundColor: connected ? '#007bff' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: connected ? 'pointer' : 'not-allowed'
                }}
                >
                Send
                </button>
            </div>
            <div>
                Siddhant Message only
                {messages.map((msg, idx) => {
                    if (msg.receiverUsername === 'sid@example.com') {
                        return(<li>{msg.content}</li>)
                    }
                })}
            </div>
        </div>
    );
};

export default WebSocketClient;