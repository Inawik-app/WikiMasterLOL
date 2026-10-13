import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <main className="forge">
      <header className="masthead">
        <SiteHeader />
        <h1>Page introuvable</h1>
        <p className="masthead__lede">Cette page n&apos;est jamais sortie de la forge, ou elle a été fondue depuis.</p>
      </header>
      <p className="empty">
        <Link href="/" className="forge__secondary">
          Retour aux boosters
        </Link>
      </p>
    </main>
  );
}
