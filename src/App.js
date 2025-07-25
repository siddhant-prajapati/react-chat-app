import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import RootPage from './pages/RootPage';
import ErrorBoundary from './layout/ErrorBoudary';

function App() {
	return (
		<div className="App">
			<BrowserRouter>
				<ErrorBoundary>
					<RootPage />
				</ErrorBoundary>
			</BrowserRouter>
		</div>
	);
}

export default App;
