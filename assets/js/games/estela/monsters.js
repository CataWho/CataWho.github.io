// Los monstruos: cómo se ven, cómo atacan y cómo "piensan".
//
// Cada tipo es una ficha en KINDS con su vida, su caja de cuerpo, sus ataques (misma tabla
// que los de Estela: startup/active/recovery…), una función think() que decide qué hacer
// y una función draw() que lo dibuja mirando a la derecha con los pies en (0, 0).
// Para sumar un monstruo nuevo alcanza con agregar una ficha (acá o con defineMonsters).

import { createStamper } from "../arcade/pixel.js";
import { Fighter, Shot, worldBox } from "./fight.js";
import { GOO } from "./effects.js";
import { say } from "./texts.js";

const stamp = createStamper();
export const between = ([min, max]) => min + Math.floor(Math.random() * (max - min));
export const dist = (m, world) => Math.abs(world.hero.x - m.x);

export function walkToward(m, world, speed) {
  m.vx = Math.sign(world.hero.x - m.x) * speed;
  if (m.state !== "walk") m.setState("walk");
}

export function stand(m) {
  m.vx = 0;
  if (m.state !== "idle") m.setState("idle");
}

function hop(m, vx, vy) {
  m.jump(vy, vx);
  m.setState("jump");
}

/** ¿Viene una Onda estelar hacia este monstruo? */
const incoming = (m, world, range) =>
  world.shots.some((shot) => shot.fromHero && Math.abs(shot.x - m.x) < range && Math.sign(m.x - shot.x) === Math.sign(shot.vx));

/** En qué parte del ataque está: "windup" (preparación), "active" (golpe), "recover" o null. */
export function attackPhase(m) {
  if (m.state !== "attack") return null;
  if (m.t < m.move.startup) return "windup";
  return m.t < m.move.startup + m.move.active ? "active" : "recover";
}

// --- Dibujos ----------------------------------------------------------------------------------------

function drawSlug(q, m) {
  const phase = attackPhase(m);
  const wiggle = m.state === "walk" ? Math.sin(m.time * 0.2) : 0;
  const stretch = phase === "windup" ? -2 : phase === "active" ? 3 : wiggle;
  const rx = Math.round(10 + stretch);
  const ry = Math.round(5 - stretch * 0.4);
  q.ellipse(0, -ry - 1, rx, ry, "#3f9c1f");
  q.ellipse(1, -ry - 2, rx - 2, ry - 1, "#5fcf2f");
  q.rect(-rx + 2, -2, rx * 2 - 3, 2, "#b8f78a");
  q.rect(-3, -ry * 2, 2, 1, "#a9f77a");
  q.rect(-7, -ry - 3, 2, 1, "#a9f77a");
  // Ojos en antenas.
  const top = -ry * 2 - 1;
  q.line(rx - 6, top + 3, rx - 5, top - 3, "#5fcf2f", 2);
  q.line(rx - 3, top + 3, rx - 1, top - 2, "#5fcf2f", 2);
  q.disc(rx - 5, top - 4, 2, "#ffffff");
  q.rect(rx - 4, top - 4, 1, 1, "#170c1c");
  q.disc(rx - 1, top - 3, 2, "#ffffff");
  q.rect(rx, top - 3, 1, 1, "#170c1c");
  // Boca: se abre grande para morder.
  const open = phase === "windup" || phase === "active" ? 3 : 1;
  q.rect(rx - 3, -3 - open, 3, open + 1, "#2a0f18");
  if (open > 1) {
    q.rect(rx - 3, -3 - open, 1, 1, "#ffffff");
    q.rect(rx - 1, -3 - open, 1, 1, "#ffffff");
    q.rect(rx - 2, -2, 1, 1, "#ffffff");
  }
}

