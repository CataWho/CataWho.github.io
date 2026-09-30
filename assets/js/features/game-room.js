// La sala de juegos (juegos.html): una habitación retro de líneas de luz en perspectiva, con un
// cuadrado negro al fondo (el espacio), nubes y un letrero pintado en las paredes y el techo.
// De ese cuadrado sale el juego cuando se elige una tele. Abajo, el panel de teles: la del juego
// muestra en vivo lo que pasa adentro y las demás, estática de "sin señal".
//
// A diferencia de los juegos, esto NO es pixel art: se dibuja a la resolución real de la pantalla
// (líneas finas que brillan), como la ilustración de referencia.

import { seeded } from "../games/arcade/pixel.js";

// Dónde está el cuadrado del fondo. El CSS usa estos mismos números (ver games.css) para que la
// pantalla del juego arranque exactamente ahí y viaje hacia adelante.
const ROOM = {
  centerY: 0.45, // altura del centro del cuadrado (0 arriba, 1 abajo)
  screen: 0.86, // ancho de la pantalla del juego cuando está adelante (de 0 a 1)
  back: 0.3, // tamaño del cuadrado del fondo comparado con la pantalla adelante
};
const DEPTH = 5; // cuánto se "achican" las líneas hacia el fondo (más = más profundidad)
const CROSS_LINES = 12;
const RAILS = 10;
// El letrero: entre qué profundidades está pintado (0 = adelante, 1 = el fondo) y a qué velocidad corre.
const MARQUEE = { near: 0.03, far: 0.11, speed: 0.012, color: "#c98aa8", alpha: 0.38 };
export const NO_SIGNAL = ["rainbow", "snow", "bars"]; // las "lluvias" de las teles sin señal
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Nubes ----------------------------------------------------------------------------------

/**
 * Una nube de verdad es "fractal": bollos grandes con bollos más chicos en el borde, y en esos, más
 * chicos todavía. Se arma así, en proporciones de la sala (x e y de 0 a 1, r comparado con el ancho).
 */
function makeCloud(rand, cx, base, width, height) {
  const puffs = [];
  for (let i = 0; i < 9; i++) {
    const k = i / 8 - 0.5;
    const tall = 1 - Math.abs(k) * 1.6; // más alta en el medio
    puffs.push({ x: cx + k * width, y: base - rand() * height * tall * 0.6, r: width * (0.09 + rand() * 0.05) * (0.6 + tall * 0.6) });
  }
  let level = puffs;
  for (let depth = 0; depth < 3; depth++) {
    const next = [];
    level.forEach((puff) => {
      const count = 3 + Math.floor(rand() * 3);
      for (let i = 0; i < count; i++) {
        // Los bollitos nuevos salen del borde de arriba y de los costados (nunca de abajo: la base es chata).
        const angle = -Math.PI * (0.05 + rand() * 0.9);
        const r = puff.r * (0.35 + rand() * 0.25);
        const y = Math.min(base, puff.y + Math.sin(angle) * puff.r * 0.85);
        next.push({ x: puff.x + Math.cos(angle) * puff.r * 0.85, y, r });
      }
    });
    puffs.push(...next);
    level = next;
  }
  return { puffs, top: Math.min(...puffs.map((p) => p.y - p.r)), base };
}

function makeClouds() {
  const rand = seeded(12);
  return [makeCloud(rand, 0.19, 0.74, 0.3, 0.22), makeCloud(rand, 0.81, 0.7, 0.32, 0.28), makeCloud(rand, 0.5, 0.65, 0.12, 0.08)];
}

/** Color HSL (tono 0-360, saturación y luz de 0 a 1) → [r, g, b]. */
function hsl(h, sat, light) {
  const k = (n) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  return [0, 8, 4].map((n) => 255 * (light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
}

/** Mezcla dos colores [r, g, b] (k de 0 a 1). */
const mixColor = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));

