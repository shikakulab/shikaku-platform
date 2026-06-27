import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-noto)", "sans-serif"],
      },
    },
  },
};

export default config;
