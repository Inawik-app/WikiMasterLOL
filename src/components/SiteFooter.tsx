import Link from "next/link";

// Under every page: who owns the art, and where the legal notice lives.
export function SiteFooter() {
  return (
    <footer className="sitefoot">
      <p>
        WikiMaster LoL est un projet de fan, non approuvé par Riot Games. League of Legends et ses illustrations
        appartiennent à Riot Games, Inc.
      </p>
      <Link href="/mentions-legales">Mentions légales et confidentialité</Link>
    </footer>
  );
}
