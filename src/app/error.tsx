"use client"; // Error boundaries must be Client Components

export default function PageError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="forge">
      <header className="masthead">
        <p className="masthead__mark">WikiMaster LoL</p>
        <h1>La forge s&apos;est enrayée</h1>
        <p className="masthead__lede">Quelque chose a cassé de notre côté. Tes cartes ne sont pas touchées.</p>
      </header>
      <p className="empty">
        <button type="button" className="forge__secondary" onClick={() => retry()}>
          Réessayer
        </button>
      </p>
    </main>
  );
}
