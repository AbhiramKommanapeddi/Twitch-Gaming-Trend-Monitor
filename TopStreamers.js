import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const TopStreamers = ({ limit = 6 }) => {
  const { data: topStreamers, isLoading } = useQuery({
    queryKey: ['topStreamers', limit],
    queryFn: async () => {
      const response = await fetch(`/api/streamers/top?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch top streamers');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
            <div className="h-16 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {topStreamers?.map((streamer) => (
        <Link
          key={streamer.id}
          to={`/streamers/${streamer.id}`}
          className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors group"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative">
              <img
                src={streamer.profileImageUrl || '/placeholder-avatar.jpg'}
                alt={streamer.displayName}
                className="w-12 h-12 rounded-full"
              />
              {streamer.isLive && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-gray-800 animate-pulse"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                {streamer.displayName}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                {streamer.currentGame || 'No Category'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-400">
                {streamer.currentViewers?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-400">viewers</div>
            </div>
          </div>

          {streamer.isLive && streamer.streamTitle && (
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-xs font-bold">LIVE</span>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2">
                {streamer.streamTitle}
              </p>
            </div>
          )}

          {!streamer.isLive && (
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>{streamer.followers?.toLocaleString()} followers</span>
                {streamer.lastStreamedAt && (
                  <span>
                    Last: {new Date(streamer.lastStreamedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </Link>
      )) || []}
    </div>
  );
};

export default TopStreamers;
