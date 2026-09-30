// Escenarios: estrellas, planetas, la navecita de Estela y los fondos de cada nivel.
// Los fondos fijos se pintan una sola vez en un canvas aparte (así el juego no los redibuja
// píxel por píxel 60 veces por segundo); lo que se mueve se dibuja encima en cada cuadro.

import { H, W, createStamper, makeCanvas, painter, seeded } from "../arcade/pixel.js";
import { say } from "./texts.js";

// --- Estrellas --------------------------------------------------------------------------------------

export function createStars(seed, count, width = W, height = H) {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: rand() * width,
    y: rand() * height,
    depth: 0.2 + rand() * 0.8, // las más lejanas se mueven más lento
    twinkle: rand() * 100,
  }));
}

/** offset: cuánto se corrieron las estrellas. streak > 0 las estira (hiperespacio). */
/** colors: [brillante, media, lejana] (cada zona del espacio puede tener su tono). */
export function drawStars(p, stars, offset = 0, { width = W, streak = 0, time = 0, colors = ["#ffffff", "#b8b0d8", "#6a6090"] } = {}) {
  stars.forEach((star) => {
    const x = (((star.x - offset * star.depth) % width) + width) % width;
    const bright = star.depth > 0.75 || Math.sin(time * 0.05 + star.twinkle) > 0.6;
    const color = bright ? colors[0] : star.depth > 0.45 ? colors[1] : colors[2];
    p.rect(x, star.y, 1 + streak * star.depth, 1, color);
  });
}

// --- Planetas ------------------------------------------------------------------------------------------

/**
 * Una esfera en pixel art que gira: base (color), spots (manchas: continentes, cráteres),
 * spin (cuánto giró, de 0 a 1) y una sombra del lado derecho.
 */
export function drawSphere(p, cx, cy, r, { base, spots = [], spin = 0, shade = "rgba(12, 4, 24, 0.5)" }) {
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.round(r * Math.sqrt(Math.max(0, 1 - (dy / (r + 0.5)) ** 2)));
    if (half <= 0) continue;
    p.rect(cx - half, cy + dy, half * 2 + 1, 1, base);
    spots.forEach((spot) => {
      const sy = spot.v * r;
      if (Math.abs(dy - sy) > spot.ry) return;
      const u = (((spot.u + spin) % 1) + 1) % 1; // 0..1 alrededor del planeta
      const sx = (u - 0.5) * r * 3;
      const w = spot.rx * Math.sqrt(Math.max(0, 1 - ((dy - sy) / (spot.ry + 0.5)) ** 2));
      const from = Math.max(-half, Math.round(sx - w));
      const to = Math.min(half + 1, Math.round(sx + w));
      if (to > from) p.rect(cx + from, cy + dy, to - from, 1, spot.color);
    });
    const shadow = Math.round(half * 0.55);
    p.rect(cx + half + 1 - shadow, cy + dy, shadow, 1, shade);
  }
}

const EARTH_SPOTS = [
  { u: 0.1, v: -0.3, rx: 9, ry: 6, color: "#3fae5a" },
  { u: 0.18, v: 0.25, rx: 6, ry: 9, color: "#3fae5a" },
  { u: 0.45, v: -0.1, rx: 12, ry: 8, color: "#58c26a" },
  { u: 0.55, v: 0.4, rx: 5, ry: 4, color: "#3fae5a" },
  { u: 0.8, v: -0.45, rx: 8, ry: 4, color: "#58c26a" },
  { u: 0.3, v: -0.6, rx: 14, ry: 2, color: "#ffffff" },
  { u: 0.7, v: 0.1, rx: 10, ry: 2, color: "#e8f4ff" },
  { u: 0.95, v: 0.55, rx: 9, ry: 2, color: "#ffffff" },
];

export function drawEarth(p, cx, cy, r, spin) {
  const scale = r / 30;
  drawSphere(p, cx, cy, r, {
    base: "#2d6fd6",
    spin,
    spots: EARTH_SPOTS.map((spot) => ({ ...spot, rx: spot.rx * scale, ry: spot.ry * scale })),
  });
}

const CRIMSON_SPOTS = [
  { u: 0.05, v: -0.4, rx: 10, ry: 4, color: "#8e1f2a" },
  { u: 0.25, v: 0.2, rx: 6, ry: 5, color: "#e0603c" },
  { u: 0.4, v: -0.1, rx: 4, ry: 4, color: "#8e1f2a" },
  { u: 0.6, v: 0.45, rx: 12, ry: 3, color: "#8e1f2a" },
  { u: 0.75, v: -0.2, rx: 7, ry: 6, color: "#e0603c" },
  { u: 0.9, v: 0.15, rx: 3, ry: 3, color: "#6a1420" },
];

