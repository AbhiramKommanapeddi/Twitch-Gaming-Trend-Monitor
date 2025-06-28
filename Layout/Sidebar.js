import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  TvIcon,
  Cog6ToothIcon,
  FireIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: HomeIcon,
      current: location.pathname === '/',
    },
    {
      name: 'Games',
      href: '/games',
      icon: TvIcon,
      current: location.pathname.startsWith('/games'),
    },
    {
      name: 'Streamers',
      href: '/streamers',
      icon: UserGroupIcon,
      current: location.pathname.startsWith('/streamers'),
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      current: location.pathname === '/analytics',
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Cog6ToothIcon,
      current: location.pathname === '/dashboard',
    },
  ];

  const quickActions = [
    {
      name: 'Trending Now',
      href: '/games?filter=trending',
      icon: FireIcon,
      color: 'text-orange-400',
    },
    {
      name: 'Live Streams',
      href: '/streamers?status=live',
      icon: ClockIcon,
      color: 'text-green-400',
    },
    {
      name: 'Growth Analysis',
      href: '/analytics?view=growth',
      icon: ArrowTrendingUpIcon,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="fixed left-0 top-16 bottom-0 w-64 bg-dark-secondary border-r border-gray-800 overflow-y-auto">
      <div className="p-6">
        {/* Main Navigation */}
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-twitch-purple text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <Icon className={`w-5 h-5 ${action.color}`} />
                  <span>{action.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Platform Stats */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Platform Stats
          </h3>
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">2.8M</div>
              <div className="text-xs text-gray-400">Total Viewers</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">95K</div>
              <div className="text-xs text-gray-400">Live Channels</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">847</div>
              <div className="text-xs text-gray-400">Categories</div>
            </div>
          </div>
        </div>

        {/* Trending Games Preview */}
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Trending Games
          </h3>
          <div className="space-y-2">
            {[
              { name: 'League of Legends', viewers: '234K' },
              { name: 'Valorant', viewers: '187K' },
              { name: 'Fortnite', viewers: '156K' },
            ].map((game, index) => (
              <div key={game.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">{game.name}</span>
                </div>
                <span className="text-xs text-gray-400">{game.viewers}</span>
              </div>
            ))}
          </div>
          <Link
            to="/games"
            className="block mt-3 text-sm text-twitch-purple hover:text-twitch-purple-light transition-colors"
          >
            View all games →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
