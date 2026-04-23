/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f6efe3',
        ink: '#1f2937',
        brand: {
          50: '#eef7f1',
          100: '#d7ecdf',
          300: '#8bc4a0',
          500: '#367b5b',
          600: '#285f46',
          700: '#1f4c38',
        },
        accent: '#d86f45',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 24px 80px rgba(31, 41, 55, 0.12)',
      },
      backgroundImage: {
        grid:
          'linear-gradient(to right, rgba(31, 41, 55, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(31, 41, 55, 0.06) 1px, transparent 1px)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 700ms ease-out both',
      },
    },
  },
  plugins: [],
};
