import type { Config } from 'tailwindcss'

/**
 * 设计令牌统一走 CSS 变量，配合 `hsl(var(--x) / <alpha-value>)`
 * 让 `bg-accent/10` 这类透明度修饰符可以正常工作。
 *
 * 原来的写法是 `bg-[hsl(var(--accent))/10]` —— 透明度写在方括号内部，
 * 生成的 CSS 是 `hsl(var(--accent))/10`，属于非法值，浏览器直接丢弃。
 * 全站那些「淡淡的主题色背景」其实一直没生效。
 */
const withOpacity = (variable: string) => `hsl(var(${variable}) / <alpha-value>)`

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: withOpacity('--border'),
        input: withOpacity('--input'),
        ring: withOpacity('--ring'),
        background: withOpacity('--background'),
        foreground: withOpacity('--foreground'),
        surface: withOpacity('--surface'),
        muted: {
          DEFAULT: withOpacity('--muted'),
          foreground: withOpacity('--muted-foreground'),
        },
        card: {
          DEFAULT: withOpacity('--card'),
          foreground: withOpacity('--card-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('--accent'),
          foreground: withOpacity('--accent-foreground'),
          subtle: withOpacity('--accent-subtle'),
        },
        destructive: {
          DEFAULT: withOpacity('--destructive'),
          foreground: withOpacity('--destructive-foreground'),
        },
        success: withOpacity('--success'),
        warning: withOpacity('--warning'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 2px 0 hsl(var(--shadow-color) / 0.04), 0 8px 24px -8px hsl(var(--shadow-color) / 0.10)',
        lift: '0 2px 4px -1px hsl(var(--shadow-color) / 0.06), 0 16px 40px -12px hsl(var(--shadow-color) / 0.18)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        shimmer: 'shimmer 1.6s infinite',
      },
      typography: () => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'hsl(var(--foreground) / 0.88)',
            '--tw-prose-headings': 'hsl(var(--foreground))',
            '--tw-prose-lead': 'hsl(var(--muted-foreground))',
            '--tw-prose-links': 'hsl(var(--accent))',
            '--tw-prose-bold': 'hsl(var(--foreground))',
            '--tw-prose-counters': 'hsl(var(--muted-foreground))',
            '--tw-prose-bullets': 'hsl(var(--muted-foreground) / 0.5)',
            '--tw-prose-hr': 'hsl(var(--border))',
            '--tw-prose-quotes': 'hsl(var(--muted-foreground))',
            '--tw-prose-quote-borders': 'hsl(var(--accent) / 0.4)',
            '--tw-prose-captions': 'hsl(var(--muted-foreground))',
            '--tw-prose-code': 'hsl(var(--foreground))',
            '--tw-prose-pre-code': 'hsl(var(--pre-foreground))',
            '--tw-prose-pre-bg': 'hsl(var(--pre-background))',
            '--tw-prose-th-borders': 'hsl(var(--border))',
            '--tw-prose-td-borders': 'hsl(var(--border))',
            maxWidth: 'none',
            a: { textDecorationThickness: '1px', textUnderlineOffset: '3px' },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            code: {
              fontWeight: '500',
              fontSize: '0.875em',
              borderRadius: '0.375rem',
              padding: '0.15rem 0.4rem',
              background: 'hsl(var(--muted))',
              border: '1px solid hsl(var(--border))',
            },
            'pre code': {
              background: 'transparent',
              border: 'none',
              padding: '0',
              fontWeight: '400',
            },
            pre: {
              borderRadius: '0.875rem',
              border: '1px solid hsl(var(--border))',
              padding: '1.1rem 1.25rem',
              fontSize: '0.875rem',
              lineHeight: '1.7',
            },
            blockquote: {
              fontStyle: 'normal',
              fontWeight: '400',
              borderLeftWidth: '3px',
              paddingLeft: '1.1rem',
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:last-of-type::after': { content: 'none' },
            img: { borderRadius: '0.875rem', margin: '1.5rem auto' },
            hr: { marginTop: '2.5rem', marginBottom: '2.5rem' },
            table: { fontSize: '0.9em' },
            th: { fontWeight: '600' },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
