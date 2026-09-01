import type { Metadata } from "next";
import { fontPrincipal, fontSecundariaRegular, fontSecundariaBold } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bazar da Bia",
  description: "Catálogo do bazar — escolha suas peças e feche sua lista",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${fontPrincipal.variable} ${fontSecundariaRegular.variable} ${fontSecundariaBold.variable}`}
    >
      <body className="bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
