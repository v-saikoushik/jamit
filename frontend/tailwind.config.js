/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Midnight Aurora — original palette (not Spotify)
        jamit: {
          black: '#0b0d12',
          dark: '#12151c',
          card: '#1a1f29',
          hover: '#262d3d',
          // Primary accent (class names kept for compatibility)
          green: '#a855f7',
          'green-hover': '#c084fc',
          muted: '#94a3b8',
          accent: '#22d3ee',
          'accent-muted': '#67e8f9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'jamit-glow': 'radial-gradient(ellipse at top, rgba(168, 85, 247, 0.15), transparent 55%)',
      },
    },
  },
  plugins: [],
};
