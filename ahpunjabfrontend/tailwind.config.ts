import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Safe area spacing
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      },
      // Safe area heights
      height: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'screen-safe': 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
      },
      // Safe area minimum heights
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
      },
      // Your app colors - FIXED
      colors: {
        'ah': {
          'yellow': '#E9BE28',
          'yellow-dark': '#c9a01f',
        },
        // Alternative flat structure
        'ah-yellow': '#E9BE28',
        'ah-yellow-dark': '#c9a01f',
      }
    },
  },
} satisfies Config