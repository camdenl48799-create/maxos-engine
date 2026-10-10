const COLORS = ["#48dfff", "#a1ff78", "#ff6ab0", "#c4a0ff"];
const WIDTH = 1000;
const HEIGHT = 600;
const LEFT = 92;
const LANE_W = 78;
const GAP = 8;
const TOP = 70;
const RECEPTOR_Y = 470;
const PIXELS_PER_SECOND = 360;

export class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = WIDTH;
    this.height = HEIGHT;
    this.activeLanes = new Set();
  }

  draw(session, timeMs, state = "playing") {
    const g = this.ctx;
    const w = this.width, h = this.height;
    g.clearRect(0, 0, w, h);
    const bg = g.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,"#20223b");
    bg.addColorStop(1,"#0b0c15");
    g.fillStyle = bg; g.fillRect(0,0,w,h);
    g.strokeStyle = "#ffffff0a";
    for (let x=0;x<w;x+=40) { g.beginPath(); g.moveTo(x,0); g.lineTo(x,h); g.stroke(); }
    this.drawCharacterBackdrop(g, timeMs);

    // Opponent receptors on the left; player receptors on the right.
    for (let sideIndex=0; sideIndex<2; sideIndex++) {
      const side = sideIndex === 0 ? "opponent" : "player";
      const base = sideIndex === 0 ? LEFT : 548;
      for (let lane=0;lane<4;lane++) {
        const x = base + lane*(LANE_W+GAP);
        g.fillStyle = side === "player" ? "#ffffff08" : "#ffffff05";
        g.fillRect(x, TOP, LANE_W, 445);
        g.strokeStyle = "#ffffff15"; g.strokeRect(x, TOP, LANE_W, 445);
        this.drawArrow(g, x+LANE_W/2, RECEPTOR_Y, lane, 30, COLORS[lane], side==="player" && this.activeLanes.has(lane) ? 1 : .42);
      }
    }

    if (session) {
      const approachMs = 1500;
      for (const note of session.notes) {
        if (note.judged && note.side === "player") continue;
        const y = RECEPTOR_Y - ((note.time-timeMs)/approachMs)*(RECEPTOR_Y-TOP);
        if (y < TOP-50 || y > HEIGHT+50) continue;
        const base = note.side === "opponent" ? LEFT : 548;
        const x = base + note.lane*(LANE_W+GAP) + LANE_W/2;
        const color = COLORS[note.lane];
        this.drawArrow(g,x,y,note.lane,27,color,.98);
        if (note.sustain > 0) {
          const tail = note.sustain/approachMs*(RECEPTOR_Y-TOP);
          g.globalAlpha=.55; g.fillStyle=color; g.fillRect(x-7,y-tail,14,tail); g.globalAlpha=1;
        }
      }
      g.fillStyle = "#e9eaff"; g.textAlign = "center"; g.font = "800 26px system-ui";
      const judgment = session.lastJudgment;
      if (judgment && performance.now()-session.lastJudgmentAt < 500) {
        g.fillStyle = judgment==="MISS" ? "#ff617c" : judgment==="SICK" ? "#6cf5ff" : "#ffffff";
        g.fillText(judgment, 500, 175);
      }
      g.fillStyle="#ffffff20"; g.fillRect(260,25,480,12);
      g.fillStyle=session.health>.35?"#79ff9b":"#ff536e"; g.fillRect(260,25,480*session.health,12);
      g.fillStyle="#bfc3e0"; g.font="700 12px system-ui";
      g.fillText(session.chart.song+" • "+session.chart.bpm+" BPM",500,565);
    }
    if (state !== "playing") {
      g.fillStyle="#070811bb"; g.fillRect(0,0,w,h);
      g.textAlign="center"; g.fillStyle="#ffffff"; g.font="900 38px system-ui";
      g.fillText(state === "paused" ? "PAUSED" : state === "ended" ? "SONG COMPLETE" : "MAXOS ENGINE", w/2, h/2);
      g.font="16px system-ui"; g.fillStyle="#c5c8e2";
      g.fillText(state === "ready" ? "Load a song or play the practice chart" : "Use the controls above to continue",w/2,h/2+32);
    }
  }

  drawArrow(g,x,y,lane,size,color,alpha=1) {
    g.save(); g.globalAlpha=alpha; g.translate(x,y); g.rotate(lane*Math.PI/2);
    g.shadowColor=color; g.shadowBlur=8; g.fillStyle=color;
    g.beginPath();
    g.moveTo(0,-size); g.lineTo(size*.8,-size*.15); g.lineTo(size*.36,-size*.15);
    g.lineTo(size*.36,size*.7); g.lineTo(-size*.36,size*.7); g.lineTo(-size*.36,-size*.15);
    g.lineTo(-size*.8,-size*.15); g.closePath(); g.fill(); g.restore();
  }

  drawCharacterBackdrop(g,timeMs) {
    const bounce = Math.sin(timeMs/150)*4;
    g.save(); g.globalAlpha=.18;
    for (const [x,color] of [[32,"#a1ff78"],[938,"#ff6ab0"]]) {
      g.fillStyle=color; g.beginPath(); g.ellipse(x,390+bounce,34,58,0,0,Math.PI*2); g.fill();
      g.fillRect(x-24,425+bounce,48,74);
    }
    g.restore();
  }
}
