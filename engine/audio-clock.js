export class AudioClock {
  constructor(audioElement) {
    this.audio = audioElement;
    this.startedAt = 0;
    this.pausedAt = 0;
    this.running = false;
    this.hasAudio = false;
    this.audio.addEventListener("loadedmetadata", () => { this.hasAudio = true; });
  }

  async loadFile(file) {
    if (!file) return;
    this.audio.pause();
    if (this.audio.src.startsWith("blob:")) URL.revokeObjectURL(this.audio.src);
    this.audio.src = URL.createObjectURL(file);
    this.audio.load();
    await new Promise((resolve, reject) => {
      if (this.audio.readyState >= 1) return resolve();
      const ok = () => { cleanup(); resolve(); };
      const bad = () => { cleanup(); reject(new Error("This audio file could not be loaded by your browser.")); };
      const cleanup = () => {
        this.audio.removeEventListener("loadedmetadata", ok);
        this.audio.removeEventListener("error", bad);
      };
      this.audio.addEventListener("loadedmetadata", ok, { once: true });
      this.audio.addEventListener("error", bad, { once: true });
    });
    this.hasAudio = true;
    this.pausedAt = 0;
  }

  async start(fromMs = 0) {
    this.pausedAt = Math.max(0, fromMs);
    if (this.hasAudio && this.audio.src) {
      this.audio.currentTime = this.pausedAt / 1000;
      await this.audio.play();
    } else {
      this.startedAt = performance.now() - this.pausedAt;
    }
    this.running = true;
  }

  pause() {
    if (this.hasAudio && this.audio.src) {
      this.pausedAt = this.audio.currentTime * 1000;
      this.audio.pause();
    } else if (this.running) {
      this.pausedAt = performance.now() - this.startedAt;
    }
    this.running = false;
  }

  nowMs() {
    if (this.hasAudio && this.audio.src) return this.audio.currentTime * 1000;
    return this.running ? performance.now() - this.startedAt : this.pausedAt;
  }

  get durationMs() {
    return this.hasAudio && Number.isFinite(this.audio.duration) ? this.audio.duration * 1000 : 0;
  }

  dispose() {
    this.pause();
    if (this.audio.src.startsWith("blob:")) URL.revokeObjectURL(this.audio.src);
  }
}
