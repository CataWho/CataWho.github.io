// Fondo animado del inicio: un visual de Hydra detrás de "Mi pequeño universo".
// El código vive en assets/hydra/fondo-inicio.js (se pega tal cual desde el editor de Hydra).
// Cuando suena música en "escuchando", el visual reacciona a ella a través de a.fft.

import { q } from "../core/dom.js";
import { readBands } from "./audio-analyser.js";
import { mountSketch, sendAudio } from "./sketch.js";

const CODE_URL = "assets/hydra/fondo-inicio.js";
const RESOLUTION = 0.5; // dibujamos a la mitad de píxeles: se ve igual de fondo y pesa mucho menos

/**
 * Lleva cada banda al mismo rango que la onda de reposo (≈0.1–0.7): así con música
 * el visual late más fuerte pero no cambia de escala, y nunca llega a 0 en los silencios.
 */
const shape = (value) => 0.12 + Math.min(1, Math.max(0, (value - 0.3) * 1.5)) * 0.6;

export async function startHeroVisual() {
  const hero = q("[data-hero-visual]");
  if (!hero) return;
  // Quien pidió "menos movimiento" en su compu ve el fondo liso de siempre.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const code = await fetch(CODE_URL)
    .then((response) => (response.ok ? response.text() : null))
    .catch(() => null);
  if (!code) return;

  const frame = document.createElement("iframe");
  frame.className = "hero-visual";
  frame.title = "Visual de fondo hecho con Hydra";
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.addEventListener("load", () => hero.classList.add("has-visual"), { once: true });
  hero.prepend(frame);
  mountSketch(frame, code, {
    engine: "hydra",
    resolution: RESOLUTION,
    onError: (message) => console.warn(`Fondo de Hydra: ${message}`),
  });

  // Mientras suena música y el hero se ve, le pasamos el sonido al visual.
  let heroVisible = true;
  new IntersectionObserver(([entry]) => (heroVisible = entry.isIntersecting)).observe(hero);
  const pump = () => {
    const bands = heroVisible && readBands();
    if (bands) sendAudio(frame, bands.map(shape));
    requestAnimationFrame(pump);
  };
  requestAnimationFrame(pump);
}
