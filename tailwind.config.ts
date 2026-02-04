import type { Config } from "tailwindcss";

const config: Config = {
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
        primary: '#000000',
        accent: '#3B82F6',
        surface: {
          light: '#FFFFFF',
          dark: '#1F2937'
        }
      },
      transitionTimingFunction: {
        'custom-curve': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '300': '0.3s',
      }
    },
  },
  plugins: [],
};
export default config;
