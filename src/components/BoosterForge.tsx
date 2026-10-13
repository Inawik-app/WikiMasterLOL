"use client";

import type { User } from "@supabase/supabase-js";
import { type CSSProperties, useCallback, useEffect, useState } from "react";
import { claimSeal, forgeCard, openBooster, type OpenedCard, serverTime } from "@/app/actions";
import { boosterStock, MAX_STOCK } from "@/lib/booster";
import { RARITIES, RARITY_LABEL, type Rarity } from "@/lib/card";
import { isSecret } from "@/lib/forge";
import { nextSealMilestone, PRICE, SEAL_CYCLE, SEAL_STEPS, sealReward, SECRET_RARITIES } from "@/lib/forge";
import { RANKS } from "@/lib/upgrades";
import { createClient } from "@/lib/supabase/client";
import { CardDialog } from "./CardDialog";
import { CardFace, cardClass, cardLabel, type FaceCard } from "./CardFace";
import { Gem, GemDefs } from "./Gem";

type Profile = { booster_anchor: string; essence: number; seal_days: number; seal_claimed_day: number };

const FAILURE: Record<string, string> = {
  "signed-out": "Ta session a expiré. Reconnecte-toi pour continuer.",
  empty: "Plus de booster en réserve. Le prochain arrive bientôt.",
  "not-ready": "Le sceau n'a pas encore atteint ce palier.",
  "not-enough": "Tu n'as pas assez d'essence.",
  complete: "Tu possèdes déjà toutes les cartes de cette rareté.",
  unavailable: "La forge ne répond pas. Réessaie dans un instant.",
};

// What is laid out on the bench, and where it came from.
type Pack = { cards: OpenedCard[]; from: "booster" | "seal" | "forge" };

const count = new Intl.NumberFormat("fr-FR");

// "dans 42 min", "dans moins d'une minute"
function wait(until: Date, now: number) {
  const minutes = Math.ceil((until.getTime() - now) / 60_000);
  return minutes <= 1 ? "dans moins d'une minute" : `dans ${minutes} min`;
}

