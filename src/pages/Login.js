import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTwitchLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Redirect to Twitch OAuth
      window.location.href = '/api/auth/twitch';
    } catch (err) {
      setError('Failed to initiate login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {/* Logo */}
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-purple-600 rounded-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Welcome to TwitchTrend Monitor
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Track gaming trends and streamer analytics
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              onClick={handleTwitchLogin}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg className="h-5 w-5 text-purple-300 group-hover:text-purple-200" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428C1.714 21.114 2.6 22 3.714 22h16.572c1.114 0 2-0.886 2-2V4.286L18 0zm14.286 20H3.714V5.714h16.572z"/>
                  </svg>
                )}
              </span>
              {isLoading ? 'Connecting...' : 'Continue with Twitch'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              By signing in, you agree to our{' '}
              <a href="#" className="font-medium text-purple-400 hover:text-purple-300">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium text-purple-400 hover:text-purple-300">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-12">
          <h3 className="text-lg font-medium text-white text-center mb-6">
            What you'll get access to:
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-white font-medium">Real-time Gaming Trends</p>
                <p className="text-gray-400 text-sm">Track what games are trending on Twitch</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-white font-medium">Streamer Analytics</p>
                <p className="text-gray-400 text-sm">Analyze viewer patterns and growth metrics</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-white font-medium">Personalized Dashboard</p>
                <p className="text-gray-400 text-sm">Custom insights based on your preferences</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-white font-medium">Growth Insights</p>
                <p className="text-gray-400 text-sm">Understand what drives viewership and engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
