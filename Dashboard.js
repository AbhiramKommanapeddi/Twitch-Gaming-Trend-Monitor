import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const [liveData, setLiveData] = useState({});

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/overview', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    }
  });

  // WebSocket live updates
  useEffect(() => {
    if (socket) {
      socket.on('dashboard-update', (data) => {
        setLiveData(prev => ({ ...prev, ...data }));
      });
    }
  }, [socket]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentStreams = dashboardData?.recentStreams || [];
  const topGames = dashboardData?.topGames || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold">Welcome back, {user?.display_name}!</h1>
        <p className="text-purple-100 mt-2">Here's what's happening with your streams</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Views"
          value={stats.totalViews || 0}
          icon={EyeIcon}
          color="blue"
          trend={stats.viewsTrend}
        />
        <StatCard
          title="Followers"
          value={stats.followers || 0}
          icon={UserGroupIcon}
          color="green"
          trend={stats.followersTrend}
        />
        <StatCard
          title="Stream Hours"
          value={stats.streamHours || 0}
          icon={ClockIcon}
          color="purple"
          trend={stats.hoursTrend}
        />
        <StatCard
          title="Avg Viewers"
          value={stats.avgViewers || 0}
          icon={ChartBarIcon}
          color="orange"
          trend={stats.viewersTrend}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Streams */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Streams</h2>
          <div className="space-y-4">
            {recentStreams.map((stream, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{stream.title}</h3>
                  <p className="text-sm text-gray-500">{stream.game}</p>
                  <p className="text-xs text-gray-400">{new Date(stream.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{stream.viewers}</p>
                  <p className="text-sm text-gray-500">viewers</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Games */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Trending Games</h2>
          <div className="space-y-3">
            {topGames.map((game, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{game.name}</p>
                  <p className="text-sm text-gray-500">{game.viewers} viewers</p>
                </div>
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
            <ChartBarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Analyze Performance</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
            <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Schedule Stream</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
            <ChatBubbleLeftIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Chat Analytics</p>
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
