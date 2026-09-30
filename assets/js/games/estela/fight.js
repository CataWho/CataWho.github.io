// Física y golpes compartidos por todos los niveles de Estela.
//
// Cada personaje tiene una "caja de cuerpo" (donde lo pueden golpear)
// y sus ataques tienen una "caja de golpe" que solo existe durante unos cuadros.
// Cada ataque tiene tres tiempos: preparación (startup), golpe (active) y recuperación (recovery).
// Todo se mide en cuadros: el juego corre a 60 cuadros por segundo.

export const GRAVITY = 0.25;

/** Un control "suelto": para cuando Estela no se puede mover (carteles, escenas). */
export const NO_INPUT = { held: () => false, pressed: () => false, anyPressed: () => false, axisX: () => 0, motion: () => false };

/** Caja [dx, dy, ancho, alto] pensada mirando a la derecha → caja en el mundo. */
export function worldBox(actor, [dx, dy, w, h]) {
  return { x: actor.facing > 0 ? actor.x + dx : actor.x - dx - w, y: actor.y + dy, w, h };
}

export const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const center = (a, b) => ({
  x: (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2,
  y: (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2,
});

/** Lo que tienen en común la heroína y los monstruos: posición, salto, gravedad, límites. */
export class Fighter {
  constructor({ x, y, hp, width }) {
    Object.assign(this, { x, y, hp, maxHp: hp, width, vx: 0, vy: 0, facing: 1, onGround: true });
    this.state = "idle";
    this.t = 0; // cuadros desde que empezó el estado actual
    this.move = null;
    this.hitIds = new Set(); // a quién ya golpeó el ataque actual (para no pegarle dos veces)
  }

  setState(state) {
    this.state = state;
    this.t = 0;
  }

  /** Arranca un ataque (ver las tablas de movimientos de cada personaje). */
  startMove(move) {
    this.move = move;
    this.hitIds.clear();
    this.setState("attack");
  }

  /** ¿El ataque actual está en sus cuadros de golpe? */
  get moveActive() {
    const m = this.move;
    return this.state === "attack" && m && this.t >= m.startup && this.t < m.startup + m.active;
  }

  attackBox() {
    if (!this.moveActive || !this.move.box) return null;
    return { box: worldBox(this, this.move.box), hit: this.move };
  }

  jump(vy, vx) {
    this.vy = vy;
    this.vx = vx;
    this.onGround = false;
  }

  physics(world) {
    this.x += this.vx;
    if (!this.onGround) {
      this.vy += GRAVITY;
      this.y += this.vy;
      if (this.y >= world.ground) {
        this.y = world.ground;
        this.vy = 0;
        this.onGround = true;
        this.landed(world);
      }
    }
    const half = this.width / 2;
    this.x = Math.max(world.left + half, Math.min(world.right - half, this.x));
  }

  landed() {}
}

/** Un disparo: la onda de Estela, los escupitajos verdes, la onda expansiva del Bruto. */
export class Shot {
  /**
   * gravity: si cae (los huevos); onLand(shot, world): qué pasa cuando toca el piso;
   * fragile: si Estela lo puede reventar con el sable (y onPop: qué pasa cuando lo revienta).
   */
  constructor({ x, y, vx, vy = 0, gravity = 0, w, h, hit, fromHero, kind, life = 240, onLand, fragile = false, onPop, clash = true }) {
    Object.assign(this, { x, y, vx, vy, gravity, w, h, hit, fromHero, kind, life, onLand, fragile, onPop, clash, t: 0, gone: false });
    this.facing = Math.sign(vx) || 1;
  }

  box() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  update(world) {
    this.x += this.vx;
    this.vy += this.gravity;
    this.y += this.vy;
    this.t++;
    if (this.gravity && this.y >= world.ground - this.h / 2) {
      this.gone = true;
      this.onLand?.(this, world);
      return;
    }
    // Se borra al salir de lo que se ve (world.view), así la Onda se puede volver a tirar enseguida.
    const { left, right } = world.view ?? world;
    if (--this.life <= 0 || this.x < left - 20 || this.x > right + 20) this.gone = true;
  }
}

/** Chispas, temblor y congelado al conectar un golpe. */
function impact(world, where, result, hit) {
  const heavy = hit.damage >= 10 || result === "ko";
  if (result === "blocked") {
    world.fx.spark(where.x, where.y, ["#9fe8ff", "#ffffff", "#5fb8ff"], 8);
    world.sound.play("block");
    world.freeze(3);
    return;
  }
  world.fx.spark(where.x, where.y, ["#ffffff", "#ffe45e", "#ff9ad5"], heavy ? 14 : 9, heavy ? 2.6 : 1.8);
  world.sound.play(heavy ? "heavy" : "hit");
  world.freeze(heavy ? 8 : 5);
  if (heavy) world.shake(3);
}

/**
 * Un cuadro de pelea: golpes de la heroína, de los monstruos y de los disparos.
 * world = { hero, enemies, shots, fx, sound, freeze, shake, ground, left, right }
 */
export function resolveCombat(world) {
  const { hero, shots } = world;
  const enemies = world.enemies.filter((enemy) => enemy.hittable);

  const heroAttack = hero.attackBox();
  if (heroAttack) {
    for (const enemy of enemies) {
      const body = enemy.hurtBox();
      if (hero.hitIds.has(enemy) || !overlaps(heroAttack.box, body)) continue;
      hero.hitIds.add(enemy);
      const result = enemy.takeHit(heroAttack.hit, hero, world);
      if (!result) continue;
      hero.connected = true;
      impact(world, center(heroAttack.box, body), result, heroAttack.hit);
    }
    // Los disparos frágiles (huevos) se revientan de un sablazo.
    shots
      .filter((shot) => shot.fragile && !shot.gone && overlaps(heroAttack.box, shot.box()))
      .forEach((shot) => {
        shot.gone = true;
        shot.onPop?.(shot, world);
      });
  }

  for (const enemy of enemies) {
    const attack = enemy.attackBox();
    if (!attack || enemy.hitIds.has(hero)) continue;
    const body = hero.hurtBox();
    if (!overlaps(attack.box, body)) continue;
    enemy.hitIds.add(hero);
    const result = hero.takeHit(attack.hit, enemy, world);
    if (result) impact(world, center(attack.box, body), result, attack.hit);
  }

  for (const shot of shots) {
    shot.update(world);
    if (shot.gone) continue;
    const box = shot.box();
    // Dos disparos que chocan se anulan.
    // (Los ataques de área, como una explosión o un rayo, no chocan: clash = false.)
    const rival =
      shot.clash !== false &&
      shots.find((other) => !other.gone && other.clash !== false && other.fromHero !== shot.fromHero && overlaps(box, other.box()));
    if (rival) {
      shot.gone = rival.gone = true;
      world.fx.spark(shot.x, shot.y, ["#ffffff", "#ff9ad5", "#9fe8ff"], 12, 2);
      world.sound.play("block");
      continue;
    }
    const targets = shot.fromHero ? enemies : [hero];
    for (const target of targets) {
      const body = target.hurtBox();
      if (!overlaps(box, body)) continue;
      const result = target.takeHit(shot.hit, shot, world);
      if (!result) continue;
      shot.gone = true;
      impact(world, center(box, body), result, shot.hit);
      break;
    }
  }
  world.shots = shots.filter((shot) => !shot.gone);

  // Nadie se superpone con nadie: se empujan (solo si los dos están en el piso).
  const bodies = [hero, ...enemies];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i];
      const b = bodies[j];
      if (!a.onGround || !b.onGround) continue;
      const gap = (a.width + b.width) / 2 - Math.abs(a.x - b.x);
      if (gap <= 0) continue;
      const side = Math.sign(a.x - b.x) || (i === 0 ? -1 : 1);
      // A los monstruos gigantes (heavy) no se los puede empujar: se corre el otro.
      const share = a.heavy ? 0 : b.heavy ? 1 : 0.5;
      a.x += side * gap * share;
      b.x -= side * gap * (1 - share);
    }
  }
}
