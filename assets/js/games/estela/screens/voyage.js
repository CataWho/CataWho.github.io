// Escenas de viaje (los "videos" entre niveles): Estela despega, cruza una zona del espacio,
// salta al hiperespacio y llega a un planeta nuevo. Cada viaje es una ficha en VOYAGES:
// de dónde sale, qué zona del espacio cruza y adónde llega. Todos usan la misma línea de tiempo:
// cada toma dura unos cuadros (60 cuadros = 1 segundo).

import { H, W } from "../../arcade/pixel.js";
import { SONGS } from "../audio.js";
import { drawCaption } from "../hud.js";
import {
  LANDING,
  MOONS,
  createStars,
  drawAmber,
  drawCrimson,
  drawEarth,
  drawMoon,
  drawShip,
  drawStars,
  paintAmber,
  paintCrimson,
} from "../scenery.js";
import { say } from "../texts.js";

// Tomas: [desde qué cuadro, nombre]. Subtítulos: [desde, hasta, número de texto].
const SHOTS = [
  [0, "takeoff"],
  [180, "cruise"],
  [540, "warp"],
  [680, "arrival"],
  [1000, "descent"],
];
const CAPTIONS = [
  [20, 175, 0],
  [200, 530, 1],
  [560, 670, 2],
  [700, 840, 3],
  [850, 995, 4],
];
const END = 1190;

const VOYAGES = {
  // De la nave nodriza (junto a la Tierra) al planeta Carmín.
  toCrimson: {
    texts: "voyage",
    music: SONGS.voyage,
    seed: 21,
    space: "#07040f",
    stars: ["#ffffff", "#b8b0d8", "#6a6090"],
    nebula: ["#ff4fb0", "#7b46c9"],
    from: "mothership",
    passing: "earth",
    to: "crimson",
    landing: () => paintCrimson({ ship: false }),
  },
  // Del planeta Carmín al planeta Ámbar, cruzando otra zona del espacio.
  toAmber: {
    texts: "voyage2",
    music: SONGS.voyage2,
    seed: 44,
    space: "#021216",
    stars: ["#e8fff8", "#8fe8d8", "#2f6f70"],
    nebula: ["#2fe0c0", "#39ff14"],
    from: "crimson",
    passing: "asteroids",
    to: "amber",
    landing: () => paintAmber({ ship: false }),
  },
};

function shotAt(t) {
  let current = SHOTS[0];
  SHOTS.forEach((shot) => {
    if (t >= shot[0]) current = shot;
  });
  return { name: current[1], t: t - current[0] };
}

/** Nubes de nebulosa, hechas con rayitas de dos colores. */
function drawNebula(p, offset, [a, b]) {
  [[60, 40, 50], [220, 120, 70], [380, 70, 40]].forEach(([x, y, size]) => {
    const sx = ((((x - offset) % 440) + 440) % 440) - 60;
    for (let i = 0; i < size / 3; i++) {
      p.alpha(0.18, () => p.rect(sx + ((i * 7) % size), y + ((i * 5) % (size / 3)), size / 2, 2, i % 2 ? a : b));
    }
  });
}

/** Asteroides que pasan (rocas irregulares) y un cometa. */
const ROCKS = [
  [40, 30, 7, 1.6],
  [150, 140, 5, 2.4],
  [260, 60, 9, 1.2],
  [340, 120, 4, 3],
  [420, 20, 6, 2],
];
function drawAsteroids(p, t) {
  ROCKS.forEach(([x, y, r, speed], i) => {
    const sx = ((((x - t * speed) % 460) + 460) % 460) - 70;
    p.poly([[sx - r, y], [sx - r * 0.4, y - r], [sx + r * 0.7, y - r * 0.8], [sx + r, y + r * 0.2], [sx + r * 0.2, y + r], [sx - r * 0.8, y + r * 0.6]], "#6b5a4a");
    p.rect(sx - r * 0.3, y - r * 0.4, Math.max(1, r * 0.4), Math.max(1, r * 0.3), "#8f7a64");
    p.rect(sx + (i % 2 ? 1 : -2), y + r * 0.3, 2, 1, "#4a3c30");
  });
  const cx = 360 - ((t * 1.3) % 520);
  for (let k = 0; k < 18; k++) p.alpha(1 - k / 18, () => p.rect(cx + k * 3, 24 + k * 0.6, 3, 1, k < 3 ? "#ffffff" : "#8fe8d8"));
}

