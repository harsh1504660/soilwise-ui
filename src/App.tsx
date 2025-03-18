
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "sonner";
import Fields from './pages/Fields';
import FieldDetails from './pages/FieldDetails';
import Index from './pages/Index'; // Import the home page
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Index />} /> {/* Set Index as the home page */}
            <Route path="/fields" element={<Fields />} />
            <Route path="/field-details/:id" element={<FieldDetails />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
