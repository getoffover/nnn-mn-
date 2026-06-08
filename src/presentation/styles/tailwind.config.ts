import type { Config } from 'tailwindcss';
import { semanticTokens } from './semanticTokens';

/**
 * tailwind.config.ts extends Tailwind CSS configuration with semantic tokens
 * for consistent theming and dark/light mode support.
 */
const config: Config = {
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './src/presentation/**/*.tsx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: semanticTokens,
    },
  },
  plugins: [],
};

export default config;