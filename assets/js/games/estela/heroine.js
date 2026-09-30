// Estela, la protagonista: cómo se mueve, cómo pelea y cómo se dibuja.
//
// El dibujo es un "títere" de píxeles: la cabeza es un sprite fijo (dibujado letra por letra)
// y el cuerpo se arma con líneas entre articulaciones (cadera, rodillas, codos, manos).
// Cada pose es una lista de articulaciones; para animar, se mezcla de una pose a otra.
//
// Controles:
//   golpe = sablazo (tres seguidos hacen combo) · patada · abajo + golpe/patada = golpes bajos
//   poder = Onda estelar (disparo) · abajo + poder = Corte lunar (sube cortando, invencible al salir)
//   con la cruceta también salen: ↓ ↘ → + golpe = Onda · → ↓ ↘ + golpe = Corte lunar
//   caminar hacia el lado contrario al monstruo = cubrirse (retrocede con el sable en guardia)

import { createStamper, makeSprite } from "../arcade/pixel.js";
import { Fighter, Shot, worldBox } from "./fight.js";

const C = {
  hair: "#f7d85e",
  hairShade: "#d9a53b",
  hairLight: "#fff3b0",
  skin: "#ffdcc4",
  robe: "#f3eff8",
  robeShade: "#c3bbd6",
  lining: "#3a4aa8",
  belt: "#8a7fb0",
  suit: "#2a2f5e",
  suitShade: "#20244a",
  boot: "#4a3560",
  hilt: "#b3b8c4",
  hiltDark: "#5d6170",
};

// La cabeza, mirando un poquito a la derecha. Cada letra es un color (el punto es transparente).
const HEAD = makeSprite(
  [
    "..yYy......yYy..",
    ".yYYYy....yYYYy.",
    ".yYLYy....yYLYy.",
    "..yYYyyyyyyYYy..",
    "..yYYYYYYYYYYy..",
    ".yYYYYYLYYYYYYy.",
    ".YYYYYYYYYYYYYY.",
    "yYYYyYYYYYYYYYYy",
    "YYYyYSYYYSYYSYYY",
    "YYySSSSYSSSSSSYY",
    "YYSSSSKKSSSKKSYY",
    "YYSSSSWGSSSWGSYY",
    "YYsSSSgGSSSgGSYY",
    "YESSSSSSSSSSSsEY",
    ".YYsSSSSSMSSsYY.",
    ".YY.sSSSSSSs.YY.",
    ".Y....ssss....Y.",
  ],
  {
    Y: C.hair,
    y: C.hairShade,
    L: C.hairLight,
    S: C.skin,
    s: "#eeb399",
    K: "#3a2030",
    W: "#ffffff",
    G: "#34c47a",
    g: "#11603c",
    M: "#e0607a",
    E: "#1fbf6f",
  },
);

// --- Poses ----------------------------------------------------------------------------------
// Coordenadas mirando a la derecha, con los pies en (0, 0) y y negativo hacia arriba.
// hip cadera · chest pecho · head mentón · fe/fh codo y mano de adelante · be/bh los de atrás
// fk/ff rodilla y pie de adelante · bk/bf los de atrás · saber: ángulo del sable en grados.

const STANCE = {
  hip: [0, -16], chest: [1, -29], head: [2, -30],
  fe: [5, -23], fh: [9, -20], be: [-1, -22], bh: [7, -19],
  fk: [5, -8], ff: [7, 0], bk: [-4, -8], bf: [-6, 0],
  saber: -62,
};
const CROUCH = {
  ...STANCE,
  hip: [0, -9], chest: [2, -21], head: [3, -22],
  fe: [6, -15], fh: [10, -12], be: [1, -15], bh: [8, -11],
  fk: [7, -7], ff: [7, 0], bk: [-5, -3], bf: [-10, 0],
  saber: -40,
};
const JUMP = {
  ...STANCE,
  hip: [0, -20], chest: [1, -32], head: [2, -33],
  fe: [6, -27], fh: [9, -24], be: [-1, -26], bh: [7, -23],
  fk: [6, -15], ff: [3, -8], bk: [-2, -13], bf: [-6, -8],
  saber: -45,
};

