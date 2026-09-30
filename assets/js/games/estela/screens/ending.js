// Final (por ahora): Estela deja el planeta Ámbar y la búsqueda sigue. "Continuará..."
// Cuando haya más niveles, esta pantalla pasa al final de la lista en index.js.

import { H, W } from "../../arcade/pixel.js";
import { SONGS } from "../audio.js";
import { banner, createStory } from "../hud.js";
import { createStars, drawAmber, drawShip, drawStars } from "../scenery.js";
import { say } from "../texts.js";

export function endingScreen(game) {
  const stars = createStars(33, 100);
  const story = createStory(say("ending"));
  let t = 0;
  let doneT = 0; // cuadros desde que terminó el texto (para no saltear el cartel con el mismo botón)
  return {
    music: SONGS.title,
    update() {
      t++;
      story.update(game.pad, game.sound);
      if (story.done && ++doneT > 40 && game.pad.anyPressed("start", "punch")) game.go("title");
    },
    draw(p) {
      p.rect(0, 0, W, H, "#07040f");
      drawStars(p, stars, t * 1.5, { time: t, streak: 1 });
      drawAmber(p, 62 - t * 0.05, 70, 22, t * 0.0015);
      drawShip(p, 200 + Math.sin(t * 0.03) * 5, 70 + Math.sin(t * 0.05) * 3, t, { pilot: true, scale: 2 });
      if (!story.done) return story.draw(p);
      banner(p, say("toBeContinued"), 120);
      p.text(`${say("score")} ${String(game.data.score).padStart(6, "0")}`, W / 2, 146, "#f3eff8", { align: "center" });
      if (t % 60 < 40) p.text(say("pressStart"), W / 2, 162, "#ffe45e", { align: "center" });
    },
  };
}