function drawGremlin(q, m, spitter) {
  const G = spitter
    ? { skin: "#a3d42a", dark: "#5f8a17", belly: "#e6f7a3" }
    : { skin: "#4fb335", dark: "#2f7a1f", belly: "#a6e86f" };
  const phase = attackPhase(m);
  const step = m.state === "walk" ? Math.round(Math.sin(m.walkPhase * 2) * 2) : 0;
  const lift = m.onGround ? 0 : 3;
  // Piernas cortitas.
  q.line(-2, -9, -4 - step, -lift, G.dark, 2);
  q.line(2, -9, 3 + step, -lift, G.dark, 2);
  q.rect(-6 - step, -1 - lift, 3, 1, G.dark);
  q.rect(3 + step, -1 - lift, 3, 1, G.dark);
  q.line(-3, -15, -7, -9, G.dark, 2);
  // Cuerpo y cabezota con orejas.
  q.ellipse(0, -13, 6, 5, G.skin);
  q.ellipse(1, -12, 3, 3, G.belly);
  q.poly([[-3, -24], [-11, -30], [-4, -20]], G.skin);
  q.poly([[4, -25], [10, -32], [6, -21]], G.skin);
  q.disc(1, -21, 6, G.skin);
  q.rect(-3, -25, 2, 1, G.belly);
  // Tres ojos amarillos.
  [[0, -23], [4, -23], [2, -26]].forEach(([x, y]) => {
    q.rect(x, y, 2, 2, "#ffe14d");
    q.rect(x + 1, y + 1, 1, 1, "#170c1c");
  });
  // Boca (el escupidor la infla antes de escupir).
  const charging = spitter && phase === "windup";
  if (charging) q.disc(5, -16, 2 + (m.t % 8 < 4 ? 1 : 0), "#c9ff9a");
  q.rect(1, -18, 6, charging ? 3 : 2, "#2a0f18");
  q.rect(2, -18, 1, 1, "#ffffff");
  q.rect(5, -18, 1, 1, "#ffffff");
  // Brazo de adelante con garras.
  let hand = [7, -11];
  if (phase === "windup" && !spitter) hand = [3, -28];
  else if (phase === "active" || (m.move?.air && !m.onGround)) hand = [15, -18];
  q.line(3, -15, hand[0], hand[1], G.skin, 2);
  q.line(hand[0], hand[1], hand[0] + 3, hand[1] - 2, "#ffffff");
  q.line(hand[0], hand[1], hand[0] + 3, hand[1] + 1, "#ffffff");
}