export const POSES = {
  stance: STANCE,
  crouch: CROUCH,
  jump: JUMP,
  block: { ...STANCE, chest: [0, -28], head: [1, -29], fe: [5, -24], fh: [7, -27], be: [0, -23], bh: [6, -25], saber: -95 },
  crouchBlock: { ...CROUCH, fe: [6, -15], fh: [8, -19], bh: [7, -17], saber: -95 },
  hit: { ...STANCE, chest: [-3, -27], head: [-4, -28], fe: [-1, -21], fh: [2, -17], be: [-5, -22], bh: [0, -18], saber: 65 },
  win: { ...STANCE, fe: [4, -35], fh: [5, -41], be: [-3, -24], bh: [-2, -20], saber: -88 },
  // La del afiche: el sable parado al costado de la cara.
  guard: { ...STANCE, fe: [7, -22], fh: [11, -25], be: [2, -22], bh: [9, -23], saber: -84 },
};

/** Pose de ataque: base → preparación → golpe (de active a end) → vuelta a la base. */
const keys = (base, windup, active, end = {}) => ({
  base,
  windup: { ...base, ...windup },
  active: { ...base, ...active },
  end: { ...base, ...active, ...end },
});

function mix(a, b, k) {
  const out = {};
  for (const key in a) {
    out[key] = key === "saber" ? a.saber + (b.saber - a.saber) * k : [a[key][0] + (b[key][0] - a[key][0]) * k, a[key][1] + (b[key][1] - a[key][1]) * k];
  }
  return out;
}

// --- Movimientos ----------------------------------------------------------------------------------
// startup/active/recovery en cuadros · damage daño · stun cuánto queda aturdido el otro
// push cuánto lo empuja · box caja de golpe [dx, dy, ancho, alto] · chain qué golpe sigue en el combo

