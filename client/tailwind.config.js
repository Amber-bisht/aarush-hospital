/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#fffdfd',
          text: '#111111',
          muted: '#6b7280',
          soft: '#f7f7fb',
          accent: '#ff2e88',
          accentSoft: '#ffe2ee',
          border: '#f1f1f5',
          black: '#18181b',
        },
      },
      boxShadow: {
        soft: '0 24px 60px rgba(17, 17, 17, 0.08)',
        card: '0 10px 30px rgba(17, 17, 17, 0.06)',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        glow: 'radial-gradient(circle at top left, rgba(255, 46, 136, 0.12), transparent 32%), radial-gradient(circle at top right, rgba(17, 17, 17, 0.04), transparent 24%)',
      },
    },
  },
  plugins: [],
};
