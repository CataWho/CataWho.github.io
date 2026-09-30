// Pantalla de título y prólogo (la historia en tres carteles, con efecto máquina de escribir).

import { H, W } from "../../arcade/pixel.js";
import { SONGS } from "../audio.js";
import { POSES, drawHeroine } from "../heroine.js";
import { createStory, touchScreen } from "../hud.js";
import { createStars, drawEarth, drawStars } from "../scenery.js";
import { say } from "../texts.js";

const ANY_BUTTON = ["start", "punch", "kick", "special"];

export function titleScreen(game) {
  const stars = createStars(7, 90);
  let t = 0;
  game.data.score = 0;
  return {
    music: SONGS.title,
    update() {
      t++;
      if (t > 20 && game.pad.anyPressed(...ANY_BUTTON)) {
        game.sound.play("select");
        game.next();
      }
    },
    draw(p) {
      p.rect(0, 0, W, H, "#0b0614");
      drawStars(p, stars, t * 0.15, { time: t });
      drawEarth(p, 60, 205, 70, t * 0.0008);
      // Título con sombras de colores, como en los afiches de los 80.
      const title = say("title");
      p.text(title, 21, 29, "#170c1c", { size: 32 });
      p.text(title, 19, 27, "#ff4fb0", { size: 32 });
      p.text(title, 17, 25, "#ffe45e", { size: 32 });
      p.text(say("subtitle"), 19, 64, "#f3eff8", { shadow: "#ff4fb0" });
      drawHeroine(p, 262, 168, POSES.guard, { scale: 2, facing: -1, time: t });
      if (t % 60 < 40) p.text(say(touchScreen ? "tapStart" : "pressStart"), 19, 96, "#ffe45e", { shadow: "#170c1c" });
    },
  };
}

export function prologueScreen(game) {
  const stars = createStars(3, 80);
  const story = createStory(say("prologue"));
  let t = 0;

  return {
    music: SONGS.title,
    update() {
      t++;
      story.update(game.pad, game.sound);
      if (story.done || game.pad.pressed("start")) game.next();
    },
    draw(p) {
      p.rect(0, 0, W, H, "#0b0614");
      drawStars(p, stars, t * 0.1, { time: t });
      if (story.page === 0) drawEarth(p, 160, 64, 40, t * 0.001);
      else if (story.page === 1) {
        drawEarth(p, 250, 60, 26, t * 0.001);
        drawHeroine(p, 110, 116, POSES.win, { scale: 2, time: t });
      } else {
        // Un resplandor verde en la nave nodriza.
        p.rect(90, 50, 140, 30, "#2b2442");
        p.rect(90, 50, 140, 2, "#4a4170");
        p.rect(110, 58, 12, 8, "#6fd6ff");
        p.rect(140, 58, 12, 8, t % 20 < 10 ? "#8df55a" : "#6fd6ff");
        p.rect(170, 58, 12, 8, "#6fd6ff");
        p.alpha(0.3 + Math.sin(t * 0.1) * 0.2, () => p.disc(146, 62, 16, "#5fcf2f"));
      }
      story.draw(p);
      p.text(say("skip"), W - 10, 4, "#6a6090", { align: "right" });
    },
  };
}