const MOVES = {
  slash1: {
    startup: 4, active: 4, recovery: 10, damage: 6, stun: 15, push: 1.4, box: [2, -44, 28, 36],
    chain: "slash2", cancelable: true, trail: true,
    pose: keys(
      STANCE,
      { chest: [0, -29], fe: [2, -29], fh: [2, -34], be: [-1, -27], bh: [1, -32], saber: -140 },
      { chest: [2, -28], head: [3, -29], fe: [8, -26], fh: [12, -23], be: [4, -24], bh: [10, -22], fk: [7, -8], ff: [9, 0], saber: -80 },
      { fh: [12, -20], bh: [10, -19], saber: 35 },
    ),
  },
  slash2: {
    startup: 4, active: 4, recovery: 11, damage: 6, stun: 15, push: 1.4, box: [2, -46, 26, 38],
    chain: "slash3", cancelable: true, trail: true,
    pose: keys(
      STANCE,
      { fe: [7, -20], fh: [11, -17], bh: [9, -16], saber: 40 },
      { chest: [2, -29], fe: [8, -26], fh: [12, -26], bh: [10, -25], saber: 20 },
      { fe: [6, -29], fh: [9, -32], bh: [7, -31], saber: -110 },
    ),
  },
  slash3: {
    startup: 7, active: 5, recovery: 18, damage: 10, stun: 20, push: 3.2, knockdown: true, box: [0, -44, 30, 40],
    cancelable: true, trail: true,
    pose: keys(
      STANCE,
      { chest: [-1, -28], head: [0, -29], fe: [-2, -25], fh: [-5, -27], be: [-3, -23], bh: [-4, -25], saber: -170 },
      { chest: [3, -27], head: [4, -28], fe: [9, -25], fh: [13, -23], be: [5, -24], bh: [11, -22], fk: [8, -8], ff: [10, 0], bk: [-6, -7], bf: [-9, 0], saber: -70 },
      { fh: [13, -19], bh: [11, -18], saber: 40 },
    ),
  },
  lowSlash: {
    startup: 4, active: 4, recovery: 10, damage: 5, stun: 14, push: 1.2, box: [4, -20, 28, 18],
    low: true, cancelable: true, trail: true,
    pose: keys(
      CROUCH,
      { fe: [4, -17], fh: [4, -20], bh: [3, -18], saber: -130 },
      { fe: [8, -14], fh: [12, -12], bh: [10, -11], saber: -30 },
      { fh: [12, -9], bh: [10, -8], saber: 20 },
    ),
  },
  kick: {
    startup: 7, active: 5, recovery: 13, damage: 9, stun: 17, push: 2.6, box: [6, -28, 20, 18],
    sfx: "kick", cancelable: true,
    pose: keys(
      STANCE,
      { fk: [7, -15], ff: [5, -9] },
      { chest: [-1, -28], head: [-1, -29], fe: [1, -24], fh: [2, -21], be: [-3, -23], bh: [1, -20], fk: [9, -18], ff: [17, -20], bk: [-3, -8], bf: [-4, 0], saber: -105 },
    ),
  },
  sweep: {
    startup: 7, active: 6, recovery: 18, damage: 7, stun: 0, push: 1, knockdown: true, box: [4, -8, 28, 8],
    sfx: "kick", low: true,
    pose: keys(
      CROUCH,
      { fk: [5, -6], ff: [4, -2] },
      { hip: [-1, -8], chest: [-2, -19], head: [-1, -20], fe: [2, -14], fh: [3, -11], bh: [1, -10], fk: [9, -4], ff: [19, -1], bk: [-5, -3], bf: [-9, 0], saber: -70 },
    ),
  },
  airSlash: {
    startup: 3, active: 8, recovery: 8, damage: 7, stun: 15, push: 1.5, box: [0, -42, 26, 32],
    air: true, trail: true,
    pose: keys(
      JUMP,
      { fe: [2, -33], fh: [1, -38], bh: [0, -36], saber: -150 },
      { fe: [8, -29], fh: [12, -26], bh: [10, -25], saber: -70 },
      { fh: [12, -22], bh: [10, -21], saber: 50 },
    ),
  },
  airKick: {
    startup: 4, active: 12, recovery: 4, damage: 9, stun: 17, push: 2.2, box: [4, -20, 20, 16],
    air: true, sfx: "kick",
    pose: keys(
      JUMP,
      {},
      { fk: [7, -13], ff: [15, -6], bk: [-2, -16], bf: [-6, -12], fe: [1, -28], fh: [1, -24], bh: [0, -23], saber: -100 },
    ),
  },
  // Onda estelar: dispara una estrella de energía (una sola en pantalla a la vez).
  wave: {
    startup: 12, active: 2, recovery: 24, sfx: "wave",
    launch(hero, world) {
      hero.shot = new Shot({
        x: hero.x + hero.facing * 18,
        y: hero.y - 24,
        vx: hero.facing * 3.2,
        w: 12,
        h: 12,
        kind: "wave",
        fromHero: true,
        hit: { damage: 10, stun: 18, push: 2.5, chip: 1 },
      });
      world.shots.push(hero.shot);
    },
    pose: keys(
      STANCE,
      { chest: [0, -29], fe: [-2, -25], fh: [-5, -24], be: [-3, -23], bh: [-4, -22], saber: -160 },
      { chest: [3, -28], head: [4, -29], fe: [9, -26], fh: [14, -24], be: [5, -24], bh: [12, -23], fk: [7, -8], ff: [10, 0], bk: [-6, -7], bf: [-9, 0], saber: 0 },
    ),
  },
  // Corte lunar: sube girando el sable. Es invencible al principio, pero si falla queda expuesta.
  rising: {
    startup: 4, active: 16, recovery: 14, damage: 13, stun: 22, push: 2, knockdown: true, box: [-2, -56, 24, 52],
    air: true, landLag: 14, sfx: "rising", trail: true,
    launch(hero) {
      hero.jump(-5.8, hero.facing * 1.4);
    },
    pose: keys(
      JUMP,
      { hip: [0, -10], chest: [2, -21], head: [3, -22], fk: [7, -7], ff: [7, 0], bk: [-5, -3], bf: [-10, 0], fe: [6, -15], fh: [9, -12], bh: [8, -11], saber: -30 },
      { fe: [5, -36], fh: [6, -42], be: [1, -33], bh: [5, -40], saber: -82 },
    ),
  },
};
Object.entries(MOVES).forEach(([name, move]) => (move.name = name));

