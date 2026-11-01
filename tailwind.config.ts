import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#090b12", panel: "#111522", line: "#252b3b", violet: "#8b5cf6", cyan: "#22d3ee" }, boxShadow: { glow: "0 0 50px rgba(139,92,246,.14)" } } },
  plugins: []
};
export default config;