export function drawCrimson(p, cx, cy, r, spin) {
  const scale = r / 30;
  drawSphere(p, cx, cy, r, {
    base: "#c23a2e",
    spin,
    spots: CRIMSON_SPOTS.map((spot) => ({ ...spot, rx: spot.rx * scale, ry: spot.ry * scale })),
  });
}

const AMBER_BANDS = [
  { u: 0.5, v: -0.62, rx: 999, ry: 2, color: "#f2d9a0" },
  { u: 0.5, v: -0.3, rx: 999, ry: 3, color: "#c98f3e" },
  { u: 0.5, v: 0.05, rx: 999, ry: 2, color: "#f7e2b0" },
  { u: 0.5, v: 0.38, rx: 999, ry: 3, color: "#b87a30" },
  { u: 0.5, v: 0.7, rx: 999, ry: 2, color: "#e8c27a" },
  { u: 0.3, v: 0.2, rx: 4, ry: 2, color: "#a86a28" }, // la gran tormenta
];

/** Anillos de hielo: una elipse gruesa y chata; front = la mitad de adelante (tapa al planeta). */
function drawRings(p, cx, cy, r, front) {
  const colors = ["#e8f4ff", "#b8d8ec", "#0b0614", "#f2e2b8", "#d9c08a", "#a8c8dc"];
  for (let a = 0; a < Math.PI * 2; a += 0.006) {
    if (Math.sin(a) > 0 !== front) continue;
    colors.forEach((color, i) => {
      if (color === "#0b0614") return; // la división oscura entre anillos
      const k = 1.45 + i * 0.13;
      p.rect(cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * 0.28, 1, 1, color);
    });
  }
}

/** El planeta Ámbar: dorado a franjas, con anillos de hielo (como Saturno). */
export function drawAmber(p, cx, cy, r, spin) {
  drawRings(p, cx, cy, r, false);
  drawSphere(p, cx, cy, r, { base: "#e0ac56", spin, spots: AMBER_BANDS.map((band) => ({ ...band, ry: (band.ry * r) / 30 })) });
  drawRings(p, cx, cy, r, true);
}

/** Las tres lunas del planeta Carmín (en el cielo del nivel 2 y en la llegada del viaje). */
export const MOONS = [
  { r: 16, base: "#f2c4d6", crater: "#d99ab4" },
  { r: 9, base: "#c9b3f0", crater: "#a18ad0" },
  { r: 5, base: "#ffb070", crater: "#e08a4a" },
];

export function drawMoon(p, x, y, moon) {
  drawSphere(p, x, y, moon.r, {
    base: moon.base,
    spots: [
      { u: 0.45, v: -0.3, rx: moon.r * 0.25, ry: moon.r * 0.2, color: moon.crater },
      { u: 0.55, v: 0.35, rx: moon.r * 0.18, ry: moon.r * 0.15, color: moon.crater },
    ],
    shade: "rgba(40, 8, 30, 0.45)",
  });
}

// --- La navecita de Estela --------------------------------------------------------------------------------

const shipStamp = createStamper(128, 64, 64);

function drawHull(q, pilot) {
  q.poly([[-14, 3], [-3, 3], [-17, 12], [-24, 11]], "#b8b1cc");
  q.poly([[-26, -4], [-18, -8], [6, -9], [24, -4], [31, 1], [24, 5], [-18, 6], [-26, 3]], "#ece8f4");
  q.poly([[-26, 1], [31, 1], [24, 5], [-18, 6], [-26, 3]], "#c3bbd6");
  q.rect(-22, -2, 42, 2, "#ff4fb0");
  q.poly([[-22, -7], [-16, -15], [-10, -15], [-12, -8]], "#d6d0e4");
  q.rect(-17, -14, 5, 1, "#ff4fb0");
  q.poly([[-4, -8], [4, -15], [14, -15], [22, -6], [6, -8]], "#6fd6ff");
  if (pilot) {
    // Estela en la cabina: rodete, colita y cara.
    q.line(3, -11, -2, -8, "#f7d85e", 2);
    q.disc(6, -11, 3, "#f7d85e");
    q.disc(4, -14, 1, "#f7d85e");
    q.rect(7, -11, 2, 2, "#ffdcc4");
    q.rect(8, -11, 1, 1, "#34c47a");
  }
  q.poly([[8, -14], [13, -14], [17, -10], [12, -10]], "#c8f4ff");
}

