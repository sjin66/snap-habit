/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Success / Done
        success: {
          DEFAULT: '#4CAF50',
          50: '#F0FBF0',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#4CAF50',
          600: '#16A34A',
          700: '#15803D',
        },
        // Warning (streak fire)
        warning: {
          DEFAULT: '#FF9800',
          50: '#FFF8E1',
          500: '#FF9800',
          600: '#FB8C00',
        },
        // Danger / Missed
        danger: {
          DEFAULT: '#F44336',
          50: '#FEF2F2',
          500: '#F44336',
        },
        // Light mode surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F2F3F7',
          card: '#FFFFFF',
        },
        // Text
        content: {
          DEFAULT: '#1A1A2E',
          secondary: '#6C757D',
          tertiary: '#9CA3AF',
          inverse: '#FFFFFF',
        },
        // Borders
        border: {
          DEFAULT: '#E9ECEF',
          light: '#F3F4F6',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      fontSize: {
        '2xs': '10px',
      },
    },
  },
  plugins: [],
};
