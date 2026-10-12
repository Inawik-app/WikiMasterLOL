import type { Metadata } from "next";
import { Barlow_Semi_Condensed, Marcellus } from "next/font/google";
import "./globals.css";

const display = Marcellus({ variable: "--font-marcellus", weight: "400", subsets: ["latin"] });
const sans = Barlow_Semi_Condensed({ variable: "--font-barlow", weight: ["400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WikiMaster LoL",
  description: "Collectionne les cartes de League of Legends : champions, skins, compétences, récits de Runeterra.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
