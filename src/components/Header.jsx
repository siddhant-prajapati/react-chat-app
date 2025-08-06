import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonGroup, Box } from '@mui/material';
import { getUserByUsernameKeyword, makeFriend, getLoginUser } from '../service/user.service';
import '../styles/Header.css'
import { Send } from 'lucide-react';

const Header = ({ loginUser, onFriendAdded }) => {
	const navigate = useNavigate();
	const [userName, setUserName] = useState('');
	const token = localStorage.getItem('token');
	const [users, setUsers] = useState([]);
	const [localLoginUser, setLocalLoginUser] = useState({});

	const avatarUrl = process.env.REACT_APP_IMAGE_URL;

	useEffect(() => {
		const loadLoginUser = async () => {
			await fetchLoginUser();
		};
		loadLoginUser();
	}, []);

	// Use loginUser from props if available, otherwise use local state
	const currentUser = loginUser?.id ? loginUser : localLoginUser;

	const fetchLoginUser = async () => {
		const user = await getLoginUser(token, navigate);
		setLocalLoginUser(user);
	}

	const searchUser = async (value) => {
		setUserName(value);
		const usrs = await getUserByUsernameKeyword(token, value);
		setUsers(usrs);
	}

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			console.log(e)
		}
	}

	const makeUserFriend = async () => {
		try {
			const selectedUser = await getUserByUsernameKeyword(token, userName);
			
			console.log(selectedUser[0]);
			console.log(currentUser);
			
			if (selectedUser?.length === 1) {
				const selectedUserId = selectedUser[0]?.id;
				const loginUserId = currentUser.id;
				
				const newFriend = await makeFriend(token, selectedUserId, loginUserId);
				console.log("✅ Friend request sent:", newFriend);
				
				// Clear the search input
				setUserName('');
				setUsers([]);
				
				// Notify parent component that a friend was added
				if (onFriendAdded) {
					onFriendAdded();
				}
				
				
			} else {
				console.log("Enter valid username", userName);
				alert("Please enter a valid username");
			}
		} catch (error) {
			console.error("❌ Error making friend:", error);
			alert("Failed to send friend request. Please try again.");
		}
	}

	const logOutUser = () => {
		localStorage.removeItem('token');
		navigate('/')
	}

	return (
		<Box sx={{ 
			display: 'flex', 
			alignItems: 'center', 
			gap: 2, 
			padding: 2 
		}}>
			<Avatar alt="chat-logo" src="/assets/chat-logo.png" />
			
			<ButtonGroup variant="text" sx={{ flexGrow: 1 }}>
				<Button onClick={() => navigate('/home')} sx={{color : '#008c6f'}}>
					Home
				</Button>
				<Button onClick={() => navigate('/about')} sx={{color : '#008c6f'}}>
					About
				</Button>
				<Button onClick={() => navigate('/help')} sx={{color : '#008c6f'}}>
					Help
				</Button>
			</ButtonGroup>

			<Box sx={{ position: 'relative', width: '250px', marginRight: '20px' }}>
				<input
					type="text"
					placeholder="Search user..."
					value={userName}
					onChange={(e) => searchUser(e.target.value)}
					onKeyDown={handleKeyPress}
					className="message-input"
					style={{ width: '100%', padding: '8px' }}
				/>
				{(users?.length > 0) && (
					<ul className="suggestion-box">
						{users.map((user, idx) => (
							<li
								key={idx}
								className="suggestion-item"
								onClick={() => {
									setUserName(user.username);
									setUsers([]); // hide suggestions
								}}
							>
								{user.username}
							</li>
						))}
					</ul>
				)}
			</Box>
			
			<button 
				className='request-send'
				onClick={makeUserFriend}
				disabled={!userName.trim()}
				title="Send friend request"
			>
				<Send size={20}/>&nbsp;
			</button>
			
			<Button variant="outlined" color="error" onClick={logOutUser}>
				Logout
			</Button>
			
			<div style={{display : 'flex'}}>
				<Avatar alt="login-user-logo" src={avatarUrl + currentUser?.firstName}/>
				<p>&nbsp;{currentUser?.firstName}</p>
			</div>
		</Box>
	)
}

export default Header;