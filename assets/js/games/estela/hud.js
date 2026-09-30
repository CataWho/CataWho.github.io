// Lo que se dibuja encima del juego: barras de vida, carteles grandes y el "¿continuar?".

import { W } from "../arcade/pixel.js";
import { say } from "./texts.js";

export const touchScreen = matchMedia("(hover: none)").matches;

/** Barra de vida con "estela" roja: el daño recién recibido se va vaciando despacio. */
export function drawBar(p, x, y, w, h, value, max, shown, reverse = false) {
  p.rect(x - 1, y - 1, w + 2, h + 2, "#170c1c");
  p.rect(x, y, w, h, "#3a0f24");
  const lost = Math.round((w * shown) / max);
  const full = Math.round((w * value) / max);
  p.rect(reverse ? x + w - lost : x, y, lost, h, "#ff4f6f");
  p.rect(reverse ? x + w - full : x, y, full, h, "#ffe45e");
  p.rect(x, y, w, 1, "rgba(255, 255, 255, 0.35)");
}

/** Acerca de a poco el número "mostrado" al real (para la estela roja de la barra). */
export const ease = (shown, value) => (shown > value ? Math.max(value, shown - 0.6) : value);

/** Cartel grande en el medio de la pantalla. */
export function banner(p, text, y = 70, color = "#ffe45e", size = 16) {
  p.text(text, W / 2 + 2, y + 2, "#170c1c", { align: "center", size });
  p.text(text, W / 2 + 1, y + 1, "#ff4fb0", { align: "center", size });
  p.text(text, W / 2, y, color, { align: "center", size });
}

/** Presentación de un nivel: "NIVEL 1" / "LA NAVE NODRIZA" / objetivo. */
export function levelCard(p, t, level, name, goal) {
  if (t > 150) return;
  const fade = Math.min(1, (150 - t) / 20, t / 10);
  p.alpha(fade, () => {
    p.alpha(0.55, () => p.rect(0, 56, W, 58, "#0b0614"));
    p.text(level, W / 2, 62, "#ff9ad5", { align: "center" });
    banner(p, name, 76);
    if (goal) p.text(goal, W / 2, 100, "#f3eff8", { align: "center" });
  });
}

/** Cuenta regresiva de "¿continuar?" (como las fichas del arcade). */
export function drawContinue(p, t) {
  const count = Math.max(0, 9 - Math.floor(t / 60));
  p.alpha(0.7, () => p.rect(0, 0, W, 180, "#0b0614"));
  banner(p, say("continue"), 58);
  banner(p, String(count), 84, "#ffffff", 24);
  p.text(touchScreen ? "START" : say("continueHint"), W / 2, 120, "#f3eff8", { align: "center" });
  return count;
}

/** Escribe un texto letra por letra en una caja abajo (chars = cuántas letras se ven). */
export function drawCaption(p, text, chars, y = 128) {
  p.rect(8, y - 4, W - 16, 180 - y, "#170c1c");
  p.rect(8, y - 4, W - 16, 1, "#ff4fb0");
  // Se parte en renglones el texto completo, así las palabras no saltan mientras se escriben.
  let left = Math.floor(chars);
  p.wrap(text, W - 32).forEach((line, i) => {
    if (left > 0) p.text(line.slice(0, left), 16, y + 4 + i * 11, "#f3eff8");
    left -= line.length + 1;
  });
}

/** Una historia en carteles: golpe/patada completa el texto o pasa al siguiente. */
export function createStory(pages) {
  let page = 0;
  let chars = 0;
  const turn = () => {
    page++;
    chars = 0;
  };
  return {
    get page() {
      return page;
    },
    get done() {
      return page >= pages.length;
    },
    update(pad, sound) {
      if (page >= pages.length) return;
      chars += 0.6;
      if (pad.anyPressed("punch", "kick", "special")) {
        sound.play("select");
        if (chars < pages[page].length) chars = pages[page].length;
        else turn();
      } else if (chars > pages[page].length + 200) turn();
    },
    draw(p) {
      if (page < pages.length) drawCaption(p, pages[page], chars);
    },
  };
}

/** Puntaje: arriba a la derecha, o donde se pida. */
export function drawScore(p, score, x = W - 6, y = 6, align = "right") {
  p.text(`${say("score")} ${String(score).padStart(6, "0")}`, x, y, "#f3eff8", { align, shadow: "#170c1c" });
}
