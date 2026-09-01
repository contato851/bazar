import localFont from "next/font/local";

export const fontPrincipal = localFont({
  src: "../public/fonts/principal.ttf",
  variable: "--font-principal",
  display: "swap",
});

// Duas famílias separadas (em vez de duas variações de peso da mesma
// família) para não depender do algoritmo de "peso mais próximo" do
// navegador — botões e títulos usam a bold explicitamente, o resto usa a
// regular explicitamente.
export const fontSecundariaRegular = localFont({
  src: "../public/fonts/secundaria regular.otf",
  variable: "--font-secundaria-regular",
  display: "swap",
});

export const fontSecundariaBold = localFont({
  src: "../public/fonts/secundaria bold.otf",
  variable: "--font-secundaria-bold",
  display: "swap",
});
