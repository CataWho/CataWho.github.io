// Analiza la música que suena en "escuchando" para que los visuales reaccionen.
// Devuelve 4 bandas (graves → agudos) entre 0 y 1, como el a.fft de Hydra.
// Las previews de iTunes permiten este análisis porque mandan Access-Control-Allow-Origin: *.

// Rangos de la lista de frecuencias (de 128) que forman cada banda.
const BANDS = [
  [1, 4], // graves
  [4, 12], // medios-graves
  [12, 40], // medios
  [40, 100], // agudos
];

let player = null;
let analyser = null;
let context = null;
let samples = null;

/** Empieza a escuchar un <audio>. El análisis arranca la primera vez que suena. */
export function listenTo(audio) {
  if (!audio) return;
  player = audio;
  audio.addEventListener("play", () => {
    try {
      if (!context) {
        context = new AudioContext();
        const source = context.createMediaElementSource(audio);
        analyser = context.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        // El sonido pasa por el analizador y sigue hacia los parlantes.
        source.connect(analyser);
        analyser.connect(context.destination);
        samples = new Uint8Array(analyser.frequencyBinCount);
      }
      context.resume();
    } catch (error) {
      console.warn("No se pudo analizar el audio", error);
    }
  });
}

/** Las 4 bandas del momento, o null si no está sonando nada. */
export function readBands() {
  if (!analyser || !player || player.paused) return null;
  analyser.getByteFrequencyData(samples);
  return BANDS.map(([from, to]) => {
    let sum = 0;
    for (let i = from; i < to; i++) sum += samples[i];
    return sum / (to - from) / 255;
  });
}
