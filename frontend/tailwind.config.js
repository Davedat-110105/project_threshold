/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:     'var(--c-base)',
        panel:    'var(--c-panel)',
        card:     'var(--c-card)',
        hover:    'var(--c-hover)',
        border:   'var(--c-border)',
        primary:  'var(--c-primary)',
        muted:    'var(--c-muted)',
        accent:   'var(--c-accent)',
        orange:   'var(--c-orange)',
        low:      'var(--c-low)',
        moderate: 'var(--c-moderate)',
        high:     'var(--c-high)',
        critical: 'var(--c-critical)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Playfair Display', 'ui-serif', 'Georgia'],
      },
    },
  },
  plugins: [],
};