function drawLeaper(q, m) {
  const P = { skin: "#ff6fb5", dark: "#c2378a", light: "#ffb3dc", claw: "#fff0f6", eye: "#35f2ff" };
  const phase = attackPhase(m);
  const air = !m.onGround;
  const step = m.state === "walk" ? Math.sin(m.walkPhase * 1.5) * 3 : 0;
  // Cola con punta de flecha.
  const sway = Math.round(Math.sin(m.time * 0.12) * 3);
  q.line(-3, -14, -10, -17, P.dark, 2);
  q.line(-10, -17, -13, -25 + sway, P.dark, 2);
  q.poly([[-16, -26 + sway], [-10, -26 + sway], [-13, -31 + sway]], P.dark);
  // Patas de cabra.
  if (air && m.move?.name === "leap") {
    q.line(-2, -14, -6, -9, P.dark, 2);
    q.line(-6, -9, -3, -5, P.dark, 2);
    q.line(1, -14, 8, -10, P.skin, 2);
    q.line(8, -10, 15, -8, P.skin, 2);
  } else if (air) {
    q.line(-2, -14, 1, -9, P.dark, 2);
    q.line(1, -9, -2, -6, P.dark, 2);
    q.line(2, -14, 6, -10, P.skin, 2);
    q.line(6, -10, 3, -6, P.skin, 2);
  } else {
    q.line(-2, -14, -4 - step, -8, P.dark, 2);
    q.line(-4 - step, -8, -2 - step, -3, P.dark, 2);
    q.line(-2 - step, -3, -5 - step, 0, P.dark, 2);
    q.line(2, -14, 4 + step, -8, P.skin, 2);
    q.line(4 + step, -8, 2 + step, -3, P.skin, 2);
    q.line(2 + step, -3, 5 + step, 0, P.skin, 2);
  }
  q.line(-1, -25, -5, -19, P.dark, 2);
  q.line(-5, -19, -3, -14, P.dark, 2);
  // Torso y cabeza con cuernos.
  q.poly([[-4, -27], [4, -27], [3, -14], [-3, -14]], P.skin);
  q.rect(-1, -24, 3, 7, P.light);
  q.ellipse(2, -31, 5, 4, P.skin);
  q.line(-1, -34, -4, -40, P.claw, 2);
  q.line(4, -34, 6, -40, P.claw, 2);
  q.rect(3, -33, 2, 2, P.eye);
  q.rect(6, -33, 1, 2, P.eye);
  q.rect(4, -32, 1, 1, "#170c1c");
  q.rect(2, -29, 6, 1, "#5a0f33");
  q.rect(3, -29, 1, 1, "#ffffff");
  q.rect(6, -29, 1, 1, "#ffffff");
  // Brazo largo con garras.
  let hand = [7, -17];
  if (phase === "windup") hand = [0, -37];
  else if (phase === "active") hand = [19, -25];
  const elbow = [(2 + hand[0]) / 2 + 2, (-25 + hand[1]) / 2 + 3];
  q.line(2, -25, elbow[0], elbow[1], P.skin, 2);
  q.line(elbow[0], elbow[1], hand[0], hand[1], P.skin, 2);
  [-2, 0, 2].forEach((dy) => q.line(hand[0], hand[1], hand[0] + 3, hand[1] + dy, P.claw));
}

function drawBrute(q, m) {
  const V = { skin: "#7b46c9", dark: "#52289a", light: "#a47be6", fist: "#9b6be8", horn: "#f0e2ff", eye: "#ff4fb0" };
  const phase = attackPhase(m);
  const name = m.move?.name;
  const step = m.state === "walk" ? Math.round(Math.sin(m.walkPhase) * 2) : 0;
  const lean = name === "charge" && phase !== "recover" ? 4 : 0;
  // Piernas gruesas.
  q.line(-5, -18, -7 - step, -2, V.dark, 5);
  q.line(5, -18, 6 + step, -2, V.skin, 5);
  q.rect(-11 - step, -2, 7, 2, V.dark);
  q.rect(4 + step, -2, 8, 2, V.dark);
  // Brazo de atrás.
  const backFist = m.blocking > 0 ? [9, -44] : phase === "windup" && name === "smash" ? [0, -60] : [-15, -22];
  q.line(-10 + lean, -42, backFist[0], backFist[1], V.dark, 4);
  q.disc(backFist[0], backFist[1], 4, V.dark);
  // Torso con placas en la panza.
  q.poly([[-12 + lean, -46], [12 + lean, -46], [9, -18], [-9, -18]], V.skin);
  [-38, -33, -28, -23].forEach((y) => q.rect(-5 + lean / 2, y, 10, 2, V.light));
  q.disc(-11 + lean, -43, 5, V.fist);
  q.disc(11 + lean, -43, 5, V.fist);
  // Cabeza chiquita con cuernos y ojos que brillan.
  q.disc(3 + lean, -48, 5, V.dark);
  q.poly([[-1 + lean, -51], [-7 + lean, -59], [1 + lean, -54]], V.horn);
  q.poly([[6 + lean, -52], [11 + lean, -59], [8 + lean, -51]], V.horn);
  q.rect(4 + lean, -49, 2, 1, V.eye);
  q.rect(7 + lean, -49, 1, 1, V.eye);
  q.rect(4 + lean, -45, 5, 1, "#2a0f30");
  q.rect(8 + lean, -46, 1, 2, V.horn);
  // Brazo de adelante con el puño enorme.
  let fist = [15, -22];
  if (m.blocking > 0) fist = [14, -40];
  else if (name === "smash") fist = phase === "windup" ? [6, -62] : phase === "active" ? [23, -10] : [20, -14];
  else if (name === "charge" && phase !== "recover") fist = [18, -36];
  else if (name === "pound" && !m.onGround) fist = [12, -58];
  const elbow = [(11 + fist[0]) / 2 + 3, (-42 + fist[1]) / 2 + 2];
  q.line(11 + lean, -42, elbow[0], elbow[1], V.skin, 4);
  q.line(elbow[0], elbow[1], fist[0], fist[1], V.skin, 4);
  q.disc(fist[0], fist[1], 5, V.fist);
  q.rect(fist[0] - 1, fist[1] - 3, 2, 1, V.horn);
}

