import assert from "node:assert/strict";
import { test } from "node:test";
import type { Card } from "../src/lib/card.ts";
import { championRarity, check, decodeEntities, distinctNames, playerRarity, skinRarity, songRarity, teamRarity } from "./build-cards.ts";

test("skin rarity adds up Riot tier, availability and age", () => {
  assert.equal(skinRarity(12001, "kNoRarity", { availability: "Limited", release: "2009-06-13" }), "ultimate"); // Black Alistar
  assert.equal(skinRarity(1, "kNoRarity", { availability: "Available", release: "2022-01-01" }), "common");
  assert.equal(skinRarity(1, "kNoRarity", { availability: "Available", release: "2013-01-01" }), "rare");
  assert.equal(skinRarity(1, "kEpic", { availability: "Available", release: "2022-01-01" }), "uncommon");
  assert.equal(skinRarity(1, "kEpic", { availability: "Legacy", release: "2018-01-01" }), "epic");
  assert.equal(skinRarity(1, "kNoRarity", { availability: "Legacy", release: "2010-01-01" }), "legendary");
  // Mythic only for Riot's mythic tier or skins that can never be obtained again.
  assert.equal(skinRarity(1, "kLegendary", { availability: "Legacy", release: "2012-01-01" }), "legendary");
  assert.equal(skinRarity(1, "kMythic", { availability: "Rare", release: "2022-01-01" }), "mythic");
  assert.equal(skinRarity(1, "kNoRarity", { availability: "Limited", release: "2009-01-01" }), "mythic");
  // Riot's top tiers ignore age and availability.
  assert.equal(skinRarity(1, "kUltimate", { availability: "Available", release: "2022-01-01" }), "ultimate");
  assert.equal(skinRarity(1, "kExalted"), "transcendent");
  // Unknown to the availability source, or unknown release date: Riot tier alone.
  assert.equal(skinRarity(1, "kLegendary"), "epic");
  assert.equal(skinRarity(1, "kNoRarity", { availability: "Available", release: "0000-00-00" }), "common");
});

test("most picked champions are the rarest", () => {
  assert.equal(championRarity(0, 100), "rare");
  assert.equal(championRarity(30, 100), "uncommon");
  assert.equal(championRarity(99, 100), "common");
});

test("teams rank by titles, then by the level of their league", () => {
  assert.equal(teamRarity("T1", "LCK"), "transcendent");
  assert.equal(teamRarity("Fnatic", "LEC"), "ultimate");
  assert.equal(teamRarity("G2 Esports", "LEC"), "epic");
  assert.equal(teamRarity("Solary", "La Ligue Française"), "rare");
  assert.equal(teamRarity("Some Team", "Liga Portuguesa"), "uncommon");
});

test("players rank by league, hand-picked names above", () => {
  assert.equal(playerRarity("Faker", "LCK"), "transcendent");
  assert.equal(playerRarity("Caps", "LEC"), "ultimate");
  assert.equal(playerRarity("Caliste", "LEC"), "mythic");
  // A hand-picked name also counts in a recognised regional league.
  assert.equal(playerRarity("Saken", "La Ligue Française"), "legendary");
  assert.equal(playerRarity("Someone", "LEC"), "rare");
  assert.equal(playerRarity("Someone", "La Ligue Française"), "uncommon");
  assert.equal(playerRarity("Someone", "Liga Portuguesa"), "common");
  // A namesake outside the major leagues is not promoted.
  assert.equal(playerRarity("Faker", "Liga Portuguesa"), "common");
});

test("the most watched anthems are the rarest", () => {
  assert.equal(songRarity(457_000_000), "transcendent");
  assert.equal(songRarity(317_000_000), "ultimate");
  assert.equal(songRarity(157_000_000), "legendary");
  assert.equal(songRarity(36_000_000), "epic");
  assert.equal(songRarity(19_000_000), "rare");
});

test("HTML entities become characters", () => {
  assert.equal(decodeEntities("«&nbsp;Tu ne veux pas l'utiliser&nbsp;?&nbsp;»"), "«\u00a0Tu ne veux pas l'utiliser\u00a0?\u00a0»");
  assert.equal(decodeEntities("caf&eacute; &amp; th&#233; &#x2014; &unknown;"), "café & thé — &unknown;");
});

test("check rejects duplicate ids and broken cards", () => {
  const card = { id: "a", type: "skin", name: "A", rarity: "common", image: "https://x/a.jpg" } as const;
  check([card]);
  assert.throws(() => check([card, card]));
  assert.throws(() => check([{ ...card, image: "" }]));
});

test("namesakes get a tag, the first type keeps the bare name", () => {
  const card = (id: string, type: string, subtitle?: string) =>
    ({ id, type, name: "Annie", rarity: "common", image: "https://x/a.jpg", subtitle }) as Card;
  const names = distinctNames([
    card("1", "champion"),
    card("2", "spell"),
    card("3", "tft", "Unité · Set 3 · coût 2"),
    card("4", "tft", "Unité · Set 14 · coût 4"),
    { ...card("5", "tft"), name: "Seule" },
  ]).map((c) => c.name);
  assert.deepEqual(names, ["Annie", "Annie - Runeterra", "Annie - TFT Set 3", "Annie - TFT Set 14", "Seule"]);
});
