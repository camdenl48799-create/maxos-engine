import test from "node:test";
import assert from "node:assert/strict";
import { validateModManifest } from "../engine/mod-loader.js";

test("valid mod manifest normalizes metadata and song entries", () => {
  const mod = validateModManifest({
    format: "maxos-mod",
    apiVersion: 1,
    id: "sample-pack",
    name: "Sample Pack",
    version: "1.0.0",
    songs: [{ id: "sample-song", title: "Sample Song", chart: "charts/sample.json", audio: "audio/sample.ogg" }]
  });
  assert.equal(mod.id, "sample-pack");
  assert.equal(mod.songs.length, 1);
  assert.equal(mod.songs[0].audio, "audio/sample.ogg");
});

test("mod manifest rejects unsafe paths and unsupported versions", () => {
  assert.throws(() => validateModManifest({
    format: "maxos-mod", apiVersion: 1, id: "sample-pack", name: "Sample",
    songs: [{ id: "sample-song", title: "Sample", chart: "../outside.json" }]
  }), /unsafe chart path/);
  assert.throws(() => validateModManifest({
    format: "maxos-mod", apiVersion: 99, id: "sample-pack", name: "Sample", songs: []
  }), /Unsupported mod manifest/);
});
