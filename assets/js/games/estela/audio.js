// Efectos de sonido y música de Estela (8 bits, se generan en el momento: ver arcade/sound.js).
// En las canciones, cada palabra dura una semicorchea: "E2" es una nota, "." un silencio,
// y en la batería k = bombo, s = redoblante, h = platillo.

export const EFFECTS = {
  select: (s) => {
    s.tone({ from: 880, duration: 0.06, volume: 0.12 });
    s.tone({ from: 1320, duration: 0.1, volume: 0.12, delay: 0.06 });
  },
  jump: (s) => s.tone({ from: 260, to: 640, duration: 0.12, volume: 0.1 }),
  slash: (s) => {
    s.noise({ duration: 0.09, volume: 0.18, pitch: 3200, filter: "bandpass" });
    s.tone({ from: 900, to: 260, duration: 0.09, wave: "sawtooth", volume: 0.05 });
  },
  kick: (s) => s.noise({ duration: 0.1, volume: 0.2, pitch: 900, filter: "bandpass" }),
  hit: (s) => {
    s.noise({ duration: 0.12, volume: 0.35, pitch: 1400 });
    s.tone({ from: 190, to: 60, duration: 0.12, volume: 0.25 });
  },
  heavy: (s) => {
    s.noise({ duration: 0.25, volume: 0.45, pitch: 900 });
    s.tone({ from: 140, to: 40, duration: 0.25, wave: "sine", volume: 0.5 });
  },
  block: (s) => s.tone({ from: 1600, to: 1200, duration: 0.06, wave: "triangle", volume: 0.2 }),
  hurt: (s) => s.tone({ from: 420, to: 110, duration: 0.22, wave: "sawtooth", volume: 0.16 }),
  wave: (s) => {
    s.tone({ from: 180, to: 1400, duration: 0.35, wave: "sawtooth", volume: 0.1 });
    s.tone({ from: 360, to: 2000, duration: 0.3, volume: 0.06, delay: 0.04 });
  },
  rising: (s) => s.tone({ from: 300, to: 1800, duration: 0.25, volume: 0.12 }),
  spit: (s) => s.tone({ from: 520, to: 180, duration: 0.16, wave: "triangle", volume: 0.2 }),
  quake: (s) => {
    s.noise({ duration: 0.4, volume: 0.5, pitch: 400 });
    s.tone({ from: 90, to: 30, duration: 0.4, wave: "sine", volume: 0.5 });
  },
  splat: (s) => {
    s.noise({ duration: 0.35, volume: 0.4, pitch: 700 });
    s.tone({ from: 240, to: 40, duration: 0.3, wave: "sine", volume: 0.35 });
  },
  heal: (s) => [0, 0.07, 0.14].forEach((delay, i) => s.tone({ from: 660 * 1.26 ** i, duration: 0.09, volume: 0.1, delay })),
  ko: (s) => [0, 0.12, 0.24, 0.4].forEach((delay, i) => s.tone({ from: 440 / 1.2 ** i, duration: 0.16, volume: 0.14, delay })),
  win: (s) =>
    [523, 659, 784, 1047, 784, 1047].forEach((from, i) =>
      s.tone({ from, duration: i === 5 ? 0.4 : 0.1, volume: 0.12, delay: i * 0.1 }),
    ),
  // Nivel 3: huevos, el "¡buah!" al reventar, electricidad y el pecho que se abre.
  egg: (s) => {
    s.tone({ from: 260, to: 520, duration: 0.12, wave: "sine", volume: 0.3 });
    s.tone({ from: 390, to: 700, duration: 0.1, wave: "sine", volume: 0.15, delay: 0.05 });
  },
  buah: (s) => {
    s.noise({ duration: 0.3, volume: 0.35, pitch: 500 });
    s.tone({ from: 320, to: 60, duration: 0.3, wave: "triangle", volume: 0.3 });
  },
  pop: (s) => s.tone({ from: 900, to: 1400, duration: 0.06, wave: "sine", volume: 0.2 }),
  zap: (s) => [0, 0.04, 0.08, 0.12, 0.16].forEach((delay) => s.tone({ from: 800 + Math.random() * 1600, to: 200, duration: 0.05, wave: "sawtooth", volume: 0.1, delay })),
  rumble: (s) => s.noise({ duration: 1.4, volume: 0.45, pitch: 160 }),
  burst: (s) => {
    s.noise({ duration: 0.8, volume: 0.6, pitch: 900 });
    s.tone({ from: 200, to: 30, duration: 0.8, wave: "sine", volume: 0.6 });
  },
  engine: (s) => s.noise({ duration: 1.2, volume: 0.25, pitch: 300 }),
  warp: (s) => s.tone({ from: 100, to: 3000, duration: 1, wave: "sawtooth", volume: 0.08 }),
};

const repeat = (text, times) => Array(times).fill(text).join(" ");

