/**
 * semanticTokens.ts defines theme tokens for consistent styling across the application.
 * It supports both light and dark modes using CSS variable conventions.
 */
export const semanticTokens = {
  colors: {
    background: {
      DEFAULT: 'hsl(var(--background))',
      dark: 'hsl(var(--background-dark))',
    },
    foreground: {
      DEFAULT: 'hsl(var(--foreground))',
      dark: 'hsl(var(--foreground-dark))',
    },
    primary: {
      DEFAULT: 'hsl(var(--primary))',
      dark: 'hsl(var(--primary-dark))',
    },
    secondary: {
      DEFAULT: 'hsl(var(--secondary))',
      dark: 'hsl(var(--secondary-dark))',
    },
    success: {
      DEFAULT: 'hsl(var(--success))',
      dark: 'hsl(var(--success-dark))',
    },
    error: {
      DEFAULT: 'hsl(var(--error))',
      dark: 'hsl(var(--error-dark))',
    },
    overlay: {
      DEFAULT: 'hsl(var(--overlay))',
      dark: 'hsl(var(--overlay-dark))',
    },
  },
  opacity: {
    overlay: '0.85',
    overlayDark: '0.9',
  },
  spacing: {
    'safe-top': 'env(safe-area-inset-top)',
    'safe-bottom': 'env(safe-area-inset-bottom)',
  },
};

export default semanticTokens;