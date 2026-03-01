/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary (near-black in light, near-white in dark)
        primary: {
          DEFAULT: '#171717',
          foreground: '#FAFAFA',
        },
        // Secondary / Muted surfaces
        secondary: {
          DEFAULT: '#F5F5F5',
          foreground: '#171717',
        },
        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#737373',
        },
        // Accent
        accent: {
          DEFAULT: '#F5F5F5',
          foreground: '#171717',
        },
        // Destructive (keeps red for danger/delete)
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FAFAFA',
        },
        // Surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F5F5',
          card: '#FFFFFF',
        },
        // Text
        content: {
          DEFAULT: '#0A0A0A',
          secondary: '#737373',
          tertiary: '#A3A3A3',
          inverse: '#FAFAFA',
        },
        // Borders
        border: {
          DEFAULT: '#E5E5E5',
          light: '#F5F5F5',
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