function makeVoyage(config) {
  return function voyageScene(game) {
    const stars = createStars(config.seed, 110);
    const landingSite = config.landing();
    const departure = config.from === "crimson" ? paintCrimson({ ship: false }) : null;
    const texts = say(config.texts);
    let t = 0;
    const starOptions = { time: 0, colors: config.stars };

    function drawTakeoff(p, s) {
      if (departure) {
        // Despega desde el planeta: la nave sube en diagonal y se va.
        p.ctx.drawImage(departure, 0, 0);
        const k = s * s;
        drawShip(p, LANDING.x + k * 0.01, LANDING.y - k * 0.006, t, { pilot: true });
        if (s < 50) for (let i = 0; i < 5; i++) p.rect(LANDING.x - 16 + Math.random() * 34, LANDING.y + 10 + Math.random() * 8, 2, 1, "#e0603c");
        return;
      }
      drawStars(p, stars, s * 0.05, starOptions);
      drawEarth(p, 250, 230, 110, t * 0.0004);
      // La nave nodriza, con el hangar abierto.
      p.poly([[-20, 40], [110, 44], [140, 70], [140, 120], [110, 142], [-20, 146]], "#4a4170");
      p.poly([[-20, 52], [100, 56], [124, 74], [124, 116], [100, 132], [-20, 134]], "#5d5388");
      for (let x = 0; x < 100; x += 16) p.rect(x, 64, 10, 3, x % 32 ? "#ffe45e" : "#6fd6ff");
      p.rect(118, 84, 22, 26, "#1e1930");
      p.rect(118, 84, 22, 1, "#ffe45e");
      drawShip(p, 128 + 0.012 * s * s, 98 - s * 0.05, t, { pilot: true });
    }

    function drawCruise(p, s) {
      drawStars(p, stars, t * 2.2, { ...starOptions, streak: 2 });
      drawNebula(p, t * 1.2, config.nebula);
      if (config.passing === "earth") drawEarth(p, 330 - s * 0.45, 40, 20, t * 0.001);
      else {
        drawCrimson(p, 300 - s * 0.35, 36, 14, t * 0.001);
        drawAsteroids(p, t);
      }
      drawShip(p, 130 + Math.sin(t * 0.03) * 6, 92 + Math.sin(t * 0.05) * 4, t, { pilot: true, scale: 2 });
    }

    function drawWarp(p, s) {
      drawStars(p, stars, t * (2.2 + s * 0.15), { ...starOptions, streak: Math.min(40, s * 0.4) });
      const shake = s > 60 ? Math.round((Math.random() - 0.5) * 3) : 0;
      drawShip(p, 130 + shake, 92 + shake, t, { pilot: true, scale: 2 });
      if (s > 110) p.alpha(Math.min(1, (s - 110) / 30), () => p.rect(0, 0, W, H, "#ffffff"));
    }

    function drawArrival(p, s) {
      drawStars(p, stars, s * 0.1, starOptions);
      const cx = 205;
      const cy = 84;
      if (config.to === "amber") drawAmber(p, cx, cy, 30, t * 0.001);
      else {
        // Las lunas giran en órbitas achatadas: si están "atrás", se dibujan antes que el planeta.
        const moons = MOONS.map((moon, i) => {
          const angle = t * (0.012 - i * 0.003) + i * 2.1;
          return { moon, x: cx + Math.cos(angle) * (64 + i * 18), y: cy + Math.sin(angle) * (16 + i * 5), behind: Math.sin(angle) < 0 };
        });
        const small = (moon) => ({ ...moon, r: Math.max(4, Math.round(moon.r * 0.65)) });
        moons.filter((m) => m.behind).forEach((m) => drawMoon(p, m.x, m.y, small(m.moon)));
        drawCrimson(p, cx, cy, 40, t * 0.0015);
        moons.filter((m) => !m.behind).forEach((m) => drawMoon(p, m.x, m.y, small(m.moon)));
      }
      // La nave llega desde la izquierda y frena.
      const x = Math.min(110, -30 + s * 1.2 - s * s * 0.0015);
      drawShip(p, x, 118 - s * 0.03, t, { pilot: true });
      if (s < 20) p.alpha(1 - s / 20, () => p.rect(0, 0, W, H, "#ffffff"));
    }

    function drawDescent(p, s) {
      // La cámara baja: el paisaje sube desde abajo y la nave se posa en su lugar.
      const k = Math.min(1, s / 140);
      const offset = Math.round((1 - k) ** 2 * 90);
      p.ctx.drawImage(landingSite, 0, offset);
      if (offset > 0) p.rect(0, 0, W, offset, "#0a0616");
      const landed = s > 150;
      const y = landed ? LANDING.y : LANDING.y - (1 - Math.min(1, s / 150)) * 120 + offset;
      drawShip(p, LANDING.x + (1 - k) * 60, y, t, { pilot: true, flame: !landed });
      if (!landed && s > 100) {
        for (let i = 0; i < 4; i++) p.rect(LANDING.x - 12 + Math.random() * 30, LANDING.y + 10 + Math.random() * 6, 2, 1, "#e0a060");
      }
      if (s > 160) p.alpha(Math.min(1, (s - 160) / 30), () => p.rect(0, 0, W, H, "#000000"));
    }

    const DRAW = { takeoff: drawTakeoff, cruise: drawCruise, warp: drawWarp, arrival: drawArrival, descent: drawDescent };

    return {
      music: config.music,
      pausable: true,
      update() {
        t++;
        starOptions.time = t;
        if (t === 60) game.sound.play("engine");
        if (t === SHOTS[2][0]) game.sound.play("warp");
        if (t >= END || (t > 30 && game.pad.anyPressed("punch", "kick", "special"))) game.next();
      },
      draw(p) {
        p.rect(0, 0, W, H, config.space);
        const shot = shotAt(t);
        DRAW[shot.name](p, shot.t);
        const caption = CAPTIONS.find(([from, to]) => t >= from && t < to);
        if (caption) drawCaption(p, texts[caption[2]], (t - caption[0]) * 0.7, 150);
      },
    };
  };
}

export const voyageToCrimson = makeVoyage(VOYAGES.toCrimson);
export const voyageToAmber = makeVoyage(VOYAGES.toAmber);
