import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-twitch-purple mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-primary">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-9V6a2 2 0 00-2-2H8a2 2 0 00-2 2v2M4 12h16"
              />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
            <p className="text-gray-400 mb-6">
              You need to be logged in to access this page. Please log in with your Twitch account to continue.
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/api/auth/twitch'}
              className="w-full bg-twitch-purple hover:bg-twitch-purple-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
              </svg>
              <span>Login with Twitch</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Go Back Home
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              By logging in, you agree to our{' '}
              <a href="/terms" className="text-twitch-purple hover:text-twitch-purple-light">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-twitch-purple hover:text-twitch-purple-light">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