// --- Dibujo ------------------------------------------------------------------------------------

const stamp = createStamper();
const rad = (degrees) => (degrees * Math.PI) / 180;

function limb(q, [ax, ay], [bx, by], [cx, cy], color) {
  q.line(ax, ay, bx, by, color, 3);
  q.line(bx, by, cx, cy, color, 3);
}

/** Una colita de pelo: una cadena de segmentos que ondula con el tiempo y flamea al moverse. */
function tail(q, [x, y], time, phase, color, lift) {
  let angle = Math.PI * 0.6 + lift;
  const points = [[x, y]];
  for (let i = 0; i < 10; i++) {
    angle += 0.035 + Math.sin(time * 0.09 + i * 0.55 + phase) * 0.07;
    x += Math.cos(angle) * 3.2;
    y += Math.sin(angle) * 3.2;
    points.push([x, y]);
  }
  for (let i = 0; i < points.length - 1; i++) {
    q.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], color, i < 3 ? 4 : i < 7 ? 3 : 2);
  }
  for (let i = 1; i < points.length - 2; i += 3) q.rect(points[i][0], points[i][1] - 1, 1, 1, C.hairLight);
}

function drawBody(q, P, { time = 0, vx = 0, vy = 0 }) {
  const [hx, hy] = P.head;
  const [cx, cy] = P.chest;
  const [px, py] = P.hip;
  const lift = Math.min(0.8, Math.abs(vx) * 0.25 + Math.max(0, vy) * 0.18) - (vy < 0 ? 0.15 : 0);

  // Las colitas salen de los rodetes.
  tail(q, [hx - 5, hy - 15], time, 0, C.hairShade, lift);
  tail(q, [hx + 4, hy - 15], time, 1.7, C.hair, lift + 0.1);

  // Piernas (la túnica tapa los muslos).
  limb(q, P.hip, P.bk, P.bf, C.suitShade);
  q.rect(P.bf[0] - 1, P.bf[1] - 2, 4, 2, C.boot);
  limb(q, P.hip, P.fk, P.ff, C.suit);
  q.rect(P.ff[0] - 1, P.ff[1] - 2, 4, 2, C.boot);

  // Brazo de atrás.
  limb(q, [cx - 2, cy + 1], P.be, P.bh, C.robeShade);
  q.rect(P.bh[0] - 1, P.bh[1] - 1, 2, 2, C.skin);

  // Capucha, capa y túnica (la capa flamea más cuando corre).
  const flare = 2 + Math.sin(time * 0.1) + Math.min(3, Math.abs(vx) * 1.5);
  q.ellipse(cx - 3, cy - 2, 4, 3, C.robeShade);
  q.poly([[cx - 3, cy - 1], [px - 9 - flare, py + 8], [px - 2, py + 9]], C.lining);
  q.poly([[cx - 4, cy - 1], [cx + 4, cy - 1], [px + 5, py + 1], [px + 6, py + 8], [px - 7 - flare * 0.5, py + 9], [px - 5, py]], C.robe);
  q.line(cx - 1, cy + 2, px - 2, py + 7, C.robeShade);
  q.line(px - 4, py - 1, px + 5, py - 1, C.belt);

  q.ctx.drawImage(HEAD, Math.round(hx - 8), Math.round(hy - 17));

  // Brazo de adelante con el mango del sable.
  const [fx, fy] = P.fh;
  const dx = Math.cos(rad(P.saber));
  const dy = Math.sin(rad(P.saber));
  q.line(fx - dx * 5, fy - dy * 5, fx + dx, fy + dy, C.hilt, 2);
  q.rect(fx - dx * 5, fy - dy * 5, 1, 1, C.hiltDark);
  limb(q, [cx + 1, cy + 1], P.fe, P.fh, C.robe);
  q.rect(fx - 1, fy - 1, 2, 2, C.skin);
}

