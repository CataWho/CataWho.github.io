// Nivel 1: la nave nodriza. Estela recorre el pasillo hacia el hangar (de izquierda a derecha)
// y en ciertos puntos la cámara se traba y aparecen oleadas de monstruos verdes.
// Al vencer la última oleada, sube a su navecita y despega.

import { H, W } from "../../arcade/pixel.js";
import { SONGS } from "../audio.js";
import { createEffects, drawShot } from "../effects.js";
import { NO_INPUT, resolveCombat } from "../fight.js";
import { Heroine } from "../heroine.js";
import { banner, drawBar, drawContinue, drawScore, ease, levelCard, touchScreen } from "../hud.js";
import { Monster } from "../monsters.js";
import { SHIP_LENGTH, VENTS, createStars, drawEarth, drawShip, drawStars, paintMothership } from "../scenery.js";
import { say } from "../texts.js";

const GROUND = 150;
const SHIP_PARKED = { x: 1215, y: 132 };

// Oleadas: cuando Estela pasa por "at", la cámara se traba hasta vencer a todos.
// Cada monstruo: [tipo, de dónde sale (left, right o vent = cae del techo), cuántos cuadros espera].
const WAVES = [
  { at: 100, foes: [["slug", "right", 0], ["slug", "right", 70]] },
  { at: 420, foes: [["gremlin", "right", 0], ["slug", "left", 40], ["gremlin", "left", 110]] },
  { at: 740, foes: [["slug", "vent", 0], ["gremlin", "right", 30], ["spitter", "right", 80], ["gremlin", "left", 140]] },
  {
    at: 1000,
    foes: [["gremlin", "left", 0], ["gremlin", "right", 0], ["spitter", "right", 50], ["slug", "vent", 90], ["slug", "vent", 130], ["gremlin", "right", 180]],
  },
];
const HEAL_PER_WAVE = 25;

