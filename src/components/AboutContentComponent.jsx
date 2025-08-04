import React from 'react';
import { Box, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';

const AboutContentComponent = () => {
    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 4 }}>
            <Typography variant="h3" gutterBottom>
                About This Chat App
            </Typography>

            <Typography variant="body1" paragraph>
                Welcome to <strong>Chat App</strong>, a simple and modern real-time messaging platform built using 
                <strong> React</strong>, <strong>Node.js</strong>, and <strong>Socket.IO</strong>.
            </Typography>

            <Typography variant="body1" paragraph>
                This project was designed as a <strong>learning tool</strong> and a <strong>starter template</strong> 
                for building chat-based applications. It supports:
            </Typography>

            <List dense>
                <ListItem>
                    <ListItemText primary="✅ Real-time messaging" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="✅ User authentication" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="✅ Friend management" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="✅ Responsive and user-friendly UI" />
                </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h5" gutterBottom>
                Technologies Used
            </Typography>

            <List dense>
                <ListItem>
                    <ListItemText primary="Frontend: React, Material UI" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="Backend: Node.js, Express" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="Real-time: Socket.IO" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="Authentication: JWT (JSON Web Tokens)" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="Database: MongoDB (optional)" />
                </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h5" gutterBottom>
                Developer Notes
            </Typography>
            <Typography variant="body1" paragraph>
                This is a sample project created for learning and prototyping purposes. Feel free to clone, fork, 
                or contribute to improve it further!
            </Typography>

            <Typography variant="body2">
                Check out the source code on GitHub if you’re interested in how it works under the hood.
            </Typography>
        </Box>
    );
};

export default AboutContentComponent;
