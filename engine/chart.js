export const CHART_VERSION = 1;

export function makeDemoChart() {
  const notes = [];
  // A deterministic 110 BPM practice chart: no random notes.
  const beat = 60000 / 110;
  const pattern = [
    [0,0],[1,1],[2,2],[3,3],[4,0],[4.5,2],[5,1],[6,3],
    [7,2],[8,0],[8.5,1],[9,3],[10,2],[11,0],[12,1],[12.5,3],
    [13,2],[14,0],[15,1],[16,3],[16.5,2],[17,0],[18,1],[19,3],
    [20,2],[21,0],[22,3],[23,1],[24,0],[24.5,2],[25,1],[26,3],
    [27,2],[28,0],[29,3],[30,1],[31,2],[32,0],[32.5,1],[33,3],
    [34,2],[35,0],[36,1],[37,3],[38,2],[39,0],[40,3],[41,1],
    [42,2],[43,0],[44,1],[45,3],[46,2],[47,0],[48,1],[48.5,3],
    [49,2],[50,0],[51,1],[52,3],[53,2],[54,0],[55,1],[56,3],
    [57,2],[58,0],[59,3],[60,1],[61,2],[62,0],[63,1],[64,3]
  ];
  for (const [beatNumber, lane] of pattern) {
    notes.push({ time: Math.round(1500 + beatNumber * beat), lane, side: "player", type: "tap", sustain: 0 });
  }
  for (const [beatNumber, lane] of [[2,1],[6,0],[10,3],[14,2],[18,1],[22,0],[26,3],[30,2],[34,1],[38,0],[42,3],[46,2],[50,1],[54,0],[58,3],[62,2]]) {
    notes.push({ time: Math.round(1500 + beatNumber * beat), lane, side: "opponent", type: "tap", sustain: 0 });
  }
  return { version: CHART_VERSION, song: "Maxos Practice", bpm: 110, offset: 0, notes: notes.sort((a,b) => a.time-b.time) };
}

export function validateChart(input) {
  if (!input || typeof input !== "object" || !Array.isArray(input.notes)) {
    throw new Error("Chart must be a JSON object containing a notes array.");
  }
  const bpm = Number(input.bpm ?? 100);
  if (!Number.isFinite(bpm) || bpm <= 0 || bpm > 500) throw new Error("BPM must be between 1 and 500.");
  const notes = input.notes.map((raw, index) => {
    const time = Number(raw.time);
    const lane = Number(raw.lane);
    const side = raw.side === "opponent" ? "opponent" : "player";
    if (!Number.isFinite(time) || time < 0) throw new Error("Note " + (index + 1) + " has an invalid time.");
    if (!Number.isInteger(lane) || lane < 0 || lane > 3) throw new Error("Note " + (index + 1) + " lane must be 0, 1, 2, or 3.");
    const sustain = Math.max(0, Number(raw.sustain) || 0);
    return { time: Math.round(time), lane, side, type: String(raw.type || "tap"), sustain };
  }).sort((a,b) => a.time-b.time);
  return {
    version: CHART_VERSION,
    song: String(input.song || "Untitled Song").slice(0,100),
    bpm,
    offset: Number.isFinite(Number(input.offset)) ? Number(input.offset) : 0,
    notes
  };
}

export function downloadChart(chart) {
  const blob = new Blob([JSON.stringify(chart, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (chart.song || "maxos-chart").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".json";
  a.click();
  URL.revokeObjectURL(url);
}