/** La nave mirando a la derecha, centrada en (x, y). */
export function drawShip(p, x, y, time, { flame = true, pilot = false, scale = 1 } = {}) {
  if (flame) {
    const length = (7 + (time % 6 < 3 ? 3 : 0)) * scale;
    const back = x - 26 * scale;
    p.poly([[back, y - 3 * scale], [back - length, y], [back, y + 3 * scale]], "#ff4fb0");
    p.poly([[back, y - 1.5 * scale], [back - length * 0.6, y], [back, y + 1.5 * scale]], "#ffe6f6");
  }
  shipStamp(p.ctx, x, y, (q) => drawHull(q, pilot), { scale });
  p.rect(x + 28 * scale, y, 2 * scale, scale, time % 30 < 15 ? "#ffe45e" : "#8a7a30");
}

// --- Nivel 1: el pasillo de la nave nodriza ---------------------------------------------------------------

export const SHIP_LENGTH = 1280;
export const HANGAR_X = 1120; // desde acá empieza el hangar
export const VENTS = [260, 590, 900]; // rejillas del techo por donde caen monstruos
const WINDOWS = [90, 260, 430, 600, 770, 940];

/** Pinta el pasillo una sola vez. Las ventanas quedan transparentes: detrás se ven las estrellas. */
export function paintMothership() {
  const canvas = makeCanvas(SHIP_LENGTH, H);
  const p = painter(canvas.getContext("2d"));
  const rand = seeded(42);

  p.rect(0, 0, SHIP_LENGTH, H, "#231d38");
  // Paneles de la pared con remaches.
  for (let x = 0; x < HANGAR_X; x += 64) {
    p.rect(x, 30, 62, 118, "#2b2442");
    p.rect(x, 30, 62, 1, "#3d3560");
    p.rect(x, 147, 62, 1, "#1a1530");
    [[x + 3, 33], [x + 57, 33], [x + 3, 143], [x + 57, 143]].forEach(([rx, ry]) => p.rect(rx, ry, 2, 2, "#4a4170"));
  }
  // Franja con la línea rosa de la agencia.
  p.rect(0, 118, HANGAR_X, 6, "#3a2f5c");
  p.rect(0, 120, HANGAR_X, 1, "#ff4fb0");
  // Techo con caños.
  p.rect(0, 0, SHIP_LENGTH, 26, "#171228");
  p.rect(0, 26, SHIP_LENGTH, 2, "#3b3358");
  p.rect(0, 8, SHIP_LENGTH, 3, "#2e2748");
  p.rect(0, 9, SHIP_LENGTH, 1, "#453c68");
  p.rect(0, 17, SHIP_LENGTH, 2, "#2a2342");
  for (let x = 20; x < SHIP_LENGTH; x += 48) p.rect(x, 7, 3, 5, "#453c68");
  // Rejillas de ventilación.
  VENTS.forEach((x) => {
    p.rect(x - 12, 22, 24, 6, "#0d0a18");
    for (let i = 0; i < 24; i += 3) p.rect(x - 12 + i, 22, 1, 6, "#3b3358");
  });
  // Ventanas: marco y hueco transparente.
  WINDOWS.forEach((x) => {
    p.rect(x - 3, 43, 54, 34, "#4a4170");
    p.rect(x - 2, 44, 52, 1, "#6a5f8f");
    p.ctx.clearRect(x, 46, 48, 28);
    p.rect(x + 23, 46, 2, 28, "#4a4170");
  });
  // Carteles hacia el hangar.
  [340, 680, 1010].forEach((x) => {
    p.rect(x, 88, 74, 13, "#ffe45e");
    p.text(say("hangar"), x + 4, 91, "#231d38");
    p.poly([[x + 58, 90], [x + 70, 94.5], [x + 58, 99]], "#231d38");
  });
  // Manchas verdes: algo se metió en la nave.
  for (let i = 0; i < 16; i++) {
    const x = rand() * (HANGAR_X - 40) + 20;
    const y = 36 + rand() * 100;
    p.ellipse(x, y, 3 + Math.round(rand() * 5), 1 + Math.round(rand() * 2), "#3f9c1f");
    const drips = 1 + Math.floor(rand() * 3);
    for (let d = 0; d < drips; d++) p.rect(x - 3 + rand() * 6, y, 1, 3 + rand() * 9, "#3f9c1f");
  }

  // Hangar: techo alto y una compuerta abierta al espacio (con campo de fuerza).
  p.rect(HANGAR_X, 28, SHIP_LENGTH - HANGAR_X, 122, "#1e1930");
  p.ctx.clearRect(HANGAR_X + 40, 34, SHIP_LENGTH - HANGAR_X - 50, 112);
  p.rect(HANGAR_X + 36, 34, 4, 116, "#4a4170");
  p.rect(SHIP_LENGTH - 10, 34, 4, 116, "#4a4170");
  for (let y = 34; y < 150; y += 8) p.rect(HANGAR_X + 36, y, 4, 4, "#ffe45e");

  // Piso de rejilla.
  p.rect(0, 150, SHIP_LENGTH, 30, "#3a3350");
  p.rect(0, 150, SHIP_LENGTH, 1, "#6a5f8f");
  for (let x = 0; x < SHIP_LENGTH; x += 8) p.rect(x, 151, 1, 29, "#2c2640");
  p.rect(0, 161, SHIP_LENGTH, 1, "#2c2640");
  p.rect(0, 172, SHIP_LENGTH, 1, "#2c2640");
  // Rayas de peligro en la entrada del hangar.
  for (let x = HANGAR_X - 8; x < HANGAR_X + 32; x += 8) p.poly([[x, 151], [x + 4, 151], [x + 8, 157], [x + 4, 157]], "#ffe45e");
  return canvas;
}

