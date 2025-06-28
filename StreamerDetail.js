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
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useWebSocket } from '../contexts/WebSocketContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StreamerDetail = () => {
  const { streamerId } = useParams();
  const { socket } = useWebSocket();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [realTimeData, setRealTimeData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const { data: streamerDetail, isLoading, error } = useQuery({
    queryKey: ['streamerDetail', streamerId],
    queryFn: async () => {
      const response = await fetch(`/api/streamers/${streamerId}`);
      if (!response.ok) throw new Error('Failed to fetch streamer details');
      return response.json();
    }
  });

  const { data: streamerStats } = useQuery({
    queryKey: ['streamerStats', streamerId, selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/streamers/${streamerId}/stats?timeRange=${selectedTimeRange}`);
      if (!response.ok) throw new Error('Failed to fetch streamer stats');
      return response.json();
    }
  });

  const { data: recentStreams } = useQuery({
    queryKey: ['recentStreams', streamerId],
    queryFn: async () => {
      const response = await fetch(`/api/streamers/${streamerId}/streams`);
      if (!response.ok) throw new Error('Failed to fetch recent streams');
      return response.json();
    }
  });

  const { data: topClips } = useQuery({
    queryKey: ['topClips', streamerId],
    queryFn: async () => {
      const response = await fetch(`/api/streamers/${streamerId}/clips`);
      if (!response.ok) throw new Error('Failed to fetch top clips');
      return response.json();
    }
  });

  useEffect(() => {
    if (socket) {
      socket.emit('subscribeToStreamer', streamerId);
      
      socket.on('streamerUpdate', (data) => {
        if (data.streamerId === streamerId) {
          setRealTimeData(data);
        }
      });

      return () => {
        socket.emit('unsubscribeFromStreamer', streamerId);
        socket.off('streamerUpdate');
      };
    }
  }, [socket, streamerId]);

  const handleFollow = async () => {
    try {
      const response = await fetch(`/api/streamers/${streamerId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Error following streamer:', error);
    }
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
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Streamer</h2>
          <p className="text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  const viewerChartData = {
    labels: streamerStats?.viewerHistory?.map(d => new Date(d.timestamp).toLocaleDateString()) || [],
    datasets: [{
      label: 'Average Viewers',
      data: streamerStats?.viewerHistory?.map(d => d.avgViewers) || [],
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      tension: 0.4,
    }]
  };

  const hoursStreamedData = {
    labels: streamerStats?.streamHours?.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'Hours Streamed',
      data: streamerStats?.streamHours?.map(d => d.hours) || [],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
    }]
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Streamer Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-6">
            <img
              src={streamerDetail?.profileImageUrl || '/placeholder-avatar.jpg'}
              alt={streamerDetail?.displayName}
              className="w-32 h-32 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-4xl font-bold text-white">{streamerDetail?.displayName}</h1>
                {realTimeData?.isLive || streamerDetail?.isLive ? (
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    LIVE
                  </span>
                ) : (
                  <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm">
                    OFFLINE
                  </span>
                )}
              </div>
              
              <p className="text-gray-400 mb-4">{streamerDetail?.description}</p>
              
              {/* Live Stream Info */}
              {(realTimeData?.isLive || streamerDetail?.isLive) && (
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {realTimeData?.streamTitle || streamerDetail?.streamTitle}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <span>Playing: {realTimeData?.currentGame || streamerDetail?.currentGame}</span>
                    <span>•</span>
                    <span>{realTimeData?.viewers || streamerDetail?.currentViewers} viewers</span>
                    <span>•</span>
                    <span>Started: {new Date(streamerDetail?.streamStartedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-6 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {streamerDetail?.followers?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-400">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {realTimeData?.viewers || streamerDetail?.currentViewers || 0}
                  </div>
                  <div className="text-sm text-gray-400">Current Viewers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {streamerStats?.avgViewers || 0}
                  </div>
                  <div className="text-sm text-gray-400">Avg Viewers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {streamerStats?.totalHoursStreamed || 0}
                  </div>
                  <div className="text-sm text-gray-400">Hours Streamed</div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isFollowing
                      ? 'bg-gray-600 text-white hover:bg-gray-500'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                {(realTimeData?.isLive || streamerDetail?.isLive) && (
                  <a
                    href={`https://twitch.tv/${streamerDetail?.loginName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Watch on Twitch
                  </a>
                )}
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

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Viewer Trend */}
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

          {/* Hours Streamed */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Hours Streamed</h3>
            <div className="h-64">
              <Bar 
                data={hoursStreamedData}
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
        </div>

        {/* Recent Streams and Top Clips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Streams */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recent Streams</h3>
            <div className="space-y-4">
              {recentStreams?.map((stream) => (
                <div key={stream.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white truncate">{stream.title}</h4>
                    <span className="text-sm text-gray-400">
                      {new Date(stream.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>{stream.gameName}</span>
                    <div className="flex space-x-4">
                      <span>{stream.avgViewers} avg viewers</span>
                      <span>{stream.duration}h</span>
                    </div>
                  </div>
                </div>
              )) || []}
            </div>
          </div>

          {/* Top Clips */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Top Clips</h3>
            <div className="space-y-4">
              {topClips?.map((clip) => (
                <div key={clip.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.title}
                      className="w-16 h-9 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm mb-1 line-clamp-2">
                        {clip.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{clip.views} views</span>
                        <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) || []}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamerDetail;
