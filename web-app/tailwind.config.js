/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lol: {
          blue: '#005a82',      // Summoner's Blue
          blueLight: '#00a3e0', // Bright Blue accent
          red: '#c8aa6e',       // Fallback to gold or red
          redDark: '#8c1a1a',   // Summoner's Red dark
          redLight: '#ff4655',  // SUMMONERS RED
          gold: '#c8aa6e',      // Hextech Gold
          goldDark: '#785a28',  // Dark Gold
          goldLight: '#f0e6d2', // Light Gold / Ivory
          obsidian: '#010a13',  // Obsidian Dark background
          greyDark: '#091420',  // Deep grey-blue client bg
          greyLight: '#1e282d', // Medium grey client accent
          border: '#3c3c41',    // Hextech border color
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        hextech: '0 0 10px rgba(200, 170, 110, 0.3)',
        hextechGlow: '0 0 20px rgba(200, 170, 110, 0.6)',
        blueGlow: '0 0 20px rgba(0, 163, 224, 0.4)',
        redGlow: '0 0 20px rgba(255, 70, 85, 0.4)',
      }
    },
  },
  plugins: [],
}