// --- Fichas de cada monstruo ----------------------------------------------------------------------

const KINDS = {
  // Nivel 1 (verdes)
  slug: {
    hp: 12, width: 20, height: 11, body: [-10, -11, 20, 11], goo: "green", gooAmount: 18, score: 100, cool: [40, 90],
    moves: {
      bite: { startup: 22, active: 10, recovery: 26, lunge: 2.4, box: [4, -10, 14, 9], damage: 7, stun: 16, push: 2 },
    },
    think(m, world) {
      if (dist(m, world) > 22) walkToward(m, world, 0.35 + 0.3 * Math.max(0, Math.sin(m.time * 0.2)));
      else {
        stand(m);
        m.attempt("bite", world);
      }
    },
    draw: drawSlug,
  },
  gremlin: {
    hp: 20, width: 14, height: 26, body: [-7, -27, 14, 27], goo: "green", gooAmount: 24, score: 150, cool: [30, 80],
    moves: {
      claw: { startup: 14, active: 5, recovery: 18, box: [4, -27, 16, 16], damage: 7, stun: 16, push: 2, sfx: "slash" },
      pounce: {
        startup: 12, active: 90, recovery: 18, air: true, box: [0, -24, 16, 18], damage: 8, stun: 16, push: 2.2, sfx: "jump",
        launch: (m) => m.jump(-3.6, m.facing * 2.2),
      },
    },
    think(m, world) {
      const d = dist(m, world);
      if (d < 22) {
        stand(m);
        m.attempt("claw", world);
      } else if (d > 44 && d < 80 && Math.random() < 0.02 && m.attempt("pounce", world)) {
        // salta encima de Estela
      } else walkToward(m, world, 0.75);
    },
    draw: (q, m) => drawGremlin(q, m, false),
  },
  spitter: {
    hp: 16, width: 14, height: 26, body: [-7, -27, 14, 27], goo: "green", gooAmount: 24, score: 200, cool: [70, 120],
    moves: {
      spit: {
        startup: 28, active: 2, recovery: 26, sfx: "spit",
        launch(m, world) {
          world.shots.push(
            new Shot({ x: m.x + m.facing * 10, y: m.y - 30, vx: m.facing * 2.2, w: 6, h: 6, kind: "spit", fromHero: false, hit: { damage: 6, stun: 14, push: 1.5 } }),
          );
        },
      },
    },
    think(m, world) {
      const d = dist(m, world);
      if (d < 64) {
        m.vx = -m.facing * 0.7;
        if (m.state !== "walk") m.setState("walk");
      } else if (d > 130) walkToward(m, world, 0.7);
      else {
        stand(m);
        m.attempt("spit", world);
      }
    },
    draw: (q, m) => drawGremlin(q, m, true),
  },

  // Nivel 2 (violetas y rosas): pelean de a uno, en una sola pantalla.
  leaper: {
    name: "leaper", hp: 80, width: 14, height: 34, body: [-7, -35, 14, 35], goo: "pink", gooAmount: 70, gooPower: 3, score: 1000, cool: [14, 40],
    moves: {
      scratch: { startup: 6, active: 4, recovery: 10, box: [4, -33, 18, 16], damage: 6, stun: 14, push: 1.5, followUp: ["scratch2", 0.5], sfx: "slash" },
      scratch2: { startup: 5, active: 4, recovery: 16, box: [4, -29, 20, 14], damage: 7, stun: 16, push: 2.5, sfx: "slash" },
      leap: {
        startup: 10, active: 90, recovery: 14, air: true, box: [2, -20, 18, 16], damage: 10, stun: 18, push: 2.5, sfx: "jump",
        launch: (m, world) => m.jump(-4.4, m.facing * Math.min(2.8, Math.max(1.4, dist(m, world) / 34))),
      },
    },
    think(m, world) {
      const d = dist(m, world);
      if (--m.react <= 0) {
        m.react = between([8, 20]);
        if (incoming(m, world, 80) && Math.random() < 0.55) return hop(m, m.facing * 2, -4.6); // salta la Onda
        if (world.hero.isAttacking && d < 44 && Math.random() < 0.3) return hop(m, -m.facing * 2.2, -4); // voltereta atrás
        if (d < 28 && m.attempt(Math.random() < 0.8 ? "scratch" : "leap", world)) return;
        if (d > 50 && d < 110 && Math.random() < 0.3 && m.attempt("leap", world)) return;
      }
      if (d > 24) walkToward(m, world, 1.5);
      else stand(m);
    },
    draw: drawLeaper,
  },
  brute: {
    name: "brute", hp: 120, width: 24, height: 52, body: [-12, -52, 24, 52], goo: "pink", gooAmount: 100, gooPower: 3.4, score: 1500, cool: [30, 60],
    stunScale: 0.7, weight: 0.6,
    moves: {
      smash: { startup: 22, active: 6, recovery: 24, box: [8, -50, 28, 50], damage: 14, stun: 20, push: 3, knockdown: true, sfx: "kick" },
      charge: { startup: 20, active: 34, recovery: 22, lunge: 3, armor: true, box: [6, -46, 18, 42], damage: 12, stun: 20, push: 3, knockdown: true, sfx: "kick" },
      pound: {
        startup: 12, active: 90, recovery: 30, air: true, box: [-14, -22, 28, 22], damage: 10, stun: 18, push: 2, knockdown: true, sfx: "jump",
        launch: (m) => m.jump(-5, 0),
        // Al caer, manda dos ondas por el piso: hay que saltarlas (no se pueden cubrir).
        onLand(m, world) {
          [-1, 1].forEach((dir) =>
            world.shots.push(
              new Shot({
                x: m.x + dir * 16, y: world.ground - 4, vx: dir * 2.6, w: 10, h: 8, kind: "quake", fromHero: false, life: 100,
                hit: { damage: 9, stun: 16, push: 2, unblockable: true },
              }),
            ),
          );
          world.shake(5);
          world.sound.play("quake");
        },
      },
    },
    think(m, world) {
      const d = dist(m, world);
      if (--m.react <= 0) {
        m.react = between([10, 24]);
        if (((world.hero.isAttacking && d < 56) || incoming(m, world, 90)) && Math.random() < 0.4) {
          m.blocking = 26;
          return stand(m);
        }
        if (d < 38 && m.attempt(Math.random() < 0.75 ? "smash" : "pound", world)) return;
        if (d > 60 && Math.random() < 0.22 && m.attempt("charge", world)) return;
        if (d > 40 && d < 110 && Math.random() < 0.12 && m.attempt("pound", world)) return;
      }
      if (m.blocking > 0 || d <= 32) stand(m);
      else walkToward(m, world, 0.7);
    },
    draw: drawBrute,
  },
};
/**
 * Suma fichas de monstruos (los jefes viven en su propio archivo, bosses.js).
 * Opciones extra de una ficha: heavy (gigante: no se aturde ni se lo empuja), corpse (al morir queda
 * en el piso en vez de reventar), stamp (un sello más grande si no entra en el común) y
 * drawFx(p, m) (lo que se dibuja encima sin contorno: rayos, marcas en el piso).
 */
