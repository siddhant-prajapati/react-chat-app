import { useEffect, useState } from 'react';
import { Send, MoreHorizontal, Phone, Video } from 'lucide-react';
import { getFriendsByUserId } from '../service/user.service';
import '../styles/ChatComponent.css';
import { getMessageBetweenTwoUsers } from '../service/message.service';
import { useWebSocket } from '../service/useWebSocket';
import { useNavigate } from 'react-router-dom';

const ChatComponent = ({ loginUser, refreshTrigger }) => {
	const [selectedUserId, setSelectedUserId] = useState(-1);
	const [newMessage, setNewMessage] = useState("");
	const [friends, setFriends] = useState([]);
	const [lastMessageMap, setLastMessageMap] = useState({});

	const navigate = useNavigate();

	// Use messages directly from useWebSocket hook - NO separate messages state
	const { 
		messages: allMessages, // All messages from WebSocket
		sendPrivateMessage, 
		connected,
		clearMessages,
		loadMessages // Function to load initial messages
	} = useWebSocket(loginUser?.username);

	const avatarUrl = process.env.REACT_APP_IMAGE_URL;
	const token = localStorage.getItem('token');

	// Convert ISO datetime to time
	const getFormattedTime = (isoString) => {
		const date = new Date(isoString);
		const formattedTime = date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		});
		return formattedTime;
	}

	let selectedUser = friends.filter(f => f.id === selectedUserId)[0];

	// Get messages for the currently selected chat
	const getCurrentChatMessages = () => {
		if (selectedUserId === -1 || !selectedUser) return [];
		
		return allMessages.filter(msg => {
			const senderName = msg.sender || msg.senderUsername;
			const receiverName = msg.receiver || msg.receiverUsername;
			
			// Message is part of current chat if:
			// 1. Current user sent to selected user, OR
			// 2. Selected user sent to current user
			return (
				(senderName === loginUser.username && receiverName === selectedUser.username) ||
				(senderName === selectedUser.username && receiverName === loginUser.username)
			);
		});
	};

	// Get current chat messages
	const currentChatMessages = getCurrentChatMessages();

	// Function to fetch friends and messages
	const fetchFriendsAndMessages = async () => {
		if (!loginUser?.id) return;
		
		console.log("🔄 Fetching friends and messages...");
		
		try {
			const ufs = await getFriendsByUserId(token, loginUser.id, navigate);
			setFriends(ufs);
			console.log("Friends loaded:", ufs.length);
			
			// Fetch last message for each friend AND load all historical messages
			const lastMessages = {};
			const allHistoricalMessages = [];
			
			for (const friend of ufs) {
				try {
					const messages = await getMessageBetweenTwoUsers(token, loginUser.id, friend.id);
					console.log(`Loaded ${messages.length} messages with friend ${friend.firstName}`);
					
					if (messages && messages.length > 0) {
						// Store last message for friend list display
						const lastMessage = messages[messages.length - 1];
						lastMessages[friend.id] = lastMessage;
						
						// Collect all messages to load into WebSocket state
						allHistoricalMessages.push(...messages);
					}
				} catch (error) {
					console.error(`Error fetching messages for friend ${friend.id}:`, error);
				}
			}
			
			// Load all historical messages into WebSocket state at once
			if (allHistoricalMessages.length > 0) {
				console.log("Loading all historical messages into WebSocket state:", allHistoricalMessages.length);
				loadMessages(allHistoricalMessages);
			}
			
			setLastMessageMap(lastMessages);
		} catch (error) {
			console.error("Error fetching friends:", error);
		}
	};

	// Initial load when component mounts or loginUser changes
	useEffect(() => {
		fetchFriendsAndMessages();
	}, [loginUser?.id, loadMessages]);

	// Refresh friends when refreshTrigger changes (when Header adds a new friend)
	useEffect(() => {
		if (refreshTrigger > 0) {
			console.log("📋 Friend list refresh triggered from Header!");
			fetchFriendsAndMessages();
		}
	}, [refreshTrigger]);

	// Update last message map when allMessages changes
	useEffect(() => {
		console.log("📊 All messages updated:", allMessages.length);
		
		// Update last message map based on current messages
		if (friends.length > 0 && allMessages.length > 0) {
			const updatedLastMessages = { ...lastMessageMap };
			
			friends.forEach(friend => {
				// Find the most recent message with this friend
				const messagesWithFriend = allMessages.filter(msg => {
					const senderName = msg.sender || msg.senderUsername;
					const receiverName = msg.receiver || msg.receiverUsername;
					
					return (
						(senderName === loginUser.username && receiverName === friend.username) ||
						(senderName === friend.username && receiverName === loginUser.username)
					);
				});
				
				if (messagesWithFriend.length > 0) {
					// Get the most recent message
					const lastMessage = messagesWithFriend[messagesWithFriend.length - 1];
					updatedLastMessages[friend.id] = lastMessage;
				}
			});
			
			setLastMessageMap(updatedLastMessages);
		}
	}, [allMessages, friends, loginUser.username]);

	// Load initial messages when selecting a user
	const handleUserClick = async (selectedUserId) => {
		setSelectedUserId(selectedUserId);
		console.log('Selected user:', selectedUserId);
		
		const selectedFriend = friends.find(f => f.id === selectedUserId);
		if (!selectedFriend) {
			console.error("Selected friend not found");
			return;
		}
		
		const loginUserId = loginUser.id;
		console.log(`Selected userId: ${selectedUserId}, Login userId: ${loginUserId}`);

		// Check if we already have messages for this conversation in our WebSocket state
		const existingMessages = allMessages.filter(msg => {
			const senderName = msg.sender || msg.senderUsername;
			const receiverName = msg.receiver || msg.receiverUsername;
			
			return (
				(senderName === loginUser.username && receiverName === selectedFriend.username) ||
				(senderName === selectedFriend.username && receiverName === loginUser.username)
			);
		});

		// Only fetch from database if we don't have messages for this conversation
		if (existingMessages.length === 0) {
			console.log("No existing messages found, fetching from database...");
			try {
				const historicalMessages = await getMessageBetweenTwoUsers(token, loginUserId, selectedUserId);
				console.log("Historical messages loaded from database:", historicalMessages.length);
				
				if (historicalMessages && historicalMessages.length > 0) {
					// Load messages into the WebSocket hook's state
					loadMessages(historicalMessages);
					
					// Update last message map with the most recent message
					const lastMsg = historicalMessages[historicalMessages.length - 1];
					setLastMessageMap(prev => ({
						...prev,
						[selectedUserId]: lastMsg
					}));
				}
				
			} catch (error) {
				console.error("Error fetching historical messages from database:", error);
			}
		} else {
			console.log(`Found ${existingMessages.length} existing messages for this conversation`);
		}
	};

	const handleSendMessage = async () => {
		if (newMessage.trim() && selectedUser) {
			try {
				const msgText = newMessage.trim();
				const receiverUsername = selectedUser.username.trim();

				console.log("Sending message:", msgText, "to:", receiverUsername);
				
				// Send via WebSocket - this will automatically add to allMessages via the hook
				sendPrivateMessage(receiverUsername, msgText);
				setNewMessage("");

			} catch (error) {
				console.error('❌ Failed to send message:', error);
				alert(`Failed to send message: ${error.message}`);
			}
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			handleSendMessage();
		}
	};

	// Get last message for a friend
	const getLastMessageForFriend = (friendId) => {
		return lastMessageMap[friendId] || null;
	};

	// Debug logging
	useEffect(() => {
		console.log("📊 Current chat messages:", currentChatMessages.length);
	}, [currentChatMessages]);

	useEffect(() => {
		console.log("📊 Connection status:", connected);
	}, [connected]);

	return (
		<div className="chat-container">
			{/* Connection Status Indicator */}
			{!connected && (
				<div className="connection-status">
					<span style={{color: 'red'}}>● Disconnected</span>
				</div>
			)}
			
			{/* Users List */}
			<div className="users-list">
				<div className="chat-header">
					<h2>Chats</h2>
					{friends.length === 0 && (
						<p style={{fontSize: '14px', color: '#666', margin: '10px 0'}}>
							No friends yet. Add friends using the search box above!
						</p>
					)}
				</div>
				
				<div className="users-scroll">
					{friends.map((user, index) => {
						const lastMessage = getLastMessageForFriend(user.id);
						return (
							<div 
								key={index} 
								onClick={() => handleUserClick(user.id)}
								className={`user-item ${selectedUserId === user.id ? 'selected' : ''}`}
							>
								<div className="user-info">
									<img 
										src={avatarUrl + user.firstName} 
										alt={user.firstName}
										className="user-avatar"
									/>
									<div className="user-details">
										<div className="user-header">
											<h3 className="user-name">{user.firstName}</h3>
											<span className="message-time">
												{lastMessage ? getFormattedTime(lastMessage.sendTime || lastMessage.timestamp) : ''}
											</span>
										</div>
										<p className="last-message">
											{lastMessage ? lastMessage.message : 'No messages yet'}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Chat Area */}
			<div className="chat-area">
				{selectedUser ? (
					<>
						{/* Chat Header */}
						<div className="selected-chat-header">
							<div className="selected-user-info">
								<img 
									src={avatarUrl + selectedUser.firstName} 
									alt={selectedUser.firstName}
									className="selected-user-avatar"
								/>
								<div className="selected-user-details">
									<h3 className="selected-user-name">{selectedUser.firstName}</h3>
									<p className="user-status">{selectedUser.lastSeen}</p>
								</div>
							</div>
							<div className="chat-actions">
								<button className="action-btn">
									<Video size={20} />
								</button>
								<button className="action-btn">
									<Phone size={20} />
								</button>
								<button className="action-btn">
									<MoreHorizontal size={20} />
								</button>
							</div>
						</div>

						{/* Messages */}
						<div className="messages-area">
							<div className="messages-container">
								{currentChatMessages.map((msg, index) => (
									<div 
										key={index} 
										className={`message-wrapper ${(msg.sender || msg.senderUsername) === loginUser.username ? 'sent' : 'received'}`}
									>
										<div className="message-bubble">
											<div className={`message ${(msg.sender || msg.senderUsername) === loginUser.username ? 'message-sent' : 'message-received'}`}>
												<p className="message-text">{msg.message}</p>
												<p className="message-timestamp">{getFormattedTime(msg.sendTime || msg.timestamp)}</p>
											</div>
											<div className={`message-tail ${(msg.sender || msg.senderUsername) === loginUser.username ? 'tail-sent' : 'tail-received'}`}></div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Message Input */}
						<div className="input-area">
							<input
								type="text"
								placeholder="Type a message..."
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								onKeyPress={handleKeyPress}
								className="message-input"
								disabled={!connected}
							/>
							<button 
								onClick={handleSendMessage}
								disabled={!newMessage.trim() || !connected}
								className={`send-button ${newMessage.trim() && connected ? 'active' : 'inactive'}`}
							>
								<Send size={20} />
							</button>
						</div>
					</>
				) : (
					<div className="welcome-screen">
						<div className="welcome-content">
							<h2 className="welcome-title">Welcome to Chat</h2>
							<p className="welcome-subtitle">
								{friends.length === 0 
									? "Add friends using the search box above to start chatting!" 
									: "Select a conversation to start messaging"
								}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ChatComponent;