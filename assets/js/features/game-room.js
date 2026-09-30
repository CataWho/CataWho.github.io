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
  centerY: 0.46, // altura del centro del cuadrado (0 arriba, 1 abajo)
  screen: 0.86, // la pantalla del juego adelante ocupa como mucho este ancho de la sala...
  screenHeight: 0.84, // ...y como mucho este alto
  back: 0.3, // tamaño del cuadrado del fondo comparado con la pantalla adelante
};

/** Ancho (en píxeles) de la pantalla del juego cuando está adelante: lo más grande que entre. */
const screenWidth = (w, h) => Math.min(w * ROOM.screen, ((h * ROOM.screenHeight) * 16) / 9);
const DEPTH = 5; // cuánto se "achican" las líneas hacia el fondo (más = más profundidad)
const CROSS_LINES = 12;
const RAILS = 10;
// El letrero: entre qué profundidades está pintado (0 = adelante, 1 = el fondo) y a qué velocidad corre.
const MARQUEE = { near: 0.12, far: 0.2, speed: 0.0008, color: "#c98aa8", alpha: 0.38 };
export const NO_SIGNAL = ["rainbow", "snow", "bars"]; // las "lluvias" de las teles sin señal
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Nubes ----------------------------------------------------------------------------------
//
// Las nubes se calculan como en los programas 3D: una "niebla" (densidad) que se arma con la forma
// general de la nube más ruido (para los bollitos y pliegues). Después se ilumina: cada punto se
// oscurece si entre él y el sol (arriba a la izquierda) hay más nube. Así aparecen las partes muy
// blancas donde da la luz y los grises de los pliegues, como en una foto.

/** Ruido suave (value noise): números al azar que cambian de a poco. Siempre el mismo. */
function makeNoise(seed) {
  const rand = seeded(seed);
  const table = Float32Array.from({ length: 256 * 256 }, rand);
  const at = (x, y) => table[(y & 255) * 256 + (x & 255)];
  const noise = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = (x - xi) ** 2 * (3 - 2 * (x - xi));
    const v = (y - yi) ** 2 * (3 - 2 * (y - yi));
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  // Varias capas de ruido, cada una más fina (bollos grandes con bollitos encima).
  return (x, y) => {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    for (let i = 0; i < 5; i++) {
      sum += amp * noise(x * freq, y * freq);
      freq *= 2.03;
      amp *= 0.5;
    }
    return sum;
  };
}

/**
 * La forma general de cada nube: unas "cúpulas" con base chata, medidas en proporción al ancho de la
 * nube. Dónde está apoyada en el piso de la sala: side de 0 (pared izquierda) a 1 (pared derecha) y
 * depth de 0 (adelante) a 1 (el fondo). peak: dónde está su parte más alta (0 izquierda, 1 derecha);
 * height: qué tan alta es; count: cuántas cúpulas (más = más alargada).
 * Si se pasa de una pared, queda cortada contra ella (como apoyada).
 */
function makeCloud(rand, { side, depth, width, peak = 0.5, height = 1, count = 11 }) {
  const domes = [];
  for (let i = 0; i < count; i++) {
    const k = i / (count - 1) - 0.5;
    const tall = Math.max(0.15, 1 - Math.abs(k - (peak - 0.5)) * 1.4);
    domes.push({ x: k * 0.85, up: tall * height * (0.34 + rand() * 0.16), r: (0.12 + tall * 0.1 + rand() * 0.04) * (11 / count) ** 0.4 });
  }
  // Cúpulas más chicas sobre el borde de arriba: la "coliflor" de las nubes de verdad.
  domes.slice().forEach((dome) => {
    for (let i = 0; i < 2; i++) {
      const angle = -Math.PI * (0.2 + rand() * 0.6);
      domes.push({ x: dome.x + Math.cos(angle) * dome.r * 0.75, up: dome.up - Math.sin(angle) * dome.r * 0.75, r: dome.r * (0.38 + rand() * 0.18) });
    }
  });
  return { domes, side, depth, width };
}

function makeClouds() {
  const rand = seeded(12);
  // Desparejas a propósito: cada una con su tamaño, su altura y su lugar.
  return [
    makeCloud(rand, { side: 0.255, depth: 0.03, width: 0.44, peak: 0.75, height: 0.75, count: 14 }), // grande y alargada, casi contra la pared
    makeCloud(rand, { side: 0.84, depth: 0.06, width: 0.24, peak: 0.45, height: 1.35, count: 8 }), // alta y angosta
    makeCloud(rand, { side: 0.3, depth: 0.38, width: 0.3, peak: 0.3, height: 0.6, count: 9 }), // lejos, corrida del centro
    makeCloud(rand, { side: 0.95, depth: 0.6, width: 0.32, peak: 0.2, height: 0.7, count: 7 }), // chiquita, contra la pared
  ];
}