export function defineMonsters(kinds) {
  Object.values(kinds).forEach((kind) => Object.entries(kind.moves).forEach(([name, move]) => (move.name = name)));
  Object.assign(KINDS, kinds);
}
defineMonsters(KINDS); // les pone nombre a los movimientos de las fichas de arriba

/** Nombre para mostrar en la barra de vida (solo los del nivel 2 tienen). */
export const monsterName = (kind) => say(KINDS[kind].name);

export class Monster extends Fighter {
  /** options: hp (para cambiar la vida), drop (cae del techo), margin (cuánto puede salirse de la pantalla). */
  constructor(kind, x, y, options = {}) {
    const cfg = KINDS[kind];
    super({ x, y, hp: options.hp ?? cfg.hp, width: cfg.width });
    this.kind = kind;
    this.cfg = cfg;
    this.margin = options.margin ?? 0;
    this.time = Math.floor(Math.random() * 100);
    this.walkPhase = 0;
    this.cool = 40;
    this.react = 20;
    this.flash = 0;
    this.blocking = 0;
    this.stun = 0;
    this.armor = false;
    this.hasToken = false;
    this.gone = false;
    if (options.drop) {
      this.onGround = false;
      this.setState("jump");
    }
  }

  get hittable() {
    return this.hp > 0 && !this.gone;
  }

