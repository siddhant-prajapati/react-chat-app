export const getMessageByUserId = async (token, userId) => {
    try {
        const url = `${process.env.REACT_APP_CHAT_URL}/api/friends/${userId}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.log('Unable to get messages of user by userId', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Get messages by userId api not working:', error);
    }
}

export const getMessageBetweenTwoUsers = async (token, userId1, userId2) => {
    try {
        const url = `${process.env.REACT_APP_CHAT_URL}/api/messages/users/${userId1}/${userId2}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`response of api`, data);
            return data;
        } else {
            console.log('Unable to get messages between 2 users', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Get messages between 2 users api not working:', error);
    }
}