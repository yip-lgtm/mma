let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function beep(kind: "start" | "end" | "rest") {
  const c = getCtx();
  if (!c) return;
  void c.resume();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = kind === "end" ? 660 : kind === "rest" ? 392 : 523;
  g.gain.value = 0.07;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  o.stop(c.currentTime + (kind === "end" ? 0.22 : 0.12));
}
