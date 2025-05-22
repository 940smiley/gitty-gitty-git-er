import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
// import Repositories from './pages/Repositories';
import RepositoryDetail from './pages/RepositoryDetail';
import PullRequests from './pages/PullRequests';
// import CodeExplorer from './pages/CodeExplorer';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';

// Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? children : null;
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
            {/* <Repositories /> */}
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/repositories/:owner/:repo" element={
        <ProtectedRoute>
          <MainLayout>
            <RepositoryDetail />
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
      
      <Route path="/code/:owner/:repo" element={
        <ProtectedRoute>
          <MainLayout>
            {/* <CodeExplorer /> */}
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
      
      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
