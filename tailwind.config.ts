import type { Config } from "tailwindcss";

// Tokens de marca (Bia) — os mesmos do painel de guarda-roupa/looks, pra
// manter a identidade visual consistente entre as duas ferramentas dela.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#D6DE01",
        brand: {
          pink: "#FF6684",
          purple: "#742694",
          green: "#013E02",
          indigo: "#25029C",
          orange: "#FF600F",
        },
        "bold-text": "var(--text-bold-color)",
      },
      fontFamily: {
        principal: ["var(--font-principal)", "sans-serif"],
        sans: ["var(--font-secundaria-regular)", "sans-serif"],
        "secundaria-bold": ["var(--font-secundaria-bold)", "sans-serif"],
      },
      // Diretriz de marca: cantos sempre quadrados, sem exceção — sobrescreve
      // toda a escala em vez de deixar exceções por componente.
      borderRadius: {
        none: "0px",
        sm: "0px",
        DEFAULT: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
        full: "0px",
      },
    },
  },
  plugins: [],
};

export default config;