/** La hoja del sable: un láser rosa que brilla (se dibuja sin contorno, por encima de todo). */
function drawBlade(p, [fx, fy], degrees, length = 20) {
  const x1 = fx + Math.cos(rad(degrees)) * length;
  const y1 = fy + Math.sin(rad(degrees)) * length;
  const { ctx } = p;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  p.alpha(0.3, () => p.line(fx, fy, x1, y1, "#ff4fb0", 5));
  ctx.restore();
  p.line(fx, fy, x1, y1, "#ff4fb0", 3);
  p.line(fx, fy, x1, y1, "#ffe6f6", 1);
}

/**
 * Dibuja a Estela en una pose. options: facing, scale, rotate, alpha, flash,
 * time/vx/vy (para el pelo y la capa), blade (si el sable está prendido) y trail (estela del corte).
 */
export function drawHeroine(p, x, y, pose, options = {}) {
  const { facing = 1, scale = 1, rotate = 0, alpha = 1, flash = null, blade = true, trail = [] } = options;
  stamp(p.ctx, x, y, (q) => drawBody(q, pose, options), { flip: facing < 0, scale, rotate, alpha, flash });
  if (!blade) return;
  const { ctx } = p;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(facing * scale, scale);
  trail.forEach((degrees, i) => {
    const [fx, fy] = pose.fh;
    const a = rad(degrees);
    const b = rad(trail[i + 1] ?? pose.saber);
    p.alpha(0.18 + i * 0.1, () =>
      p.poly([[fx, fy], [fx + Math.cos(a) * 21, fy + Math.sin(a) * 21], [fx + Math.cos(b) * 21, fy + Math.sin(b) * 21]], "#ff7cc6"),
    );
  });
  drawBlade(p, pose.fh, pose.saber);
  ctx.restore();
}

// --- La heroína en el juego ------------------------------------------------------------------------

export class Heroine extends Fighter {
  constructor(x, y) {
    super({ x, y, hp: 100, width: 12 });
    this.time = 0;
    this.invuln = 0;
    this.stun = 0;
    this.inputDx = 0;
    this.walkPhase = 0;
    this.shot = null;
    this.connected = false;
    this.queued = null;
    this.airAttack = false;
    this.blockLow = false;
    this.guarding = false;
    this.landFrames = 0;
  }

  get isAttacking() {
    return this.state === "attack";
  }

  hurtBox() {
    if (!this.onGround && this.state !== "fall") return worldBox(this, [-6, -40, 12, 32]);
    const low = this.state === "crouch" || this.state === "land" || (this.state === "block" && this.blockLow) || (this.state === "attack" && this.move.low);
    return worldBox(this, low ? [-7, -25, 14, 25] : [-6, -44, 12, 44]);
  }

  /** Un cuadro de juego. world.enemies son los monstruos (para mirarlos de frente). */
  update(pad, world) {
    this.time++;
    this.t++;
    if (this.invuln > 0) this.invuln--;
    this.inputDx = pad.axisX();

    // Siempre mira al monstruo más cercano; si no hay ninguno, mira para donde camina.
    const target = this.nearest(world.enemies);
    if (["idle", "walk", "crouch"].includes(this.state) && this.onGround) {
      if (target) this.facing = target.x >= this.x ? 1 : -1;
      else if (this.inputDx) this.facing = this.inputDx;
    }
    // Con un monstruo en pantalla, ir hacia el lado contrario es cubrirse: retrocede en guardia.
    this.guarding = Boolean(target) && this.inputDx === -this.facing;

    switch (this.state) {
      case "idle":
      case "walk":
      case "crouch":
        this.neutral(pad, world);
        break;
      case "jump":
        if (!this.airAttack && pad.pressed("punch")) this.attack("airSlash");
        else if (!this.airAttack && pad.pressed("kick")) this.attack("airKick");
        break;
      case "attack":
        this.attacking(pad, world);
        break;
      case "hit":
      case "block":
        this.vx *= 0.82;
        if (this.t >= this.stun) this.setState("idle");
        break;
      case "land":
        this.vx = 0;
        if (this.t >= this.landFrames) this.setState("idle");
        break;
      case "down":
        this.vx *= 0.8;
        if (this.t >= 40) {
          this.setState("idle");
          this.invuln = 45;
        }
        break;
      default:
        break;
    }
    this.physics(world);
  }

