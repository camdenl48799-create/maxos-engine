import test from "node:test";
import assert from "node:assert/strict";
import { makeDemoChart, validateChart } from "../engine/chart.js";

test("practice chart is deterministic and contains both sides", () => {
  const a = makeDemoChart();
  const b = makeDemoChart();
  assert.deepEqual(a, b);
  assert.ok(a.notes.some(n => n.side === "player"));
  assert.ok(a.notes.some(n => n.side === "opponent"));
  assert.ok(a.notes.every(n => n.time >= 0 && n.lane >= 0 && n.lane <= 3));
});

test("valid chart fields are normalized and notes sorted", () => {
  const chart = validateChart({
    song: "Test",
    bpm: 120,
    notes: [
      { time: 2000, lane: 2, side: "player" },
      { time: 500, lane: 0, side: "opponent" }
    ]
  });
  assert.equal(chart.song, "Test");
  assert.equal(chart.notes[0].time, 500);
  assert.equal(chart.notes[1].side, "player");
});

test("invalid lane and invalid BPM are rejected", () => {
  assert.throws(() => validateChart({ bpm: 100, notes: [{time: 1, lane: 4}] }), /lane/);
  assert.throws(() => validateChart({ bpm: 0, notes: [] }), /BPM/);
});
