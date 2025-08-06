import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLoginUser } from '../service/user.service';
import Layout from '../layout/Layout';
import ChatComponent from '../components/ChatComponent';

const HomePage = () => {
	const [loginUser, setLoginUser] = useState({
		id : 0,
		username : '',
		firstName : '',
		lastName : '',
		active : false
	});

	// Add state to trigger friend list refresh
	const [refreshFriends, setRefreshFriends] = useState(0);

	const navigate = useNavigate();

	useEffect(() => {
		const fetchUser = async () => {
			const token = localStorage.getItem('token');
			const user = await getLoginUser(token, navigate);
			setLoginUser(user);
		};

		fetchUser();
	}, []);

	// Function to trigger friend list refresh
	const triggerFriendRefresh = () => {
		console.log("📋 Triggering friend list refresh...");
		setRefreshFriends(prev => prev + 1);
	};

	return (
		<Layout 
			loginUser={loginUser} 
			onFriendAdded={triggerFriendRefresh}
		>
			<ChatComponent 
				loginUser={loginUser}
				refreshTrigger={refreshFriends}
			/>
		</Layout>
	);  
}

export default HomePage;