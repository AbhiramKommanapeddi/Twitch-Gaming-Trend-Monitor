import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useWebSocket } from '../contexts/WebSocketContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const GameDetail = () => {
  const { gameId } = useParams();
  const { socket } = useWebSocket();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [realTimeData, setRealTimeData] = useState(null);

  const { data: gameDetail, isLoading, error } = useQuery({
    queryKey: ['gameDetail', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch game details');
      return response.json();
    }
  });

  const { data: gameStats } = useQuery({
    queryKey: ['gameStats', gameId, selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameId}/stats?timeRange=${selectedTimeRange}`);
      if (!response.ok) throw new Error('Failed to fetch game stats');
      return response.json();
    }
  });

  const { data: topStreamers } = useQuery({
    queryKey: ['gameTopStreamers', gameId],
    queryFn: async () => {
      const response = await fetch(`/api/games/${gameId}/streamers`);
      if (!response.ok) throw new Error('Failed to fetch top streamers');
      return response.json();
    }
  });

  useEffect(() => {
    if (socket) {
      socket.emit('subscribeToGame', gameId);
      
      socket.on('gameUpdate', (data) => {
        if (data.gameId === gameId) {
          setRealTimeData(data);
        }
      });

      return () => {
        socket.emit('unsubscribeFromGame', gameId);
        socket.off('gameUpdate');
      };
    }
  }, [socket, gameId]);

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
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Game</h2>
          <p className="text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  const viewerChartData = {
    labels: gameStats?.viewerHistory?.map(d => new Date(d.timestamp).toLocaleDateString()) || [],
    datasets: [{
      label: 'Viewers',
      data: gameStats?.viewerHistory?.map(d => d.viewers) || [],
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      tension: 0.4,
    }]
  };

  const streamersChartData = {
    labels: gameStats?.streamerHistory?.map(d => new Date(d.timestamp).toLocaleDateString()) || [],
    datasets: [{
      label: 'Active Streamers',
      data: gameStats?.streamerHistory?.map(d => d.count) || [],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
    }]
  };

  const categoryDistribution = {
    labels: gameStats?.categories?.map(c => c.name) || [],
    datasets: [{
      data: gameStats?.categories?.map(c => c.percentage) || [],
      backgroundColor: [
        'rgba(147, 51, 234, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
    }]
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Game Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-6">
            <img
              src={gameDetail?.boxArtUrl || '/placeholder-game.jpg'}
              alt={gameDetail?.name}
              className="w-32 h-42 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{gameDetail?.name}</h1>
              <p className="text-gray-400 mb-4">{gameDetail?.description}</p>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {realTimeData?.viewers || gameDetail?.currentViewers || 0}
                  </div>
                  <div className="text-sm text-gray-400">Current Viewers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {realTimeData?.streamers || gameDetail?.activeStreamers || 0}
                  </div>
                  <div className="text-sm text-gray-400">Active Streamers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    #{gameDetail?.rank || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">Twitch Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {gameDetail?.growthRate > 0 ? '+' : ''}{gameDetail?.growthRate || 0}%
                  </div>
                  <div className="text-sm text-gray-400">24h Growth</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Viewer Trend Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Viewer Trend</h3>
            <div className="h-64">
              <Line 
                data={viewerChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { 
                      ticks: { color: '#9CA3AF' },
                      grid: { color: '#374151' }
                    },
                    y: { 
                      ticks: { color: '#9CA3AF' },
                      grid: { color: '#374151' }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Streamers Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Active Streamers</h3>
            <div className="h-64">
              <Bar 
                data={streamersChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { 
                      ticks: { color: '#9CA3AF' },
                      grid: { color: '#374151' }
                    },
                    y: { 
                      ticks: { color: '#9CA3AF' },
                      grid: { color: '#374151' }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Category Distribution</h3>
            <div className="h-64">
              <Doughnut 
                data={categoryDistribution}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { color: '#9CA3AF' }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Peak Hours (UTC)</h3>
            <div className="space-y-4">
              {gameStats?.peakHours?.map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300">{hour.hour}:00</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${hour.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-purple-400 text-sm font-medium">
                      {hour.percentage}%
                    </span>
                  </div>
                </div>
              )) || []}
            </div>
          </div>
        </div>

        {/* Top Streamers */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Top Streamers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topStreamers?.map((streamer) => (
              <div key={streamer.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={streamer.profileImageUrl || '/placeholder-avatar.jpg'}
                    alt={streamer.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{streamer.displayName}</h4>
                    <p className="text-sm text-gray-400">{streamer.followers} followers</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">
                      {streamer.currentViewers}
                    </div>
                    <div className="text-xs text-gray-400">viewers</div>
                  </div>
                </div>
                {streamer.isLive && (
                  <div className="mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-400 text-sm font-medium">LIVE</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1 truncate">
                      {streamer.streamTitle}
                    </p>
                  </div>
                )}
              </div>
            )) || []}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
