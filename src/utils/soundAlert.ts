/**
 * Web Audio API Sound Chime Utility
 * Synthesizes a crisp, melodious double-chime (D5 -> A5) for new incoming restaurant orders.
 * 100% offline, zero external file dependencies, low latency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem('omni_kds_sound_muted') === 'true';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem('omni_kds_sound_muted', muted ? 'true' : 'false');
  } catch {}
}

/**
 * Plays a pleasant double chime (Ding-Dong) for new incoming orders
 */
export function playOrderChime(force: boolean = false): boolean {
  if (!force && isSoundMuted()) {
    return false;
  }

  const ctx = getAudioContext();
  if (!ctx) return false;

  const now = ctx.currentTime;

  // Tone 1: 587.33 Hz (D5)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(587.33, now);

  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + 0.36);

  // Tone 2: 880 Hz (A5) - starts at +0.18s
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880, now + 0.18);

  gain2.gain.setValueAtTime(0.001, now + 0.18);
  gain2.gain.exponentialRampToValueAtTime(0.4, now + 0.20);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc2.start(now + 0.18);
  osc2.stop(now + 0.72);

  return true;
}

/**
 * Test chime with higher volume for verifying speaker in noisy kitchen environments
 */
export function testKitchenChime(): void {
  playOrderChime(true);
}