// --- Nivel 2: el planeta Carmín ----------------------------------------------------------------------------

export const PLANET_GROUND = 156;
export const LANDING = { x: 44, y: 130 }; // dónde queda estacionada la nave en el planeta

/** Tramas de dos colores "a cuadritos" (como se hacían los degradés en los 80). */
function dither(p, x, y, w, h, a, b) {
  p.rect(x, y, w, h, a);
  for (let j = 0; j < h; j++) for (let i = (j % 2) + x; i < x + w; i += 2) p.rect(i, y + j, 1, 1, b);
}

/** ship: si se ve la navecita aterrizada (en el aterrizaje del viaje todavía no está). */
export function paintCrimson({ ship = true } = {}) {
  const canvas = makeCanvas(W, H);
  const p = painter(canvas.getContext("2d"));
  const rand = seeded(9);
  // Cielo en franjas, de noche arriba a atardecer abajo.
  const sky = ["#1c0716", "#2a0a1c", "#44102a", "#6e1630", "#962336", "#b8322e", "#d4492f", "#e8663a"];
  sky.forEach((color, i) => {
    p.rect(0, i * 16, W, 16, color);
    if (i > 0) dither(p, 0, i * 16, W, 3, color, sky[i - 1]);
  });
  for (let i = 0; i < 40; i++) p.rect(rand() * W, rand() * 50, 1, 1, rand() > 0.5 ? "#ffffff" : "#e0b8d0");
  // Las tres lunas.
  drawMoon(p, 252, 34, MOONS[0]);
  drawMoon(p, 70, 26, MOONS[1]);
  drawMoon(p, 150, 60, MOONS[2]);
  // Mesetas lejanas y rocas.
  p.poly([[0, 128], [20, 112], [48, 112], [60, 122], [96, 120], [110, 104], [150, 104], [162, 118], [210, 122], [230, 108], [262, 108], [276, 120], [320, 116], [320, 150], [0, 150]], "#5a1426");
  p.poly([[0, 138], [30, 130], [70, 134], [120, 126], [180, 134], [240, 128], [290, 134], [320, 130], [320, 150], [0, 150]], "#7a1e28");
  // La navecita de Estela, aterrizada al fondo.
  if (ship) {
    drawShip(p, LANDING.x, LANDING.y, 0, { flame: false });
    p.rect(LANDING.x - 14, LANDING.y + 6, 2, 6, "#8a7fb0");
    p.rect(LANDING.x + 12, LANDING.y + 6, 2, 6, "#8a7fb0");
  }
  // Piso de roca roja.
  p.rect(0, 150, W, 30, "#8a2a22");
  p.rect(0, 150, W, 2, "#c2452f");
  dither(p, 0, 152, W, 2, "#a8362a", "#8a2a22");
  for (let i = 0; i < 60; i++) p.rect(rand() * W, 154 + rand() * 26, 2 + rand() * 4, 1, rand() > 0.5 ? "#6e1f1a" : "#a8362a");
  // Cráteres.
  [[40, 168], [180, 172], [270, 164]].forEach(([x, y]) => {
    p.ellipse(x, y, 10, 2, "#6e1f1a");
    p.ellipse(x, y - 1, 8, 1, "#5a1916");
  });
  return canvas;
}

