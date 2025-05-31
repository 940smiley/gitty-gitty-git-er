import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Check if link is active
  const isActive = (path) => {
    return location.pathname === path ? 'bg-green-700 text-white' : 'text-white hover:bg-green-700 hover:text-white';
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-green-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-white font-bold text-xl">
                  Gitty-Gitty-Git-Er
                </Link>
              </div>
              
              {/* Desktop navigation */}
              <nav className="hidden md:ml-6 md:flex md:space-x-4">
                <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}>
                  Dashboard
                </Link>
                <Link to="/repositories" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/repositories')}`}>
                  Repositories
                </Link>
                <Link to="/repositories/new" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/repositories/new')}`}>
                  New Repository
                </Link>
                <Link to="/pull-requests" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/pull-requests')}`}>
                  Pull Requests
                </Link>
                <Link to="/settings" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/settings')}`}>
                  Settings
                </Link>
              </nav>
            </div>
            
            {/* User menu */}
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  {user && (
                    <>
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.avatar_url}
                        alt={user.login}
                      />
                      <span className="ml-2 text-white hidden md:block">{user.login}</span>
                      <button
                        onClick={logout}
                        className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Mobile menu button */}
              <div className="flex md:hidden ml-3">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-green-700 focus:outline-none"
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/repositories"
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/repositories')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Repositories
              </Link>
              <Link
                to="/pull-requests"
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/pull-requests')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pull Requests
              </Link>
              <Link
                to="/settings"
                className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/settings')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
            </div>
          </div>
        )}
      </header>
      
      {/* Main content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
            Gitty-Gitty-Git-Er &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
