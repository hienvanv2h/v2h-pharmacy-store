import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // aspectRatio: {
      //   "4/3": "4 / 3",
      //   "16/9": "16 / 9",
      // },
    },
  },
  plugins: [require("@tailwindcss/aspect-ratio")],
};
export default config;
