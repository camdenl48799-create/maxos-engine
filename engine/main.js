import { makeDemoChart, validateChart, downloadChart } from "./chart.js";
import { AudioClock } from "./audio-clock.js";
import { GameplaySession, KEY_CODES } from "./gameplay.js";
import { GameRenderer } from "./renderer.js";

const $ = id => document.getElementById(id);
const canvas = $("game");
const renderer = new GameRenderer(canvas);
const audio = $("audio");
const clock = new AudioClock(audio);
let chart = makeDemoChart();
let session = null;
let state = "ready";
let held = new Set();
let editorLane = 0;
let editorSide = "player";
let animationFrame = 0;

function setStatus(message, isError=false) {
  $("status").textContent = message;
  $("status").classList.toggle("error", isError);
}
function syncChartUI() {
  $("songName").value = chart.song;
  $("bpm").value = chart.bpm;
  $("offset").value = chart.offset || 0;
  $("chartCount").textContent = chart.notes.length + " notes";
  $("chartPreview").textContent = chart.notes.slice(0,12).map(n =>
    (n.time/1000).toFixed(3)+"s · "+n.side+" · lane "+(n.lane+1)+(n.sustain ? " · hold "+n.sustain+"ms" : "")
  ).join("\n") || "No notes yet.";
  updateStats();
}
function updateStats(s = session) {
  $("score").textContent = s ? s.score.toLocaleString() : "0";
  $("combo").textContent = s ? s.combo : "0";
  $("accuracy").textContent = s ? s.accuracy.toFixed(1)+"%" : "100.0%";
  $("rating").textContent = s ? s.rating : "—";
  $("misses").textContent = s ? s.missCount : "0";
}
function resetSession() {
  session = new GameplaySession(chart, updateStats);
  held.clear();
}
function setState(next) {
  state = next;
  $("playBtn").textContent = next === "playing" ? "PAUSE" : next === "paused" ? "RESUME" : "PLAY CHART";
  $("playBtn").disabled = next === "ended";
}
async function startGame() {
  try {
    resetSession();
    await clock.start(0);
    setState("playing");
    setStatus(clock.hasAudio ? "Playing with audio-clock synchronization." : "Practice clock running. Load an audio file to sync a song.");
  } catch (error) {
    setStatus(error.message || "Audio could not start. Try clicking Play again.", true);
  }
}
async function togglePlay() {
  if (state === "playing") {
    clock.pause(); setState("paused"); return;
  }
  if (state === "paused") {
    try { await clock.start(clock.pausedAt); setState("playing"); }
    catch (error) { setStatus(error.message, true); }
    return;
  }
  await startGame();
}
function finishGame() {
  clock.pause(); setState("ended");
  setStatus("Chart finished. Best combo: "+(session?.maxCombo ?? 0)+". Reset to play again.");
}
function frame() {
  const now = clock.nowMs();
  if (state === "playing" && session) {
    session.update(now);
    const chartEnd = chart.notes.length ? chart.notes[chart.notes.length-1].time + 1800 : 0;
    const songEnded = clock.hasAudio && clock.durationMs > 0 && now >= clock.durationMs;
    if (session.finished || (now > chartEnd && !session.playerNotesRemaining) || songEnded) finishGame();
  }
  renderer.activeLanes = held;
  renderer.draw(session, now, state);
  animationFrame = requestAnimationFrame(frame);
}
function addNote(time, lane=editorLane, side=editorSide, sustain=0) {
  chart.notes.push({time:Math.max(0,Math.round(time)),lane,side,type:"tap",sustain:Math.max(0,Math.round(sustain))});
  chart.notes.sort((a,b)=>a.time-b.time);
  syncChartUI();
}
function chooseLane(lane) {
  editorLane = lane;
  document.querySelectorAll("[data-lane]").forEach(el=>el.classList.toggle("selected",Number(el.dataset.lane)===lane));
}
function chooseSide(side) {
  editorSide = side;
  $("sidePlayer").classList.toggle("selected",side==="player");
  $("sideOpponent").classList.toggle("selected",side==="opponent");
}

