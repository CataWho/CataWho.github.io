// Los jefes del planeta Ámbar. Los dos se mueven todo el tiempo por la pantalla.
//
// La Babosa Reina: gigante, verde neón, se arrastra dejando baba, vomita chorros de baba y escupe
// huevos-burbuja que revientan en el piso ("¡buah!").
// Los huevos se pueden reventar en el aire con el sable. Cuando parece muerta...
// El Gusano Voltio: azul eléctrico, le sale del pecho. Ataca con tentáculos con pinzas
// (arriba: hay que agacharse; abajo: hay que saltar), los hace salir del piso debajo de Estela
// y suelta descargas eléctricas si se le acercan.

import { createStamper } from "../arcade/pixel.js";
import { GOO } from "./effects.js";
import { Shot } from "./fight.js";
import { attackPhase, between, defineMonsters, dist } from "./monsters.js";
import { say } from "./texts.js";

// El gusano con los tentáculos estirados no entra en el sello común: usa uno más grande.
const bigStamp = createStamper(256, 128, 150);

// --- Babosa Reina ----------------------------------------------------------------------------------

function splatEgg(shot, world) {
  // Al tocar el piso, el huevo revienta y salpica alrededor.
  world.shots.push(
    new Shot({
      x: shot.x, y: world.ground - 6, vx: 0, w: 30, h: 12, kind: "splash", fromHero: false, life: 10, clash: false,
      hit: { damage: 5, stun: 14, push: 2 },
    }),
  );
  world.fx.goo(shot.x, world.ground - 3, GOO.neon, 16, 0, 1.8);
  world.fx.text(say("splat"), shot.x, world.ground - 26, "#7dff5a");
  world.sound.play("buah");
}

function popEgg(shot, world) {
  world.fx.goo(shot.x, shot.y, GOO.neon, 8, 0, 1.2);
  world.fx.spark(shot.x, shot.y, ["#ffffff", "#c8ff9a"], 6, 1.2);
  world.sound.play("pop");
}

/** Vómito: mientras dura el ataque, un chorro de baba sale de la boca en arco y salpica el piso. */
function vomit(m, world) {
  const mouthX = m.x + m.facing * 32;
  const mouthY = m.y - 26;
  world.fx.goo(mouthX, mouthY, GOO.neon, 2, m.facing * 0.8, 1.2);
  if (m.t === m.move.startup) m.stream = {}; // todas las gotas de este vómito pegan una sola vez
  if ((m.t - m.move.startup) % 3) return;
  world.shots.push(
    new Shot({
      x: mouthX, y: mouthY, vx: m.facing * (1.4 + Math.random() * 1.8), vy: -1.2 - Math.random() * 1.2, gravity: 0.16, w: 6, h: 6,
      kind: "slime", fromHero: false, clash: false, group: m.stream,
      onLand: (shot) => world.fx.goo(shot.x, world.ground - 2, GOO.neon, 4, 0, 0.8),
      hit: { damage: 7, stun: 16, push: 2.2 },
    }),
  );
}

/** Escupe varios huevos en arco, repartidos alrededor de Estela. */
function layEggs(m, world) {
  const count = 2;
  const mouthX = m.x + m.facing * 32;
  const mouthY = m.y - 46;
  for (let i = 0; i < count; i++) {
    const target = world.hero.x + (i - (count - 1) / 2) * 36 + (Math.random() - 0.5) * 12;
    const time = 55 + i * 8; // cuadros de vuelo
    const vy = -3.2 - i * 0.3;
    // La gravedad justa para que caiga en el piso justo a ese tiempo.
    const gravity = (2 * (world.ground - 4 - mouthY - vy * time)) / (time * time);
    world.shots.push(
      new Shot({
        x: mouthX, y: mouthY, vx: (target - mouthX) / time, vy, gravity, w: 9, h: 9, kind: "egg", fromHero: false, life: 400,
        fragile: true, onLand: splatEgg, onPop: popEgg,
        hit: { damage: 5, stun: 14, push: 1.5 },
      }),
    );
  }
}

/**
 * La reina nunca se queda quieta: cada tanto elige un lugar (acercarse a Estela o irse a otra parte
 * de la pantalla) y se arrastra hasta ahí como una oruga, estirándose y encogiéndose, dejando baba.
 */