/** Color HSL (tono 0-360, saturación y luz de 0 a 1) → [r, g, b]. */
function hsl(h, sat, light) {
  const k = (n) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  return [0, 8, 4].map((n) => 255 * (light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
}

const fbm = makeNoise(21);
const smooth = (a, b, v) => Math.max(0, Math.min(1, (v - a) / (b - a)));

/**
 * place(nube) dice dónde queda en la pantalla: { x (centro), floor (línea del piso), size (ancho) }.
 * Cada nube se dibuja con su sombra y su reflejo en el piso, y con un toque de las luces de la sala
 * (rosa del lado izquierdo, celeste del derecho).
 */
function paintClouds(canvas, clouds, place) {
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  const white = [255, 253, 250];
  const shadow = [96, 98, 146]; // sombra violácea, como el ambiente de la sala
  const pink = [255, 214, 236];
  const cyan = [206, 238, 255];

  // Las del fondo primero, así las de adelante quedan encima.
  [...clouds].sort((a, b) => b.depth - a.depth).forEach((cloud) => {
    const { x: cx, floor, size: unit, wallLeft, wallRight } = place(cloud);
    // Nada sale de la sala: la nube se corta donde están las paredes (las que se apoyan quedan planas ahí).
    ctx.save();
    ctx.beginPath();
    ctx.rect(wallLeft, 0, wallRight - wallLeft, h);
    ctx.clip();
    const centers = cloud.domes.map((d) => ({ x: cx + d.x * unit, y: floor - d.up * unit, r: d.r * unit }));
    const margin = unit * 0.06; // lugar para los bollitos que se asoman del borde
    const left = Math.min(...centers.map((c) => c.x - c.r)) - margin;
    const right = Math.max(...centers.map((c) => c.x + c.r)) + margin;
    const top = Math.min(...centers.map((c) => c.y - c.r)) - margin;
    const boxW = right - left;
    const boxH = floor + unit * 0.02 - top;
    // Se calcula a menos resolución (y después se agranda suave): así es rápido.
    const scale = Math.min(1, 460 / boxW);
    const cw = Math.ceil(boxW * scale);
    const ch = Math.ceil(boxH * scale);
    const layer = document.createElement("canvas");
    layer.width = cw;
    layer.height = ch;
    const image = layer.getContext("2d").createImageData(cw, ch);
    const grain = unit * 0.05; // tamaño de los bollitos
    const density = (X, Y) => {
      let shape = 0;
      centers.forEach((c) => {
        const dx = (X - c.x) / c.r;
        const dy = (Y - c.y) / (c.r * 0.9);
        shape = Math.max(shape, 1 - Math.sqrt(dx * dx + dy * dy));
      });
      if (shape <= 0) return -1; // fuera de la forma no hay nube (así no quedan pedacitos sueltos)
      // El ruido arma los bollitos del borde; adentro casi no actúa, así la nube no tiene agujeros.
      const edge = 1 - smooth(0.12, 0.45, shape) * 0.7;
      let value = shape * 1.5 + (fbm(X / grain, Y / grain) - 0.5) * 0.95 * edge * Math.min(1, shape * 3 + 0.3);
      if (Y > floor - unit * 0.03) value -= (Y - (floor - unit * 0.03)) / (unit * 0.02); // base chata
      return value;
    };
    const lx = -unit * 0.035; // hacia dónde está el sol (arriba a la izquierda)
    const ly = -unit * 0.05;
    for (let j = 0; j < ch; j++) {
      for (let i = 0; i < cw; i++) {
        const X = left + i / scale;
        const Y = top + j / scale;
        const d = density(X, Y);
        const alpha = smooth(0.05, 0.2, d);
        const p = (j * cw + i) * 4;
        if (alpha <= 0) continue;
        // Si hacia el sol hay más nube, este punto queda en sombra (se miran tres puntos, más suave).
        let ahead = 0;
        for (let k = 1; k <= 3; k++) ahead += Math.max(0, density(X + (lx * k) / 2, Y + (ly * k) / 2) - d);
        const occlusion = smooth(0, 0.7, ahead / 1.5);
        const high = 1 - smooth(top, floor, Y); // la parte de arriba recibe más luz
        const crease = (fbm(X / (grain * 0.5), Y / (grain * 0.5)) - 0.5) * 0.35; // pliegues chiquitos
        const light = Math.max(0, Math.min(1, 1.02 - occlusion * 0.8 - (1 - high) * 0.3 + crease));
        const across = (X - left) / boxW; // de 0 (izquierda) a 1 (derecha)
        const lit = mixColor(mixColor(pink, cyan, across), white, 0.55);
        const color = mixColor(shadow, lit, light);
        image.data[p] = color[0];
        image.data[p + 1] = color[1];
        image.data[p + 2] = color[2];
        image.data[p + 3] = alpha * 255;
      }
    }
    layer.getContext("2d").putImageData(image, 0, 0);

    // Sombra en el piso, debajo de la nube.
    const dark = ctx.createRadialGradient(cx, floor, 0, cx, floor, unit * 0.55);
    dark.addColorStop(0, "rgba(2, 1, 10, 0.55)");
    dark.addColorStop(1, "rgba(2, 1, 10, 0)");
    ctx.save();
    ctx.translate(0, floor);
    ctx.scale(1, 0.12);
    ctx.fillStyle = dark;
    ctx.fillRect(cx - unit * 0.6, -unit * 0.6, unit * 1.2, unit * 1.2);
    ctx.restore();
    // Reflejo: la nube dada vuelta sobre su línea de piso, achatada y transparente.
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.translate(0, floor);
    ctx.scale(1, -0.5);
    ctx.translate(0, -floor);
    ctx.drawImage(layer, left, top, boxW, boxH);
    ctx.restore();
    ctx.drawImage(layer, left, top, boxW, boxH);
    ctx.restore();
  });
}

/** Mezcla dos colores [r, g, b] (k de 0 a 1). */
function mixColor(a, b, k) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * k));
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
  // Estrellas por toda la sala (se ven entre las líneas, en las paredes, el techo y el piso).
  const skyStars = Array.from({ length: 260 }, () => ({ x: starRand(), y: starRand(), t: starRand() * 100, big: starRand() > 0.9 }));
  const sky = document.createElement("canvas");
  let banner = makeBanner(marquee);
  let dpr = 1;
  let cloudTimer = 0;
  let raf = 0;
  let visible = true;
  let frame = 0;

  // El CSS toma las medidas del cuadrado desde acá.
  view.style.setProperty("--room-cy", ROOM.centerY);
  view.style.setProperty("--room-back", ROOM.back);
  // Si la tipografía pixel todavía no había cargado, se vuelve a armar la tira del letrero.
  document.fonts?.ready.then(() => (banner = makeBanner(marquee)));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(view.clientWidth * dpr);
    canvas.height = Math.round(view.clientHeight * dpr);
    // Las nubes tardan un poquito en calcularse: se hacen cuando se termina de cambiar el tamaño.
    clearTimeout(cloudTimer);
    cloudTimer = setTimeout(() => {
      clouds.width = canvas.width;
      clouds.height = canvas.height;
      const { at } = geometry();
      paintClouds(clouds, cloudShapes, ({ side, depth, width }) => {
        const [x0, , x1, y1] = at(depth);
        return { x: x0 + (x1 - x0) * side, floor: y1, size: (x1 - x0) * width, wallLeft: x0, wallRight: x1 };
      });
    }, 120);
    paintSky();
    // El CSS ubica la pantalla del juego con esta medida (así coincide con el cuadrado del fondo).
    view.style.setProperty("--screen-w", `${screenWidth(view.clientWidth, view.clientHeight)}px`);
  }

  /**
   * El fondo: espacio profundo violeta, más claro alrededor del cuadrado del fondo y oscuro en los
   * bordes, con dos nubes de nebulosa muy suaves (rosa arriba a la izquierda, turquesa abajo a la derecha).
   */
  function paintSky() {
    sky.width = canvas.width;
    sky.height = canvas.height;
    const c = sky.getContext("2d");
    const { width: w, height: h } = sky;
    const glow = c.createRadialGradient(w / 2, h * ROOM.centerY, 0, w / 2, h * ROOM.centerY, Math.max(w, h) * 0.75);
    glow.addColorStop(0, "#140a2c");
    glow.addColorStop(0.45, "#07041a");
    glow.addColorStop(1, "#010005");
    c.fillStyle = glow;
    c.fillRect(0, 0, w, h);
    [[0.15, 0.2, "rgba(255, 79, 176, 0.08)"], [0.85, 0.85, "rgba(47, 224, 192, 0.06)"]].forEach(([x, y, color]) => {
      const nebula = c.createRadialGradient(x * w, y * h, 0, x * w, y * h, w * 0.4);
      nebula.addColorStop(0, color);
      nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
      c.fillStyle = nebula;
      c.fillRect(0, 0, w, h);
    });
  }

  function geometry() {
    const { width: w, height: h } = canvas;
    const bw = screenWidth(w, h) * ROOM.back;
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

    ctx.drawImage(sky, 0, 0);
    skyStars.forEach((star) => {
      const on = Math.sin(time * 0.0015 + star.t) > -0.2;
      ctx.fillStyle = on ? (star.big ? "#ffffff" : "#c8c0f0") : "#4a4070";
      const size = star.big ? dpr * 2 : dpr;
      ctx.fillRect(star.x * w, star.y * h, size, size);
    });
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

    ctx.drawImage(clouds, 0, 0);

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
