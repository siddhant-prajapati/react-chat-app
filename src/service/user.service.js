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

const makeRequest = async ({ url, method = 'GET', token, body, navigate }) => {
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': body ? 'application/json' : undefined,
                Authorization: `Bearer ${token}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (response.ok) {
            return await response.json();
        } else if (response.status === 403) {
            console.warn('403 Forbidden - Redirecting To /');
            navigate('/')
            return;
        } else {
            console.error(`Request failed: ${url}`, response.status, response.statusText);
        }
    } catch (error) {
        console.error(`Network error for ${url}:`, error);
    }
};

// Get logged-in user info
export const getLoginUser = (token, navigate) => {
    const url = `${chatAppBaseUrl}/api/users/login`;
    return makeRequest({ url, token, navigate });
};

// Search users by username keyword
export const getUserByUsernameKeyword = (token, usernameKeyword, navigate) => {
    const url = `${chatAppBaseUrl}/api/users/username/${usernameKeyword}`;
    return makeRequest({ url, token, navigate });
};

// Make a friend connection
export const makeFriend = (token, currentUserId, loginUserId, navigate) => {
    const url = `${chatAppBaseUrl}/api/friends`;
    const body = {
        user: { id: loginUserId },
        friend: { id: currentUserId }
    };
    return makeRequest({ url, method: 'POST', token, body, navigate });
};

// Get friends of a user
export const getFriendsByUserId = (token, userId, navigate) => {
    const url = `${chatAppBaseUrl}/api/friends/${userId}`;
    return makeRequest({ url, token, navigate });
};
