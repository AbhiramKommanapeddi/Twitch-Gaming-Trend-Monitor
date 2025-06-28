import React, { useState } from 'react';
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

const Analytics = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('viewers');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', selectedTimeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?timeRange=${selectedTimeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  const { data: platformStats } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/platform');
      if (!response.ok) throw new Error('Failed to fetch platform stats');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Chart configurations
  const viewerTrendData = {
    labels: analyticsData?.viewerTrend?.map(d => new Date(d.timestamp).toLocaleDateString()) || [],
    datasets: [{
      label: 'Total Viewers',
      data: analyticsData?.viewerTrend?.map(d => d.viewers) || [],
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      tension: 0.4,
    }]
  };

  const gamePopularityData = {
    labels: analyticsData?.topGames?.map(g => g.name) || [],
    datasets: [{
      label: 'Viewers',
      data: analyticsData?.topGames?.map(g => g.viewers) || [],
      backgroundColor: [
        'rgba(147, 51, 234, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(245, 101, 101, 0.8)',
      ],
    }]
  };

  const languageDistributionData = {
    labels: analyticsData?.languageDistribution?.map(l => l.language) || [],
    datasets: [{
      data: analyticsData?.languageDistribution?.map(l => l.percentage) || [],
      backgroundColor: [
        'rgba(147, 51, 234, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
    }]
  };

  const streamerGrowthData = {
    labels: analyticsData?.streamerGrowth?.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'New Streamers',
      data: analyticsData?.streamerGrowth?.map(d => d.newStreamers) || [],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#9CA3AF' }
      }
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
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Comprehensive insights into Twitch gaming trends</p>
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">Total Viewers</h3>
                <p className="text-2xl font-bold text-purple-400">
                  {platformStats?.totalViewers?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-400">
                  {platformStats?.viewerGrowth > 0 ? '+' : ''}{platformStats?.viewerGrowth || 0}% vs last period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">Active Streamers</h3>
                <p className="text-2xl font-bold text-green-400">
                  {platformStats?.activeStreamers?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-400">
                  {platformStats?.streamerGrowth > 0 ? '+' : ''}{platformStats?.streamerGrowth || 0}% vs last period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 011 1v1a2 2 0 114 0V4z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">Games Tracked</h3>
                <p className="text-2xl font-bold text-blue-400">
                  {platformStats?.gamesTracked?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-400">
                  {platformStats?.newGames || 0} new this period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-white">Peak Concurrent</h3>
                <p className="text-2xl font-bold text-yellow-400">
                  {platformStats?.peakViewers?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-400">
                  {platformStats?.peakTime || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Viewer Trend */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Viewer Trend</h3>
            <div className="h-80">
              <Line data={viewerTrendData} options={chartOptions} />
            </div>
          </div>

          {/* Top Games */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Most Popular Games</h3>
            <div className="h-80">
              <Bar data={gamePopularityData} options={chartOptions} />
            </div>
          </div>

          {/* Language Distribution */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Language Distribution</h3>
            <div className="h-80">
              <Doughnut 
                data={languageDistributionData} 
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

          {/* Streamer Growth */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">New Streamers</h3>
            <div className="h-80">
              <Bar data={streamerGrowthData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Categories */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Top Categories</h3>
            <div className="space-y-3">
              {analyticsData?.topCategories?.map((category, index) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 font-mono text-sm">#{index + 1}</span>
                    <span className="text-white">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-purple-400 font-semibold">
                      {category.viewers?.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">{category.streamers} streamers</div>
                  </div>
                </div>
              )) || []}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Peak Hours (UTC)</h3>
            <div className="space-y-3">
              {analyticsData?.peakHours?.map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300">{hour.hour}:00</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${hour.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-blue-400 text-sm font-medium">
                      {hour.percentage}%
                    </span>
                  </div>
                </div>
              )) || []}
            </div>
          </div>

          {/* Growth Metrics */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Growth Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Viewer Growth</span>
                <span className={`font-semibold ${
                  (analyticsData?.growthMetrics?.viewerGrowth || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(analyticsData?.growthMetrics?.viewerGrowth || 0) >= 0 ? '+' : ''}
                  {analyticsData?.growthMetrics?.viewerGrowth || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Streamer Growth</span>
                <span className={`font-semibold ${
                  (analyticsData?.growthMetrics?.streamerGrowth || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(analyticsData?.growthMetrics?.streamerGrowth || 0) >= 0 ? '+' : ''}
                  {analyticsData?.growthMetrics?.streamerGrowth || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Game Diversity</span>
                <span className="text-blue-400 font-semibold">
                  {analyticsData?.growthMetrics?.gameDiversity || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Engagement Rate</span>
                <span className="text-yellow-400 font-semibold">
                  {analyticsData?.growthMetrics?.engagementRate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
