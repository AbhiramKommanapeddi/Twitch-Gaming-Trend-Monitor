import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const TrendingGames = ({ limit = 6 }) => {
  const { data: trendingGames, isLoading } = useQuery({
    queryKey: ['trendingGames', limit],
    queryFn: async () => {
      const response = await fetch(`/api/games/trending?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch trending games');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="w-full h-32 bg-gray-700 rounded mb-3"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {trendingGames?.map((game) => (
        <Link
          key={game.id}
          to={`/games/${game.id}`}
          className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors group"
        >
          <div className="relative">
            <img
              src={game.boxArtUrl || '/placeholder-game.jpg'}
              alt={game.name}
              className="w-full h-32 object-cover"
            />
            <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
              #{game.rank}
            </div>
            {game.growthRate && game.growthRate > 0 && (
              <div className="absolute top-2 left-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold">
                +{game.growthRate}%
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
              {game.name}
            </h3>
            <div className="flex justify-between text-sm text-gray-400">
              <span>{game.viewers?.toLocaleString()} viewers</span>
              <span>{game.streamers} streamers</span>
            </div>
            <div className="mt-2 flex items-center">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (game.viewers / 100000) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Link>
      )) || []}
    </div>
  );
};

export default TrendingGames;
