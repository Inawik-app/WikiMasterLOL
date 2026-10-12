import assert from "node:assert/strict";
import { test } from "node:test";
import { championRarity, check, skinRarity } from "./build-cards.ts";

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

test("check rejects duplicate ids and broken cards", () => {
  const card = { id: "a", type: "skin", name: "A", rarity: "common", image: "https://x/a.jpg" } as const;
  check([card]);
  assert.throws(() => check([card, card]));
  assert.throws(() => check([{ ...card, image: "" }]));
});
