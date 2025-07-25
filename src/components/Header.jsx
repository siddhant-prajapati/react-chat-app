import React, {useState, useEffect} from 'react';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';
import {Button, ButtonGroup, Box} from '@mui/material';
import { getUserByUsernameKeyword, makeFriend, getLoginUser } from '../service/user.service';
import '../styles/Header.css'
import { Send } from 'lucide-react';

const Header = () => {
	const navigate = useNavigate();
	const [userName, setUserName] = useState('');
	const token = localStorage.getItem('token');
	const [users, setUsers] = useState([]);


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
		
		const selectedUser = await getUserByUsernameKeyword(token ,userName);
		const loginUser = await getLoginUser(token);
		console.log(selectedUser[0])
		console.log(loginUser)
		if (selectedUser?.length === 1) {
			const selectedUserId = selectedUser[0]?.id;
			const loginUserId = loginUser.id;
			const newFriend = await makeFriend(token, selectedUserId, loginUserId);
			console.log(newFriend);
		} else {
			console.log("Enter valid username", userName);
		}
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
		>
			<Send size={20}/>&nbsp;
		</button>
		
		<Button variant="outlined" color="error" onClick={() => navigate('/')}>
			Logout
		</Button>
		</Box>
	)
}

export default Header
