// Sonido de 8 bits hecho en el momento con Web Audio (no hay archivos de audio):
// ondas cuadradas y ruido, como los chips de sonido de las consolas viejas.
// Los navegadores no dejan sonar nada hasta que la persona toca una tecla o la pantalla:
// por eso el sonido "arranca" recién con el primer toque (unlock).

const NOTE_INDEX = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };

/** "A4" → 440 Hz. */
function frequency(note) {
  const [, name, octave] = /^([A-G]#?)(\d)$/.exec(note);
  const midi = 12 * (Number(octave) + 1) + NOTE_INDEX[name];
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * effects: { nombre: (s) => { s.tone(...); s.noise(...) } } — los efectos de cada juego.
 * Una canción es { bpm, tracks: [{ wave, volume, length, notes: "E2 . E3 ..." }] }:
 * cada palabra es una semicorchea; "." es silencio; k/s/h son bombo, redoblante y platillo.
 */
export function createSound(effects) {
  let ac = null;
  let master;
  let sfxBus;
  let musicBus;
  let noiseBuffer;
  let muted = false; // lo decide el botón de volumen del sitio (ver pages/games.js)
  let song = null;
  let songSource = null; // la canción tal como la pasó el juego (para no reiniciarla si es la misma)
  let step = 0;
  let nextTime = 0;
  let timer = 0;

  function ready() {
    if (!ac) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      ac = new AudioContext();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ac.destination);
      sfxBus = ac.createGain();
      sfxBus.gain.value = 0.8;
      sfxBus.connect(master);
      musicBus = ac.createGain();
      musicBus.gain.value = 0.32;
      musicBus.connect(master);
      noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return true;
  }

  /** Una nota que puede deslizarse de una frecuencia a otra (from → to). */
  function tone({ from, to = from, duration = 0.1, wave = "square", volume = 0.2, delay = 0, at, bus = sfxBus }) {
    const start = at ?? ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 20), start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain).connect(bus);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  /** Ruido filtrado: golpes, explosiones, "splash". */
  function noise({ duration = 0.1, volume = 0.3, pitch = 2000, filter = "lowpass", delay = 0, at, bus = sfxBus }) {
    const start = at ?? ac.currentTime + delay;
    const source = ac.createBufferSource();
    source.buffer = noiseBuffer;
    const band = ac.createBiquadFilter();
    band.type = filter;
    band.frequency.value = pitch;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(band).connect(gain).connect(bus);
    source.start(start, Math.random() * 0.5);
    source.stop(start + duration + 0.02);
  }

  const synth = { tone, noise };

  function playStep(at, stepLength) {
    song.tracks.forEach((track) => {
      const token = track.tokens[step % track.tokens.length];
      if (token === ".") return;
      const volume = track.volume ?? 0.1;
      if (token === "k") tone({ from: 150, to: 40, duration: 0.12, wave: "sine", volume: volume * 2.5, at, bus: musicBus });
      else if (token === "s") noise({ duration: 0.1, volume, pitch: 1800, filter: "bandpass", at, bus: musicBus });
      else if (token === "h") noise({ duration: 0.03, volume: volume * 0.6, pitch: 7000, filter: "highpass", at, bus: musicBus });
      else
        tone({
          from: frequency(token),
          duration: stepLength * (track.length ?? 1),
          wave: track.wave ?? "square",
          volume,
          at,
          bus: musicBus,
        });
    });
  }

  // El secuenciador mira un poquito hacia adelante y agenda las notas con precisión.
  function schedule() {
    if (!ac || !song || ac.state !== "running") return;
    const stepLength = 60 / song.bpm / 4;
    if (nextTime < ac.currentTime) nextTime = ac.currentTime + 0.05;
    while (nextTime < ac.currentTime + 0.12) {
      playStep(nextTime, stepLength);
      nextTime += stepLength;
      step++;
    }
  }

  return {
    /** Llamar dentro de un toque o tecla: recién ahí el navegador deja sonar. */
    unlock() {
      if (ready() && ac.state === "suspended" && !this.paused) ac.resume();
    },
    paused: false,
    play(name) {
      if (!ac || muted || ac.state !== "running") return;
      effects[name]?.(synth);
    },
    music(next) {
      if (next === songSource) return;
      songSource = next;
      song = next && { ...next, tracks: next.tracks.map((track) => ({ ...track, tokens: track.notes.trim().split(/\s+/) })) };
      step = 0;
      nextTime = 0;
      clearInterval(timer);
      timer = song ? setInterval(schedule, 25) : 0;
    },
    /** Pausa todo el sonido (cuando el juego se pausa o sale de la pantalla). */
    suspend() {
      this.paused = true;
      if (ac?.state === "running") ac.suspend();
    },
    resume() {
      this.paused = false;
      if (ac?.state === "suspended") ac.resume();
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : 0.5;
    },
  };
}
