/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './src/**/*.html',
    './src/**/*.vue',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          muted: 'var(--color-primary-muted)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          active: 'var(--color-secondary-active)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        overlay: {
          DEFAULT: 'var(--color-overlay)',
          transparent: 'var(--color-overlay-transparent)',
        },
        card: {
          rank: {
            red: 'var(--color-card-rank-red)',
            black: 'var(--color-card-rank-black)',
          },
          suit: {
            hearts: 'var(--color-card-suit-hearts)',
            diamonds: 'var(--color-card-suit-diamonds)',
            clubs: 'var(--color-card-suit-clubs)',
            spades: 'var(--color-card-suit-spades)',
          },
        },
        chip: {
          white: 'var(--color-chip-white)',
          red: 'var(--color-chip-red)',
          blue: 'var(--color-chip-blue)',
          green: 'var(--color-chip-green)',
          black: 'var(--color-chip-black)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
        '12': 'var(--space-12)',
        '16': 'var(--space-16)',
        '20': 'var(--space-20)',
        '24': 'var(--space-24)',
        '32': 'var(--space-32)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        overlay: 'var(--shadow-overlay)',
      },
      opacity: {
        '10': 'var(--opacity-10)',
        '20': 'var(--opacity-20)',
        '30': 'var(--opacity-30)',
        '40': 'var(--opacity-40)',
        '50': 'var(--opacity-50)',
        '60': 'var(--opacity-60)',
        '70': 'var(--opacity-70)',
        '80': 'var(--opacity-80)',
        '90': 'var(--opacity-90)',
      },
    },
  },
  plugins: [],
};