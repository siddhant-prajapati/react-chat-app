const chatAppBaseUrl = process.env.REACT_APP_CHAT_URL;

export const users = [
    {
    "name": "Siddhant",
    "number": "5948209376",
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    "lastSeen": "online",
    "messages": [
    { text: "Hey! How are you doing?", timestamp: "10:30 AM", sent: false },
    { text: "I'm good! Just working on some React projects", timestamp: "10:32 AM", sent: true },
    { text: "That sounds great! Need any help?", timestamp: "10:35 AM", sent: false },
    { text: "Actually yes, I'm stuck with state management", timestamp: "10:36 AM", sent: true },
    { text: "No worries, let me know what specific issue you're facing", timestamp: "10:40 AM", sent: false }
    ]
},
{
    "name": "Ajay",
    "number": "1234556678",
    "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    "lastSeen": "last seen 2 hours ago",
    "messages": [
    { text: "Good morning!", timestamp: "9:00 AM", sent: false },
    { text: "Morning! Ready for the meeting?", timestamp: "9:05 AM", sent: true },
    { text: "Yes, I'll be there in 10 minutes", timestamp: "9:06 AM", sent: false },
    { text: "Perfect! See you soon", timestamp: "9:07 AM", sent: true }
    ]
}
];

export const getLoginUser = async (token) => {
try {
    const url = chatAppBaseUrl + '/api/users/login';
    const response = await fetch(url, {
    method: 'GET',
    headers: {
        Authorization: `Bearer ${token}`,
    },
    });

    if (response.ok) { // response.status in 200-299
    const data = await response.json();
    return data;
    } else {
    console.log('Unable to get login User', response.status, response.statusText);
    }
} catch (error) {
    console.error('Get login User api not working:', error);
}
};


export const getUserByUsernameKeyword = async (token, usernameKeyword) => {
try {
    const url = `${chatAppBaseUrl}/api/users/username/${usernameKeyword}`;
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
    console.log('Unable to get Users by username keyword', response.status, response.statusText);
    }
} catch (error) {
    console.error('Get Users by username keyword api not working:', error);
}
};


export const makeFriend = async (token, currentUserId, loginUserId) => {
    const friend = {
        user: { id: loginUserId },
        friend: { id: currentUserId }
    };

    try {
        const url = `${chatAppBaseUrl}/api/friends`;
        const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // important!
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(friend), // ✅ send as JSON string
        });

        console.log("Create friend response:", response);

        if (response.ok) {
        const data = await response.json();
        return data;
        } else {
        console.log('Unable to create friend', response.status, response.statusText);
        }
    } catch (error) {
        console.error('makeFriend API error:', error);
    }
};



export const getFriendsByUserId = async (token, userId) => {
    try {
        const url = `${chatAppBaseUrl}/api/friends/${userId}`;
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
            console.log('Unable to get friends of login User', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Get Friends User api not working:', error);
    }
}


    