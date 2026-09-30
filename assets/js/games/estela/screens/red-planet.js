// Nivel 2: el planeta Carmín. Peleas de una pantalla:
// rondas con reloj, barras de vida arriba y K.O. Los monstruos son violetas y rosas
// y cuando caen revientan en líquido rosa (que queda en el piso de ronda en ronda).

import { H, W } from "../../arcade/pixel.js";
import { SONGS } from "../audio.js";
import { createEffects, drawShot } from "../effects.js";
import { NO_INPUT, resolveCombat } from "../fight.js";
import { Heroine } from "../heroine.js";
import { banner, drawBar, drawContinue, drawScore, ease, levelCard } from "../hud.js";
import { Monster, monsterName } from "../monsters.js";
import { PLANET_GROUND, drawPlants, paintCrimson } from "../scenery.js";
import { say } from "../texts.js";

// Cada ronda: los monstruos [tipo, x, vida] y cuántos pueden atacar a la vez.
const ROUNDS = [
  { foes: [["leaper", 230]] },
  { foes: [["brute", 240]] },
  { foes: [["leaper", 250, 55], ["brute", 200, 85]], tokens: 1 },
];
const ROUND_TIME = 60 * 60; // 60 segundos
const INTRO = 170; // el cartel del nivel, antes de la primera ronda

