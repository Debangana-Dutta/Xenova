/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f2f7f3',
          100: '#e1ede3',
          200: '#c4dcc8',
          300: '#9dc4a5',
          400: '#74a780',
          500: '#548a62',
          600: '#3f6f4c',
          700: '#33593e',
          800: '#2b4834',
          900: '#243c2c',
        },
        amber: {
          50: '#fdf8ed',
          100: '#faedcf',
          200: '#f4d89b',
          300: '#edbe61',
          400: '#e6a638',
          500: '#dc8d20',
          600: '#c06f18',
          700: '#9f5417',
          800: '#814319',
          900: '#6b3818',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '0.625rem',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in': 'slide-in 0.25s ease-out',
        'slide-in-left': 'slide-in-left 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