export function mothershipLevel(game) {
  const background = paintMothership();
  const stars = createStars(11, 70);
  const fx = createEffects(GROUND);
  const hero = new Heroine(40, GROUND);
  const world = {
    ground: GROUND,
    left: 6,
    right: SHIP_LENGTH - 6,
    hero,
    enemies: [],
    shots: [],
    fx,
    sound: game.sound,
    freeze: game.freeze,
    shake: game.shake,
    tokens: 2, // como mucho dos monstruos atacan a la vez
    onDefeat(monster) {
      game.data.score += monster.cfg.score;
      fx.text(`+${monster.cfg.score}`, monster.x, monster.y - monster.cfg.height - 10, "#ffe45e");
    },
  };

  let t = 0;
  let phase = "play"; // play · continue · gameover · exit
  let phaseT = 0;
  let camX = 0;
  let wave = null;
  let nextWave = 0;
  let goSign = 0;
  let heroShown = hero.hp;
  const ship = { ...SHIP_PARKED, vx: 0, boarded: false };

  function setPhase(next) {
    phase = next;
    phaseT = 0;
  }

  function startWave() {
    wave = { t: 0, queue: WAVES[nextWave].foes.map(([kind, from, delay]) => ({ kind, from, delay })) };
    nextWave++;
    goSign = 0;
  }

  function spawn({ kind, from }) {
    let x = from === "left" ? camX - 14 : camX + W + 14;
    if (from === "vent") x = VENTS.find((vent) => vent > camX + 20 && vent < camX + W - 20) ?? camX + W / 2;
    const monster = new Monster(kind, x, from === "vent" ? 30 : GROUND, { drop: from === "vent", margin: 24 });
    monster.facing = hero.x > x ? 1 : -1;
    world.enemies.push(monster);
  }

  function updateWaves() {
    if (!wave && nextWave < WAVES.length && hero.x > WAVES[nextWave].at) startWave();
    if (!wave) return;
    wave.t++;
    wave.queue.filter((foe) => foe.delay <= wave.t).forEach(spawn);
    wave.queue = wave.queue.filter((foe) => foe.delay > wave.t);
    if (wave.queue.length === 0 && world.enemies.length === 0) {
      wave = null;
      hero.heal(HEAL_PER_WAVE);
      fx.text(`+${HEAL_PER_WAVE}`, hero.x, hero.y - 56, "#8df55a");
      game.sound.play("heal");
      goSign = 150;
    }
  }

  function updateCamera() {
    // La cámara solo avanza (como en los arcades de pelea callejera) y se traba durante una oleada.
    if (!wave) camX = Math.max(camX, Math.min(hero.x - 140, SHIP_LENGTH - W));
    world.left = camX + 6;
    world.right = wave ? camX + W - 6 : SHIP_LENGTH - 6;
    world.view = { left: camX, right: camX + W };
  }

  function updateExit() {
    if (phaseT === 20) {
      ship.boarded = true;
      fx.spark(ship.x + 6, ship.y - 10, ["#ffffff", "#ff9ad5", "#ffe45e"], 14, 1.6);
      game.sound.play("engine");
    }
    if (phaseT > 50) {
      ship.vx += 0.06;
      ship.x += ship.vx;
    }
    if (phaseT === 50) game.shake(2);
    if (phaseT > 200) game.next();
  }

  return {
    music: SONGS.ship,
    pausable: true,
    update() {
      t++;
      phaseT++;
      const pad = game.pad;
      if (phase === "continue") {
        if (phaseT > 30 && pad.anyPressed("start", "punch")) {
          // Otra ficha: vuelve con la vida llena, en el mismo lugar.
          hero.hp = hero.maxHp;
          hero.setState("idle");
          hero.invuln = 120;
          world.shots = [];
          game.sound.play("select");
          setPhase("play");
        } else if (phaseT >= 600) setPhase("gameover");
        return;
      }
      if (phase === "gameover") {
        if (phaseT > 240 || (phaseT > 60 && pad.anyPressed("start", "punch"))) game.go("title");
        return;
      }

      hero.update(phase === "play" && t > 30 ? pad : NO_INPUT, world);
      if (phase === "play") updateWaves();
      world.enemies.forEach((enemy) => enemy.update(world));
      resolveCombat(world);
      world.enemies = world.enemies.filter((enemy) => !enemy.gone);
      fx.update();
      updateCamera();
      heroShown = ease(heroShown, hero.hp);
      if (goSign > 0) goSign--;

      if (phase === "exit") updateExit();
      else if (hero.hp <= 0 && hero.onGround && hero.t > 50) setPhase("continue");
      else if (!wave && nextWave >= WAVES.length && hero.x > SHIP_PARKED.x - 30) {
        hero.celebrate();
        setPhase("exit");
      }
    },
    draw(p) {
      const cam = Math.round(camX);
      const { ctx } = p;
      // El espacio que se ve por las ventanas (se mueve más lento: está lejos).
      p.rect(0, 0, W, H, "#07040f");
      drawStars(p, stars, cam * 0.25, { time: t });
      drawEarth(p, 720 - cam * 0.5, 64, 26, t * 0.0005);
      ctx.drawImage(background, -cam, 0);
      // Luces de alarma en el techo.
      const alarm = t % 50 < 25;
      for (let x = 160; x < SHIP_LENGTH; x += 320) {
        const sx = x - cam;
        if (sx < -40 || sx > W + 40) continue;
        p.rect(sx - 3, 27, 6, 3, alarm ? "#ff3b4f" : "#6a1a28");
        if (alarm) p.alpha(0.12, () => p.poly([[sx - 3, 30], [sx + 3, 30], [sx + 24, 120], [sx - 24, 120]], "#ff3b4f"));
      }

      ctx.save();
      ctx.translate(-cam, 0);
      fx.drawFloor(p);
      drawShip(p, ship.x, ship.y, t, { flame: phase === "exit" && phaseT > 30, pilot: ship.boarded });
      const actors = [...world.enemies, ...(ship.boarded ? [] : [hero])];
      actors.forEach((actor) => p.alpha(0.35, () => p.ellipse(actor.x, GROUND, actor.width / 2 + 2, 1, "#000000")));
      world.enemies.forEach((enemy) => enemy.draw(p));
      if (!ship.boarded) hero.draw(p);
      world.shots.forEach((shot) => drawShot(p, shot));
      fx.draw(p);
      ctx.restore();

      // Tinte rojo de alarma que late.
      p.alpha(0.04 + 0.04 * Math.sin(t * 0.08), () => p.rect(0, 0, W, H, "#ff2040"));

      p.text("ESTELA", 6, 6, "#f3eff8", { shadow: "#170c1c" });
      drawBar(p, 6, 17, 96, 5, hero.hp, hero.maxHp, heroShown);
      drawScore(p, game.data.score);
      if (goSign > 0 && goSign % 30 < 20) {
        banner(p, say("go"), 60);
        p.poly([[W - 34, 58], [W - 14, 68], [W - 34, 78]], "#ffe45e");
      }
      levelCard(p, t, say("level1"), say("level1Name"), say("level1Goal"));
      if (t > 160 && t < 560 && t % 40 < 28) {
        p.text(say(touchScreen ? "controlsHintTouch" : "controlsHint"), W / 2, 166, "#ffe45e", { align: "center", shadow: "#170c1c" });
      }
      if (phase === "continue") drawContinue(p, phaseT);
      if (phase === "gameover") {
        p.alpha(0.7, () => p.rect(0, 0, W, H, "#0b0614"));
        banner(p, say("gameOver"), 76);
      }
      if (phase === "exit" && phaseT > 160) p.alpha(Math.min(1, (phaseT - 160) / 40), () => p.rect(0, 0, W, H, "#000000"));
    },
  };
}
