import type { Config } from 'tailwindcss'

// Визуальное направление: «Lab Instrument» (тёмная приборная панель ML-стенда).
// Палитра и гарнитуры заданы как CSS-переменные в src/renderer/src/styles/tokens.css,
// здесь они только маппятся в утилиты Tailwind.
export default {
  content: ['./app/src/renderer/index.html', './app/src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        line: 'var(--line)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        warn: 'var(--warn)',
        danger: 'var(--danger)'
      },
      fontFamily: {
        mono: 'var(--font-mono)',
        sans: 'var(--font-sans)'
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)'
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px var(--accent-dim), 0 0 18px -6px var(--accent)'
      }
    }
  },
  plugins: []
} satisfies Config
