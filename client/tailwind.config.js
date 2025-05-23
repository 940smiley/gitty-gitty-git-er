/** [@type](https://github.com/type "View User on GitHub") {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        github: {
          green: '#2da44e',
          darkgreen: '#1a7f37',
          lightgreen: '#46c55a',
          dark: '#0d1117',
          darkgray: '#161b22',
          gray: '#24292f',
          lightgray: '#f6f8fa',
        },
      },
    },
  },
  plugins: [],
}