function paintClouds(canvas, clouds) {
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  const shadow = [150, 158, 190]; // abajo, gris azulado
  const mid = [222, 226, 240];
  // Un desenfoque apenas: así los bollitos se funden entre sí como en una nube de verdad.
  ctx.filter = `blur(${Math.max(1, w * 0.0018)}px)`;
  const light = [255, 255, 255]; // arriba, donde da la luz
  clouds.forEach(({ puffs, top, base }) => {
    puffs.forEach(({ x, y, r }) => {
      const px = x * w;
      const py = y * h;
      const pr = r * w;
      // Cuanto más arriba en la nube, más iluminado.
      const height = Math.max(0, Math.min(1, (base * h - py) / ((base - top) * h)));
      const body = height < 0.5 ? mixColor(shadow, mid, height * 2) : mixColor(mid, light, (height - 0.5) * 2);
      // Cada bollo: centro claro corrido hacia arriba (la luz viene de arriba) y borde que se desvanece.
      const gradient = ctx.createRadialGradient(px - pr * 0.15, py - pr * 0.3, pr * 0.05, px, py, pr);
      gradient.addColorStop(0, `rgba(${mixColor(body, light, 0.5)}, 1)`);
      gradient.addColorStop(0.6, `rgba(${body}, 0.95)`);
      gradient.addColorStop(1, `rgba(${body}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    });
    // La base chata y en sombra, como las nubes de verdad.
    const left = Math.min(...puffs.map((p) => p.x - p.r)) * w;
    const right = Math.max(...puffs.map((p) => p.x + p.r)) * w;
    const shade = ctx.createLinearGradient(0, base * h - (right - left) * 0.08, 0, base * h + (right - left) * 0.03);
    shade.addColorStop(0, "rgba(90, 100, 145, 0)");
    shade.addColorStop(1, "rgba(90, 100, 145, 0.55)");
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = shade;
    ctx.fillRect(left, 0, right - left, h);
    ctx.globalCompositeOperation = "source-over";
  });
  ctx.filter = "none";
}

// --- El letrero ----------------------------------------------------------------------------------

/** El texto del letrero, repetido, en una tira larga (después se "pega" en perspectiva). */
function makeBanner(text) {
  const size = 40;
  const measure = document.createElement("canvas").getContext("2d");
  const font = `${size}px "Press Start 2P", monospace`;
  measure.font = font;
  const width = Math.ceil(measure.measureText(text).width);
  const canvas = document.createElement("canvas");
  canvas.width = width * 3;
  canvas.height = Math.round(size * 1.5);
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  ctx.fillStyle = MARQUEE.color;
  ctx.textBaseline = "middle";
  for (let i = 0; i < 3; i++) ctx.fillText(text, i * width, canvas.height / 2);
  return { canvas, width };
}

// --- La sala -----------------------------------------------------------------------------------

/**
 * view: el contenedor de la sala · canvas: donde se dibuja la habitación
 * tvs: [{ canvas, source }] (source = canvas del juego para verlo en vivo)
 *      o [{ canvas, mode }] (sin señal; mode = rainbow, snow o bars)
 * marquee: el texto del letrero que da la vuelta por la pared izquierda, el techo y la pared derecha.
 */
export function mountGameRoom({ view, canvas, tvs, marquee }) {
  const ctx = canvas.getContext("2d");
  const clouds = document.createElement("canvas");
  const cloudShapes = makeClouds();
  const starRand = seeded(3);
  const stars = Array.from({ length: 40 }, () => ({ x: starRand(), y: starRand(), t: starRand() * 100 }));
  let banner = makeBanner(marquee);
  let dpr = 1;
  let raf = 0;
  let visible = true;
  let frame = 0;

  // El CSS toma las medidas del cuadrado desde acá.
  view.style.setProperty("--room-cy", ROOM.centerY);
  view.style.setProperty("--room-screen", ROOM.screen);
  view.style.setProperty("--room-back", ROOM.back);
  // Si la tipografía pixel todavía no había cargado, se vuelve a armar la tira del letrero.
  document.fonts?.ready.then(() => (banner = makeBanner(marquee)));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(view.clientWidth * dpr);
    canvas.height = Math.round(view.clientHeight * dpr);
    clouds.width = canvas.width;
    clouds.height = canvas.height;
    paintClouds(clouds, cloudShapes);
  }

  function geometry() {
    const { width: w, height: h } = canvas;
    const bw = w * ROOM.screen * ROOM.back;
    const bh = (bw * 9) / 16;
    const bx = (w - bw) / 2;
    const by = h * ROOM.centerY - bh / 2;
    // Rectángulo a una profundidad u (0 = adelante, 1 = el fondo), con perspectiva.
    const at = (u) => {
      const g = (u * (1 + DEPTH)) / (1 + DEPTH * u);
      return [bx * g, by * g, w + (bx + bw - w) * g, h + (by + bh - h) * g];
    };
    // Profundidad que corresponde a un punto de la pantalla (la cuenta de "at", al revés).
    const depthOf = (g) => g / (1 + DEPTH - DEPTH * g);
    return { w, h, bw, bh, bx, by, at, depthOf };
  }

  /**
   * El letrero pintado sobre las superficies: se dibuja en tiras de 1 píxel. En el techo, cada fila
   * de la pantalla está a una misma profundidad; en las paredes, cada columna. Así cada tira del texto
   * se estira o se achica lo justo y las letras quedan "apoyadas" en la pared, en perspectiva.
   * Recorre la pared izquierda de abajo hacia arriba, el techo y la pared derecha hacia abajo.
   */
  function drawMarquee(time, { at, depthOf, bx, by }) {
    const [nx0, ny0, nx1, ny1] = at(MARQUEE.near);
    const [fx0, fy0] = at(MARQUEE.far);
    const texture = banner.canvas;
    const texH = texture.height;
    // Largo del recorrido adelante (en la pantalla) y cuánto texto entra en él.
    const pathAt = ([x0, y0, x1, y1]) => [y1 - y0, x1 - x0, y1 - y0];
    const thickness = fy0 - ny0;
    const visible = ((ny1 - ny0) * 2 + (nx1 - nx0)) * (texH / thickness);
    const offset = reducedMotion ? 0 : (time * MARQUEE.speed * texH) % banner.width;

    ctx.save();
    ctx.globalAlpha = MARQUEE.alpha;
    ctx.imageSmoothingEnabled = true;
    const strip = (u, draw) => {
      const v = ((u - MARQUEE.near) / (MARQUEE.far - MARQUEE.near)) * texH; // fila del texto (arriba adelante)
      const legs = pathAt(at(u));
      const total = legs[0] + legs[1] + legs[2];
      let start = 0;
      legs.forEach((length, leg) => {
        const sx = offset + (start / total) * visible;
        const sw = (length / total) * visible;
        draw(leg, v, sx, sw, length);
        start += length;
      });
    };
    // Techo: una fila por píxel, entre el borde de adelante y el de atrás del letrero.
    for (let y = Math.ceil(ny0); y < fy0; y++) {
      const u = depthOf(y / by);
      strip(u, (leg, v, sx, sw, length) => {
        if (leg !== 1) return;
        const [x0] = at(u);
        ctx.drawImage(texture, sx, v, sw, 1, x0, y, length, 1);
      });
    }
    // Paredes: una columna por píxel (a la izquierda sube, a la derecha baja).
    for (let x = Math.ceil(nx0); x < fx0; x++) {
      const u = depthOf(x / bx);
      strip(u, (leg, v, sx, sw, length) => {
        const [x0, y0, x1, y1] = at(u);
        if (leg === 0) {
          ctx.setTransform(0, -1, 1, 0, x0, y1); // girado: dibuja hacia arriba
          ctx.drawImage(texture, sx, v, sw, 1, 0, 0, length, 1);
        } else if (leg === 2) {
          ctx.setTransform(0, 1, -1, 0, x1, y0); // girado: dibuja hacia abajo
          ctx.drawImage(texture, sx, v, sw, 1, 0, 0, length, 1);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      });
    }
    ctx.restore();
  }

  /**
   * El piso, como en la ilustración: un brillo azulado que se apaga hacia adelante, el reflejo de las
   * nubes y unas curvas de nivel suaves (como un mapa topográfico), todo en perspectiva.
   */
  function drawFloor(time, { w, h, bx, by, bw, bh, at }) {
    const floor = new Path2D();
    floor.moveTo(0, h);
    floor.lineTo(w, h);
    floor.lineTo(bx + bw, by + bh);
    floor.lineTo(bx, by + bh);
    floor.closePath();
    ctx.save();
    ctx.clip(floor);
    const glow = ctx.createLinearGradient(0, by + bh, 0, h);
    glow.addColorStop(0, "rgba(120, 150, 255, 0.45)");
    glow.addColorStop(0.35, "rgba(70, 80, 170, 0.22)");
    glow.addColorStop(1, "rgba(10, 8, 30, 0.1)");
    ctx.fillStyle = glow;
    ctx.fill(floor);
    // Reflejo de las nubes: dadas vuelta sobre la línea del piso, transparentes.
    const horizon = h * 0.74;
    ctx.globalAlpha = 0.22;
    ctx.translate(0, horizon * 2);
    ctx.scale(1, -1);
    ctx.drawImage(clouds, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Curvas de nivel: líneas onduladas que se van achicando hacia el fondo.
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#b8c8ff";
    ctx.lineWidth = Math.max(1, w / 1400);
    for (let k = 1; k <= 9; k++) {
      const u = k / 10;
      const [x0, , x1, y1] = at(u);
      const wave = (1 - u) * h * 0.012;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const x = x0 + ((x1 - x0) * i) / 40;
        const y = y1 + Math.sin(i * 0.7 + k * 1.3 + time * 0.0004) * wave + Math.sin(i * 0.23 + k) * wave * 1.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRoom(time) {
    const room = geometry();
    const { w, h, bw, bh, bx, by, at } = room;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
    drawFloor(time, room);

    // El espacio al fondo, con estrellas que titilan.
    ctx.fillStyle = "#000000";
    ctx.fillRect(bx, by, bw, bh);
    stars.forEach((star) => {
      ctx.fillStyle = Math.sin(time * 0.002 + star.t) > 0.3 ? "#ffffff" : "#6a6090";
      ctx.fillRect(bx + star.x * bw, by + star.y * bh, dpr, dpr);
    });

    // El letrero, pintado en las superficies (por debajo de las líneas de luz).
    drawMarquee(time, room);

    // Las líneas de luz: un degradé rosa → blanco → celeste, con brillo.
    const light = ctx.createLinearGradient(0, 0, w, 0);
    light.addColorStop(0, "#ffb3e0");
    light.addColorStop(0.5, "#f5f7ff");
    light.addColorStop(1, "#9fe0ff");
    ctx.strokeStyle = light;
    ctx.lineWidth = Math.max(1, w / 900);
    ctx.shadowColor = "rgba(160, 215, 255, 0.9)";
    ctx.shadowBlur = 6 * dpr;
    ctx.beginPath();
    // Líneas que cruzan (se acercan despacio: parece que la sala avanza).
    const phase = reducedMotion ? 0.5 : (time * 0.00008) % 1;
    for (let k = 0; k < CROSS_LINES; k++) {
      const u = (k + 1 - phase) / CROSS_LINES;
      const [x0, y0, x1, y1] = at(u);
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
    }
    // Rieles que van hacia el fondo, en el piso, el techo y las paredes.
    for (let i = 0; i <= RAILS; i++) {
      const k = i / RAILS;
      ctx.moveTo(k * w, h);
      ctx.lineTo(bx + k * bw, by + bh);
      ctx.moveTo(k * w, 0);
      ctx.lineTo(bx + k * bw, by);
      ctx.moveTo(0, k * h);
      ctx.lineTo(bx, by + k * bh);
      ctx.moveTo(w, k * h);
      ctx.lineTo(bx + bw, by + k * bh);
    }
    ctx.rect(bx, by, bw, bh);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Nubes que se mecen apenas.
    const drift = reducedMotion ? 0 : Math.sin(time * 0.0002) * w * 0.006;
    ctx.drawImage(clouds, drift, 0);

    // Letreros de luces rojas arriba, como en los tableros viejos.
    ctx.font = `${10 * dpr}px "DM Mono", monospace`;
    ctx.fillStyle = "#ff5a3c";
    ctx.shadowColor = "#ff5a3c";
    ctx.shadowBlur = 8 * dpr;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText("ARCHIVO VIVO · SALA 08", 12 * dpr, 10 * dpr);
    ctx.textAlign = "right";
    ctx.fillText(new Date().toLocaleTimeString("es-AR", { hour12: false }), w - 12 * dpr, 10 * dpr);
    ctx.shadowBlur = 0;
  }

  /**
   * Teles sin señal, cada una con su "lluvia" (como en los tableros viejos de la ilustración):
   * rainbow = franjas de arcoíris que ondulan · snow = estática de colores · bars = barras de prueba.
   */
  function drawNoise(tv) {
    const c = tv.canvas.getContext("2d");
    const { width, height } = tv.canvas;
    const image = c.createImageData(width, height);
    const roll = (frame * 0.8) % (height + 20); // la franja clara que baja
    for (let i = 0; i < image.data.length; i += 4) {
      const x = (i / 4) % width;
      const y = Math.floor(i / 4 / width);
      const grain = Math.random() * 90;
      const flash = Math.abs(y - roll) < 3 ? 60 : 0;
      let rgb;
      if (tv.mode === "rainbow") {
        const hue = (y * 6 + Math.sin(y * 0.3 + frame * 0.1) * 8 - frame * 2) % 360;
        rgb = hsl((hue + 360) % 360, 0.9, 0.55).map((v) => v * 0.7 + grain);
      } else if (tv.mode === "bars") {
        const glitch = Math.random() < 0.02 ? Math.random() * 8 : 0;
        const bar = Math.floor(((x + glitch) / width) * 7) % 7;
        const colors = [[235, 235, 235], [235, 235, 40], [40, 235, 235], [40, 235, 40], [235, 40, 235], [235, 40, 40], [40, 40, 235]];
        rgb = (y > height * 0.72 ? [30, 30, 40] : colors[bar]).map((v) => v * 0.75 + grain * 0.6);
      } else {
        const v = Math.random();
        rgb = v > 0.92 ? hsl(Math.random() * 360, 1, 0.6) : [v * 210, v * 210, v * 230];
      }
      image.data[i] = rgb[0] + flash;
      image.data[i + 1] = rgb[1] + flash;
      image.data[i + 2] = rgb[2] + flash;
      image.data[i + 3] = 255;
    }
    c.putImageData(image, 0, 0);
  }

  /** La tele del juego muestra lo que pasa adentro, recortado a una pantalla 4:3. */
  function drawMirror(tv) {
    const c = tv.canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    const { width, height } = tv.canvas;
    const scale = height / tv.source.height;
    c.drawImage(tv.source, (width - tv.source.width * scale) / 2, 0, tv.source.width * scale, height);
  }

  function loop(time) {
    raf = requestAnimationFrame(loop);
    frame++;
    drawRoom(time);
    tvs.forEach((tv) => {
      if (tv.source) drawMirror(tv);
      else if (!reducedMotion || frame % 12 === 0) drawNoise(tv);
    });
  }

  function sync() {
    const run = visible && !document.hidden;
    if (run && !raf) raf = requestAnimationFrame(loop);
    if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  new ResizeObserver(resize).observe(view);
  // Si la sala no se ve, no se dibuja (así no gasta batería).
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(view.closest("[data-room]"));
  document.addEventListener("visibilitychange", sync);
  resize();
  sync();
}
