import type { Config } from 'tailwindcss';

/**
 * Every value here is pulled directly from DESIGN_SYSTEM.md — do not add new
 * colors/spacing/fonts ad hoc. If a new pattern is genuinely needed, add it to
 * DESIGN_SYSTEM.md first, then here (see that file's closing note).
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // §2 Color Tokens
        sidebar: {
          bg: '#0F1B2D',
          text: '#AEB9C7',
          'text-active': '#FFFFFF',
        },
        accent: {
          DEFAULT: '#0D9488',
          light: '#CCFBF1',
        },
        canvas: '#F5F7FA',
        card: '#FFFFFF',
        border: '#E5E9F0',
        text: {
          primary: '#1A2332',
          secondary: '#6B7688',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        // §3 Typography
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        caption: ['12px', { lineHeight: '16px' }],
        body: ['14px', { lineHeight: '20px' }],
        'body-lg': ['16px', { lineHeight: '24px' }],
        'card-title': ['20px', { lineHeight: '28px' }],
        'page-title': ['24px', { lineHeight: '32px' }],
        kpi: ['32px', { lineHeight: '40px' }],
      },
      borderRadius: {
        card: '12px',
        button: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04)',
      },
      width: {
        'sidebar-expanded': '240px',
        'sidebar-collapsed': '72px',
      },
    },
  },
  plugins: [],
};
export default config;
