import { useEffect, useState } from 'react';
import { Send, MoreHorizontal, Phone, Video } from 'lucide-react';
import { getFriendsByUserId } from '../service/user.service';
import '../styles/ChatComponent.css';
import { getMessageBetweenTwoUsers } from '../service/message.service';
import { useWebSocket } from '../service/useWebSocket';

const ChatComponent = (props) => {
	const [selectedUserId, setSelectedUserId] = useState(-1);
	const [newMessage, setNewMessage] = useState("");
	const [friends, setFriends] = useState([]);
	const [messages, setMessages] = useState([]);

	const { sendPrivateMessage } = useWebSocket(props.loginUser?.username);

	const avatarUrl = process.env.REACT_APP_IMAGE_URL;

	// console.log(props.loginUser);

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
			const ufs = await getFriendsByUserId(token, props.loginUser.id);
			setFriends(ufs);
			console.log(avatarUrl);
		}
		fetchFriends();
	},[props.loginUser.id])

	useEffect(() => {
		console.log("Updated friends list:", friends);
	}, [friends]);

	useEffect(() => {
		console.log("Change in messages",messages)
	}, [messages])

	const getMessages = async (userId1, userId2) => {
		const response = await getMessageBetweenTwoUsers(token, userId1, userId2);
		console.log("new messages", response);
		setMessages(response);
	}


	const handleUserClick = async (selectedUserId) => {
		setSelectedUserId(selectedUserId);
		console.log('selected user', selectedUserId);
		const loginUserId = props.loginUser.id;
		console.log(`Selected userId : ${selectedUserId} , Login userId : ${loginUserId}`);

		getMessages(loginUserId, selectedUserId);
		console.log('Messages',messages)
		console.log("Selected User",selectedUser)
	};

	const handleSendMessage = async () => {
		if (newMessage.trim() && selectedUser) {
			try {
				const msgText = newMessage.trim();
				const receiverUsername = selectedUser.username.trim();

				sendPrivateMessage(selectedUser?.username.trim(), newMessage.trim());
				console.log("Sending message:", newMessage);
				setNewMessage("");

				// Optimistically add message to UI
				const newMsg = {
					message: msgText,
					sender: props.loginUser.username,
					receiver: receiverUsername,
					sendTime: new Date().toISOString(),
				};
				setMessages(prev => [...prev, newMsg]);
				// getMessages(props.loginUser?.id, selectedUserId);
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

	return (
	<div className="chat-container">
		{/* Users List */}
		<div className="users-list">
		<div className="chat-header">
			<h2>Chats </h2>
		</div>
		
		<div className="users-scroll">
			{friends.map((user, index) => (
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
							{getFormattedTime(messages[messages.length - 1]?.sendTime)}
						</span>
						</div>
						<p className="last-message">
						{/* {user.messages[user.messages.length - 1]?.text} */}
						{messages[messages.length - 1]?.message}
						</p>
					</div>
					</div>
				</div>
			))}
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
						<p className="message-timestamp">{getFormattedTime(msg.sendTime)}</p>
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
				/>
				<button 
				onClick={handleSendMessage}
				disabled={!newMessage.trim()}
				className={`send-button ${newMessage.trim() ? 'active' : 'inactive'}`}
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
