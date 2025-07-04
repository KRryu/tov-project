import React from 'react';
import { Link } from 'react-router-dom';

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/">
            <img
              className="mx-auto h-12 w-auto"
              src="/assets/images/logo.png"
              alt="TOVmate"
            />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout; 