import Link from "next/link";
import { UserMenu } from "./UserMenu";

const PAGES = [
  ["boosters", "/", "Boosters"],
  ["collection", "/collection", "Collection"],
  ["catalogue", "/catalogue", "Catalogue"],
  ["amis", "/amis", "Amis"],
] as const;

// The bar shared by every page: name of the game, the places to go, the account.
export function SiteHeader({ current }: { current: (typeof PAGES)[number][0] }) {
  return (
    <div className="masthead__bar">
      <p className="masthead__mark">WikiMaster LoL</p>
      <nav className="sitenav" aria-label="Navigation principale">
        {PAGES.map(([page, href, label]) => (
          <Link key={page} href={href} aria-current={current === page ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <UserMenu />
    </div>
  );
}
