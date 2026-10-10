export const LANES = ["LEFT", "DOWN", "UP", "RIGHT"];
export const KEY_CODES = [
  ["ArrowLeft", "KeyA"],
  ["ArrowDown", "KeyS"],
  ["ArrowUp", "KeyW"],
  ["ArrowRight", "KeyD"]
];

export class GameplaySession {
  constructor(chart, onUpdate = () => {}) {
    this.chart = chart;
    this.onUpdate = onUpdate;
    this.reset();
  }

  reset() {
    this.notes = this.chart.notes.map((note, id) => ({ ...note, id, judged: false, judgment: "", wasHit: false }));
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.health = 1;
    this.lastJudgment = "";
    this.lastJudgmentAt = 0;
    this.finished = false;
    this.onUpdate(this);
  }

  update(timeMs) {
    if (this.finished) return;
    const offsetTime = timeMs + (this.chart.offset || 0);
    for (const note of this.notes) {
      if (note.judged || note.side !== "player") continue;
      if (offsetTime - note.time > 160) this.miss(note, offsetTime);
    }
    if (this.health <= 0) this.finished = true;
    this.onUpdate(this);
  }

  press(lane, timeMs) {
    if (this.finished) return;
    const now = timeMs + (this.chart.offset || 0);
    const note = this.notes
      .filter(n => !n.judged && n.side === "player" && n.lane === lane && Math.abs(n.time - now) <= 160)
      .sort((a,b) => Math.abs(a.time-now)-Math.abs(b.time-now))[0];
    if (!note) return;
    const delta = Math.abs(note.time - now);
    const grade = delta <= 45 ? "SICK" : delta <= 90 ? "GOOD" : delta <= 135 ? "BAD" : "SHIT";
    const points = grade === "SICK" ? 350 : grade === "GOOD" ? 200 : grade === "BAD" ? 100 : 50;
    note.judged = true;
    note.wasHit = true;
    note.judgment = grade;
    this.hitCount++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += points + Math.min(this.combo, 100) * 5;
    this.health = Math.min(1, this.health + (grade === "SICK" ? 0.025 : 0.012));
    this.lastJudgment = grade;
    this.lastJudgmentAt = performance.now();
    this.onUpdate(this);
  }

  miss(note, now) {
    note.judged = true;
    note.judgment = "MISS";
    this.missCount++;
    this.combo = 0;
    this.score = Math.max(0, this.score - 10);
    this.health = Math.max(0, this.health - 0.085);
    this.lastJudgment = "MISS";
    this.lastJudgmentAt = performance.now();
  }

  get accuracy() {
    const total = this.hitCount + this.missCount;
    if (!total) return 100;
    // Weighted judgement detail can be expanded without changing chart data.
    return Math.max(0, 100 * this.hitCount / total);
  }

  get rating() {
    if (this.hitCount + this.missCount === 0) return "—";
    const acc = this.accuracy;
    return acc >= 95 ? "S" : acc >= 90 ? "A" : acc >= 80 ? "B" : acc >= 70 ? "C" : "D";
  }

  get playerNotesRemaining() {
    return this.notes.some(n => n.side === "player" && !n.judged);
  }
}
