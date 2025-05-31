import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-8">
        <circle cx="60" cy="60" r="54" fill="#2DA44E" />
        <path d="M60 18C36.8 18 18 36.8 18 60C18 78.84 30.54 94.8 48 99.54V84C48 80.69 50.69 78 54 78H66C69.31 78 72 80.69 72 84V99.54C89.46 94.8 102 78.84 102 60C102 36.8 83.2 18 60 18Z" fill="#0D1117"/>
        <path d="M39 45C39 41.69 41.69 39 45 39H75C78.31 39 81 41.69 81 45V60C81 63.31 78.31 66 75 66H45C41.69 66 39 63.31 39 60V45Z" fill="white"/>
        <rect x="45" y="48" width="6" height="9" fill="#0D1117"/>
        <rect x="57" y="48" width="6" height="9" fill="#0D1117"/>
        <rect x="69" y="48" width="6" height="9" fill="#0D1117"/>
      </svg>
      
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      
      <Link
        to="/"
        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
