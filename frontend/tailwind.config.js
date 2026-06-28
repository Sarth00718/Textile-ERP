/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Industrial palette: deep steel-navy primary, amber for active/running states,
        // muted slate for surfaces. Chosen to read as factory-floor instrumentation
        // rather than a generic SaaS dashboard.
        steel: {
          50: '#f4f6f8', 100: '#e3e8ed', 200: '#c3ccd6', 300: '#9aa7b5',
          400: '#6f8092', 500: '#52647a', 600: '#3f4f63', 700: '#33404f',
          800: '#28323d', 900: '#1c242c', 950: '#11161b',
        },
        amber: {
          50: '#fff8e6', 100: '#ffecb3', 200: '#ffe085', 300: '#ffd24d',
          400: '#ffc31f', 500: '#f5ab00', 600: '#cc8e00', 700: '#a37100',
          800: '#7a5500', 900: '#523900',
        },
        signal: {
          run: '#2f9e5c', idle: '#ada85f', down: '#c4453b', maint: '#3f7fbf',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