export const SONGS = {
  // Título: arpegios tranquilos, como mirar las estrellas.
  title: {
    bpm: 96,
    tracks: [
      {
        wave: "triangle",
        volume: 0.13,
        notes: `A4 C5 E5 A5 E5 C5 A4 C5  F4 A4 C5 F5 C5 A4 F4 A4
                G4 B4 D5 G5 D5 B4 G4 B4  E4 G#4 B4 E5 B4 G#4 E4 G#4`,
      },
      {
        volume: 0.06,
        length: 6,
        notes: "A2 . . . . . . .  F2 . . . . . . .  G2 . . . . . . .  E2 . . . . . . .",
      },
    ],
  },
  // Nivel 1: bajo que empuja y melodía de aventura.
  ship: {
    bpm: 132,
    tracks: [
      {
        volume: 0.08,
        notes: `${repeat("E2 E2 E3 E2", 4)} ${repeat("C2 C2 C3 C2", 4)} ${repeat("D2 D2 D3 D2", 4)} ${repeat("B1 B1 B2 B1", 4)}`,
      },
      {
        volume: 0.05,
        length: 2,
        notes: `B4 . . . G4 . A4 . B4 . D5 . B4 . A4 .  G4 . . . E4 . G4 . A4 . . . . . . .
                F#4 . . . D4 . F#4 . A4 . D5 . C5 . A4 .  B4 . . . . . . . D#5 . . . F#5 . . .`,
      },
      { volume: 0.12, notes: "k . h . s . h . k k h . s . h h" },
    ],
  },
  // Viaje: espacio abierto.
  voyage: {
    bpm: 88,
    tracks: [
      { wave: "triangle", volume: 0.12, notes: "D4 A4 D5 E5 F5 E5 D5 A4  A#3 F4 A#4 D5 F5 D5 A#4 F4  C4 G4 C5 E5 G5 E5 C5 G4  A3 E4 A4 C#5 E5 C#5 A4 E4" },
      { volume: 0.05, length: 8, notes: "D2 . . . . . . .  A#1 . . . . . . .  C2 . . . . . . .  A1 . . . . . . ." },
    ],
  },
  // Segundo viaje: otra zona del espacio, más misteriosa.
  voyage2: {
    bpm: 92,
    tracks: [
      { wave: "triangle", volume: 0.12, notes: "E4 B4 E5 F#5 G5 F#5 E5 B4  C4 G4 C5 E5 G5 E5 C5 G4  A3 E4 A4 C5 E5 C5 A4 E4  B3 F#4 B4 D#5 F#5 D#5 B4 F#4" },
      { volume: 0.05, length: 8, notes: "E2 . . . . . . .  C2 . . . . . . .  A1 . . . . . . .  B1 . . . . . . ." },
      { volume: 0.06, notes: "h . . . . . h . . . h . . . . ." },
    ],
  },
  // Nivel 3, primera parte: la Babosa Reina (pesada y viscosa).
  amber: {
    bpm: 128,
    tracks: [
      {
        volume: 0.09,
        notes: `${repeat("F#2 . F#2 F#3 . F#2 A2 .", 2)} ${repeat("D2 . D2 D3 . D2 E2 .", 2)}
                ${repeat("B1 . B1 B2 . B1 D2 .", 2)} ${repeat("C#2 . C#2 C#3 . C#2 F2 .", 2)}`,
      },
      {
        wave: "sawtooth",
        volume: 0.035,
        length: 3,
        notes: `F#4 . . . . . G#4 . A4 . . . C#5 . . .  D5 . . . C#5 . . . A4 . . . F#4 . . .
                F#4 . . . . . A4 . B4 . . . D5 . . .  C#5 . . . . . . . F5 . . . G#5 . . .`,
      },
      { volume: 0.13, notes: "k . . h s . k . k . h . s . h ." },
    ],
  },
  // Nivel 3, segunda parte: el Gusano Voltio (más rápido y nervioso).
  worm: {
    bpm: 168,
    tracks: [
      {
        volume: 0.08,
        notes: `${repeat("C#2 C#3 C#2 C#3 C#2 C#3 B1 B2", 2)} ${repeat("A1 A2 A1 A2 A1 A2 G#1 G#2", 2)}
                ${repeat("F#1 F#2 F#1 F#2 F#1 F#2 G#1 G#2", 2)} ${repeat("A1 A2 A1 A2 B1 B2 C2 C3", 2)}`,
      },
      {
        volume: 0.05,
        length: 1,
        notes: `C#5 E5 G#5 E5 C#5 E5 G#5 B5  A5 G#5 E5 C#5 B4 C#5 E5 . A4 C#5 E5 C#5 A4 C#5 E5 A5  G#5 E5 C#5 B4 G#4 . . .
                F#4 A4 C#5 A4 F#4 A4 C#5 F#5  G#5 F#5 E5 C#5 B4 G#4 E5 . A4 C#5 E5 A5 B4 D#5 F#5 B5  C5 E5 G5 C6 . . . .`,
      },
      { volume: 0.14, notes: "k h s h k k s h k h s h k s s s" },
    ],
  },
  // Nivel 2: pelea en el planeta rojo.
  planet: {
    bpm: 150,
    tracks: [
      {
        volume: 0.08,
        notes: `${repeat("D2 D2 D3 D2 D2 D3 D2 C3", 2)} ${repeat("A#1 A#1 A#2 A#1 A#1 A#2 A#1 A2", 2)}
                ${repeat("G1 G1 G2 G1 G1 G2 G1 F2", 2)} ${repeat("A1 A1 A2 A1 A1 A2 C#2 E2", 2)}`,
      },
      {
        volume: 0.05,
        length: 2,
        notes: `D5 . . D5 . . F5 . E5 . D5 . C5 . A4 .  A#4 . . A#4 . . D5 . C5 . . . A4 . . .
                G4 . . G4 . . A#4 . A4 . G4 . F4 . E4 .  A4 . . . C#5 . . . E5 . . . A5 . . .`,
      },
      { volume: 0.13, notes: "k . h k s . h . k . h k s . s h" },
    ],
  },
};
