import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Games from './pages/Games';
import GameDetail from './pages/GameDetail';
import Streamers from './pages/Streamers';
import StreamerDetail from './pages/StreamerDetail';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <div className="App min-h-screen bg-dark-primary text-white">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1a1a2e',
                    color: '#ffffff',
                    border: '1px solid rgba(145, 70, 255, 0.3)',
                  },
                }}
              />
              
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="games" element={<Games />} />
                  <Route path="games/:gameId" element={<GameDetail />} />
                  <Route path="streamers" element={<Streamers />} />
                  <Route path="streamers/:streamerId" element={<StreamerDetail />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
