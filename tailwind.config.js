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
        primary: '#141414',
        'primary-dark': '#169aa6',
        accent: '#EBC85B',
        'rotaract-blue': '#005dAA',
        'background-light': '#f5f5f7',
        'background-dark': '#191919',
        'surface-light': '#ffffff',
        'surface-dark': '#1e1e1e',
        'text-main': '#101817',
        'text-muted': '#5c8a82',
        peach: '#F9C0AF',
        'peach-dark': '#d98c73',
        // Keep legacy colors for backward compatibility
        rotaract: {
          pink: '#ac005a',
          darkpink: '#5a0732',
          white: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Manrope', 'sans-serif'],
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
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 0 4px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
