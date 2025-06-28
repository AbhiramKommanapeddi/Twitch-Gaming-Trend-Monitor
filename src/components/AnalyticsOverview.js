import React from 'react';
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

const AnalyticsOverview = () => {
  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['analyticsOverview'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/overview');
      if (!response.ok) throw new Error('Failed to fetch analytics overview');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="h-48 bg-gray-700 rounded"></div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="h-48 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const viewerTrendData = {
    labels: overviewData?.viewerTrend?.map(d => new Date(d.timestamp).toLocaleDateString()) || [],
    datasets: [{
      label: 'Total Viewers',
      data: overviewData?.viewerTrend?.map(d => d.viewers) || [],
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      tension: 0.4,
    }]
  };

  const topGamesData = {
    labels: overviewData?.topGames?.map(g => g.name) || [],
    datasets: [{
      label: 'Viewers',
      data: overviewData?.topGames?.map(g => g.viewers) || [],
      backgroundColor: [
        'rgba(147, 51, 234, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: { 
        ticks: { color: '#9CA3AF', maxTicksLimit: 6 },
        grid: { color: '#374151' }
      },
      y: { 
        ticks: { color: '#9CA3AF' },
        grid: { color: '#374151' }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Total Viewers</p>
              <p className="text-xl font-bold text-white">
                {overviewData?.totalViewers?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Live Streams</p>
              <p className="text-xl font-bold text-white">
                {overviewData?.liveStreams?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 011 1v1a2 2 0 114 0V4z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Games</p>
              <p className="text-xl font-bold text-white">
                {overviewData?.totalGames?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Growth</p>
              <p className="text-xl font-bold text-white">
                {overviewData?.growthRate > 0 ? '+' : ''}{overviewData?.growthRate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viewer Trend */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Viewer Trend (7 days)</h3>
          <div className="h-48">
            <Line data={viewerTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Top Games */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Games Today</h3>
          <div className="h-48">
            <Bar data={topGamesData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {overviewData?.recentActivity?.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 py-2 border-b border-gray-700 last:border-b-0">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'new_game' ? 'bg-green-500' :
                activity.type === 'trending' ? 'bg-yellow-500' :
                activity.type === 'peak' ? 'bg-red-500' : 'bg-blue-500'
              }`}></div>
              <span className="text-gray-300 flex-1">{activity.message}</span>
              <span className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )) || []}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
