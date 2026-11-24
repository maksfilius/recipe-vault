// Kitchen-timer alarm, kept identical to alarm() in extension/reader-utils.js (tests/alarm-sound.test.mts
// compares them): three 350 ms beeps, each with its own attack and decay, on an 880 Hz tone with a quieter
// fifth above. Peak level 0.6 stays below clipping. Resolves false when audio is unavailable or blocked.
const ALARM = { beeps: 3, length: 0.35, gap: 0.15, attack: 0.012, hold: 0.18, tones: [[880, 0.4], [1320, 0.2]] } as const;

export function createAlarmContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    return AudioContextClass ? new AudioContextClass() : null;
  } catch {
    return null;
  }
}

export async function playAlarm(context: BaseAudioContext | null | undefined): Promise<boolean> {
  if (!context) return false;
  try {
    if (context.state !== "running" && "resume" in context) {
      // resume() stays pending when autoplay is blocked, so do not wait on it for long.
      await Promise.race([(context as AudioContext).resume(), new Promise((resolve) => setTimeout(resolve, 400))]);
      // resume() may have changed the state; TypeScript still narrows it from the check above.
      if ((context.state as AudioContextState) !== "running") return false;
    }
    const start = context.currentTime + 0.03;
    for (let beep = 0; beep < ALARM.beeps; beep += 1) {
      const at = start + beep * (ALARM.length + ALARM.gap);
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(1, at + ALARM.attack);
      envelope.gain.setValueAtTime(1, at + ALARM.hold);
      envelope.gain.exponentialRampToValueAtTime(0.001, at + ALARM.length);
      envelope.connect(context.destination);
      for (const [frequency, level] of ALARM.tones) {
        const oscillator = context.createOscillator();
        const mix = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        mix.gain.value = level;
        oscillator.connect(mix);
        mix.connect(envelope);
        oscillator.start(at);
        oscillator.stop(at + ALARM.length + 0.02);
      }
    }
    return true;
  } catch {
    return false;
  }
}
