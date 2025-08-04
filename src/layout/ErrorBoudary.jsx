import React from 'react';
import { Box } from '@mui/material'

class ErrorBoundary extends React.Component {
constructor(props) {
	super(props);
	this.state = { hasError: false };
}

static getDerivedStateFromError(error) {
	return { hasError: true };
}

componentDidCatch(error, errorInfo) {
	console.error('Error caught by boundary:', error, errorInfo);
}

render() {
	if (this.state.hasError) {
	return (
		<Box className='center-container'>
			<div style={{border : '2px solid #e2e2e2', borderRadius : '15px', margin : '10px', padding : '10px'}}>
				<h1>Something went wrong.</h1>
			</div>
			
		</Box>
		);
	}

	return this.props.children;
}
}

export default ErrorBoundary;