  nearest(enemies) {
    let best = null;
    enemies.forEach((enemy) => {
      if (!enemy.hittable || Math.abs(enemy.x - this.x) > 300) return;
      if (!best || Math.abs(enemy.x - this.x) < Math.abs(best.x - this.x)) best = enemy;
    });
    return best;
  }

  neutral(pad, world) {
    const dx = this.inputDx;
    const down = pad.held("down");
    const punch = pad.pressed("punch");
    const special = pad.pressed("special");
    if (this.trySpecial(pad)) return;
    if (punch) return this.attack(down ? "lowSlash" : "slash1");
    if (pad.pressed("kick")) return this.attack(down ? "sweep" : "kick");
    if (special) return; // la Onda ya está en pantalla: hay que esperar
    if (pad.held("up")) {
      this.jump(-5.2, dx * 1.5);
      this.setState("jump");
      this.airAttack = false;
      world.sound.play("jump");
      return;
    }
    if (down) {
      this.vx = 0;
      if (this.state !== "crouch") this.setState("crouch");
    } else if (dx) {
      this.vx = dx * (dx === this.facing ? 1.35 : 1.05);
      this.walkPhase += 0.22 * dx * this.facing;
      if (this.state !== "walk") this.setState("walk");
    } else {
      this.vx = 0;
      if (this.state !== "idle") this.setState("idle");
    }
  }

  /** Los dos poderes: con el botón de poder o con un movimiento de cruceta. */
  trySpecial(pad) {
    const punch = pad.pressed("punch");
    const special = pad.pressed("special");
    if (!punch && !special) return false;
    if ((special && pad.held("down")) || (punch && pad.motion([6, 2, 3], this.facing))) {
      this.attack("rising");
      this.invuln = 12;
      return true;
    }
    if (special || (punch && pad.motion([2, 3, 6], this.facing))) {
      if (this.shot && !this.shot.gone) return false;
      this.attack("wave");
      return true;
    }
    return false;
  }

  attack(name) {
    this.startMove(MOVES[name]);
    this.connected = false;
    this.queued = null;
    if (this.move.air) this.airAttack = true;
    if (this.onGround) this.vx = 0;
  }

  attacking(pad, world) {
    const m = this.move;
    if (this.t === m.startup) {
      world.sound.play(m.sfx ?? "slash");
      m.launch?.(this, world);
    }
    if (m.chain && pad.pressed("punch")) this.queued = m.chain;
    // Si el golpe conectó, se puede "cancelar" en un poder.
    if (this.connected && m.cancelable && this.trySpecial(pad)) return;
    if (this.t >= m.startup + m.active && this.queued) return this.attack(this.queued);
    if (this.onGround && !m.air) this.vx *= 0.7;
    if (this.t >= m.startup + m.active + m.recovery) {
      this.move = null;
      this.setState(this.onGround ? "idle" : "jump");
    }
  }

  landed(world) {
    if (this.state === "fall") {
      this.setState(this.hp > 0 ? "down" : "ko");
      world.shake(2);
    } else if (this.state === "ko") {
      this.vx = 0;
    } else if (this.state === "attack" && this.move.air) {
      this.landFrames = this.move.landLag ?? 3;
      this.move = null;
      this.setState("land");
    } else if (this.state === "jump") {
      this.landFrames = 3;
      this.setState("land");
    }
    if (this.state === "down" || this.state === "ko") this.vx *= 0.4;
  }