function crawl(m, world) {
  if (m.goal === undefined || --m.goalTime <= 0 || Math.abs(m.goal - m.x) < 4) {
    const hero = world.hero.x;
    m.goal = Math.random() < 0.6 ? hero - Math.sign(hero - m.x || 1) * 50 : 50 + Math.random() * (world.right - world.left - 100);
    m.goal = Math.max(world.left + 40, Math.min(world.right - 40, m.goal));
    m.goalTime = between([90, 180]);
  }
  const dir = Math.sign(m.goal - m.x);
  // Avanza a tirones: rápido cuando se estira, casi nada cuando se encoge.
  m.vx = dir * (0.15 + 0.55 * Math.max(0, Math.sin(m.time * 0.14)));
  m.facing = dir || m.facing;
  if (m.state !== "walk") m.setState("walk");
  if (m.time % 18 === 0) world.fx.goo(m.x - m.facing * 26, world.ground - 2, GOO.neon, 2, 0, 0.3);
}

function drawQueen(q, m) {
  const N = { dark: "#0f7a02", body: "#2fd80c", neon: "#39ff14", light: "#9dff6a", belly: "#d4ffb0", sac: "#b6ff5a", mouth: "#1a0520", eye: "#fff36b" };
  if (m.torn) {
    // El cuero vacío, abierto en el pecho, tirado en el piso.
    q.ellipse(-6, -4, 30, 4, N.dark);
    q.ellipse(-6, -5, 27, 3, "#1f9e0a");
    q.poly([[-2, -6], [1, -15], [4, -7], [8, -17], [11, -8], [14, -14], [16, -6]], "#1f9e0a");
    q.ellipse(28, -4, 9, 4, "#1f9e0a");
    q.rect(31, -6, 2, 1, "#6a6a3a");
    return;
  }
  const phase = attackPhase(m);
  const name = m.move?.name;
  const sag = m.state === "dead" ? Math.min(1, m.t / 90) : 0; // se desinfla al "morir"
  const breath = Math.sin(m.time * 0.08) * (1 - sag);
  let rear = 0; // cuánto levanta la cabeza
  if (name === "eggs" || name === "slam") rear = phase === "windup" ? Math.min(1, m.t / m.move.startup) : 0.5;
  // Al arrastrarse, el cuerpo se estira y se encoge (como una oruga).
  let stretch = m.state === "walk" ? Math.round(Math.sin(m.time * 0.14) * 4) : 0;
  if (name === "slide") stretch = phase === "windup" ? -4 : phase === "active" ? 6 : 0;

  // Cuerpo con lomo brillante y panza clara.
  const ry = Math.round(16 + breath - sag * 8);
  q.ellipse(-8 - stretch / 2, -ry - 1, 28 + stretch, ry, N.dark);
  q.ellipse(-8 - stretch / 2, -ry - 2, 26 + stretch, ry - 2, N.body);
  q.ellipse(-12, -ry * 1.4, 16, Math.max(1, Math.round(ry * 0.4)), N.neon);
  q.ellipse(-8 - stretch / 2, -2, 26 + stretch, 2, N.belly);
  // Sacos de huevos en el lomo (bien asquerosos).
  [[-24, -ry * 2 + 3, 5], [-12, -ry * 2 + 1, 6], [0, -ry * 2 + 4, 4]].forEach(([x, y, r]) => {
    q.disc(x, y, r, N.sac);
    q.disc(x + 1, y + 1, r - 2, "#6fcf2a");
    q.rect(x - 1, y - 1, 2, 2, "#1f5a0a");
    q.rect(x - r + 1, y - r + 1, 1, 1, "#ffffff");
  });
  // Pecho que late: adentro se ve algo azul (lo usa la escena de "¡todavía no!").
  if (m.bulge) {
    q.disc(6, -18, Math.round(4 + m.bulge * 8), "#2e8bff");
    q.disc(6, -18, Math.round(2 + m.bulge * 5), "#7fd4ff");
  }
  // Cuello y cabeza: se levanta para escupir, y en el golpe cae hacia adelante.
  let hx = 20 + stretch + rear * 4;
  let hy = -24 - rear * 22 + sag * 14;
  if (name === "slam" && phase === "active") {
    hx += 14;
    hy = -14;
  }
  q.line(8, -14, hx - 4, hy + 6, N.body, 12);
  q.ellipse(hx, hy, 12, 10, N.body);
  q.ellipse(hx + 1, hy - 2, 9, 6, N.light);
  if (name === "vomit" && phase === "active") {
    // Baja la cabeza y abre la boca grande para vomitar.
    hx += 4;
    hy += 6;
  }
  let open = name === "eggs" && phase !== "recover" ? 5 : name === "slam" && phase === "active" ? 4 : 2;
  if (name === "vomit") open = phase === "windup" ? 3 : phase === "active" ? 7 : 2;
  q.rect(hx + 5, hy + 2, 8, open, N.mouth);
  q.rect(hx + 6, hy + 2, 1, 1, "#ffffff");
  q.rect(hx + 10, hy + 2, 1, 1, "#ffffff");
  if (name === "eggs" && phase === "windup") q.disc(hx + 9, hy + 4, 3, N.sac);
  // Babas que chorrean.
  for (let i = 0; i < 3; i++) q.rect(hx + 6 + i * 3, hy + 2 + open, 1, 3 + ((m.time * 0.2 + i * 7) % 6), N.light);
  // Tres ojos en antenas.
  [[-4, -8], [2, -11], [7, -7]].forEach(([dx, h], i) => {
    const ex = hx + dx + Math.sin(m.time * 0.1 + i) * 1.5 - sag * 4;
    const ey = hy - 8 + h * (1 - sag);
    q.line(hx + dx * 0.5, hy - 6, ex, ey, N.body, 2);
    q.disc(ex, ey, 2, sag ? "#8a8a50" : N.eye);
    q.rect(ex + 1, ey, 1, 1, "#170c1c");
  });
}

