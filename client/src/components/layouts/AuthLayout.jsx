import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gray-100 dark:bg-gray-900 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20">
            <circle cx="60" cy="60" r="54" fill="#2DA44E" />
            <path d="M60 18C36.8 18 18 36.8 18 60C18 78.84 30.54 94.8 48 99.54V84C48 80.69 50.69 78 54 78H66C69.31 78 72 80.69 72 84V99.54C89.46 94.8 102 78.84 102 60C102 36.8 83.2 18 60 18Z" fill="#0D1117"/>
            <path d="M39 45C39 41.69 41.69 39 45 39H75C78.31 39 81 41.69 81 45V60C81 63.31 78.31 66 75 66H45C41.69 66 39 63.31 39 60V45Z" fill="white"/>
            <rect x="45" y="48" width="6" height="9" fill="#0D1117"/>
            <rect x="57" y="48" width="6" height="9" fill="#0D1117"/>
            <rect x="69" y="48" width="6" height="9" fill="#0D1117"/>
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Gitty-Gitty-Git-Er
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
