import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./HomePage'));
const AboutPage = React.lazy(() => import('./AboutPage'));
const HelpPage = React.lazy(() => import('./HelpPage'));
const LoginPage = React.lazy(() => import('./LoginPage'));

// Loading component
const LoadingSpinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="200px">
    <div>Loading...</div>
  </Box>
);

const RootPage = () => (
  <Box>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
    </Suspense>
  </Box>
);

export default RootPage;