// --- Gusano Voltio -------------------------------------------------------------------------------------

const B = { dark: "#0d3aa8", body: "#1f6bff", light: "#5fb0ff", ring: "#9fe0ff", belly: "#c8f0ff", eye: "#fff36b", pincer: "#dff6ff" };

/**
 * El gusano se desliza por el piso: casi siempre busca quedar a distancia de latigazo de Estela,
 * y a veces se va a otro lado para sorprenderla. Siempre la mira de frente.
 */
function slither(m, world) {
  const hero = world.hero.x;
  if (m.goal === undefined || --m.goalTime <= 0 || Math.abs(m.goal - m.x) < 4) {
    const side = Math.sign(m.x - hero) || 1;
    m.goal = Math.random() < 0.65 ? hero + side * (70 + Math.random() * 30) : 40 + Math.random() * (world.right - world.left - 80);
    m.goal = Math.max(world.left + 30, Math.min(world.right - 30, m.goal));
    m.goalTime = between([70, 150]);
  }
  const dir = Math.sign(m.goal - m.x);
  m.vx = dir * (0.5 + 0.45 * Math.abs(Math.sin(m.time * 0.2)));
  if (m.state !== "walk") m.setState("walk");
}

/** Una pinza: dos puntas en V (abierta o cerrada). */
function pincer(q, x, y, dir, open) {
  const spread = open ? 4 : 1;
  q.line(x, y, x + dir * 6, y - spread, B.pincer, 2);
  q.line(x, y, x + dir * 6, y + spread, B.pincer, 2);
}

/** Tentáculo flojo que ondula (una cadena de segmentos). */
function tentacle(q, [x, y], angle, time, phase, dir) {
  for (let i = 0; i < 7; i++) {
    angle += 0.12 * dir + Math.sin(time * 0.07 + i * 0.8 + phase) * 0.12;
    const nx = x + Math.cos(angle) * 5;
    const ny = y + Math.sin(angle) * 5;
    q.line(x, y, nx, ny, i < 4 ? B.body : B.light, i < 3 ? 4 : 3);
    x = nx;
    y = ny;
  }
  pincer(q, x, y, Math.cos(angle) >= 0 ? 1 : -1, Math.sin(time * 0.1 + phase) > 0);
}

