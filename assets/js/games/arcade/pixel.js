// Herramientas de dibujo pixel art que comparten todos los juegos.
// Todo se dibuja en una pantalla chiquita de 320 × 180 y el CSS la agranda sin suavizar,
// como una consola vieja conectada a un televisor.

export const W = 320;
export const H = 180;
export const FONT = "'Press Start 2P', monospace";

/** Números al azar pero siempre los mismos (así las estrellas no cambian de lugar en cada visita). */
export function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** "Pincel" de píxeles: rectángulos, líneas gruesas, polígonos y texto, siempre en números enteros. */
export function painter(ctx) {
  ctx.imageSmoothingEnabled = false;
  const p = {
    ctx,
    rect(x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },
    line(x0, y0, x1, y1, color, size = 1) {
      ctx.fillStyle = color;
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      const half = (size - 1) / 2;
      for (let i = 0; i <= steps; i++) {
        const x = x0 + ((x1 - x0) * i) / steps;
        const y = y0 + ((y1 - y0) * i) / steps;
        ctx.fillRect(Math.round(x - half), Math.round(y - half), size, size);
      }
    },
    /** Polígono relleno, fila por fila (sin bordes borrosos). */
    poly(points, color) {
      ctx.fillStyle = color;
      const ys = points.map((point) => point[1]);
      const top = Math.floor(Math.min(...ys));
      const bottom = Math.ceil(Math.max(...ys));
      for (let y = top; y < bottom; y++) {
        const cy = y + 0.5;
        const xs = [];
        points.forEach(([ax, ay], i) => {
          const [bx, by] = points[(i + 1) % points.length];
          if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + ((cy - ay) / (by - ay)) * (bx - ax));
        });
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) {
          const x0 = Math.round(xs[i]);
          const x1 = Math.round(xs[i + 1]);
          if (x1 > x0) ctx.fillRect(x0, y, x1 - x0, 1);
        }
      }
    },
    ellipse(cx, cy, rx, ry, color) {
      ctx.fillStyle = color;
      if (ry < 1) return ctx.fillRect(Math.round(cx - rx), Math.round(cy), Math.round(rx * 2 + 1), 1);
      for (let dy = -ry; dy <= ry; dy++) {
        const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.5)) ** 2)));
        ctx.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2 + 1, 1);
      }
    },
    disc(cx, cy, r, color) {
      p.ellipse(cx, cy, r, r, color);
    },
    text(str, x, y, color, { align = "left", size = 8, shadow } = {}) {
      ctx.font = `${size}px ${FONT}`;
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      if (shadow) {
        ctx.fillStyle = shadow;
        ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
      }
      ctx.fillStyle = color;
      ctx.fillText(str, Math.round(x), Math.round(y));
    },
    /** Parte un texto en renglones que entren en maxWidth píxeles. */
    wrap(str, maxWidth, size = 8) {
      ctx.font = `${size}px ${FONT}`;
      const lines = [];
      let line = "";
      str.split(" ").forEach((word) => {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else line = next;
      });
      if (line) lines.push(line);
      return lines;
    },
    /** Dibuja con transparencia sin afectar lo que venga después. */
    alpha(value, draw) {
      ctx.save();
      ctx.globalAlpha *= value;
      draw();
      ctx.restore();
    },
  };
  return p;
}

/** Convierte un dibujo hecho con letras (cada letra = un color) en una imagen reutilizable. */
export function makeSprite(rows, palette) {
  const canvas = makeCanvas(rows[0].length, rows.length);
  const ctx = canvas.getContext("2d");
  rows.forEach((row, y) =>
    [...row].forEach((char, x) => {
      if (!palette[char]) return;
      ctx.fillStyle = palette[char];
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  return canvas;
}

/**
 * Sello para personajes: el dibujo se hace siempre mirando a la derecha, con los pies en (0, 0),
 * y el sello le agrega un contorno oscuro de 1 píxel, lo da vuelta si mira a la izquierda,
 * lo agranda o lo pinta de blanco cuando recibe un golpe.
 */
export function createStamper(size = 128, originX = 64, originY = 96) {
  const art = makeCanvas(size, size);
  const shape = makeCanvas(size, size);
  const artCtx = art.getContext("2d");
  const shapeCtx = shape.getContext("2d");
  const artPainter = painter(artCtx);

  const silhouette = (color) => {
    shapeCtx.globalCompositeOperation = "source-over";
    shapeCtx.clearRect(0, 0, size, size);
    shapeCtx.drawImage(art, 0, 0);
    shapeCtx.globalCompositeOperation = "source-in";
    shapeCtx.fillStyle = color;
    shapeCtx.fillRect(0, 0, size, size);
  };

  return function stamp(ctx, x, y, draw, options = {}) {
    const { flip = false, outline = "#170c1c", flash = null, rotate = 0, scale = 1, alpha = 1 } = options;
    artCtx.clearRect(0, 0, size, size);
    artCtx.save();
    artCtx.translate(originX, originY);
    draw(artPainter);
    artCtx.restore();

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(Math.round(x), Math.round(y));
    if (rotate) ctx.rotate(rotate);
    ctx.scale(flip ? -scale : scale, scale);
    silhouette(outline);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(shape, dx - originX, dy - originY);
    if (flash) silhouette(flash);
    ctx.drawImage(flash ? shape : art, -originX, -originY);
    ctx.restore();
  };
}