$("playBtn").addEventListener("click",togglePlay);
$("resetBtn").addEventListener("click",()=>{clock.pause();resetSession();setState("ready");setStatus("Chart reset. Ready to play.");});
$("audioFile").addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file)return;
  try { await clock.loadFile(file); setStatus("Loaded audio: "+file.name+" ("+(clock.durationMs/1000).toFixed(1)+"s)."); }
  catch(error){setStatus(error.message,true);}
});
$("chartFile").addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file)return;
  try { chart=validateChart(JSON.parse(await file.text())); resetSession(); syncChartUI(); setState("ready"); setStatus("Imported chart "+chart.song+"."); }
  catch(error){setStatus("Chart import failed: "+error.message,true);}
  e.target.value="";
});
$("exportBtn").addEventListener("click",()=>{
  chart.song=$("songName").value.trim()||"Untitled Song";
  chart.bpm=Number($("bpm").value)||100;
  chart.offset=Number($("offset").value)||0;
  try { chart=validateChart(chart); downloadChart(chart); syncChartUI(); setStatus("Chart exported as JSON."); }
  catch(error){setStatus(error.message,true);}
});
$("demoBtn").addEventListener("click",()=>{
  chart=makeDemoChart(); clock.pause(); resetSession(); syncChartUI(); setState("ready"); setStatus("Practice chart loaded. No audio required.");
});
$("songName").addEventListener("change",()=>{chart.song=$("songName").value.trim()||"Untitled Song";syncChartUI();});
$("bpm").addEventListener("change",()=>{chart.bpm=Math.max(1,Math.min(500,Number($("bpm").value)||100));syncChartUI();});
$("offset").addEventListener("change",()=>{chart.offset=Number($("offset").value)||0;syncChartUI();});
document.querySelectorAll("[data-lane]").forEach(el=>el.addEventListener("click",()=>chooseLane(Number(el.dataset.lane))));
$("sidePlayer").addEventListener("click",()=>chooseSide("player"));
$("sideOpponent").addEventListener("click",()=>chooseSide("opponent"));
$("addNoteBtn").addEventListener("click",()=>{
  const time=Number($("noteTime").value);
  const sustain=Number($("noteSustain").value)||0;
  if(!Number.isFinite(time)||time<0){setStatus("Enter a note time in milliseconds (0 or greater).",true);return;}
  addNote(time,editorLane,editorSide,sustain);
  setStatus("Added "+editorSide+" note at "+time+" ms.");
});
$("deleteLastBtn").addEventListener("click",()=>{chart.notes.pop();syncChartUI();setStatus("Removed the last note.");});
$("chartPreview").addEventListener("click",e=>{
  const row=e.target.closest("[data-note-index]");
  if(row){chart.notes.splice(Number(row.dataset.noteIndex),1);syncChartUI();}
});

addEventListener("keydown",e=>{
  const lane=KEY_CODES.findIndex(codes=>codes.includes(e.code));
  if(lane<0)return;
  e.preventDefault();
  if(held.has(lane))return;
  held.add(lane);
  if(state==="playing"&&session)session.press(lane,clock.nowMs());
});
addEventListener("keyup",e=>{
  const lane=KEY_CODES.findIndex(codes=>codes.includes(e.code));
  if(lane>=0)held.delete(lane);
});
addEventListener("blur",()=>held.clear());
canvas.addEventListener("pointerdown",e=>{
  if(state!=="playing"||!session)return;
  const rect=canvas.getBoundingClientRect();
  const x=(e.clientX-rect.left)*1000/rect.width;
  if(x>=548){const lane=Math.floor((x-548)/(78+8));if(lane>=0&&lane<4)session.press(lane,clock.nowMs());}
});
window.addEventListener("beforeunload",()=>clock.dispose());
syncChartUI();
chooseLane(0);
chooseSide("player");
setState("ready");
setStatus("Ready. Play the included practice chart or load your own audio and JSON chart.");
renderer.draw(null,0,state);
animationFrame=requestAnimationFrame(frame);
