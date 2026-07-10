// 8비트풍 효과음 (WebAudio 신디사이저, 외부 파일 없음)
let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function beep(freq: number, dur: number, delay = 0, type: OscillatorType = "square", vol = 0.06) {
  const c = ac();
  if (!c || muted) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = c.currentTime + delay;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export const sfx = {
  spinTick: () => beep(220 + Math.random() * 120, 0.05, 0, "square", 0.03),
  reelStop: () => beep(160, 0.09, 0, "square", 0.05),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.12, i * 0.09));
  },
  jackpot: () => {
    [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => beep(f, 0.16, i * 0.11, "square", 0.08));
  },
  lose: () => beep(110, 0.15, 0, "sawtooth", 0.04),
  buy: () => {
    beep(660, 0.07);
    beep(880, 0.09, 0.07);
  },
  sell: () => {
    beep(880, 0.07);
    beep(660, 0.09, 0.07);
  },
  crash: () => {
    [400, 300, 200, 120].forEach((f, i) => beep(f, 0.12, i * 0.09, "sawtooth", 0.06));
  },
  moon: () => {
    [400, 550, 700, 900].forEach((f, i) => beep(f, 0.1, i * 0.07));
  },
  loan: () => {
    beep(200, 0.2, 0, "sawtooth", 0.06);
    beep(150, 0.3, 0.18, "sawtooth", 0.06);
  },
};
