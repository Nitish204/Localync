/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF9F4",
        panel: "#FFFFFF",
        ink: "#15161A",
        subink: "#5B5C63",
        line: "#E5E2D6",
        signal: {
          go: "#1F9D66",
          warn: "#C9860F",
          stop: "#D6432F",
        },
        circuit: {
          DEFAULT: "#3B36D6",
          light: "#5A55EE",
          dark: "#2A26A3",
          tint: "#EEEDFC",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        grid: "linear-gradient(to right, #00000008 1px, transparent 1px), linear-gradient(to bottom, #00000008 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(21,22,26,0.04), 0 8px 24px rgba(21,22,26,0.06)",
      },
    },
  },
  plugins: [],
};
