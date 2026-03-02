// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Ensure all your source files are scanned for classes
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      // Define a custom primary color (Teal/Greenish-Blue) for consistency
      colors: {
        'tivi-primary': '#008080', // A nice, deep teal for the brand
      },
      // You can define custom typography here if needed later
      fontFamily: {
        // 'sans': ['Inter', 'sans-serif'], // Example: Use if you install Inter or another custom font
      },
      // Add custom animations if you want more complex CSS transitions
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        'float-slow': 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};