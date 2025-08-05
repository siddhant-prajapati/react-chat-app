import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

const HelpContentComponent = () => {
    console.log("Help component")
    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 4 }}>
            <Typography variant="h3" gutterBottom>
                Help & Support
            </Typography>

            <Typography variant="body1" paragraph>
                Welcome to the Chat App help center! Here are some tips to get you started and answers to common questions.
            </Typography>

            <Typography variant="h5" gutterBottom>
                Getting Started
            </Typography>
            <List dense>
                <ListItem>
                    <ListItemText primary="1. Create an account or log in to access your chats." />
                </ListItem>
                <ListItem>
                    <ListItemText primary="2. Use the search feature to find friends by username." />
                </ListItem>
                <ListItem>
                    <ListItemText primary="3. Send real-time messages and receive instant replies." />
                </ListItem>
                <ListItem>
                    <ListItemText primary="4. Manage your friends list to stay connected." />
                </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h5" gutterBottom>
                Common Issues
            </Typography>
            <List dense>
                <ListItem>
                    <ListItemText primary="• If you can’t log in, please check your username and password." />
                </ListItem>
                <ListItem>
                    <ListItemText primary="• For connection problems, ensure you have a stable internet connection." />
                </ListItem>
                <ListItem>
                    <ListItemText primary="• If messages don’t send, try refreshing the page or logging out and back in." />
                </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h5" gutterBottom>
                Contact & Feedback
            </Typography>
            <Typography variant="body1" paragraph>
                If you encounter any issues or have suggestions, feel free to reach out via the contact form or open an issue on our GitHub repository.
            </Typography>
        </Box>
    );
};

export default HelpContentComponent;
