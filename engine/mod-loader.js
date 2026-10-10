import { validateChart } from "./chart.js";

const SAFE_ID = /^[a-z0-9][a-z0-9._-]{1,63}$/;
const safeRelativePath = path =>
  typeof path === "string" &&
  path.length > 0 &&
  !path.startsWith("/") &&
  !path.includes("\\") &&
  path.split("/").every(part => part && part !== "." && part !== "..");

export function validateModManifest(raw) {
  if (!raw || raw.format !== "maxos-mod" || raw.apiVersion !== 1) {
    throw new Error("Unsupported mod manifest. Expected format 'maxos-mod' and apiVersion 1.");
  }
  if (!SAFE_ID.test(String(raw.id || ""))) throw new Error("Mod id must be 2–64 lowercase letters, numbers, dots, underscores, or hyphens.");
  if (!String(raw.name || "").trim()) throw new Error("Mod manifest needs a name.");
  if (!Array.isArray(raw.songs)) throw new Error("Mod manifest needs a songs array.");
  const seen = new Set();
  const songs = raw.songs.map((song, index) => {
    if (!song || !SAFE_ID.test(String(song.id || ""))) throw new Error("Song " + (index + 1) + " has an invalid id.");
    if (seen.has(song.id)) throw new Error("Duplicate song id: " + song.id);
    seen.add(song.id);
    if (!String(song.title || "").trim()) throw new Error("Song " + song.id + " needs a title.");
    if (!safeRelativePath(song.chart)) throw new Error("Song " + song.id + " has an unsafe chart path.");
    if (song.audio && !safeRelativePath(song.audio)) throw new Error("Song " + song.id + " has an unsafe audio path.");
    return { id: song.id, title: String(song.title), chart: song.chart, audio: song.audio || null };
  });
  return {
    format: "maxos-mod",
    apiVersion: 1,
    id: raw.id,
    name: String(raw.name).slice(0, 100),
    version: String(raw.version || "1.0.0").slice(0, 40),
    author: String(raw.author || "Unknown").slice(0, 100),
    description: String(raw.description || "").slice(0, 500),
    songs
  };
}

async function parseMod(manifest, readText, getFile = () => null) {
  const checked = validateModManifest(manifest);
  const songs = [];
  for (const entry of checked.songs) {
    const rawChart = JSON.parse(await readText(entry.chart));
    const chart = validateChart(rawChart);
    const audioFile = entry.audio ? getFile(entry.audio) : null;
    if (entry.audio && !audioFile) throw new Error("Missing audio file for " + entry.title + ": " + entry.audio);
    songs.push({ id: entry.id, title: entry.title, chart, audioFile, audioPath: entry.audio });
  }
  return { ...checked, songs, source: "local" };
}

export async function loadModFolder(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) throw new Error("Choose a mod folder containing mod.json.");
  const paths = files.map(file => ({
    file,
    path: String(file.webkitRelativePath || file.name).replace(/^\\.\\//, "")
  }));
  const manifestEntry = paths.find(item => /(^|\/)mod\.json$/i.test(item.path));
  if (!manifestEntry) throw new Error("Could not find mod.json in the selected folder.");
  const root = manifestEntry.path.includes("/") ? manifestEntry.path.slice(0, manifestEntry.path.lastIndexOf("/") + 1) : "";
  const fileMap = new Map();
  for (const item of paths) {
    if (!item.path.startsWith(root)) continue;
    const relative = item.path.slice(root.length);
    if (safeRelativePath(relative)) fileMap.set(relative, item.file);
  }
  const manifest = JSON.parse(await manifestEntry.file.text());
  return parseMod(
    manifest,
    async path => {
      if (!safeRelativePath(path)) throw new Error("Unsafe mod path: " + path);
      const file = fileMap.get(path);
      if (!file) throw new Error("Missing mod file: " + path);
      return file.text();
    },
    path => fileMap.get(path) || null
  );
}

export async function loadBundledMod(modFolder) {
  const base = new URL(modFolder, import.meta.url);
  const manifestResponse = await fetch(new URL("mod.json", base));
  if (!manifestResponse.ok) throw new Error("Could not load bundled mod manifest.");
  const manifest = await manifestResponse.json();
  const checked = validateModManifest(manifest);
  const songs = [];
  for (const entry of checked.songs) {
    const response = await fetch(new URL(entry.chart, base));
    if (!response.ok) throw new Error("Could not load chart for " + entry.title + ".");
    const chart = validateChart(await response.json());
    let audioFile = null;
    if (entry.audio) {
      const audioResponse = await fetch(new URL(entry.audio, base));
      if (!audioResponse.ok) throw new Error("Could not load audio for " + entry.title + ".");
      const blob = await audioResponse.blob();
      audioFile = new File([blob], entry.audio.split("/").pop() || "song-audio");
    }
    songs.push({ id: entry.id, title: entry.title, chart, audioFile, audioPath: entry.audio });
  }
  return { ...checked, songs, source: "bundled" };
}
