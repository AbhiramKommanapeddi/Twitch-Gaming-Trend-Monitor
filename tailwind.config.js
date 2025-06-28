module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        twitch: {
          purple: '#9146ff',
          'purple-dark': '#772ce8',
          'purple-light': '#a970ff',
        },
        dark: {
          primary: '#0f0f23',
          secondary: '#1a1a2e',
          tertiary: '#16213e',
        },
        gaming: {
          blue: '#4facfe',
          pink: '#f5576c',
          green: '#00ff88',
          orange: '#ffa726',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'loading': 'loading 1.5s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(145, 70, 255, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(145, 70, 255, 0.6)',
          },
        },
        'slide-up': {
          from: {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        loading: {
          '0%': {
            backgroundPosition: '200% 0',
          },
          '100%': {
            backgroundPosition: '-200% 0',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
