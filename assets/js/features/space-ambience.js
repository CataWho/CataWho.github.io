// El sonido de la sala de juegos: ambiente "intergaláctico" hecho en el momento con Web Audio
// (no hay archivos de audio). Tiene cuatro capas:
//   un colchón grave que respira · un brillo agudo que tiembla · viento espacial (ruido filtrado)
//   y destellos: notas sueltas que suenan cada tanto, con eco, de un lado o del otro.
// Se usa con setAmbience (ver core/room-sound.js). Acá también está el "clic" de cambiar de canal.

const TWINKLE_NOTES = [880, 987.77, 1174.66, 1318.51, 1567.98, 1760]; // escala pentatónica, aguda

/** Cambio de canal de una tele vieja: el clic de la perilla y un chasquido de estática. */
export function channelClick(ac, destination) {
  const now = ac.currentTime;
  const click = ac.createOscillator();
  click.type = "square";
  click.frequency.setValueAtTime(1400, now);
  click.frequency.exponentialRampToValueAtTime(300, now + 0.03);
  const clickGain = ac.createGain();
  clickGain.gain.setValueAtTime(0.08, now);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  click.connect(clickGain).connect(destination);
  click.start(now);
  click.stop(now + 0.05);

  const length = Math.floor(ac.sampleRate * 0.22);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const hiss = ac.createBufferSource();
  hiss.buffer = buffer;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 3200;
  band.Q.value = 0.7;
  const hissGain = ac.createGain();
  hissGain.gain.setValueAtTime(0.06, now + 0.02);
  hissGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  hiss.connect(band).connect(hissGain).connect(destination);
  hiss.start(now + 0.02);
}

/** Un eco largo "de catedral espacial": ruido que se apaga de a poco. */
function makeReverb(ac, seconds = 4, decay = 2.5) {
  const length = ac.sampleRate * seconds;
  const buffer = ac.createBuffer(2, length, ac.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
  }
  const reverb = ac.createConvolver();
  reverb.buffer = buffer;
  return reverb;
}

/** Una onda lenta que mueve un valor (por ejemplo, el filtro o el volumen) para que "respire". */
function lfo(ac, frequency, depth, target, sources) {
  const osc = ac.createOscillator();
  osc.frequency.value = frequency;
  const gain = ac.createGain();
  gain.gain.value = depth;
  osc.connect(gain).connect(target);
  osc.start();
  sources.push(osc);
}

export function spaceAmbience(ac, destination) {
  const sources = [];
  let timer = 0;
  const bus = ac.createGain();
  const reverb = makeReverb(ac);
  const wet = ac.createGain();
  wet.gain.value = 0.7;
  bus.connect(destination);
  bus.connect(reverb).connect(wet).connect(destination);

  // Colchón: un acorde grave (La y Mi) con las voces apenas desafinadas, detrás de un filtro que respira.
  const padFilter = ac.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 420;
  padFilter.Q.value = 3;
  const pad = ac.createGain();
  pad.gain.value = 0.035;
  padFilter.connect(pad).connect(bus);
  [55, 82.41, 110, 164.81].forEach((frequency) =>
    [-6, 6].forEach((detune) => {
      const osc = ac.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = frequency;
      osc.detune.value = detune;
      osc.connect(padFilter);
      osc.start();
      sources.push(osc);
    }),
  );
  lfo(ac, 0.035, 260, padFilter.frequency, sources);

  // Brillo: tres notas agudas y suaves que tiemblan despacio.
  [659.25, 987.77, 1479.98].forEach((frequency, i) => {
    const osc = ac.createOscillator();
    osc.frequency.value = frequency;
    const gain = ac.createGain();
    gain.gain.value = 0.006;
    osc.connect(gain).connect(bus);
    osc.start();
    sources.push(osc);
    lfo(ac, 0.07 + i * 0.05, 0.005, gain.gain, sources);
  });

  // Viento espacial: ruido que pasa por un filtro que se mueve.
  const noiseBuffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;
  const noise = ac.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const wind = ac.createBiquadFilter();
  wind.type = "bandpass";
  wind.frequency.value = 700;
  wind.Q.value = 0.8;
  const windGain = ac.createGain();
  windGain.gain.value = 0.025;
  noise.connect(wind).connect(windGain).connect(bus);
  noise.start();
  sources.push(noise);
  lfo(ac, 0.05, 450, wind.frequency, sources);

  // Destellos: cada unos segundos, una nota suelta con eco, de un lado o del otro.
  function twinkle() {
    timer = setTimeout(twinkle, 2200 + Math.random() * 4500);
    if (ac.state !== "running") return;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = TWINKLE_NOTES[Math.floor(Math.random() * TWINKLE_NOTES.length)];
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
    const pan = ac.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    osc.connect(gain).connect(pan).connect(bus);
    osc.start(now);
    osc.stop(now + 2.7);
  }
  timer = setTimeout(twinkle, 1500);

  return {
    stop() {
      clearTimeout(timer);
      sources.forEach((source) => {
        try {
          source.stop();
        } catch {
          // ya estaba detenido
        }
      });
      bus.disconnect();
      wet.disconnect();
    },
  };
}