export function redPlanetLevel(game) {
  const background = paintCrimson();
  const fx = createEffects(PLANET_GROUND);
  const spores = Array.from({ length: 18 }, (_, i) => ({ x: (i * 53) % W, y: (i * 37) % 150, speed: 0.1 + (i % 5) * 0.05 }));
  let round = 0;
  let phase = "intro"; // intro · announce · fight · ko · won · lost · continue · gameover
  let phaseT = 0;
  let t = 0;
  let clock = ROUND_TIME;
  let hero;
  let world;

  function setPhase(next) {
    phase = next;
    phaseT = 0;
  }

  function startRound() {
    hero = new Heroine(80, PLANET_GROUND);
    hero.shown = hero.hp;
    const { foes, tokens } = ROUNDS[round];
    world = {
      ground: PLANET_GROUND,
      left: 8,
      right: W - 8,
      hero,
      enemies: foes.map(([kind, x, hp]) => {
        const monster = new Monster(kind, x, PLANET_GROUND, { hp });
        monster.facing = -1;
        monster.shown = monster.hp;
        return monster;
      }),
      shots: [],
      fx,
      sound: game.sound,
      freeze: game.freeze,
      shake: game.shake,
      tokens,
      calm: true,
      onDefeat(monster) {
        game.data.score += monster.cfg.score;
        // Cámara lenta en el golpe final, como en los juegos de pelea.
        if (world.enemies.every((enemy) => enemy.hp <= 0)) game.freeze(30);
      },
    };
    clock = ROUND_TIME;
    setPhase("announce");
  }

  /** Porcentaje de vida que les queda a los monstruos (para decidir quién gana si se acaba el tiempo). */
  const enemiesLeft = () =>
    world.enemies.reduce((sum, enemy) => sum + enemy.hp, 0) / world.enemies.reduce((sum, enemy) => sum + enemy.maxHp, 0);

  function finish(heroWon) {
    if (heroWon) {
      game.data.score += Math.ceil(clock / 60) * 10 + hero.hp * 5; // bonus por tiempo y vida
      setPhase("won");
    } else setPhase("lost");
  }

  startRound();
  setPhase("intro");

  return {
    music: SONGS.planet,
    pausable: true,
    update() {
      t++;
      phaseT++;
      const pad = game.pad;
      spores.forEach((spore) => {
        spore.y -= spore.speed;
        spore.x += Math.sin((t + spore.y) * 0.02) * 0.2;
        if (spore.y < 0) spore.y = 150;
      });

      if (phase === "continue") {
        if (phaseT > 30 && pad.anyPressed("start", "punch")) {
          game.sound.play("select");
          startRound();
        } else if (phaseT >= 600) setPhase("gameover");
        return;
      }
      if (phase === "gameover") {
        if (phaseT > 240 || (phaseT > 60 && pad.anyPressed("start", "punch"))) game.go("title");
        return;
      }

      world.calm = phase !== "fight";
      hero.update(phase === "fight" ? pad : NO_INPUT, world);
      world.enemies.forEach((enemy) => enemy.update(world));
      resolveCombat(world);
      fx.update();
      [hero, ...world.enemies].forEach((actor) => (actor.shown = ease(actor.shown, actor.hp)));

      if (phase === "intro" && phaseT >= INTRO) setPhase("announce");
      else if (phase === "announce" && phaseT >= 130) setPhase("fight");
      else if (phase === "fight") {
        clock--;
        if (world.enemies.every((enemy) => enemy.hp <= 0)) finish(true);
        else if (hero.hp <= 0) {
          game.freeze(30);
          game.sound.play("ko");
          finish(false);
        } else if (clock <= 0) {
          setPhase("timeup");
          game.sound.play("ko");
        }
      } else if (phase === "timeup" && phaseT >= 120) {
        finish(hero.hp / hero.maxHp > enemiesLeft());
      } else if (phase === "won") {
        if (phaseT === 30) {
          hero.celebrate();
          game.sound.play("win");
        }
        if (phaseT >= 200) {
          round++;
          if (round >= ROUNDS.length) game.next();
          else startRound();
        }
      } else if (phase === "lost" && phaseT >= 170) setPhase("continue");
    },
    draw(p) {
      p.ctx.drawImage(background, 0, 0);
      spores.forEach(({ x, y }) => p.rect(x, y, 1, 1, "#ffb3dc"));
      drawPlants(p, t);
      fx.drawFloor(p);
      const actors = [...world.enemies.filter((enemy) => !enemy.gone), hero];
      actors.forEach((actor) => p.alpha(0.35, () => p.ellipse(actor.x, PLANET_GROUND, actor.width / 2 + 2, 1, "#000000")));
      world.enemies.filter((enemy) => !enemy.gone).forEach((enemy) => enemy.draw(p));
      hero.draw(p);
      world.shots.forEach((shot) => drawShot(p, shot));
      fx.draw(p);

      // Barras de vida: Estela a la izquierda, los monstruos a la derecha.
      drawBar(p, 8, 8, 120, 7, hero.hp, hero.maxHp, hero.shown);
      p.text("ESTELA", 8, 19, "#f3eff8", { shadow: "#170c1c" });
      const enemies = world.enemies;
      const barH = enemies.length > 1 ? 3 : 7;
      enemies.forEach((enemy, i) => drawBar(p, W - 128, 8 + i * (barH + 2), 120, barH, enemy.hp, enemy.maxHp, enemy.shown, true));
      p.text(enemies.map((enemy) => monsterName(enemy.kind)).join(" + "), W - 8, 19, "#f3eff8", { align: "right", shadow: "#170c1c" });
      p.text(String(Math.ceil(Math.max(0, clock) / 60)).padStart(2, "0"), W / 2, 6, "#ffe45e", { align: "center", size: 16, shadow: "#170c1c" });
      if (phase === "fight" || phase === "announce") drawScore(p, game.data.score, W / 2, 170, "center");

      if (phase === "intro") levelCard(p, phaseT, say("level2"), say("level2Name"), "");
      if (phase === "announce") banner(p, phaseT < 80 ? say("round", { n: round + 1 }) : say("fight"), 70);
      if ((phase === "won" || phase === "lost") && phaseT < 90) banner(p, say("ko"), 66, "#ffffff", 24);
      if (phase === "won" && phaseT >= 90) banner(p, say("youWin"), 70);
      if (phase === "lost" && phaseT >= 90) banner(p, say("tryAgain"), 70);
      if (phase === "timeup") banner(p, say("time"), 70);
      if (phase === "continue") drawContinue(p, phaseT);
      if (phase === "gameover") {
        p.alpha(0.7, () => p.rect(0, 0, W, H, "#0b0614"));
        banner(p, say("gameOver"), 76);
      }
    },
  };
}
