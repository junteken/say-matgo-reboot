/**
 * Tailwind CSS Configuration
 *
 * Configuration for Tailwind CSS 3.4+ with custom theme extensions.
 *
 * @MX:NOTE: Tailwind config for Korean card game UI
 * @MX:SPEC: SPEC-UI-001
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Korean card game themed colors
        'card-back': '#2c3e50',
        'card-face': '#ecf0f1',
        'highlight': '#f39c12',
        'selected': '#3498db',
        'disabled': '#95a5a6',
      },
      spacing: {
        // Card dimensions
        'card-width': '60px',
        'card-height': '84px',
        'card-width-mobile': '40px',
        'card-height-mobile': '56px',
      },
      animation: {
        // Card animations
        'flip': 'flip 0.6s ease-in-out',
        'deal': 'deal 0.3s ease-out',
        'match': 'match 0.5s ease-in-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        deal: {
          '0%': { transform: 'translateY(-100px) rotate(-10deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
        },
        match: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
}

