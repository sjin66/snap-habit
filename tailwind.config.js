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
        background:          { DEFAULT: '#FFFFFF',  dark: '#111111' },
        foreground:          { DEFAULT: '#111111',  dark: '#FAFAFA' },
        card:                { DEFAULT: '#F5F5F5',  dark: '#1F1F1F', foreground: '#111111', 'foreground-dark': '#FAFAFA' },
        primary:             { DEFAULT: '#141414',  dark: '#EBEBEB', foreground: '#FAFAFA', 'foreground-dark': '#1F1F1F' },
        secondary:           { DEFAULT: '#F5F5F5',  dark: '#2F2F2F', foreground: '#141414', 'foreground-dark': '#FAFAFA' },
        muted:               { DEFAULT: '#F5F5F5',  dark: '#2F2F2F', foreground: '#8E8E8E', 'foreground-dark': '#B4B4B4' },
        accent:              { DEFAULT: '#F5F5F5',  dark: '#2F2F2F', foreground: '#141414', 'foreground-dark': '#FAFAFA' },
        destructive:         { DEFAULT: '#DC2626',  dark: '#EF4444', foreground: '#FAFAFA', 'foreground-dark': '#FAFAFA' },
        border:              { DEFAULT: '#EBEBEB',  dark: '#2D2D2D' },
        input:               { DEFAULT: '#EBEBEB',  dark: '#3B3B3B' },
        ring:                { DEFAULT: '#B4B4B4',  dark: '#8E8E8E' },
        chart: {
          1: { DEFAULT: '#F97316', dark: '#6366F1' },
          2: { DEFAULT: '#14B8A6', dark: '#22C55E' },
          3: { DEFAULT: '#334155', dark: '#F59E0B' },
          4: { DEFAULT: '#EAB308', dark: '#A855F7' },
          5: { DEFAULT: '#F59E0B', dark: '#EF4444' },
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
