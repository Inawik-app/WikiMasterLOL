import type { Metadata } from "next";
import { Barlow_Semi_Condensed, Marcellus } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const display = Marcellus({ variable: "--font-marcellus", weight: "400", subsets: ["latin"] });
const sans = Barlow_Semi_Condensed({ variable: "--font-barlow", weight: ["400", "500", "600"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "WikiMaster LoL", template: "%s · WikiMaster LoL" },
  description: "Collectionne les cartes de League of Legends : champions, skins, compétences, récits de Runeterra.",
  openGraph: {
    title: "WikiMaster LoL",
    description: "Ouvre des boosters de cartes League of Legends et complète ta collection avant tes amis.",
    siteName: "WikiMaster LoL",
    locale: "fr_FR",
    type: "website",
  },
  // A game between friends: no reason to appear in search engines.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable} antialiased`}>
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
