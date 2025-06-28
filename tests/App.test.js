import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Games from '../pages/Games';
import Streamers from '../pages/Streamers';

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

const TestWrapper = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock fetch
global.fetch = jest.fn();

describe('Home Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders home page', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalViewers: 1000000,
        totalStreamers: 50000,
        totalGames: 1000,
        trendingGames: 10
      }),
    });

    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByText(/gaming trends/i)).toBeInTheDocument();
  });
});

describe('Games Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders games page', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          id: '1',
          name: 'Test Game',
          boxArtUrl: 'test-url',
          viewers: 10000
        }
      ]),
    });

    render(
      <TestWrapper>
        <Games />
      </TestWrapper>
    );

    expect(screen.getByText(/games/i)).toBeInTheDocument();
  });
});

describe('Streamers Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders streamers page', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          id: '1',
          displayName: 'Test Streamer',
          currentViewers: 5000,
          isLive: true
        }
      ]),
    });

    render(
      <TestWrapper>
        <Streamers />
      </TestWrapper>
    );

    expect(screen.getByText(/streamers/i)).toBeInTheDocument();
  });
});
