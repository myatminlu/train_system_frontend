/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'train-blue': '#0066CC',
        'train-green': '#00AA44',
        'train-orange': '#FF6600',
        'train-purple': '#9966CC',
        'train-red': '#DD3333',
      }
    }
  }
}