function drawWorm(q, m) {
  const phase = attackPhase(m);
  const name = m.move?.name;
  const t = m.time;
  // Tentáculos de atrás.
  tentacle(q, [-6, -56], Math.PI * 0.85, t, 0, 1);
  tentacle(q, [-8, -44], Math.PI * 0.75, t, 2, 1);
  // Cuerpo: anillos apilados que ondulan (más fuerte cuando se desliza).
  const moving = m.state === "walk";
  const sway = moving ? 6 : 3;
  const speed = moving ? 0.16 : 0.05;
  let top = [0, -70];
  for (let i = 0; i < 8; i++) {
    const x = Math.sin(t * speed + i * 0.7) * (i / 7) * sway;
    const y = -6 - i * 9;
    const r = Math.round(13 - i * 0.6);
    q.ellipse(x, y, r, 6, B.dark);
    q.ellipse(x, y - 1, r - 1, 5, B.body);
    q.line(x - r + 2, y - 3, x + r - 2, y - 3, B.ring);
    q.rect(x + r - 5, y - 2, 3, 3, B.belly);
    top = [x, y];
  }
  // Cabeza con mandíbulas y tres ojos amarillos.
  const hx = top[0] + 2;
  const hy = top[1] - 8;
  q.ellipse(hx, hy, 11, 9, B.body);
  q.ellipse(hx + 1, hy - 2, 8, 5, B.light);
  q.line(hx + 8, hy + 3, hx + 14, hy + 8, B.pincer, 2);
  q.line(hx + 8, hy + 6, hx + 13, hy + 11, B.pincer, 2);
  [[2, -3], [6, -5], [9, -2]].forEach(([dx, dy]) => {
    q.rect(hx + dx, hy + dy, 2, 2, B.eye);
    q.rect(hx + dx + 1, hy + dy + 1, 1, 1, "#170c1c");
  });

  // Tentáculos de adelante: según el ataque, uno se estira como un látigo.
  const jab = name === "jabHigh" || name === "jabLow";
  if (jab) {
    const y = name === "jabHigh" ? -31 : -7;
    let length = 104;
    if (phase === "windup") length = 4;
    else if (phase === "recover") length = 104 * (1 - (m.t - m.move.startup - m.move.active) / m.move.recovery);
    q.line(6, -52, 12, y, B.body, 4);
    q.line(12, y, 12 + length, y, B.body, 4);
    q.line(12, y - 1, 12 + length, y - 1, B.light, 1);
    const tip = 12 + length;
    if (phase === "windup") q.disc(tip, y, 3 + (m.t % 6 < 3 ? 1 : 0), B.eye); // aviso: la pinza brilla
    pincer(q, tip, y, 1, phase === "windup");
  } else if (name === "burrow" && phase !== "recover") {
    // Hunde los tentáculos en el piso (salen debajo de Estela: ver drawWormFx).
    q.line(6, -52, 16, 0, B.body, 4);
    q.line(8, -40, 20, 0, B.body, 4);
  } else {
    tentacle(q, [6, -54], 0.3, t, 1, 1);
    tentacle(q, [8, -40], 0.6, t, 3, 1);
  }
}

/** Rayos en zigzag (se dibujan sin contorno, brillando). */
function bolt(p, x0, y0, x1, y1, color) {
  let [x, y] = [x0, y0];
  for (let i = 1; i <= 5; i++) {
    const nx = x0 + ((x1 - x0) * i) / 5 + (i < 5 ? (Math.random() - 0.5) * 8 : 0);
    const ny = y0 + ((y1 - y0) * i) / 5 + (i < 5 ? (Math.random() - 0.5) * 8 : 0);
    p.line(x, y, nx, ny, color);
    [x, y] = [nx, ny];
  }
}

function drawWormFx(p, m) {
  const phase = attackPhase(m);
  const name = m.move?.name;
  const ground = m.y;
  if (name === "burrow") {
    const x = m.target;
    if (phase === "windup" && m.t % 8 < 5) {
      // Aviso: el piso se raja y brilla donde va a salir el tentáculo.
      p.rect(x - 11, ground - 1, 22, 2, "#7fd4ff");
      bolt(p, x - 10, ground, x + 10, ground - 2, "#dff6ff");
    }
    if (phase === "active") {
      const h = Math.min(62, (m.t - m.move.startup + 1) * 14);
      p.line(x, ground, x, ground - h, B.dark, 8);
      p.line(x, ground, x, ground - h, B.body, 6);
      p.line(x - 1, ground, x - 1, ground - h, B.light, 1);
      p.line(x, ground - h, x - 6, ground - h - 8, B.pincer, 2);
      p.line(x, ground - h, x + 6, ground - h - 8, B.pincer, 2);
    }
  }
  if (name === "zap" && phase !== "recover") {
    // Descarga: chispas que crecen alrededor del cuerpo y después un anillo eléctrico.
    const n = phase === "active" ? 10 : Math.floor((m.t / m.move.startup) * 6);
    const { ctx } = p;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = phase === "active" ? 50 : 18 + Math.random() * 12;
      bolt(p, m.x, ground - 40, m.x + Math.cos(a) * r, ground - 40 + Math.sin(a) * r * 0.8, i % 2 ? "#7fd4ff" : "#ffffff");
    }
    if (phase === "active") p.alpha(0.25, () => p.ellipse(m.x, ground - 40, 55, 40, "#7fd4ff"));
    ctx.restore();
  }
}

