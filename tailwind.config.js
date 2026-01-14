/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary colors for membership page design
        primary: '#22a598',
        'primary-dark': '#1b8278',
        'background-light': '#fbfaf9',
        'background-dark': '#141f1f',
        'surface-light': '#ffffff',
        'surface-dark': '#1e2e2e',
        'text-main': '#0f1a19',
        'text-muted': '#5e706d',
        // Rotary brand colors (legacy)
        accent: '#D6AD60',  // Rotary Gold
        // Keep legacy colors for backward compatibility
        rotaract: {
          pink: '#ac005a',
          darkpink: '#5a0732',
          white: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0,0,0,0.05)',
        'soft-hover': '0 10px 25px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
