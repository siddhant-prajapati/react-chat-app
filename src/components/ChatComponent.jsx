import { useEffect, useState } from 'react';
import { Send, MoreHorizontal, Phone, Video } from 'lucide-react';
import { getFriendsByUserId } from '../service/user.service';
import '../styles/ChatComponent.css';
import { getMessageBetweenTwoUsers } from '../service/message.service';
import { useWebSocket } from '../service/useWebSocket';
import { useNavigate } from 'react-router-dom';

const ChatComponent = (props) => {
	const [selectedUserId, setSelectedUserId] = useState(-1);
	const [newMessage, setNewMessage] = useState("");
	const [friends, setFriends] = useState([]);
	const [messages, setMessages] = useState([]);
	const [lastMessageMap, setLastMessageMap] = useState({});

	const navigate = useNavigate();

	const { 
		sendPrivateMessage, 
		addMessageListener, 
		removeMessageListener,
		connected 
	} = useWebSocket(props.loginUser?.username);

	const avatarUrl = process.env.REACT_APP_IMAGE_URL;

	// convert iso datatime to time
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
	const token = localStorage.getItem('token');

	useEffect(() => {
		const fetchFriends = async () => {
			const ufs = await getFriendsByUserId(token, props.loginUser.id, navigate);
			setFriends(ufs);
			console.log(avatarUrl);
			
			// Fetch last message for each friend
			const lastMessages = {};
			for (const friend of ufs) {
				try {
					const messages = await getMessageBetweenTwoUsers(token, props.loginUser.id, friend.id);
					if (messages && messages.length > 0) {
						const lastMessage = messages[messages.length - 1];
						lastMessages[friend.id] = lastMessage;
					}
				} catch (error) {
					console.error(`Error fetching messages for friend ${friend.id}:`, error);
				}
			}
			setLastMessageMap(lastMessages);
		}
		fetchFriends();
	},[props.loginUser.id])

	// Listen for incoming messages via WebSocket
	useEffect(() => {
		if (!connected) {
			console.log("WebSocket not connected, skipping message listeners");
			return;
		}

		console.log("Setting up message listeners...");

		const handleIncomingMessage = (messageData) => {
			console.log("📨 ChatComponent received message:", messageData);
			
			// Determine if this message is relevant to current chat
			const senderName = messageData.sender || messageData.senderUsername;
			const receiverName = messageData.receiver || messageData.receiverUsername;
			const senderId = friends.find(f => f.username === senderName)?.id;
			const receiverId = friends.find(f => f.username === receiverName)?.id;
			
			console.log("Message details:", { senderName, receiverName, senderId, receiverId, selectedUserId });
			
			// Update messages if the current chat is with the sender or receiver
			if (selectedUserId !== -1) {
				if (senderId === selectedUserId || senderName === props.loginUser.username) {
					console.log("✅ Adding message to current chat");
					setMessages(prev => {
						// Avoid duplicates by checking if message already exists
						const exists = prev.some(msg => 
							msg.message === messageData.message && 
							(msg.sender === senderName || msg.senderUsername === senderName) && 
							Math.abs(new Date(msg.sendTime || msg.timestamp) - new Date(messageData.sendTime || messageData.timestamp)) < 1000
						);
						if (!exists) {
							return [...prev, messageData];
						}
						console.log("⚠️ Duplicate message detected, skipping");
						return prev;
					});
				} else {
					console.log("Message not for current chat, skipping display");
				}
			} else {
				console.log("No chat selected, not displaying message");
			}

			// Update last message map for friend list
			if (senderId || receiverId) {
				const chatPartnerId = senderName === props.loginUser.username ? receiverId : senderId;
				if (chatPartnerId) {
					console.log("📝 Updating last message for friend:", chatPartnerId);
					setLastMessageMap(prev => ({
						...prev,
						[chatPartnerId]: messageData
					}));
				}
			}
		};

		// Add listeners for different message events (STOMP compatible)
		console.log("Adding message event listeners...");
		const cleanup1 = addMessageListener('privateMessage', handleIncomingMessage);
		const cleanup2 = addMessageListener('message', handleIncomingMessage);
		const cleanup3 = addMessageListener('newMessage', handleIncomingMessage);

		return () => {
			console.log("Cleaning up message listeners...");
			cleanup1 && cleanup1();
			cleanup2 && cleanup2();
			cleanup3 && cleanup3();
		};
	}, [connected, selectedUserId, friends, props.loginUser.username, addMessageListener]);

	useEffect(() => {
		console.log("Updated friends list:", friends);
	}, [friends]);

	useEffect(() => {
		console.log("Change in messages", messages)
	}, [messages])

	const getMessages = async (userId1, userId2) => {
		try {
			const response = await getMessageBetweenTwoUsers(token, userId1, userId2);
			console.log("new messages", response);
			setMessages(response);
			
				// Update last message map
				if (response.length > 0) {
					const lastMsg = response[response.length - 1];
					setLastMessageMap(prev => ({
						...prev,
						[userId2]: lastMsg
					}));
				}
		} catch (error) {
			console.error("Error fetching messages:", error);
		}
	}

	const handleUserClick = async (selectedUserId) => {
		setSelectedUserId(selectedUserId);
		console.log('selected user', selectedUserId);
		const loginUserId = props.loginUser.id;
		console.log(`Selected userId : ${selectedUserId} , Login userId : ${loginUserId}`);

		await getMessages(loginUserId, selectedUserId);
		console.log('Messages', messages)
		console.log("Selected User", selectedUser)
	};

	const handleSendMessage = async () => {
		if (newMessage.trim() && selectedUser) {
			try {
				const msgText = newMessage.trim();
				const receiverUsername = selectedUser.username.trim();

				// Create message object
				const newMsg = {
					message: msgText,
					sender: props.loginUser.username,
					receiver: receiverUsername,
					sendTime: new Date().toISOString(),
				};

				// Send via WebSocket
				sendPrivateMessage(receiverUsername, msgText);
				console.log("Sending message:", newMessage);
				setNewMessage("");

				// Optimistically add message to UI
				setMessages(prev => [...prev, newMsg]);
				
				// Update last message map
				setLastMessageMap(prev => ({
					...prev,
					[selectedUserId]: newMsg
				}));

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
			<h2>Chats </h2>
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
						src={avatarUrl+user.firstName} 
						alt={user.firstName}
						className="user-avatar"
					/>
					<div className="user-details">
						<div className="user-header">
						<h3 className="user-name">{user.firstName}</h3>
						<span className="message-time">
							{lastMessage ? getFormattedTime(lastMessage.sendTime) : ''}
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
					src={avatarUrl+selectedUser.firstName} 
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
				{messages.map((msg, index) => (
					<div 
						key={index} 
						className={`message-wrapper ${msg.sender === props.loginUser.username ? 'sent' : 'received'}`}
					>
					<div className="message-bubble">
						<div className={`message ${msg.sender===props.loginUser.username ? 'message-sent' : 'message-received'}`}>
						<p className="message-text">{msg.message}</p>
						<p className="message-timestamp">{getFormattedTime(msg.sendTime || msg.timestamp)}</p>
						</div>
						<div className={`message-tail ${msg.sender===props.loginUser.username ? 'tail-sent' : 'tail-received'}`}></div>
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
				<p className="welcome-subtitle">Select a conversation to start messaging</p>
			</div>
			</div>
		)}
		</div>
	</div>
	);
};

export default ChatComponent;