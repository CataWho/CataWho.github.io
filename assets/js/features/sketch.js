// Corre sketches de p5.js dentro de un <iframe> aislado (sandbox).
// El iframe le avisa a la página el tamaño del canvas y los errores del código,
// y se pausa solo cuando sale de la pantalla para no gastar procesador.

const P5_URL = "https://cdn.jsdelivr.net/npm/p5@1.11.3/lib/p5.min.js";

// Este script corre ANTES del código del sketch: escucha errores y pausas.
const BEFORE_SKETCH = `
  addEventListener("error", (event) => {
    parent.postMessage({ kind: "p5-error", message: event.message, line: event.lineno }, "*");
  });
  let wasLooping = true;
  addEventListener("message", (event) => {
    if (typeof noLoop !== "function") return;
    if (event.data === "p5-pause") { wasLooping = isLooping(); noLoop(); }
    if (event.data === "p5-resume" && wasLooping) loop();
  });`;

// Este corre DESPUÉS: ajusta el canvas al tamaño del iframe sin deformarlo.
const AFTER_SKETCH = `
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
      parent.postMessage({ kind: "p5-size", width, height }, "*");
    }
  }
  new MutationObserver(fitCanvas).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["width", "height"] });
  addEventListener("resize", fitCanvas);
  fitCanvas();`;

function sketchDocument(code) {
  const safeCode = String(code || "").replace(/<\/script/gi, "<\\/script");
  const head = `<!doctype html><html><head><style>
html,body{margin:0;padding:0;background:#3e1220;overflow:hidden}
canvas{display:block;max-width:none!important}
</style><script>${BEFORE_SKETCH}<\/script><script src="${P5_URL}"><\/script></head><body>
<script>
`;
  // Guardamos en qué línea empieza el código para traducir los números de línea de los errores.
  return {
    html: `${head}${safeCode}\n<\/script><script>${AFTER_SKETCH}<\/script></body></html>`,
    firstLine: head.split("\n").length,
  };
}

const frames = new Map(); // iframe → { firstLine, onSize, onError }

const visibility = new IntersectionObserver((entries) => {
  entries.forEach((entry) =>
    entry.target.contentWindow?.postMessage(entry.isIntersecting ? "p5-resume" : "p5-pause", "*"),
  );
});

/**
 * Carga (o recarga) un sketch en un iframe.
 * onSize({width, height}) y onError(texto) son opcionales.
 */
export function mountSketch(frame, code, { onSize, onError } = {}) {
  // Olvidamos los iframes que ya no están en la página.
  for (const old of frames.keys()) {
    if (!old.isConnected) {
      frames.delete(old);
      visibility.unobserve(old);
    }
  }
  const { html, firstLine } = sketchDocument(code);
  frame.setAttribute("sandbox", "allow-scripts");
  frames.set(frame, { firstLine, onSize, onError });
  visibility.observe(frame);
  frame.srcdoc = html;
}

window.addEventListener("message", (event) => {
  const frame = [...frames.keys()].find((candidate) => candidate.contentWindow === event.source);
  if (!frame) return;
  const { firstLine, onSize, onError } = frames.get(frame);
  const data = event.data || {};
  if (data.kind === "p5-size" && Number(data.width) > 0 && Number(data.height) > 0) onSize?.(data);
  if (data.kind === "p5-error") {
    const line = data.line >= firstLine ? ` (línea ${data.line - firstLine + 1})` : "";
    onError?.(`${data.message}${line}`);
  }
});
