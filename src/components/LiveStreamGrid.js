import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const LiveStreamGrid = ({ limit = 8 }) => {
  const { data: liveStreams, isLoading } = useQuery({
    queryKey: ['liveStreams', limit],
    queryFn: async () => {
      const response = await fetch(`/api/streams/live?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch live streams');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-700"></div>
            <div className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-700 rounded mb-1"></div>
                  <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {liveStreams?.map((stream) => (
        <Link
          key={stream.id}
          to={`/streamers/${stream.streamerId}`}
          className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors group"
        >
          <div className="relative">
            <div className="aspect-video bg-gray-700 relative overflow-hidden">
              <img
                src={stream.thumbnailUrl || '/placeholder-stream.jpg'}
                alt={stream.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Live indicator */}
              <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                LIVE
              </div>
              
              {/* Viewer count */}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                {stream.viewerCount?.toLocaleString() || 0} viewers
              </div>
              
              {/* Duration */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                {stream.duration || '0:00'}
              </div>
            </div>
          </div>

          <div className="p-3">
            <div className="flex items-start space-x-2 mb-2">
              <img
                src={stream.streamer?.profileImageUrl || '/placeholder-avatar.jpg'}
                alt={stream.streamer?.displayName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white text-sm truncate group-hover:text-purple-400 transition-colors">
                  {stream.streamer?.displayName}
                </h3>
                <p className="text-xs text-gray-400 truncate">
                  {stream.gameName || 'No Category'}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-gray-300 line-clamp-2 mb-2">
              {stream.title}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{stream.language?.toUpperCase() || 'EN'}</span>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{stream.tags?.length || 0} tags</span>
              </div>
            </div>
          </div>
        </Link>
      )) || []}
    </div>
  );
};

export default LiveStreamGrid;
