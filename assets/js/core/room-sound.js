// Sonido de las salas: cada página puede tener su propio sonido de ambiente (setAmbience) y el botón
// de volumen de arriba (junto a ES / EN) lo prende o lo apaga en todo el sitio. La elección se recuerda.
// Los navegadores no dejan sonar nada hasta que la persona toca algo: por eso el ambiente arranca con
// el primer clic o tecla. La música de la sección "escuchando" es aparte y no depende de este botón.

import { t } from "./i18n.js";

const STORAGE_KEY = "archivo-vivo-sonido";
const listeners = new Set();
let enabled = readSaved();
let ac = null;
let master = null;
let ambience = null; // la función que arma el sonido de esta página
let playing = null; // lo que está sonando ahora ({ stop })
let level = 1;

function readSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function context() {
  if (!ac) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    ac = new AudioContext();
    master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);
  }
  return ac;
}

function start() {
  if (!enabled || !ambience || playing || !context()) return;
  if (ac.state === "suspended") ac.resume();
  playing = ambience(ac, master);
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setTargetAtTime(level, ac.currentTime, 1.2); // entra de a poco
}

function stop() {
  if (!playing) return;
  const current = playing;
  playing = null;
  master.gain.cancelScheduledValues(ac.currentTime);
  master.gain.setTargetAtTime(0, ac.currentTime, 0.25);
  setTimeout(() => current.stop(), 1500);
}

/** ¿Está prendido el sonido de las salas? */
export const soundOn = () => enabled;

/** Avisa cuando se prende o se apaga (por ejemplo, para callar también a un juego). */
export function onSoundChange(listener) {
  listeners.add(listener);
}

/**
 * Registra el sonido de esta página. build(ac, destino) arma los sonidos con Web Audio,
 * los conecta a destino y devuelve { stop() }.
 */
export function setAmbience(build) {
  ambience = build;
  const unlock = () => start();
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

/** Sube o baja el ambiente (de 0 a 1): por ejemplo, más bajito mientras se juega. */
export function setAmbienceLevel(value) {
  level = value;
  if (playing) master.gain.setTargetAtTime(value, ac.currentTime, 0.5);
}

// Si se cambia de pestaña, el sonido se pausa.
document.addEventListener("visibilitychange", () => {
  if (!ac) return;
  if (document.hidden) ac.suspend();
  else if (playing) ac.resume();
});

const ICONS = {
  on: `<svg viewBox="0 0 16 16" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true">
         <path fill="currentColor" d="M1 6h3v4H1zM4 5h1v6H4zM5 4h1v8H5zM6 3h1v10H6zM9 6h1v4H9zM11 4h1v8h-1zM13 2h1v12h-1z"/>
       </svg>`,
  off: `<svg viewBox="0 0 16 16" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true">
          <path fill="currentColor" d="M1 6h3v4H1zM4 5h1v6H4zM5 4h1v8H5zM6 3h1v10H6zM9 5h1v1H9zM10 6h1v1h-1zM11 7h2v2h-2zM13 6h1v1h-1zM14 5h1v1h-1zM10 9h1v1h-1zM9 10h1v1H9zM13 9h1v1h-1zM14 10h1v1h-1z"/>
        </svg>`,
};

/** El botón de volumen, arriba a la derecha (se agrega junto al selector de idioma). */
export function mountSoundSwitch() {
  const tools = document.querySelector(".header-tools");
  if (!tools || tools.querySelector(".sound-switch")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sound-switch";
  const show = () => {
    const label = t(enabled ? "sound.on" : "sound.off");
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = enabled ? ICONS.on : ICONS.off;
  };
  button.addEventListener("click", () => {
    enabled = !enabled;
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
      // Si el navegador no deja guardar, vale solo mientras la página esté abierta.
    }
    show();
    if (enabled) start();
    else stop();
    listeners.forEach((listener) => listener(enabled));
  });
  tools.prepend(button);
  show();
}
