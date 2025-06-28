import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  FireIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  TvIcon,
  ChartBarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import LiveStreamGrid from '../components/LiveStreamGrid';
import TrendingGames from '../components/TrendingGames';
import TopStreamers from '../components/TopStreamers';
import AnalyticsOverview from '../components/AnalyticsOverview';

const Home = () => {
  const [stats, setStats] = useState({
    totalViewers: 0,
    totalStreamers: 0,
    totalGames: 0,
    trendingGames: 0,
  });

  // Fetch platform overview
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/overview');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch top games
  const { data: topGames, isLoading: gamesLoading } = useQuery({
    queryKey: ['games', 'top'],
    queryFn: async () => {
      const response = await axios.get('/api/games/top?limit=10');
      return response.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Fetch top streamers
  const { data: topStreamers, isLoading: streamersLoading } = useQuery({
    queryKey: ['streamers', 'top'],
    queryFn: async () => {
      const response = await axios.get('/api/streamers/top?limit=12');
      return response.data;
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  // Fetch trending alerts
  const { data: alerts } = useQuery({
    queryKey: ['analytics', 'trending-alerts'],
    queryFn: async () => {
      const response = await axios.get('/api/analytics/trending-alerts');
      return response.data;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  useEffect(() => {
    if (overview) {
      setStats({
        totalViewers: overview.totalViewers || 0,
        totalStreamers: overview.totalStreamers || 0,
        totalGames: overview.totalGames || 0,
        trendingGames: overview.trendingGames?.length || 0,
      });
    }
  }, [overview]);

  const statCards = [
    {
      title: 'Total Viewers',
      value: stats.totalViewers.toLocaleString(),
      icon: EyeIcon,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      change: '+5.2%',
      changeColor: 'text-green-400',
    },
    {
      title: 'Live Streamers',
      value: stats.totalStreamers.toLocaleString(),
      icon: UsersIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      change: '+12.8%',
      changeColor: 'text-green-400',
    },
    {
      title: 'Active Games',
      value: stats.totalGames.toLocaleString(),
      icon: TvIcon,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      change: '+2.1%',
      changeColor: 'text-green-400',
    },
    {
      title: 'Trending',
      value: stats.trendingGames.toString(),
      icon: FireIcon,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      change: '+8.7%',
      changeColor: 'text-green-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-twitch-purple to-purple-600 rounded-2xl p-8">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-4">
            Twitch Gaming Trend Monitor
          </h1>
          <p className="text-xl text-purple-100 mb-6 max-w-2xl">
            Track streaming trends, analyze game popularity, and discover viewer behavior patterns in real-time.
          </p>
          <div className="flex space-x-4">
            <Link
              to="/games"
              className="bg-white text-twitch-purple px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Explore Games
            </Link>
            <Link
              to="/analytics"
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-twitch-purple transition-colors"
            >
              View Analytics
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white opacity-5 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-dark-secondary rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm ${stat.changeColor}`}>{stat.change}</span>
                    <span className="text-gray-400 text-sm ml-1">vs last hour</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trending Alerts */}
      {alerts && (alerts.gameAlerts?.length > 0 || alerts.streamerAlerts?.length > 0) && (
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FireIcon className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Trending Now</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.gameAlerts?.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                className="bg-dark-secondary rounded-lg p-4 border border-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-semibold">{alert.Game?.name}</p>
                    <p className="text-gray-400 text-sm">
                      +{alert.growth_rate_hourly?.toFixed(1)}% growth
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Games */}
        <div className="lg:col-span-2 space-y-8">
          {/* Trending Games */}
          <div className="bg-dark-secondary rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <TvIcon className="w-6 h-6 text-purple-400" />
                <span>Trending Games</span>
              </h2>
              <Link
                to="/games"
                className="text-twitch-purple hover:text-twitch-purple-light transition-colors"
              >
                View All
              </Link>
            </div>
            <TrendingGames games={topGames} loading={gamesLoading} />
          </div>

          {/* Live Streams */}
          <div className="bg-dark-secondary rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <EyeIcon className="w-6 h-6 text-green-400" />
                <span>Popular Live Streams</span>
              </h2>
              <Link
                to="/streamers"
                className="text-twitch-purple hover:text-twitch-purple-light transition-colors"
              >
                View All
              </Link>
            </div>
            <LiveStreamGrid streams={topStreamers?.slice(0, 6)} loading={streamersLoading} />
          </div>
        </div>

        {/* Right Column - Sidebar Content */}
        <div className="space-y-8">
          {/* Top Streamers */}
          <div className="bg-dark-secondary rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <UsersIcon className="w-6 h-6 text-blue-400" />
                <span>Top Streamers</span>
              </h2>
              <Link
                to="/streamers"
                className="text-twitch-purple hover:text-twitch-purple-light transition-colors"
              >
                View All
              </Link>
            </div>
            <TopStreamers streamers={topStreamers?.slice(0, 5)} loading={streamersLoading} />
          </div>

          {/* Analytics Preview */}
          <div className="bg-dark-secondary rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <ChartBarIcon className="w-6 h-6 text-orange-400" />
                <span>Analytics</span>
              </h2>
              <Link
                to="/analytics"
                className="text-twitch-purple hover:text-twitch-purple-light transition-colors"
              >
                View All
              </Link>
            </div>
            <AnalyticsOverview data={overview} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
