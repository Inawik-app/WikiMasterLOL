import assert from "node:assert/strict";
import { test } from "node:test";
import { duplicateRule, FIRST_SHINING_RANK, RANKS } from "./upgrades.ts";

test("a duplicate upgrades ranked skins, unlocks chromas, or becomes essence", () => {
  const chromas = [{ id: 1, name: "rubis", colors: ["#f00", "#f00"] }];
  assert.deepEqual(duplicateRule({ type: "skin", name: "Jarvan IV héros de guerre", chromas }), { mode: "rank", cap: 10 });
  assert.deepEqual(duplicateRule({ type: "skin", name: "Annie bête lunaire", chromas }), { mode: "chroma", cap: 1 });
  assert.deepEqual(duplicateRule({ type: "skin", name: "Annie gothique" }), { mode: "essence", cap: 0 });
  assert.deepEqual(duplicateRule({ type: "champion", name: "Annie" }), { mode: "essence", cap: 0 });
});

test("effects start at Émeraude", () => {
  assert.equal(RANKS[FIRST_SHINING_RANK - 1], "Émeraude");
});
