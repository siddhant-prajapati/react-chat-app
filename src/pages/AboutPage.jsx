import React, { useEffect, useState } from 'react';
import Layout from '../layout/Layout';
import { getFriendsByUserId } from '../service/user.service'; 
import { getMessageBetweenTwoUsers } from '../service/message.service';

const AboutPage = () => {
	const [friends, setFriends] = useState([]);
	const [messages, setMessages] = useState([]);

	useEffect(() => {
		const getFriends = async () => {
			const token = localStorage.getItem('token');
			const response = await getFriendsByUserId(token, 1); 
			setFriends(response);
		};
		getFriends();
	}, []);

	useEffect(() => {
		const getMessages = async () => {
			const token = localStorage.getItem('token');
			const response = await getMessageBetweenTwoUsers(token, 3, 2);
			setMessages(response);
		}
		getMessages();
		console.log(messages)
	}, [messages])



  return (
    <Layout>
		<h1>About Page</h1>
		<p>Friends List</p>
		<ul>
			{friends.map((friend, index) => {
				return(
					<ol key={index}>
						<li>{friend.firstName}</li>
						<li>{friend.lastName}</li>
						<li>{friend.username}</li>
					</ol>
				)
			})}
		</ul>
		<p>Hi {friends.length === 0 ? 'No friends yet.' : friends.map(f => f.username).join(', ')}</p>
			Is this print
		<ul>
			{messages.map((message, index) => {
				return(
					<ol key={index}>
						<li>{message.message}</li>
						<li>{message.sender}</li>
						<li>{message.receiver}</li>
						<li>{message.sendTime}</li>
					</ol>)
			})}
		</ul>
    </Layout>
  );
};

export default AboutPage;