  /** Recibe un golpe. Devuelve "blocked", "hit", "ko" o null si no le hizo nada. */
  takeHit(hit, from, world) {
    if (this.invuln > 0 || this.hp <= 0 || ["down", "fall", "win"].includes(this.state)) return null;
    const fromDir = Math.sign(from.x - this.x) || this.facing;
    const canBlock = this.onGround && ["idle", "walk", "crouch", "block"].includes(this.state) && !hit.unblockable;
    if (canBlock && this.inputDx === -fromDir) {
      this.blockLow = this.state === "crouch" || (this.state === "block" && this.blockLow);
      this.setState("block");
      this.stun = Math.round(hit.stun * 0.7) + 2;
      this.vx = -fromDir * (hit.push ?? 1.5) * 0.8;
      this.hp = Math.max(1, this.hp - (hit.chip ?? 0));
      return "blocked";
    }
    this.hp = Math.max(0, this.hp - hit.damage);
    this.move = null;
    this.queued = null;
    world.sound.play("hurt");
    if (this.hp <= 0) {
      this.setState("ko");
      this.jump(-3.2, -fromDir * 1.6);
      return "ko";
    }
    if (hit.knockdown || !this.onGround) {
      this.setState("fall");
      this.jump(-3, -fromDir * 1.8);
      return "hit";
    }
    this.setState("hit");
    this.stun = hit.stun;
    this.vx = -fromDir * (hit.push ?? 1.5);
    return "hit";
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  celebrate() {
    this.move = null;
    this.vx = 0;
    this.setState("win");
  }

  poseAt(t) {
    const m = this.move;
    const { base, windup, active, end } = m.pose;
    if (t < m.startup) return mix(base, windup, t / m.startup);
    if (t < m.startup + m.active) return mix(active, end, (t - m.startup) / m.active);
    return mix(end, base, Math.min(1, (t - m.startup - m.active) / m.recovery));
  }

  pose() {
    switch (this.state) {
      case "attack":
        return this.poseAt(this.t);
      case "walk": {
        const s = Math.sin(this.walkPhase);
        const c = Math.cos(this.walkPhase);
        return {
          ...(this.guarding ? POSES.block : STANCE),
          hip: [0, -16 - Math.abs(c) * 0.8],
          ff: [1 + 6 * s, -Math.max(0, c) * 3],
          fk: [3 + 3 * s, -8 - Math.max(0, c) * 2],
          bf: [-1 - 6 * s, -Math.max(0, -c) * 3],
          bk: [-1 - 3 * s, -8 - Math.max(0, -c) * 2],
        };
      }
      case "crouch":
        return this.guarding ? POSES.crouchBlock : CROUCH;
      case "land":
        return CROUCH;
      case "jump":
        return JUMP;
      case "block":
        return this.blockLow ? POSES.crouchBlock : POSES.block;
      case "hit":
      case "fall":
      case "down":
      case "ko":
        return POSES.hit;
      case "win":
        return POSES.win;
      default: {
        // Respira: el torso sube y baja un píxel.
        const breath = Math.sin(this.time * 0.06) > 0 ? 0 : 1;
        const pose = { ...STANCE };
        ["chest", "head", "fe", "fh", "be", "bh"].forEach((key) => (pose[key] = [pose[key][0], pose[key][1] + breath]));
        return pose;
      }
    }
  }

  draw(p) {
    const lying = (this.state === "down" || this.state === "ko") && this.onGround;
    const falling = this.state === "fall" || (this.state === "ko" && !this.onGround);
    let rotate = 0;
    if (lying) rotate = (-Math.PI / 2) * this.facing;
    else if (falling) rotate = -Math.min(1, this.t / 18) * (Math.PI / 2) * 0.8 * this.facing;

    const pose = this.pose();
    const trail = [];
    const m = this.move;
    if (this.state === "attack" && m.trail && this.t >= m.startup && this.t < m.startup + m.active + 2) {
      for (let k = 3; k >= 1; k--) if (this.t - k >= m.startup) trail.push(this.poseAt(this.t - k).saber);
    }
    drawHeroine(p, this.x, lying ? this.y - 6 : this.y, pose, {
      facing: this.facing,
      rotate,
      alpha: this.invuln > 0 && this.state !== "attack" && this.time % 6 < 3 ? 0.45 : 1,
      time: this.time,
      vx: this.vx,
      vy: this.vy,
      blade: !lying && !falling,
      trail,
    });
  }
}
