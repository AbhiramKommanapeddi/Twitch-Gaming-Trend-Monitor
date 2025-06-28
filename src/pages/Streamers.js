import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';

const Streamers = () => {
  const { socket } = useWebSocket();
  const [filters, setFilters] = useState({
    game: '',
    language: '',
    followers: '',
    isLive: null,
    sortBy: 'viewers'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [realTimeUpdates, setRealTimeUpdates] = useState({});

  const { data: streamers, isLoading, error } = useQuery({
    queryKey: ['streamers', filters, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null) {
          params.append(key, value);
        }
      });
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/streamers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch streamers');
      return response.json();
    }
  });

  const { data: games } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const response = await fetch('/api/games');
      if (!response.ok) throw new Error('Failed to fetch games');
      return response.json();
    }
  });

  useEffect(() => {
    if (socket) {
      socket.on('streamerUpdate', (data) => {
        setRealTimeUpdates(prev => ({
          ...prev,
          [data.streamerId]: data
        }));
      });

      return () => {
        socket.off('streamerUpdate');
      };
    }
  }, [socket]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStreamerData = (streamer) => {
    const update = realTimeUpdates[streamer.id];
    return update ? { ...streamer, ...update } : streamer;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Streamers</h2>
          <p className="text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Streamers</h1>
          <p className="text-gray-400">Discover and track your favorite streamers</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Streamers
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Game Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Game
              </label>
              <select
                value={filters.game}
                onChange={(e) => handleFilterChange('game', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Games</option>
                {games?.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Languages</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
              </select>
            </div>

            {/* Live Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.isLive === null ? '' : filters.isLive.toString()}
                onChange={(e) => handleFilterChange('isLive', e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="true">Live</option>
                <option value="false">Offline</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="viewers">Current Viewers</option>
                <option value="followers">Followers</option>
                <option value="name">Name</option>
                <option value="game">Game</option>
                <option value="recent">Recently Streamed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Streamers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {streamers?.map((streamer) => {
            const streamerData = getStreamerData(streamer);
            return (
              <Link
                key={streamer.id}
                to={`/streamers/${streamer.id}`}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors group"
              >
                <div className="relative">
                  {/* Stream Thumbnail or Profile Image */}
                  <div className="aspect-video bg-gray-700 relative">
                    {streamerData.isLive ? (
                      <img
                        src={streamerData.thumbnailUrl || '/placeholder-stream.jpg'}
                        alt={`${streamerData.displayName}'s stream`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={streamerData.profileImageUrl || '/placeholder-avatar.jpg'}
                          alt={streamerData.displayName}
                          className="w-20 h-20 rounded-full"
                        />
                      </div>
                    )}
                    
                    {/* Live Indicator */}
                    {streamerData.isLive && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                        LIVE
                      </div>
                    )}

                    {/* Viewer Count */}
                    {streamerData.isLive && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                        {streamerData.currentViewers || 0} viewers
                      </div>
                    )}
                  </div>

                  {/* Streamer Info */}
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <img
                        src={streamerData.profileImageUrl || '/placeholder-avatar.jpg'}
                        alt={streamerData.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                          {streamerData.displayName}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {streamerData.followers?.toLocaleString() || 0} followers
                        </p>
                      </div>
                    </div>

                    {/* Stream Title */}
                    {streamerData.isLive && streamerData.streamTitle && (
                      <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                        {streamerData.streamTitle}
                      </p>
                    )}

                    {/* Game and Language */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="truncate">
                        {streamerData.currentGame || 'No Category'}
                      </span>
                      {streamerData.language && (
                        <span className="uppercase ml-2">
                          {streamerData.language}
                        </span>
                      )}
                    </div>

                    {/* Last Seen (if offline) */}
                    {!streamerData.isLive && streamerData.lastStreamedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last streamed: {new Date(streamerData.lastStreamedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {streamers?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Streamers Found</h3>
            <p className="text-gray-400">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Streamers;
