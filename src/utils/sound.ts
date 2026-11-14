import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

type SoundKind = 'mission' | 'badge' | 'chest';

/**
 * Plays a short confirmation jingle, mirroring the web app's WebAudio version:
 * - mission: two ascending sine notes
 * - badge: four ascending notes
 * - chest: three triangle-wave notes
 *
 * Each jingle is generated as one small in-memory WAV file and played once,
 * so it works offline and needs no bundled assets.
 */
export async function playSound(kind: SoundKind) {
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    const player = createAudioPlayer({
      uri: `data:audio/wav;base64,${jingleWavBase64(kind)}`,
    });
    player.volume = 0.5;
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) player.release();
    });
    player.play();
  } catch {
    // Sound is decorative — never let it break the flow.
  }
}

const NOTES: Record<SoundKind, { frequency: number; wave: 'sine' | 'triangle' }[]> = {
  mission: [
    { frequency: 523.25, wave: 'sine' },
    { frequency: 659.25, wave: 'sine' },
  ],
  badge: [
    { frequency: 523.25, wave: 'sine' },
    { frequency: 659.25, wave: 'sine' },
    { frequency: 783.99, wave: 'sine' },
    { frequency: 1046.5, wave: 'sine' },
  ],
  chest: [
    { frequency: 392, wave: 'triangle' },
    { frequency: 523.25, wave: 'triangle' },
    { frequency: 659.25, wave: 'triangle' },
  ],
};

const SAMPLE_RATE = 44100;
const NOTE_DURATION = 0.2; // seconds
const NOTE_GAP = 0.1; // seconds, matches the web app's stagger

function jingleWavBase64(kind: SoundKind) {
  const notes = NOTES[kind];
  const noteSamples = Math.floor(SAMPLE_RATE * NOTE_DURATION);
  const gapSamples = Math.floor(SAMPLE_RATE * NOTE_GAP);
  const totalSamples = (notes.length - 1) * gapSamples + noteSamples;

  const samples = new Int16Array(totalSamples);
  notes.forEach((note, index) => {
    const start = index * gapSamples;
    for (let i = 0; i < noteSamples; i += 1) {
      const t = i / SAMPLE_RATE;
      const phase = note.frequency * t;
      const cycle = phase - Math.floor(phase);
      const raw =
        note.wave === 'triangle'
          ? 4 * Math.abs(cycle - 0.5) - 1
          : Math.sin(2 * Math.PI * phase);
      const envelope =
        t < 0.02 ? t / 0.02 : Math.max(0, 1 - (t - 0.02) / 0.18);
      const value = Math.round(raw * envelope * 0.4 * 32767);
      const target = start + i;
      if (target < totalSamples) samples[target] = value;
    }
  });

  return encodeWav(samples, SAMPLE_RATE);
}

function encodeWav(samples: Int16Array, sampleRate: number) {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i += 1) {
    view.setInt16(44 + i * 2, samples[i], true);
  }

  return toBase64(bytes);
}

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toBase64(bytes: Uint8Array) {
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    output += BASE64_CHARS[b1 >> 2];
    output += BASE64_CHARS[((b1 & 3) << 4) | ((b2 ?? 0) >> 4)];
    output += i + 1 < bytes.length ? BASE64_CHARS[((b2 & 15) << 2) | ((b3 ?? 0) >> 6)] : '=';
    output += i + 2 < bytes.length ? BASE64_CHARS[b3 & 63] : '=';
  }
  return output;
}