  get heavy() {
    return Boolean(this.cfg.heavy);
  }

  hurtBox() {
    return worldBox(this, this.cfg.body);
  }

  /** Solo pueden atacar unos pocos a la vez (world.tokens): así nunca te rodean todos juntos. */
  attempt(name, world) {
    if (this.cool > 0) return false;
    if (world.tokens !== undefined) {
      if (world.tokens <= 0) return false;
      world.tokens--;
      this.hasToken = true;
    }
    this.startMove(this.cfg.moves[name]);
    this.vx = 0;
    return true;
  }

  release(world) {
    if (!this.hasToken) return;
    world.tokens++;
    this.hasToken = false;
  }

  update(world) {
    this.time++;
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.blocking > 0) this.blocking--;
    if (this.cool > 0) this.cool--;
    switch (this.state) {
      case "idle":
      case "walk":
        // world.calm: mientras hay un cartel en pantalla ("RONDA 1"), nadie ataca.
        if (!world.calm && world.hero.hp > 0 && world.hero.state !== "win") {
          this.facing = world.hero.x >= this.x ? 1 : -1;
          this.cfg.think(this, world);
        } else stand(this);
        break;
      case "attack":
        this.attacking(world);
        break;
      case "hurt":
        this.vx *= 0.85;
        if (this.t >= this.stun) this.setState("idle");
        break;
      case "down":
        this.vx *= 0.8;
        if (this.t >= 36) this.setState("idle");
        break;
      case "dead":
        if (!this.cfg.corpse && this.onGround && this.t > 26) this.burst(world);
        break;
      default:
        break;
    }
    this.physics(world);
    if (this.state === "walk") this.walkPhase += Math.abs(this.vx) * 0.25;
  }

  physics(world) {
    // Los monstruos pueden estar un poco afuera de la pantalla (entrando desde el costado).
    const { left, right } = world;
    super.physics({ ...world, left: left - this.margin, right: right + this.margin });
  }

  attacking(world) {
    const m = this.move;
    if (this.t === m.startup) {
      if (m.sfx) world.sound.play(m.sfx);
      m.launch?.(this, world);
    }
    if (this.moveActive) m.during?.(this, world); // ataques que duran (un chorro, por ejemplo)
    if (m.lunge && this.moveActive) this.vx = this.facing * m.lunge;
    else if (this.onGround) this.vx *= 0.75;
    this.armor = Boolean(m.armor) && this.t >= m.startup - 4 && this.moveActive;
    if (this.t >= m.startup + m.active + m.recovery) this.endMove(world);
  }

  endMove(world) {
    const [next, chance] = this.move.followUp ?? [];
    this.move = null;
    this.armor = false;
    if (next && Math.random() < chance && dist(this, world) < 32) {
      this.startMove(this.cfg.moves[next]);
      return;
    }
    this.setState("idle");
    this.cool = between(this.cfg.cool);
    this.release(world);
  }

  landed(world) {
    if (this.state === "attack" && this.move.air && this.t >= this.move.startup) {
      this.move.onLand?.(this, world);
      this.t = this.move.startup + this.move.active;
      this.vx = 0;
    } else if (this.state === "fall") {
      this.setState("down");
    } else if (this.state === "jump") {
      stand(this);
    }
    if (this.state === "dead" || this.state === "down") this.vx *= 0.3;
  }

  takeHit(hit, from, world) {
    if (!this.hittable) return null;
    const fromDir = Math.sign(from.x - this.x) || -this.facing;
    if (this.blocking > 0 && this.onGround && fromDir === this.facing && !hit.unblockable) {
      this.vx = -fromDir * (hit.push ?? 1.5) * 0.6;
      this.hp = Math.max(1, this.hp - (hit.chip ?? 0));
      return "blocked";
    }
    this.hp = Math.max(0, this.hp - hit.damage);
    this.flash = 5;
    // Un chorrito del color del monstruo con cada golpe.
    world.fx.goo(this.x, this.y - this.cfg.height * 0.6, GOO[this.cfg.goo], 5, -fromDir, 1.4);
    if (this.hp <= 0) {
      this.die(world, fromDir);
      return "ko";
    }
    if (this.armor || this.heavy) return "hit"; // en plena embestida (o si es gigante) no se frena
    this.release(world);
    this.move = null;
    if (hit.knockdown || !this.onGround) {
      this.setState("fall");
      this.jump(-2.8, -fromDir * 1.8);
    } else {
      this.setState("hurt");
      this.stun = Math.round(hit.stun * (this.cfg.stunScale ?? 1));
      this.vx = -fromDir * (hit.push ?? 1.5) * (this.cfg.weight ?? 1);
    }
    return "hit";
  }

  die(world, fromDir) {
    this.release(world);
    this.move = null;
    this.armor = false;
    this.blocking = 0;
    this.setState("dead");
    this.vx = 0;
    if (!this.heavy) this.jump(-3, -fromDir * 1.6);
    world.onDefeat?.(this);
  }

  /** ¡Splash! El monstruo revienta en líquido (rosa en el planeta rojo). */
  burst(world) {
    this.gone = true;
    world.fx.goo(this.x, this.y - this.cfg.height / 2, GOO[this.cfg.goo], this.cfg.gooAmount, 0, this.cfg.gooPower ?? 2.2);
    world.sound.play("splat");
    world.shake(this.cfg.goo === "pink" ? 4 : 2);
  }

  draw(p) {
    const tall = this.cfg.height > 14 && !this.heavy; // los gigantes no se tumban
    let rotate = 0;
    if (tall && (this.state === "fall" || this.state === "dead")) rotate = -0.5 * this.facing;
    if (tall && this.state === "down") rotate = (-Math.PI / 2) * this.facing;
    const white = this.flash > 0 || (this.state === "dead" && !this.cfg.corpse && this.t % 6 < 3);
    const y = rotate === 0 ? this.y : this.y - (this.state === "down" ? this.cfg.width / 2 : 0);
    const seal = this.cfg.stamp ?? stamp;
    seal(p.ctx, this.x, y, (q) => this.cfg.draw(q, this), { flip: this.facing < 0, rotate, flash: white ? "#ffffff" : null });
  }

  /** Efectos que van por encima de todo, incluso de Estela (rayos, tentáculos que salen del piso). */
  drawFx(p) {
    this.cfg.drawFx?.(p, this);
  }
}
