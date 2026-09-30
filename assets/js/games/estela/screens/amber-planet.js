// Nivel 3: el planeta Ámbar (como Saturno, con anillos que cruzan el cielo). Es una pelea contra un jefe
// en dos partes: la Babosa Reina y, cuando parece que ganaste, el Gusano Voltio que le sale del pecho.
// Del bicho se caen corazones: si Estela los agarra, recupera vida.

import { H, W, makeSprite } from "../../arcade/pixel.js";
import { SONGS } from "../audio.js";
import "../bosses.js";
import { GOO, createEffects, drawShot } from "../effects.js";
import { NO_INPUT, resolveCombat } from "../fight.js";
import { Heroine } from "../heroine.js";
import { banner, drawBar, drawContinue, drawScore, ease, levelCard } from "../hud.js";
import { Monster, monsterName } from "../monsters.js";
import { PLANET_GROUND, paintAmber } from "../scenery.js";
import { say } from "../texts.js";

const GROUND = PLANET_GROUND;
const INTRO = 170;
const HEART_HEAL = 30;
const HEART_MARKS = [0.75, 0.5, 0.25]; // al bajar de estos porcentajes de vida, el jefe suelta un corazón
const REVEAL = { ko: 0, fakeWin: 60, rumble: 150, burst: 240, rise: 320, fight: 400 }; // la escena de "¡todavía no!"

const HEART = makeSprite(
  [
    ".RR...RR.",
    "RWRR.RRRR",
    "RWRRRRRRR",
    "RRRRRRRRR",
    ".RRRRRRR.",
    "..RRRRR..",
    "...RRR...",
    "....R....",
  ],
  { R: "#ff3f7f", W: "#ffffff" },
);

