import type { Config } from "tailwindcss";

const config: Config = {
  // Single light theme. 'class' (not the default 'media') so stray dark:
  // utilities never auto-activate under OS dark preference — no .dark is ever set.
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: '#0F172A', // Slate 900
        accent: {
          DEFAULT: '#6366F1', // Indigo 500
          light: '#818CF8', // Indigo 400
          dark: '#4F46E5',  // Indigo 600
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E293B' // Slate 800
        },
        brand: {
          violet: '#8B5CF6', // Violet 500
          fuchsia: '#D946EF', // Fuchsia 500
        }
      },
      transitionTimingFunction: {
        'custom-curve': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      transitionDuration: {
        '300': '0.3s',
        '400': '0.4s',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      animation: {
        'blob': 'blob 7s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
