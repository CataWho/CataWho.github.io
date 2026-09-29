// Corre código vivo (p5.js o Hydra) dentro de un <iframe> aislado (sandbox).
// El iframe le avisa a la página el tamaño del canvas y los errores del código,
// y se pausa solo cuando sale de la pantalla para no gastar procesador.
// A los sketches de Hydra además se les puede mandar el sonido (a.fft) desde afuera.

const P5_URL = "https://cdn.jsdelivr.net/npm/p5@1.11.3/lib/p5.min.js";
const HYDRA_URL = "https://cdn.jsdelivr.net/npm/hydra-synth@1.4.0/dist/hydra-synth.js";

// Corre ANTES de todo: reenvía los errores del código a la página.
const REPORT_ERRORS = `
  addEventListener("error", (event) => {
    parent.postMessage({ kind: "sketch-error", message: event.message, line: event.lineno }, "*");
  });`;

// --- p5.js ------------------------------------------------------------------

const P5_BEFORE = `
  let wasLooping = true;
  addEventListener("message", (event) => {
    if (typeof noLoop !== "function") return;
    if (event.data === "sketch-pause") { wasLooping = isLooping(); noLoop(); }
    if (event.data === "sketch-resume" && wasLooping) loop();
  });`;

// Ajusta el canvas al tamaño del iframe sin deformarlo.
const P5_AFTER = `
  let previousSize = "";
  function fitCanvas() {
    const canvas = document.querySelector("canvas");
    if (!canvas || !canvas.width || !canvas.height) return;
    const { width, height } = canvas;
    const scale = Math.min(innerWidth / width, innerHeight / height);
    canvas.style.setProperty("width", width * scale + "px", "important");
    canvas.style.setProperty("height", height * scale + "px", "important");
    canvas.style.setProperty("position", "absolute", "important");
    canvas.style.setProperty("left", (innerWidth - width * scale) / 2 + "px", "important");
    canvas.style.setProperty("top", (innerHeight - height * scale) / 2 + "px", "important");
    if (width + ":" + height !== previousSize) {
      previousSize = width + ":" + height;
      parent.postMessage({ kind: "sketch-size", width, height }, "*");
    }
  }
  new MutationObserver(fitCanvas).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["width", "height"] });
  addEventListener("resize", fitCanvas);
  fitCanvas();`;

// --- Hydra ------------------------------------------------------------------

// Prepara Hydra antes del código (dentro de una función, para que sus variables no
// choquen con las del código de la usuaria): canvas a pantalla completa, pausa, y un "a.fft"
// propio. Si la página manda sonido, a.fft lo sigue; si no, se mueve solo con una
// onda suave (así los visuales que dependen del micrófono nunca quedan en negro).
const hydraSetup = (resolution) => `(() => {
  const canvas = document.createElement("canvas");
  document.body.append(canvas);
  const pixelSize = () => [
    Math.max(1, Math.round(innerWidth * ${resolution})),
    Math.max(1, Math.round(innerHeight * ${resolution})),
  ];
  const [width, height] = pixelSize();
  const hydra = new Hydra({ canvas, width, height, detectAudio: false, makeGlobal: true, autoLoop: false });
  const noop = () => {};
  window.a = { fft: [0.3, 0.3, 0.3, 0.3], setBins: noop, setSmooth: noop, setCutoff: noop, setScale: noop, show: noop, hide: noop };

  let running = true;
  let last = performance.now();
  let lastAudio = 0;
  const idle = (now) => [0, 1, 2, 3].map((i) => 0.3 + 0.15 * Math.sin((now / 1000) * (0.6 + i * 0.37) + i * 1.7));
  function frame(now) {
    const dt = now - last;
    last = now;
    if (running) {
      if (now - lastAudio > 300) a.fft = idle(now);
      hydra.tick(dt);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  addEventListener("resize", () => hydra.setResolution(...pixelSize()));
  addEventListener("message", (event) => {
    if (event.data === "sketch-pause") running = false;
    if (event.data === "sketch-resume") running = true;
    if (event.data?.kind === "audio") {
      a.fft = event.data.fft;
      lastAudio = performance.now();
    }
  });
})();`;

// --- Armado del documento del iframe -------------------------------------------

function sketchDocument(code, engine, resolution) {
  const safeCode = String(code || "").replace(/<\/script/gi, "<\\/script");
  const isHydra = engine === "hydra";
  const head = `<!doctype html><html><head><style>
html,body{margin:0;padding:0;background:#3e1220;overflow:hidden;height:100%}
canvas{display:block;max-width:none!important}
${isHydra ? "canvas{width:100%!important;height:100%!important}" : ""}
</style><script>${REPORT_ERRORS}${isHydra ? "" : P5_BEFORE}<\/script>
<script src="${isHydra ? HYDRA_URL : P5_URL}"><\/script></head><body>
${isHydra ? `<script>${hydraSetup(resolution)}<\/script>` : ""}
<script>
`;
  const after = isHydra ? "" : `<script>${P5_AFTER}<\/script>`;
  // Guardamos en qué línea empieza el código para traducir los números de línea de los errores.
  return {
    html: `${head}${safeCode}\n<\/script>${after}</body></html>`,
    firstLine: head.split("\n").length,
  };
}

const frames = new Map(); // iframe → { firstLine, onSize, onError }

const visibility = new IntersectionObserver((entries) => {
  entries.forEach((entry) =>
    entry.target.contentWindow?.postMessage(entry.isIntersecting ? "sketch-resume" : "sketch-pause", "*"),
  );
});

/**
 * Carga (o recarga) código vivo en un iframe.
 * - engine: "p5" (por defecto) o "hydra".
 * - resolution: para Hydra, qué fracción de los píxeles dibujar (menos = más liviano).
 * - onSize({width, height}) y onError(texto) son opcionales.
 */
export function mountSketch(frame, code, { engine = "p5", resolution = 1, onSize, onError } = {}) {
  // Olvidamos los iframes que ya no están en la página.
  for (const old of frames.keys()) {
    if (!old.isConnected) {
      frames.delete(old);
      visibility.unobserve(old);
    }
  }
  const { html, firstLine } = sketchDocument(code, engine, resolution);
  frame.setAttribute("sandbox", "allow-scripts");
  frames.set(frame, { firstLine, onSize, onError });
  visibility.observe(frame);
  frame.srcdoc = html;
}

/** Le manda a un sketch de Hydra los valores de sonido para a.fft (4 números entre 0 y 1). */
export function sendAudio(frame, fft) {
  frame.contentWindow?.postMessage({ kind: "audio", fft }, "*");
}

window.addEventListener("message", (event) => {
  const frame = [...frames.keys()].find((candidate) => candidate.contentWindow === event.source);
  if (!frame) return;
  const { firstLine, onSize, onError } = frames.get(frame);
  const data = event.data || {};
  if (data.kind === "sketch-size" && Number(data.width) > 0 && Number(data.height) > 0) onSize?.(data);
  if (data.kind === "sketch-error") {
    const line = data.line >= firstLine ? ` (línea ${data.line - firstLine + 1})` : "";
    onError?.(`${data.message}${line}`);
  }
});
