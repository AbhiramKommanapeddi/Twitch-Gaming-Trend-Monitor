import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  TvIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SignalIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const Header = () => {
  const { user, isAuthenticated, logout, loginWithTwitch } = useAuth();
  const { connected } = useWebSocket();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-secondary border-b border-gray-800">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-twitch-purple to-twitch-purple-dark rounded-lg flex items-center justify-center">
            <TvIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Twitch Gaming Trends
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/'
                ? 'bg-twitch-purple text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span>Home</span>
          </Link>
          
          <Link
            to="/games"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              location.pathname.startsWith('/games')
                ? 'bg-twitch-purple text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <TvIcon className="w-5 h-5" />
            <span>Games</span>
          </Link>

          <Link
            to="/streamers"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              location.pathname.startsWith('/streamers')
                ? 'bg-twitch-purple text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <UserGroupIcon className="w-5 h-5" />
            <span>Streamers</span>
          </Link>

          <Link
            to="/analytics"
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/analytics'
                ? 'bg-twitch-purple text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Analytics</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/dashboard"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-twitch-purple text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Connection status */}
          <div className="flex items-center space-x-2">
            <SignalIcon 
              className={`w-5 h-5 ${
                connected ? 'text-green-400' : 'text-red-400'
              }`} 
            />
            <span className={`text-sm ${
              connected ? 'text-green-400' : 'text-red-400'
            }`}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* User menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.display_name || user.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-gray-400" />
                )}
                <span className="text-white font-medium">
                  {user?.display_name || user?.username}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-tertiary rounded-lg shadow-lg border border-gray-700 py-2 z-10">
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  <div className="border-t border-gray-700 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center space-x-2"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={loginWithTwitch}
              className="bg-twitch-purple hover:bg-twitch-purple-dark text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <TvIcon className="w-5 h-5" />
              <span>Login with Twitch</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