export function BoosterForge() {
  const [supabase] = useState(createClient);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  // Set after mounting: the clock must not be read while the page is prerendered.
  const [now, setNow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pack, setPack] = useState<Pack | null>(null);
  const [revealed, setRevealed] = useState(0); // how many cards on the bench are face up
  const [zoomed, setZoomed] = useState<FaceCard | null>(null); // the revealed card opened in large
  const [clockLag, setClockLag] = useState(0); // server clock minus this device's clock
  // The light show playing for a rare card just turned over. `key` restarts it for the next one.
  const [burst, setBurst] = useState<{ rarity: Rarity; key: number } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const loadProfile = useCallback(async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("booster_anchor, essence, seal_days, seal_claimed_day")
      .eq("id", user.id)
      .single();
    setUnreachable(Boolean(error));
    if (data) setProfile(data);
  }, [supabase, user]);

  useEffect(() => {
    // Reads the stock from the database once the player is known.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after the request, not during the effect
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    serverTime().then(
      (time) => setClockLag(time - Date.now()),
      () => {}, // without it the device's own clock is used
    );
  }, []);

  // The countdown only needs the minute.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 20_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  if (!supabase) return <p className="empty">Les comptes ne sont pas encore configurés sur cette installation.</p>;
  if (user === undefined) return null;
  if (!user) return <p className="empty">Connecte-toi avec Discord, en haut de la page, pour ouvrir tes boosters.</p>;
  if (unreachable && !profile) {
    return <p className="empty">La réserve de boosters est introuvable. Réessaie dans un instant.</p>;
  }
  if (!profile || now === null) return null;

  const stock = boosterStock(new Date(profile.booster_anchor), new Date(now + clockLag));

  // Turns cards over up to `count`. From legendary up, the rarest one among them gets its light show.
  const reveal = (count: number) => {
    if (!pack) return;
    const best = pack.cards
      .slice(revealed, count)
      .map((opened) => opened.card.rarity)
      .reduce<Rarity | null>((a, b) => (a && RARITIES.indexOf(a) >= RARITIES.indexOf(b) ? a : b), null);
    if (best && isSecret(best)) setBurst({ rarity: best, key: (burst?.key ?? 0) + 1 });
    setRevealed(count);
  };
  // The rarest card face up: it keeps lighting the bench once its show is over.
  const glow = pack?.cards
    .slice(0, revealed)
    .map((opened) => opened.card.rarity)
    .filter(isSecret)
    .sort((a, b) => RARITIES.indexOf(b) - RARITIES.indexOf(a))[0];
  const allRevealed = pack !== null && revealed >= pack.cards.length;
  const benchFree = !pack || allRevealed; // nothing left face down

  // Runs one server action, then lays its cards on the bench.
  const run = async (from: Pack["from"], action: () => Promise<{ ok: true; cards: OpenedCard[] } | { ok: false; reason: string }>) => {
    setBusy(true);
    setMessage(null);
    const result = await action();
    if (result.ok) {
      setPack({ cards: result.cards, from });
      setRevealed(0);
    } else {
      setMessage(FAILURE[result.reason] ?? FAILURE.unavailable);
    }
    await loadProfile();
    setBusy(false);
  };

  const open = () => run("booster", openBooster);
  const claim = () =>
    run("seal", async () => {
      const result = await claimSeal();
      if (!result.ok) return result;
      if (!result.card) {
        // Every card of the rarity is already owned: the reward was paid in essence.
        setMessage(`Tu as déjà toutes les cartes de ce palier : le sceau te donne ${count.format(result.essence)} essence.`);
        return { ok: true, cards: [] };
      }
      return { ok: true, cards: [{ card: result.card, isNew: true, essence: 0 }] };
    });
  const forge = (rarity: Rarity) =>
    run("forge", async () => {
      const result = await forgeCard(rarity);
      return result.ok ? { ok: true, cards: [{ card: result.card, isNew: true, essence: 0 }] } : result;
    });

  const gained = pack?.cards.slice(0, revealed).reduce((sum, c) => sum + c.essence, 0) ?? 0;
  const summary = !pack?.cards.length
    ? null
    : !allRevealed
      ? "Clique sur la carte éclairée pour la retourner."
      : pack.from === "booster"
        ? gained
          ? `Booster terminé. Les doublons t'ont rapporté ${count.format(gained)} essence.`
          : pack.cards.every((c) => c.isNew)
            ? "Booster terminé. Cinq nouvelles cartes pour ta collection."
            : "Booster terminé. Tes doublons ont amélioré des cartes de ta collection."
        : "Une carte de plus dans ta collection.";

  // Forge seal: where the player stands in the current 28-day cycle.
  const milestone = nextSealMilestone(profile.seal_claimed_day);
  const cycleStart = Math.floor(profile.seal_claimed_day / SEAL_CYCLE) * SEAL_CYCLE;
  const dayInCycle = Math.min(profile.seal_days - cycleStart, SEAL_CYCLE);
  const sealReady = milestone <= profile.seal_days;
  const reward = sealReward(milestone);

  return (
    <>
      <GemDefs />
      <section className="stock" aria-label="Réserve de boosters">
        <div className="stock__pips" aria-hidden="true">
          {Array.from({ length: MAX_STOCK }, (_, i) => (
            <span key={i} className="stock__pip" data-full={i < stock.available} />
          ))}
        </div>
        <p className="stock__text">
          <strong>{stock.available}</strong> {stock.available > 1 ? "boosters prêts" : "booster prêt"}
          {stock.nextAt && <span> · le prochain {wait(stock.nextAt, now + clockLag)}</span>}
        </p>
        <p className="stock__essence">
          <strong>{count.format(profile.essence)}</strong> essence
        </p>
      </section>

      {pack && pack.cards.length > 0 && (
        <section className="pack" aria-label="Cartes à retourner">
          {glow && <div className="pack__glow" data-rarity={glow} aria-hidden="true" />}
          <ol className="pack__cards" data-count={pack.cards.length}>
            {pack.cards.map((opened, i) =>
              i < revealed ? (
                <li key={opened.card.id} className="pack__slot" data-rarity={opened.card.rarity}>
                  <button
                    type="button"
                    className={`${cardClass(opened.card)} card--revealed`}
                    data-rarity={opened.card.rarity}
                    aria-label={`${cardLabel(opened.card)}, voir en grand`}
                    onClick={() => setZoomed(opened.card)}
                  >
                    <CardFace card={opened.card} />
                  </button>
                  <p className="pack__note" data-rarity={opened.card.rarity}>
                    <span>{RARITY_LABEL[opened.card.rarity]}</span>
                    {opened.isNew
                      ? "Nouvelle carte"
                      : opened.rank
                        ? `Doublon · rang ${RANKS[opened.rank - 1]}`
                        : opened.chroma
                          ? "Doublon · un chroma à choisir"
                          : `Doublon · +${opened.essence} essence`}
                  </p>
                </li>
              ) : (
                <li key={opened.card.id} className="pack__slot pack__slot--dealt" style={{ "--i": i } as CSSProperties}>
                  <button
                    type="button"
                    className="card card--back"
                    aria-label={`Révéler la carte ${i + 1}`}
                    disabled={i !== revealed}
                    onClick={() => reveal(i + 1)}
                  >
                    <span className="card__art">
                      <svg viewBox="0 0 24 24" className="card__sigil" aria-hidden="true">
                        <polygon points="12,2 20.7,7 20.7,17 12,22 3.3,17 3.3,7" />
                      </svg>
                    </span>
                  </button>
                </li>
              ),
            )}
          </ol>
          <p className="pack__summary" aria-live="polite">
            {summary}
          </p>
        </section>
      )}

      {burst && (
        <>
          {/* Behind the bench: the room goes dark and light pours out of the card. */}
          <div
            key={burst.key}
            className="aura"
            data-rarity={burst.rarity}
            aria-hidden="true"
            onAnimationEnd={(event) => event.target === event.currentTarget && setBurst(null)}
          >
            <span className="aura__rays" />
            <span className="aura__ring" />
            <span className="aura__ring" />
          </div>
          {/* In front of everything: the flash, and the name of the rarity. */}
          <div key={`${burst.key}-front`} className="aura aura--front" data-rarity={burst.rarity} aria-hidden="true">
            <span className="aura__flash" />
            <span className="aura__title">{RARITY_LABEL[burst.rarity]}</span>
          </div>
        </>
      )}

      <CardDialog card={zoomed} onClose={() => setZoomed(null)} />

      <div className="forge__actions">
        {pack && !allRevealed && pack.cards.length > 1 && (
          <button type="button" className="forge__secondary" onClick={() => reveal(pack.cards.length)}>
            Tout révéler
          </button>
        )}
        {benchFree && (
          <button type="button" className="forge__open" disabled={busy || stock.available === 0} onClick={open}>
            {busy ? "La forge chauffe…" : pack ? "Ouvrir un autre booster" : "Ouvrir un booster"}
          </button>
        )}
        {message && <p role="alert">{message}</p>}
      </div>

      <section className="seal" aria-labelledby="seal-title">
        <div className="seal__head">
          <h2 id="seal-title">Sceau de forge</h2>
          <p>
            Jour <strong>{dayInCycle}</strong> sur {SEAL_CYCLE}. Chaque jour où tu ouvres un booster compte, et rien
            ne se perd si tu en manques un.
          </p>
        </div>
        <ol className="seal__track" style={{ "--progress": dayInCycle / SEAL_CYCLE } as CSSProperties}>
          {SEAL_STEPS.map(([day, rarity]) => (
            <li
              key={day}
              data-rarity={rarity}
              data-reached={cycleStart + day <= profile.seal_days}
              style={{ "--at": day / SEAL_CYCLE } as CSSProperties}
            >
              <Gem rarity={rarity} />
              <span>Jour {day}</span>
              <small>{RARITY_LABEL[rarity]}</small>
            </li>
          ))}
        </ol>
        {sealReady ? (
          <button type="button" className="forge__open" disabled={busy || !benchFree} onClick={claim}>
            Récupérer ta carte {RARITY_LABEL[reward].toLowerCase()}
          </button>
        ) : (
          <p className="seal__next">
            Prochaine récompense dans {milestone - profile.seal_days} {milestone - profile.seal_days > 1 ? "jours" : "jour"}{" "}
            : une carte {RARITY_LABEL[reward].toLowerCase()} que tu n&apos;as pas encore.
          </p>
        )}
      </section>

      <section className="shop" aria-labelledby="shop-title">
        <div className="seal__head">
          <h2 id="shop-title">Forger avec l&apos;essence</h2>
          <p>
            L&apos;essence vient des doublons : une carte que tu possèdes déjà t&apos;en rend un peu, d&apos;autant plus
            qu&apos;elle est rare. Deux exceptions : le doublon d&apos;un skin à chromas te donne un chroma à choisir, et
            celui d&apos;un skin « héros de guerre » fait monter son rang.
          </p>
          <p>
            Ici, l&apos;essence forge une carte au hasard dans la rareté choisie, toujours une que tu n&apos;as pas. Les
            cartes moins rares s&apos;achètent une à une depuis le catalogue.
          </p>
        </div>
        <ul className="shop__list">
          {SECRET_RARITIES.map((rarity) => (
            <li key={rarity}>
              <button
                type="button"
                className="shop__item"
                data-rarity={rarity}
                disabled={busy || !benchFree || profile.essence < PRICE[rarity]}
                onClick={() => forge(rarity)}
              >
                <Gem rarity={rarity} />
                <span className="shop__name">{RARITY_LABEL[rarity]}</span>
                <span className="shop__price">{count.format(PRICE[rarity])} essence</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
