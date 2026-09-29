// Destellos pixelados que deja el cursor al moverse (como los del avatar).
// Solo en compu (mouse) y nunca si la persona pidió "reducir movimiento".

const COLORS = ["#7c2337", "#bd5268", "#e3d5d6"];
const PIXEL = 3; // tamaño de cada "píxel" del destello
const EVERY = 28; // cada cuántos píxeles de recorrido del mouse nace un destello
const LIFE = 700; // ms que dura cada destello
const MAX = 40;

// Forma de cruz "+" de 3×3 (x, y) y un punto suelto, para variar.
const SHAPES = [
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2],
  ],
  [[0, 0]],
];

export function startCursorSparkles() {
  if (!matchMedia("(pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "cursor-sparkles";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const context = canvas.getContext("2d");
  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  };
  resize();
  addEventListener("resize", resize);

  const sparkles = [];
  let last = null;
  let running = false;

  addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const point = { x: event.clientX, y: event.clientY };
    if (last && Math.hypot(point.x - last.x, point.y - last.y) < EVERY) return;
    last = point;
    sparkles.push({
      x: point.x + (Math.random() - 0.5) * 14,
      y: point.y + (Math.random() - 0.5) * 14,
      born: performance.now(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.random() < 0.7 ? 0 : 1],
    });
    if (sparkles.length > MAX) sparkles.shift();
    if (!running) {
      running = true;
      requestAnimationFrame(draw);
    }
  });

  function draw(now) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const sparkle = sparkles[i];
      const age = (now - sparkle.born) / LIFE;
      if (age >= 1) {
        sparkles.splice(i, 1);
        continue;
      }
      // Caen un poquito y se apagan de a "escalones", como en un juego viejo.
      context.globalAlpha = Math.ceil((1 - age) * 4) / 4;
      context.fillStyle = sparkle.color;
      const fall = Math.round(age * 6) * PIXEL;
      for (const [x, y] of sparkle.shape) {
        context.fillRect(
          Math.round(sparkle.x / PIXEL) * PIXEL + x * PIXEL,
          Math.round(sparkle.y / PIXEL) * PIXEL + y * PIXEL + fall,
          PIXEL,
          PIXEL,
        );
      }
    }
    context.globalAlpha = 1;
    // Cuando no quedan destellos, la animación se detiene (no gasta nada).
    if (sparkles.length) requestAnimationFrame(draw);
    else running = false;
  }
}
