// Fetches every image of the catalogue and lists the ones that do not come back as an image.
// Run with: node scripts/check-images.ts
import { readFileSync } from "node:fs";
import type { Card } from "../src/lib/card.ts";

const cards = JSON.parse(readFileSync("src/data/cards.json", "utf8")) as Card[];
const urls = new Map<string, string>(); // url -> first card that uses it
for (const card of cards) {
  for (const url of [card.image, card.splash, ...(card.frames ?? [])]) {
    if (url?.startsWith("http") && !urls.has(url)) urls.set(url, `${card.id} ${card.name}`);
  }
}

// GET rather than HEAD: some hosts answer HEAD with 200 for a file they no longer serve.
async function broken(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: { Range: "bytes=0-0" }, signal: AbortSignal.timeout(20_000) });
    await response.body?.cancel();
    if (!response.ok) return `HTTP ${response.status}`;
    const type = response.headers.get("content-type") ?? "";
    // Browsers still draw a PNG or JPEG sent without its type, but not an SVG.
    if (type.startsWith("image/") || !/\.svg(\?|$)/i.test(url)) return null;
    return `SVG served as ${type || "no type"}`;
  } catch (error) {
    return (error as Error).name;
  }
}

const list = [...urls];
let bad = 0;
for (let i = 0; i < list.length; i += 40) {
  await Promise.all(
    list.slice(i, i + 40).map(async ([url, card]) => {
      const reason = await broken(url);
      if (reason) console.log(`${++bad && reason}\t${card}\t${url}`);
    }),
  );
}
console.log(`${list.length} images checked, ${bad} broken`);
