// Motor de los juegos: el "reloj" que actualiza y dibuja 60 veces por segundo,
// el cambio entre pantallas (título, niveles, escenas), la pausa y el temblor de pantalla.
// Cada juego le pasa sus pantallas y el orden de su historia; el motor no sabe nada de peleas.

import { FONT, H, W, painter } from "./pixel.js";
import { createPad } from "./input.js";
import { createSound } from "./sound.js";

const STEP = 1000 / 60;

/**
 * root: la ventana del juego (escucha el teclado). canvas: la pantalla. pad: la botonera táctil.
 * screens: { nombre: (game, data) => pantalla }. Cada pantalla tiene update(), draw(p),
 *          y opcionalmente music (una canción) y pausable (si se puede pausar con Enter).
 * story: el orden de las pantallas; game.next() pasa a la siguiente.
 */
export async function createArcade({ root, canvas, pad: padRoot, screens, story, first, effects, labels, data = {} }) {
  await document.fonts.load(`8px ${FONT}`).catch(() => {});
  canvas.width = W;
  canvas.height = H;
  const p = painter(canvas.getContext("2d"));
  const sound = createSound(effects);
  const pad = createPad({ keyTarget: root, touchRoot: padRoot, onInput: () => sound.unlock() });

  let screen = null;
  let screenName = "";
  let paused = false;
  let onScreen = true;
  let frozen = 0;
  let shaking = 0;
  let raf = 0;
  let last = 0;
  let lag = 0;

  const game = {
    W,
    H,
    pad,
    sound,
    frame: 0,
    /** Datos que viajan entre pantallas (puntaje, etc.). */
    data,
    go(name, data) {
      screenName = name;
      screen = screens[name](game, data);
      sound.music(screen.music ?? null);
      root.dataset.screen = name;
    },
    next(data) {
      game.go(story[story.indexOf(screenName) + 1] ?? story[0], data);
    },
    /** Congela la acción unos cuadros: hace que los golpes "pesen". */
    freeze(frames) {
      frozen = Math.max(frozen, frames);
    },
    shake(amount) {
      shaking = Math.max(shaking, amount);
    },
  };

  function setPaused(value) {
    paused = Boolean(value && screen?.pausable);
    syncSound();
  }

  function syncSound() {
    if (raf && !paused) sound.resume();
    else sound.suspend();
  }

  function update() {
    pad.poll();
    if (screen.pausable && pad.pressed("start")) setPaused(!paused);
    if (paused) return;
    if (frozen > 0) frozen--;
    else {
      screen.update();
      game.frame++;
    }
    shaking = shaking > 0.4 ? shaking * 0.86 : 0;
  }

  function draw() {
    const { ctx } = p;
    ctx.save();
    if (shaking) ctx.translate(Math.round((Math.random() * 2 - 1) * shaking), Math.round((Math.random() * 2 - 1) * shaking));
    screen.draw(p);
    ctx.restore();
    if (paused) {
      // Pausa: cartel, cómo seguir y la lista de controles (labels.help, un renglón por elemento).
      const help = labels.help ?? [];
      const top = 70 - help.length * 6;
      p.alpha(0.75, () => p.rect(0, 0, W, H, "#0b0614"));
      p.text(labels.paused, W / 2, top, "#ffe45e", { align: "center", size: 16, shadow: "#ff4fb0" });
      p.text(labels.resume, W / 2, top + 24, "#f3eff8", { align: "center" });
      help.forEach((line, i) => p.text(line, W / 2, top + 48 + i * 12, "#b8b0d8", { align: "center" }));
    }
  }

  function frame(time) {
    raf = requestAnimationFrame(frame);
    lag += Math.min(time - last, 100);
    last = time;
    while (lag >= STEP) {
      update();
      lag -= STEP;
    }
    draw();
  }

  function run() {
    if (raf || !onScreen || document.hidden) return;
    last = performance.now();
    lag = 0;
    raf = requestAnimationFrame(frame);
    syncSound();
  }

  function halt() {
    cancelAnimationFrame(raf);
    raf = 0;
    syncSound();
  }

  // Si el juego sale de la pantalla o se cambia de pestaña, deja de gastar batería.
  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) run();
    else halt();
  });
  observer.observe(canvas);
  const onVisibility = () => {
    if (document.hidden) {
      setPaused(true);
      halt();
    } else run();
  };
  document.addEventListener("visibilitychange", onVisibility);
  // Si se hace clic afuera del juego en plena pelea, se pausa solo.
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) {
      setPaused(true);
      pad.clear();
    }
  });

  game.go(first && screens[first] ? first : story[0]);
  run();

  return {
    game,
    togglePause: () => setPaused(!paused),
    pause: () => setPaused(true),
    toggleMute: () => sound.toggleMute(),
    get muted() {
      return sound.muted;
    },
  };
}
