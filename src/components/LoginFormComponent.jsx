import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Grid, Stack, TextField, Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import { connect } from '../service/websocket.service';
import { getLoginUser } from '../service/user.service';

const FormComponent = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const backEndUrl = process.env.REACT_APP_CHAT_URL;

    const [open, setOpen] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ severity: 'info', message: '' });

    const handleLogin = (e) => {
        e.preventDefault();
        loginUser().then(() => {
            console.log(localStorage.getItem('token'));
            if (localStorage.getItem('token') != null) {
                setAlertInfo({ severity: 'success', message: 'Login Successful' });
                navigate('/home');
            } else {
                setAlertInfo({ severity: 'error', message: 'Invalid username or password' });
            }
            setOpen(true);
        });
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    };

    const loginUser = async () => {
        const url = `${backEndUrl}/auth/login`;
        console.log("Url : ", url);
        try {
            const response = await axios.post(url, {username, password});
            const token = response.data?.token;
            if (response.status === 200) {
                localStorage.setItem('token', token);
            }
            const user = await getLoginUser(token, navigate);
            await connect(user.username);
			console.log("Connected successfully")
        } catch (error) {
            console.error('Error sending api call', error.response?.data || error.message)
        }
    }

    return (
        <div>
        <Box
            className="container"
            component="form"
            onSubmit={handleLogin}
            autoComplete="off"
            sx={{
            display: 'grid',
            gridTemplateColumns: { sm: '1fr' },
            gap: 4,
            width: '400px',
            padding: '30px',
            backgroundColor: '#e2e2e2',
            borderRadius: '30px',
            }}
        >
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{vertical: 'top', horizontal: 'right'}}>
                <Alert
                    onClose={handleClose}
                    severity={alertInfo.severity}
                    sx={{ width: '100%' }}
                    >
                    {alertInfo.message}
                </Alert>
            </Snackbar>
            <Stack spacing={2}>
            <h1 style={{ textAlign: 'center', fontSize: '50px', color: 'gray' }}>
                Login
            </h1>
            <hr />
            <TextField
                required
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
                required
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <a href="https://google.com">Forget Password?</a>
            <div></div>
            <Button variant="contained" color="success" size="large" type="submit">
                Login
            </Button>
            <p style={{ textAlign: 'center' }}>
                Don't have an account? <a href="https://google.com">Sign Up</a>
            </p>
            </Stack>
        </Box>
        </div>
    );
};

export default FormComponent;