defineMonsters({
  slugQueen: {
    name: "queen", hp: 140, width: 64, height: 44, body: [-32, -44, 64, 44], goo: "neon", gooAmount: 0,
    heavy: true, corpse: true, score: 3000, cool: [50, 90],
    moves: {
      eggs: { startup: 32, active: 2, recovery: 34, sfx: "egg", launch: layEggs },
      slam: { startup: 28, active: 8, recovery: 32, box: [14, -54, 40, 54], damage: 12, stun: 20, push: 3.2, knockdown: true, sfx: "kick" },
      vomit: { startup: 24, active: 40, recovery: 30, sfx: "buah", during: vomit },
      slide: { startup: 34, active: 44, recovery: 30, lunge: 2.2, box: [20, -22, 22, 22], damage: 10, stun: 18, push: 3, knockdown: true },
    },
    think(m, world) {
      const d = dist(m, world);
      if (--m.react <= 0) {
        m.react = between([10, 22]);
        if (d < 60 && m.attempt("slam", world)) return;
        if (d > 80 && Math.random() < 0.15 && m.attempt("slide", world)) return;
        if (d > 40 && d < 130 && Math.random() < 0.35 && m.attempt("vomit", world)) return;
        if (d > 40 && Math.random() < 0.6 && m.attempt("eggs", world)) return;
      }
      crawl(m, world);
    },
    draw: drawQueen,
  },
  voltWorm: {
    name: "worm", hp: 160, width: 28, height: 76, body: [-14, -78, 28, 78], goo: "volt", gooAmount: 130, gooPower: 3.6,
    heavy: true, score: 5000, cool: [34, 66], stamp: bigStamp,
    moves: {
      jabHigh: { startup: 26, active: 10, recovery: 22, box: [10, -36, 106, 9], damage: 9, stun: 16, push: 2.5, sfx: "slash" },
      jabLow: { startup: 26, active: 10, recovery: 22, box: [10, -11, 106, 9], damage: 9, stun: 16, push: 2.5, sfx: "slash" },
      burrow: {
        startup: 42, active: 8, recovery: 30, sfx: "heavy",
        launch(m, world) {
          world.shots.push(
            new Shot({
              x: m.target, y: world.ground - 30, vx: 0, w: 22, h: 60, kind: "burrow", fromHero: false, life: 8, clash: false,
              hit: { damage: 12, stun: 20, push: 3, knockdown: true, unblockable: true },
            }),
          );
          world.shake(4);
        },
      },
      zap: {
        startup: 34, active: 12, recovery: 30, sfx: "zap",
        launch(m, world) {
          world.shots.push(
            new Shot({
              x: m.x, y: world.ground - 40, vx: 0, w: 110, h: 80, kind: "zap", fromHero: false, life: 12, clash: false,
              hit: { damage: 10, stun: 18, push: 3.5, knockdown: true, unblockable: true },
            }),
          );
        },
      },
    },
    think(m, world) {
      const d = dist(m, world);
      if (--m.react <= 0) {
        m.react = between([8, 18]);
        if (d < 46 && Math.random() < 0.6 && m.attempt("zap", world)) return;
        const roll = Math.random();
        if (d < 112 && roll < 0.6 && m.attempt(roll < 0.3 ? "jabHigh" : "jabLow", world)) return;
        if (roll >= 0.6 && m.attempt("burrow", world)) {
          m.target = world.hero.x;
          return;
        }
      }
      slither(m, world);
    },
    draw: drawWorm,
    drawFx: drawWormFx,
  },
});
