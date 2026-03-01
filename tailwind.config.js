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
        background:          { DEFAULT: '#FFFFFF',  dark: '#0A0A0A' },
        foreground:          { DEFAULT: '#0A0A0A',  dark: '#FAFAFA' },
        card:                { DEFAULT: '#FFFFFF',  dark: '#0A0A0A', foreground: '#0A0A0A', 'foreground-dark': '#FAFAFA' },
        primary:             { DEFAULT: '#171717',  dark: '#FAFAFA', foreground: '#FAFAFA', 'foreground-dark': '#171717' },
        secondary:           { DEFAULT: '#F5F5F5',  dark: '#262626', foreground: '#171717', 'foreground-dark': '#FAFAFA' },
        muted:               { DEFAULT: '#F5F5F5',  dark: '#262626', foreground: '#737373', 'foreground-dark': '#A3A3A3' },
        accent:              { DEFAULT: '#F5F5F5',  dark: '#262626', foreground: '#171717', 'foreground-dark': '#FAFAFA' },
        destructive:         { DEFAULT: '#EF4444',  dark: '#7F1D1D', foreground: '#FAFAFA' },
        border:              { DEFAULT: '#E5E5E5',  dark: '#262626' },
        input:               { DEFAULT: '#E5E5E5',  dark: '#262626' },
        ring:                { DEFAULT: '#0A0A0A',  dark: '#D4D4D4' },
        chart: {
          1: '#E8723A', 2: '#2A9D8F', 3: '#264653', 4: '#E9C46A', 5: '#F4A261',
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
