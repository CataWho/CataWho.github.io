// Controles: teclado en la compu y botonera táctil en el celular.
// Los juegos solo preguntan por "botones" (left, right, up, down, punch, kick, special, start)
// y no les importa si vienen de una tecla o de un dedo.

const KEYS = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  Space: "up",
  ArrowDown: "down",
  KeyS: "down",
  KeyJ: "punch",
  KeyZ: "punch",
  KeyK: "kick",
  KeyX: "kick",
  KeyL: "special",
  KeyC: "special",
  Enter: "start",
  KeyP: "start",
  Escape: "start",
};

// Las 8 direcciones de la cruceta táctil, empezando por la derecha y girando como el reloj.
const DPAD_SECTORS = [["right"], ["right", "down"], ["down"], ["left", "down"], ["left"], ["left", "up"], ["up"], ["right", "up"]];

/**
 * keyTarget: el elemento que escucha el teclado (tiene que tener el foco).
 * touchRoot: la botonera táctil, con [data-dpad] y botones [data-button="punch"], etc.
 * onInput: se llama con cada tecla o toque (sirve para destrabar el sonido del navegador).
 */
export function createPad({ keyTarget, touchRoot, onInput }) {
  const keys = new Set();
  const taps = new Set(); // lo que se apretó desde el último cuadro (aunque ya se haya soltado)
  const touches = new Map(); // dedo → botones que está apretando
  const history = []; // direcciones de los últimos cuadros, para los movimientos especiales
  let now = new Set();
  let before = new Set();

  keyTarget.addEventListener("keydown", (event) => {
    const button = KEYS[event.code];
    if (!button || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    onInput?.();
    if (!event.repeat) taps.add(button);
    keys.add(button);
  });
  keyTarget.addEventListener("keyup", (event) => keys.delete(KEYS[event.code]));
  keyTarget.addEventListener("focusout", () => keys.clear());

  /** Que el botón siga recibiendo el dedo aunque se deslice afuera (si el navegador lo permite). */
  function capture(element, pointerId) {
    try {
      element.setPointerCapture(pointerId);
    } catch {
      // Sin captura igual funciona: se suelta al levantar el dedo.
    }
  }

  function press(pointerId, buttons) {
    buttons.forEach((button) => {
      if (!touches.get(pointerId)?.has(button)) taps.add(button);
    });
    touches.set(pointerId, new Set(buttons));
  }

  touchRoot?.querySelectorAll("[data-button]").forEach((element) => {
    const release = (event) => {
      touches.delete(event.pointerId);
      element.classList.remove("is-down");
    };
    element.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      onInput?.();
      capture(element, event.pointerId);
      element.classList.add("is-down");
      press(event.pointerId, [element.dataset.button]);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => element.addEventListener(type, release));
  });

  const dpad = touchRoot?.querySelector("[data-dpad]");
  if (dpad) {
    const aim = (event) => {
      const box = dpad.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      let buttons = [];
      if (Math.hypot(x, y) > 0.12) {
        const sector = Math.round(Math.atan2(y, x) / (Math.PI / 4));
        buttons = DPAD_SECTORS[(sector + 8) % 8];
      }
      dpad.dataset.dir = buttons.join(" ");
      press(event.pointerId, buttons);
    };
    const release = (event) => {
      touches.delete(event.pointerId);
      dpad.dataset.dir = "";
    };
    dpad.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      onInput?.();
      capture(dpad, event.pointerId);
      aim(event);
    });
    dpad.addEventListener("pointermove", (event) => {
      if (touches.has(event.pointerId)) aim(event);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => dpad.addEventListener(type, release));
  }

  const axis = (set, minus, plus) => (set.has(plus) ? 1 : 0) - (set.has(minus) ? 1 : 0);

  const pad = {
    /** Se llama una vez por cuadro, antes de actualizar el juego. */
    poll() {
      before = now;
      now = new Set([...keys, ...taps]);
      touches.forEach((buttons) => buttons.forEach((button) => now.add(button)));
      taps.clear();
      history.push({ x: axis(now, "left", "right"), y: axis(now, "up", "down") });
      if (history.length > 30) history.shift();
    },
    held: (button) => now.has(button),
    pressed: (button) => now.has(button) && !before.has(button),
    anyPressed: (...buttons) => buttons.some((button) => pad.pressed(button)),
    axisX: () => axis(now, "left", "right"),
    /**
     * ¿Se hizo este movimiento con la cruceta en los últimos cuadros? Usa la notación de los
     * juegos de pelea (el teclado numérico): 2 = abajo, 3 = abajo-adelante, 6 = adelante.
     * "Adelante" depende de para dónde mira el personaje (facing = 1 derecha, -1 izquierda).
     */
    motion(sequence, facing, frames = 20) {
      let index = sequence.length - 1;
      for (let k = history.length - 1; k >= 0 && history.length - k <= frames; k--) {
        const { x, y } = history[k];
        if (5 + x * facing - 3 * y === sequence[index]) index--;
        if (index < 0) return true;
      }
      return false;
    },
    clear() {
      keys.clear();
      taps.clear();
      touches.clear();
      history.length = 0;
      now = new Set();
      before = new Set();
    },
  };
  return pad;
}