export function amberPlanetLevel(game) {
  const background = paintAmber();
  const fx = createEffects(GROUND);
  let t = 0;
  let phase = "intro"; // intro · announce · fight · reveal · won · lost · continue · gameover
  let phaseT = 0;
  let stage = "queen"; // queen o worm: de qué parte se retoma si hay que continuar
  let hero;
  let queen;
  let worm = null;
  let hearts = [];
  let marks = [];
  let heartTip = true; // el primer corazón avisa "¡agarralo!"
  let world;

  function setPhase(next) {
    phase = next;
    phaseT = 0;
  }

  function newWorld(enemies) {
    hero = new Heroine(70, GROUND);
    hero.shown = hero.hp;
    world = {
      ground: GROUND,
      left: 8,
      right: W - 8,
      hero,
      enemies,
      shots: [],
      fx,
      sound: game.sound,
      freeze: game.freeze,
      shake: game.shake,
      calm: true,
      onDefeat(monster) {
        game.data.score += monster.cfg.score;
        game.freeze(30);
      },
    };
    hearts = [];
    marks = [...HEART_MARKS];
  }

  function startQueen() {
    stage = "queen";
    queen = new Monster("slugQueen", 240, GROUND);
    queen.facing = -1;
    queen.shown = queen.hp;
    worm = null;
    newWorld([queen]);
    game.sound.music(SONGS.amber);
    setPhase("announce");
  }

  function startWorm(fromReveal) {
    stage = "worm";
    if (!fromReveal) {
      // Al continuar, la reina ya es un cuero vacío y el gusano está afuera.
      queen.torn = true;
      worm = new Monster("voltWorm", queen.x, GROUND);
      worm.facing = Math.sign(hero.x - worm.x) || -1;
      worm.emerge = 1;
      newWorld([queen, worm]);
      setPhase("announce");
    } else setPhase("fight");
    worm.emerge = 1;
    worm.shown = worm.hp;
    game.sound.music(SONGS.worm);
  }

  /** Un corazón que salta del bicho hacia el centro de la pantalla. */
  function dropHeart(from) {
    hearts.push({ x: from.x, y: from.y - from.cfg.height * 0.7, vx: (W / 2 - from.x) * 0.012, vy: -3.2, life: 660 });
  }

  function updateHearts() {
    hearts.forEach((heart) => {
      heart.vy += 0.2;
      heart.x += heart.vx;
      heart.y += heart.vy;
      if (heart.y >= GROUND) {
        heart.y = GROUND;
        heart.vy = Math.abs(heart.vy) > 1 ? -heart.vy * 0.4 : 0;
        heart.vx *= 0.8;
      }
      heart.life--;
      if (heart.tip === undefined && heartTip) {
        heart.tip = true;
        heartTip = false;
        fx.text(say("grabIt"), heart.x, heart.y - 30, "#ff9ad5");
      }
      if (hero.hp > 0 && Math.abs(heart.x - hero.x) < 11 && heart.y > hero.y - 46) {
        heart.life = 0;
        hero.heal(HEART_HEAL);
        game.sound.play("heal");
        fx.text(`+${HEART_HEAL}`, hero.x, hero.y - 56, "#ff9ad5");
      }
    });
    hearts = hearts.filter((heart) => heart.life > 0);
  }

  /** La escena de la reina que "muere"... y el gusano que le sale del pecho. */
  function updateReveal() {
    const s = phaseT;
    if (s === REVEAL.fakeWin) {
      hero.celebrate();
      game.sound.play("win");
    }
    if (s === REVEAL.rumble) {
      game.sound.music(null);
      game.sound.play("rumble");
      hero.setState("idle");
      // Recupera el aliento: arranca la segunda parte con la vida llena.
      hero.heal(hero.maxHp);
      fx.text(say("fullHp"), hero.x, hero.y - 56, "#ff9ad5");
      game.sound.play("heal");
    }
    if (s > REVEAL.rumble && s < REVEAL.burst) {
      queen.bulge = (s - REVEAL.rumble) / (REVEAL.burst - REVEAL.rumble);
      game.shake(1 + queen.bulge * 2);
    }
    if (s === REVEAL.burst) {
      queen.bulge = 0;
      queen.torn = true;
      fx.goo(queen.x + queen.facing * 6, GROUND - 18, GOO.neon, 70, 0, 3.4);
      fx.goo(queen.x + queen.facing * 6, GROUND - 18, GOO.volt, 30, 0, 2.6);
      fx.spark(queen.x, GROUND - 20, ["#ffffff", "#7fd4ff"], 20, 3);
      game.sound.play("burst");
      game.shake(6);
      worm = new Monster("voltWorm", queen.x, GROUND);
      worm.facing = Math.sign(hero.x - worm.x) || -1;
      worm.emerge = 0;
      world.enemies.push(worm);
      dropHeart(worm);
    }
    if (worm && s > REVEAL.burst) worm.emerge = Math.min(1, (s - REVEAL.burst) / (REVEAL.rise - REVEAL.burst));
    if (s >= REVEAL.fight) startWorm(true);
  }

  startQueen();
  setPhase("intro");

  return {
    music: SONGS.amber,
    pausable: true,
    update() {
      t++;
      phaseT++;
      const pad = game.pad;

      if (phase === "continue") {
        if (phaseT > 30 && pad.anyPressed("start", "punch")) {
          game.sound.play("select");
          if (stage === "queen") startQueen();
          else startWorm(false);
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
      world.enemies = world.enemies.filter((enemy) => !enemy.gone);
      fx.update();
      updateHearts();
      hero.shown = ease(hero.shown, hero.hp);
      const boss = stage === "queen" ? queen : worm;
      if (boss) boss.shown = ease(boss.shown, boss.hp);

      if (phase === "intro" && phaseT >= INTRO) setPhase("announce");
      else if (phase === "announce" && phaseT >= 110) setPhase("fight");
      else if (phase === "fight") {
        // Corazones: el jefe suelta uno cada vez que pierde un cuarto de su vida.
        while (marks.length && boss.hp / boss.maxHp < marks[0] && boss.hp > 0) {
          marks.shift();
          dropHeart(boss);
        }
        if (hero.hp <= 0) {
          game.sound.play("ko");
          setPhase("lost");
        } else if (boss.hp <= 0) {
          if (stage === "queen") setPhase("reveal");
          else setPhase("won");
        }
      } else if (phase === "reveal") updateReveal();
      else if (phase === "won") {
        if (phaseT === 40) {
          hero.celebrate();
          game.sound.play("win");
        }
        if (phaseT >= 240) game.next();
      } else if (phase === "lost" && phaseT >= 170) setPhase("continue");
    },
    draw(p) {
      const { ctx } = p;
      p.ctx.drawImage(background, 0, 0);
      fx.drawFloor(p);
      // Sombras.
      [hero, ...world.enemies].forEach((actor) => p.alpha(0.35, () => p.ellipse(actor.x, GROUND, actor.width / 2 + 2, 1, "#000000")));
      if (queen && world.enemies.includes(queen)) queen.draw(p);
      if (worm && !worm.gone) {
        // El gusano sale de adentro de la reina: lo que todavía está "abajo" no se ve.
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, GROUND + 1);
        ctx.clip();
        ctx.translate(0, Math.round((1 - (worm.emerge ?? 1)) * 84));
        worm.draw(p);
        ctx.restore();
      }
      hearts.forEach((heart) => {
        if (heart.life < 120 && heart.life % 10 < 5) return; // titila antes de desaparecer
        const bob = heart.y >= GROUND ? Math.round(Math.sin(t * 0.15) * 1.5) : 0;
        p.alpha(0.35 + Math.sin(t * 0.2) * 0.15, () => p.disc(heart.x, heart.y - 6 + bob, 7, "#ff9ad5"));
        ctx.drawImage(HEART, Math.round(heart.x - 4), Math.round(heart.y - 10 + bob));
      });
      hero.draw(p);
      if (worm && !worm.gone && worm.emerge === 1) worm.drawFx(p);
      world.shots.forEach((shot) => drawShot(p, shot));
      fx.draw(p);

      // Barras: Estela a la izquierda y el jefe a la derecha.
      drawBar(p, 8, 8, 120, 7, hero.hp, hero.maxHp, hero.shown);
      p.text("ESTELA", 8, 19, "#f3eff8", { shadow: "#170c1c" });
      const boss = stage === "queen" ? queen : worm;
      if (boss && phase !== "reveal") {
        drawBar(p, W - 128, 8, 120, 7, boss.hp, boss.maxHp, boss.shown, true);
        p.text(monsterName(boss.kind), W - 8, 19, "#f3eff8", { align: "right", shadow: "#170c1c" });
      }
      if (phase === "fight") drawScore(p, game.data.score, W / 2, 170, "center");

      if (phase === "intro") levelCard(p, phaseT, say("level3"), say("level3Name"), "");
      if (phase === "announce") banner(p, monsterName(boss.kind), 70, stage === "queen" ? "#7dff5a" : "#7fd4ff");
      if (phase === "reveal") {
        const s = phaseT;
        if (s < REVEAL.fakeWin) banner(p, say("ko"), 66, "#ffffff", 24);
        else if (s < REVEAL.rumble) banner(p, say("youWin"), 70);
        else if (s >= REVEAL.rise) {
          banner(p, say("notYet"), 62, "#7fd4ff");
          p.text(monsterName("voltWorm"), W / 2, 86, "#f3eff8", { align: "center", shadow: "#170c1c" });
        }
      }
      if (phase === "won" && phaseT < 100) banner(p, say("ko"), 66, "#ffffff", 24);
      if (phase === "won" && phaseT >= 100) banner(p, say("youWin"), 70);
      if (phase === "lost" && phaseT >= 60) banner(p, say("tryAgain"), 70);
      if (phase === "continue") drawContinue(p, phaseT);
      if (phase === "gameover") {
        p.alpha(0.7, () => p.rect(0, 0, W, H, "#0b0614"));
        banner(p, say("gameOver"), 76);
      }
    },
  };
}
