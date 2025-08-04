import React, { useEffect, useState } from 'react';
import Layout from '../layout/Layout';
import ChatComponent from '../components/ChatComponent';
import { getLoginUser } from '../service/user.service';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
	const [loginUser, setLoginUser] = useState({
		id : 0,
		username : '',
		firstName : '',
		lastName : '',
		active : false
	});

	const navigate = useNavigate();

	useEffect(() => {
		const fetchUser = async () => {
			const token = localStorage.getItem('token');
			const user = await getLoginUser(token, navigate);
			setLoginUser(user);
		};

		fetchUser();
	}, [])

	return(
		<Layout>
		<ChatComponent loginUser={loginUser}/>
		</Layout>
	);  
}

export default HomePage
