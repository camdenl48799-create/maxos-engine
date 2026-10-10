import test from "node:test";
import assert from "node:assert/strict";
import { GameplaySession } from "../engine/gameplay.js";

const chart = {
  song: "Test",
  bpm: 120,
  offset: 0,
  notes: [
    { time: 1000, lane: 0, side: "player", type: "tap", sustain: 0 },
    { time: 2000, lane: 1, side: "player", type: "tap", sustain: 0 }
  ]
};

test("pressing a lane inside the timing window hits the nearest note", () => {
  const game = new GameplaySession(chart);
  game.press(0, 1010);
  assert.equal(game.hitCount, 1);
  assert.equal(game.missCount, 0);
  assert.equal(game.combo, 1);
  assert.equal(game.notes[0].judgment, "SICK");
});

test("notes outside the miss window count as misses", () => {
  const game = new GameplaySession(chart);
  game.update(1161);
  assert.equal(game.missCount, 1);
  assert.equal(game.combo, 0);
  assert.equal(game.notes[0].judgment, "MISS");
});

test("pressing the wrong lane does not consume a note", () => {
  const game = new GameplaySession(chart);
  game.press(3, 1000);
  assert.equal(game.hitCount, 0);
  assert.equal(game.notes[0].judged, false);
});
