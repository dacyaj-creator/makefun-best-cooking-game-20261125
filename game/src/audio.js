// All sound is synthesized with WebAudio: no audio files, nothing over the network.
// The context starts on the first gesture (browsers block sound before one); in a
// screenshot run nothing ever gestures, so nothing ever sounds.

export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.25;
      master.connect(context.destination);
      return true;
    } catch {
      return false;
    }
  }

  /** A short tone: frequency, seconds, shape and volume. */
  function tone(freq, seconds, type, volume, when = 0) {
    if (!ensure() || muted) return;
    const start = context.currentTime + when;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  /** A burst of filtered noise: the chop and the sizzle. */
  function noise(seconds, filterFreq, volume, when = 0) {
    if (!ensure() || muted) return;
    const start = context.currentTime + when;
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
  }

  return {
    /** Call on any gesture so later sounds are allowed. */
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume().catch(() => {});
    },
    setMuted(value) {
      muted = value;
    },
    isMuted() {
      return muted;
    },
    click() {
      tone(660, 0.06, 'square', 0.12);
    },
    chop() {
      noise(0.08, 2400, 0.5);
      tone(180, 0.05, 'triangle', 0.2);
    },
    sizzle() {
      noise(0.5, 5200, 0.16);
    },
    ding() {
      tone(880, 0.12, 'sine', 0.25);
      tone(1318, 0.2, 'sine', 0.2, 0.09);
    },
    coin() {
      tone(988, 0.09, 'square', 0.12);
      tone(1319, 0.09, 'square', 0.12, 0.07);
      tone(1568, 0.16, 'square', 0.12, 0.14);
    },
    error() {
      tone(160, 0.16, 'sawtooth', 0.18);
    },
    warn() {
      tone(440, 0.1, 'square', 0.12);
      tone(440, 0.1, 'square', 0.12, 0.14);
    },
    fanfare() {
      [523, 659, 784, 1047].forEach((freq, index) => tone(freq, 0.18, 'triangle', 0.2, index * 0.11));
    },
    over() {
      [392, 330, 262, 196].forEach((freq, index) => tone(freq, 0.22, 'triangle', 0.2, index * 0.14));
    },
  };
}