// --- Nivel 3: el planeta Ámbar ---------------------------------------------------------------------

/** Desde el suelo del planeta, los anillos cruzan el cielo como un arco gigante. */
export function paintAmber({ ship = true } = {}) {
  const canvas = makeCanvas(W, H);
  const p = painter(canvas.getContext("2d"));
  const rand = seeded(17);
  const sky = ["#0a0a26", "#141238", "#1f1a4a", "#2e2358", "#40305e", "#583d62", "#7a5064", "#9c6a5e"];
  sky.forEach((color, i) => {
    p.rect(0, i * 16, W, 16, color);
    if (i > 0) dither(p, 0, i * 16, W, 3, color, sky[i - 1]);
  });
  for (let i = 0; i < 60; i++) p.rect(rand() * W, rand() * 70, 1, 1, rand() > 0.6 ? "#ffffff" : "#a8c8ff");
  // El arco de los anillos (varias franjas), con la sombra del planeta cortándolos.
  const bands = ["#f2e2b8", "#d9c08a", "#0a0a26", "#e8f4ff", "#b8d8ec", "#c9a86a", "#f7ecd0"];
  bands.forEach((color, i) => {
    for (let x = 0; x < W; x++) {
      const k = (x - 140) / 330;
      const y = 150 - Math.sqrt(Math.max(0, 1 - k * k)) * (118 - i * 5);
      if (x > 228 && x < 262) continue; // sombra del planeta sobre los anillos
      p.rect(x, y, 1, 2, color);
    }
  });
  // Una luna helada.
  drawSphere(p, 262, 34, 9, { base: "#cfe8f4", spots: [{ u: 0.5, v: 0.2, rx: 2, ry: 2, color: "#9cc0d4" }] });
  // Dunas doradas lejanas y cristales de hielo.
  p.poly([[0, 132], [40, 122], [90, 128], [140, 118], [200, 126], [260, 116], [320, 124], [320, 150], [0, 150]], "#7a5a2a");
  p.poly([[0, 140], [60, 134], [120, 140], [190, 132], [250, 138], [320, 134], [320, 150], [0, 150]], "#9c7434");
  [[96, 140, 5, 16], [104, 142, 3, 10], [286, 138, 6, 18], [276, 142, 3, 9], [168, 142, 3, 8]].forEach(([x, y, w, h]) => {
    p.poly([[x - w / 2, y], [x, y - h], [x + w / 2, y]], "#bfefff");
    p.poly([[x, y - h], [x + w / 2, y], [x, y]], "#7cc4e0");
  });
  if (ship) {
    drawShip(p, LANDING.x, LANDING.y, 0, { flame: false });
    p.rect(LANDING.x - 14, LANDING.y + 6, 2, 6, "#8a7fb0");
    p.rect(LANDING.x + 12, LANDING.y + 6, 2, 6, "#8a7fb0");
  }
  // Suelo dorado a franjas.
  p.rect(0, 150, W, 30, "#b8863a");
  p.rect(0, 150, W, 2, "#e8c27a");
  dither(p, 0, 152, W, 2, "#c99448", "#b8863a");
  for (let i = 0; i < 70; i++) p.rect(rand() * W, 154 + rand() * 26, 2 + rand() * 5, 1, rand() > 0.5 ? "#9a6c2a" : "#d9a352");
  return canvas;
}

/** Plantas alienígenas que brillan (se dibujan en cada cuadro porque laten). */
const PLANTS = [[14, 150], [110, 150], [210, 150], [304, 150]];

export function drawPlants(p, time) {
  PLANTS.forEach(([x, y], i) => {
    const glow = Math.sin(time * 0.05 + i * 1.7) > 0;
    p.line(x, y, x - 2, y - 9, "#5a1f4a", 1);
    p.line(x, y, x + 3, y - 7, "#5a1f4a", 1);
    p.disc(x - 2, y - 11, 2, glow ? "#ff9ad5" : "#d9589c");
    p.disc(x + 3, y - 9, 1, glow ? "#ffc2e6" : "#d9589c");
  });
}
