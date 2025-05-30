import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext';
import './App.css';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Repositories from './pages/repositories';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Debug from './pages/Debug'; // Fixed import case
import PullRequests from './pages/PullRequests';
import Settings from './pages/Settings';
import NewRepository from './pages/NewRepository'; // Import NewRepository component

// Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return !isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute>
          <AuthLayout>
            <Login />
          </AuthLayout>
        </PublicRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/repositories" element={
        <ProtectedRoute>
          <MainLayout>
            <Repositories />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Add New Repository route */}
      <Route path="/repositories/new" element={
        <ProtectedRoute>
          <MainLayout>
            <NewRepository />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/pull-requests" element={
        <ProtectedRoute>
          <MainLayout>
            <PullRequests />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Debug route */}
      <Route path="/debug" element={
        <ProtectedRoute>
          <MainLayout>
            <Debug />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;