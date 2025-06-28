import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  UserGroupIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const Games = () => {
  const [sortBy, setSortBy] = useState('viewers');
  const [filterBy, setFilterBy] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  // Fetch games data
  const { data: gamesData, isLoading } = useQuery({
    queryKey: ['games', sortBy, filterBy, timeRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        sort: sortBy,
        filter: filterBy,
        timeRange
      });
      const response = await fetch(`/api/games?${params}`);
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const games = gamesData?.games || [];
  const stats = gamesData?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Game Trends</h1>
            <p className="text-gray-600 mt-2">Track game popularity and viewer migration patterns</p>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="viewers">Most Viewers</option>
              <option value="growth">Fastest Growing</option>
              <option value="streams">Most Streams</option>
              <option value="new">Newest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <EyeIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Viewers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(stats.totalViewers || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Streamers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(stats.activeStreamers || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Trending Games</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.trendingGames || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FunnelIcon className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Categories</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalCategories || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Popular Games</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => (
              <GameCard key={game.id} game={game} rank={index + 1} />
            ))}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            'Action',
            'Strategy',
            'RPG',
            'Sports',
            'Racing',
            'Simulation',
            'Puzzle',
            'Fighting',
            'Adventure',
            'Horror',
            'Shooter',
            'Platformer'
          ].map((category) => (
            <button
              key={category}
              onClick={() => setFilterBy(category.toLowerCase())}
              className={`p-3 text-sm font-medium rounded-lg transition-colors ${
                filterBy === category.toLowerCase()
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const GameCard = ({ game, rank }) => {
  const trendIcon = game.trend > 0 ? ArrowUpIcon : ArrowDownIcon;
  const trendColor = game.trend > 0 ? 'text-green-500' : 'text-red-500';

  return (
    <Link
      to={`/games/${game.id}`}
      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {rank}
          </div>
          {game.imageUrl && (
            <img
              src={game.imageUrl}
              alt={game.name}
              className="w-12 h-16 object-cover rounded"
            />
          )}
        </div>
        <div className={`flex items-center space-x-1 ${trendColor}`}>
          {React.createElement(trendIcon, { className: 'w-4 h-4' })}
          <span className="text-sm font-medium">{Math.abs(game.trend)}%</span>
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{game.name}</h3>
      
      <div className="space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Viewers:</span>
          <span className="font-medium">{game.viewers?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Streamers:</span>
          <span className="font-medium">{game.streamers?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Category:</span>
          <span className="font-medium">{game.category}</span>
        </div>
      </div>
      
      {game.tags && (
        <div className="flex flex-wrap gap-1 mt-3">
          {game.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};

export default Games;
