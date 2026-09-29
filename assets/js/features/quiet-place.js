// Zona tranquila: los Bosques de Palermo en pixel art, dibujados con código.
// La escena mide 320 × 180 "píxeles" y el CSS la agranda sin suavizar (image-rendering: pixelated).
// El cielo sigue la hora real de Buenos Aires; tocando el pasto se le tira la pelota al perrito.

const W = 320;
const H = 180;
const PATH_Y = 158; // donde apoyan las patas el perrito y la pelota
const DOG_MIN = 12;
const DOG_MAX = 296;

// --- Momentos del día -----------------------------------------------------------

const PHASES = {
  day: {
    sky: ["#7fbde6", "#8fc6ea", "#a2d0ee", "#b6daf1", "#cbe5f4"],
    cloud: ["#ffffff", "#e3edf5"],
    tint: null,
  },
  golden: {
    sky: ["#4c2448", "#7a3557", "#b5566a", "#e08a74", "#f4bd8a"],
    cloud: ["#f7c9c9", "#e2a1ad"],
    tint: ["#ff7a59", 0.2],
  },
  night: {
    sky: ["#0d0819", "#140c26", "#1c1233", "#261a42", "#31234f"],
    cloud: ["#3a2f58", "#30284b"],
    tint: ["#170f3d", 0.58],
  },
};

/** Hora de Buenos Aires (0–24, con decimales), sin importar dónde esté quien mira. */
export function buenosAiresHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => Number(parts.find((part) => part.type === type).value);
  return get("hour") + get("minute") / 60;
}

export function phaseForHour(hour) {
  if ((hour >= 6 && hour < 8) || (hour >= 18 && hour < 20.5)) return "golden";
  if (hour >= 8 && hour < 18) return "day";
  return "night";
}

// --- Ayudas de dibujo -------------------------------------------------------------

/** Números al azar pero siempre los mismos (así los árboles no cambian en cada visita). */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeLayer() {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  return canvas;
}

const painter = (ctx) => ({
  rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  },
  dot(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  },
  disc(cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y + r * 0.8));
      ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1);
    }
  },
});

// --- Fondo: cielo, sol o luna, estrellas --------------------------------------------

function paintSky(ctx, phase) {
  const p = painter(ctx);
  const bands = PHASES[phase].sky;
  const bandHeight = 112 / bands.length;
  bands.forEach((color, i) => {
    p.rect(0, Math.floor(i * bandHeight), W, Math.ceil(bandHeight) + 1, color);
    // Borde "serruchado" entre franjas, bien pixel art.
    if (i > 0) for (let x = (i % 2) * 2; x < W; x += 4) p.dot(x, Math.floor(i * bandHeight) - 1, color);
  });
  if (phase === "day") {
    p.disc(58, 30, 9, "#fff3b0");
    p.disc(58, 30, 7, "#ffe27a");
  } else if (phase === "golden") {
    p.disc(84, 92, 13, "#ffd29a");
    p.disc(84, 92, 11, "#ffb36b");
  } else {
    p.disc(256, 26, 7, "#f4f0da");
    p.disc(259, 24, 6, bands[0]); // luna creciente
    const random = seeded(7);
    for (let i = 0; i < 70; i++) p.dot(random() * W, random() * 96, random() < 0.2 ? "#fff7d6" : "#b9aee0");
  }
}

// --- Parque: ciudad, Planetario, árboles, lago, pasto, camino -------------------------

const TREES = [
  { x: 22, base: 118, kind: "tipa", size: 16 },
  { x: 150, base: 116, kind: "jacaranda", size: 14 },
  { x: 196, base: 118, kind: "palo", size: 12 },
  { x: 300, base: 118, kind: "jacaranda", size: 15 },
  { x: 118, base: 150, kind: "tipa", size: 18 },
  { x: 282, base: 150, kind: "jacaranda", size: 17 },
];
const CANOPY = {
  jacaranda: ["#4e367f", "#7456b0", "#a386d6", "#c3aee8"],
  tipa: ["#2f5a2c", "#467a36", "#63994a", "#86b862"],
  palo: ["#8e3a5d", "#bb5a81", "#e185aa", "#f3b3cc"],
};

function paintTree(p, random, { x, base, kind, size }) {
  const trunkTop = base - size - 2;
  p.rect(x - 1, trunkTop, 3, base - trunkTop, "#4e3424");
  p.rect(x - 1, trunkTop, 1, base - trunkTop, "#6b4a33");
  p.rect(x - 4, trunkTop + 3, 3, 1, "#4e3424");
  p.rect(x + 2, trunkTop + 2, 3, 1, "#4e3424");
  // Copa: varios círculos juntos, con luz de arriba a la derecha y "dither" de puntos.
  const colors = CANOPY[kind];
  const blobs = [
    [0, -size, size * 0.62],
    [-size * 0.55, -size * 0.75, size * 0.45],
    [size * 0.55, -size * 0.8, size * 0.48],
    [-size * 0.2, -size * 1.3, size * 0.45],
    [size * 0.3, -size * 1.25, size * 0.4],
  ];
  const inside = (px, py) => blobs.some(([bx, by, r]) => (px - bx) ** 2 + (py - by) ** 2 <= r * r);
  for (let dy = -size * 2; dy <= 0; dy++)
    for (let dx = -size * 1.2; dx <= size * 1.2; dx++) {
      if (!inside(dx, dy)) continue;
      const light = (dx - dy * 0.6) / (size * 2) + (random() - 0.5) * 0.35; // más claro arriba a la derecha
      const level = light > 0.5 ? 3 : light > 0.15 ? 2 : light > -0.25 ? 1 : 0;
      p.dot(x + dx, trunkTop + 4 + dy, colors[level]);
    }
}

export const LAKE = { x0: 0, x1: 176, y0: 124, y1: 142 };

function paintPark(ctx, phase) {
  const p = painter(ctx);
  const random = seeded(2026);

  // Edificios de Palermo, lejos y medio azulados por la distancia.
  let x = -4;
  while (x < W) {
    const width = 10 + Math.floor(random() * 14);
    const height = 12 + Math.floor(random() * 26);
    const top = 112 - height;
    p.rect(x, top, width, height, random() < 0.5 ? "#a9b8c8" : "#b8c5d2");
    for (let wy = top + 3; wy < 108; wy += 4)
      for (let wx = x + 2; wx < x + width - 2; wx += 3) p.dot(wx, wy, "#93a4b6");
    x += width + Math.floor(random() * 3);
  }

  // Planetario Galileo Galilei: la cúpula sobre patas.
  p.rect(236, 100, 34, 3, "#b3aea6");
  p.disc(253, 97, 12, "#ebe8e1");
  p.rect(240, 97, 27, 6, "#b3aea6"); // tapa la mitad de abajo del círculo
  for (let i = 0; i < 12; i++) p.dot(244 + i, 90 - Math.round(Math.sin((i / 11) * Math.PI) * 4), "#cfcbc3");
  p.rect(236, 100, 34, 2, "#9e998f");
  [240, 252, 264].forEach((legX) => p.rect(legX, 102, 2, 8, "#8d887f"));
  p.rect(232, 110, 42, 2, "#8d887f");

  // Pasto lejano y árboles del fondo.
  p.rect(0, 110, W, 16, "#7cb462");
  TREES.slice(0, 4).forEach((tree) => paintTree(p, random, tree));

  // Lago con orilla.
  p.rect(0, 122, W, 60, "#77b053");
  const { x0, x1, y0, y1 } = LAKE;
  for (let y = y0; y <= y1; y++) {
    const inset = Math.round(Math.max(0, (y - (y0 + y1) / 2) ** 2 / 9));
    p.rect(x0, y, x1 - x0 - inset, 1, y < y0 + 3 ? "#8cc3e3" : y % 3 === 0 ? "#5a9bcc" : "#4f8fc0");
  }
  p.rect(x0, y1 + 1, x1 - 26, 1, "#5e8f3f");

  // Pasto con textura.
  for (let i = 0; i < 900; i++) {
    const gx = random() * W;
    const gy = 143 + random() * 37;
    if (gx < x1 && gy < y1 + 1) continue;
    p.dot(gx, gy, random() < 0.5 ? "#6aa34a" : "#86c063");
  }

  // Camino de tierra por donde corre el perrito.
  p.rect(0, 151, W, 9, "#d9c79f");
  p.rect(0, 151, W, 1, "#c4b089");
  p.rect(0, 159, W, 1, "#b9a57e");
  for (let i = 0; i < 90; i++)
    p.dot(random() * W, 152 + random() * 7, random() < 0.5 ? "#c6b48c" : "#e8dab8");

  // Árboles de adelante.
  TREES.slice(4).forEach((tree) => paintTree(p, random, tree));

  // Banco de plaza.
  p.rect(232, 142, 20, 2, "#8a5a3a");
  p.rect(232, 146, 20, 2, "#8a5a3a");
  p.rect(233, 144, 1, 8, "#3a3535");
  p.rect(250, 144, 1, 8, "#3a3535");

  // Farol.
  p.rect(214, 126, 1, 26, "#2e2a2a");
  p.rect(212, 124, 5, 3, "#3a3535");
  p.rect(213, 125, 3, 1, phase === "day" ? "#d8d3c4" : "#f7e27a");

  // Flores en el pasto de adelante.
  const flowers = ["#e8566a", "#f4d35e", "#ffffff", "#c3aee8"];
  for (let i = 0; i < 60; i++) {
    const fx = random() * W;
    const fy = 163 + random() * 16;
    p.dot(fx, fy, flowers[Math.floor(random() * flowers.length)]);
    p.dot(fx, fy + 1, "#4f8a36");
  }
}

// --- Perrito -----------------------------------------------------------------------

const DOG = {
  body: "#c98a4b",
  shade: "#9c6433",
  ear: "#7d4f2a",
  eye: "#141014",
  collar: "#7c2337",
  tongue: "#e07a8a",
};

const dogCache = new Map();

/** El perrito ya dibujado para esa pose; cada combinación se dibuja una sola vez. */
function dogSprite(pose, frame, carrying) {
  const key = `${pose}-${frame % 2}-${carrying}`;
  if (!dogCache.has(key)) dogCache.set(key, paintDog(pose, frame % 2, carrying));
  return dogCache.get(key);
}

/** Dibuja el perrito mirando a la derecha en una capa chiquita (22 × 16) y le pone contorno. */
function paintDog(pose, frame, carrying) {
  const sprite = document.createElement("canvas");
  sprite.width = 22;
  sprite.height = 16;
  const s = sprite.getContext("2d");
  const p = painter(s);
  const ground = 15;
  const ox = 3;

  if (pose === "sit") {
    p.rect(ox + 2, ground - 6, 6, 5, DOG.body); // cola apoyada
    p.rect(ox + 5, ground - 9, 6, 5, DOG.body); // lomo inclinado
    p.rect(ox + 2, ground - 2, 5, 1, DOG.shade);
    p.rect(ox + 9, ground - 5, 1, 5, DOG.body); // patas de adelante rectas
    p.rect(ox + 10, ground - 5, 1, 5, DOG.shade);
    const wag = frame % 2 ? -1 : 0;
    p.rect(ox, ground - 4 + wag, 2, 1, DOG.body);
    p.dot(ox - 1, ground - 5 + wag, DOG.body);
  } else {
    const run = pose === "run";
    p.rect(ox, ground - 8, 11, 4, DOG.body); // cuerpo
    p.rect(ox + 1, ground - 5, 9, 1, DOG.shade); // panza
    const stride = run ? (frame % 2 ? 2 : -1) : 0;
    [ox + 1, ox + 2, ox + 8, ox + 9].forEach((legX, i) => {
      const shift = i % 2 ? stride : -stride;
      p.rect(legX + (run ? shift : 0), ground - 4, 1, 4, i % 2 ? DOG.shade : DOG.body);
    });
    const tailUp = run || frame % 2 ? -1 : 0;
    p.rect(ox - 2, ground - 9 + tailUp, 2, 1, DOG.body);
    p.dot(ox - 3, ground - 10 + tailUp, DOG.body);
  }

  // Cabeza (igual en todas las poses, más alta si está sentado).
  const headY = pose === "sit" ? ground - 14 : ground - 12;
  const hx = pose === "sit" ? ox + 8 : ox + 10;
  p.rect(hx, headY, 6, 5, DOG.body);
  p.rect(hx + 5, headY + 2, 3, 2, DOG.body); // hocico
  p.dot(hx + 7, headY + 2, DOG.eye); // nariz
  p.dot(hx + 4, headY + 1, DOG.eye); // ojo
  p.rect(hx, headY - 1, 3, 1, DOG.ear);
  p.rect(hx, headY, 2, 3, DOG.ear); // oreja caída
  p.rect(hx, headY + 5, 2, 1, DOG.collar);
  p.rect(hx + 1, headY + 4, 2, 1, DOG.collar);
  if (carrying) p.rect(hx + 7, headY + 4, 2, 2, "#d7e04a");
  else if (pose === "run") p.dot(hx + 6, headY + 4, DOG.tongue);

  // Contorno oscuro: la silueta corrida un píxel en cada dirección, debajo del dibujo.
  const outline = document.createElement("canvas");
  outline.width = sprite.width;
  outline.height = sprite.height;
  const o = outline.getContext("2d");
  o.drawImage(sprite, 0, 0);
  o.globalCompositeOperation = "source-in";
  o.fillStyle = "#2a1a12";
  o.fillRect(0, 0, outline.width, outline.height);
  const final = document.createElement("canvas");
  final.width = sprite.width;
  final.height = sprite.height;
  const f = final.getContext("2d");
  [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ].forEach(([dx, dy]) => f.drawImage(outline, dx, dy));
  f.drawImage(sprite, 0, 0);
  return final;
}

// --- La escena completa -------------------------------------------------------------

export function startQuietPlace(canvas, { onPhase } = {}) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let chosenPhase = null; // null = seguir la hora real
  let phase = null;
  const sky = makeLayer();
  const park = makeLayer();
  const scene = makeLayer();
  const sceneCtx = scene.getContext("2d");

  const random = Math.random;
  const clouds = Array.from({ length: 4 }, (_, i) => ({
    x: i * 90 + random() * 40,
    y: 12 + random() * 40,
    w: 14 + random() * 12,
    speed: 1.5 + random() * 2.5,
  }));
  const ducks = [
    { x: 40, y: 131, dir: 1, speed: 3 },
    { x: 120, y: 136, dir: -1, speed: 2.2 },
  ];
  const petals = Array.from({ length: 26 }, () => newPetal(true));
  const fireflies = Array.from({ length: 14 }, () => ({
    x: random() * W,
    y: 120 + random() * 55,
    t: random() * 10,
  }));
  const birds = [];
  const dog = { x: 150, dir: 1, pose: "sit", target: 150, wait: 2, carrying: false };
  const ball = { active: false, x: 0, y: 0, vy: 0, resting: false };

  function newPetal(anywhere) {
    const flowering = TREES.filter((t) => t.kind !== "tipa");
    const tree = flowering[Math.floor(random() * flowering.length)];
    return {
      x: tree.x + (random() - 0.5) * tree.size * 2,
      y: anywhere ? 90 + random() * 80 : tree.base - tree.size * 2 + random() * 10,
      sway: random() * 6,
      speed: 4 + random() * 5,
      color: random() < 0.5 ? "#a386d6" : "#c3aee8",
    };
  }

  function rebuild(nextPhase) {
    phase = nextPhase;
    const skyCtx = sky.getContext("2d");
    skyCtx.clearRect(0, 0, W, H);
    paintSky(skyCtx, phase);
    const parkCtx = park.getContext("2d");
    parkCtx.clearRect(0, 0, W, H);
    paintPark(parkCtx, phase);
    onPhase?.(phase);
  }

  function currentPhase() {
    return chosenPhase || phaseForHour(buenosAiresHour());
  }

  // Tocar el pasto: la pelota cae ahí y el perrito va a buscarla.
  canvas.addEventListener("click", (event) => {
    const box = canvas.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * W;
    const y = ((event.clientY - box.top) / box.height) * H;
    if (y < 118) return; // en el cielo no
    Object.assign(ball, {
      active: true,
      resting: false,
      x: Math.min(DOG_MAX, Math.max(DOG_MIN, x)),
      y: Math.min(y, PATH_Y - 30),
      vy: 0,
    });
    Object.assign(dog, { carrying: false, pose: "run", target: ball.x, wait: 0 });
  });

  let last = performance.now();

  function update(dt, now) {
    clouds.forEach((cloud) => {
      cloud.x += cloud.speed * dt;
      if (cloud.x > W + 30) cloud.x = -40;
    });
    ducks.forEach((duck) => {
      duck.x += duck.dir * duck.speed * dt;
      if (duck.x < 6 || duck.x > LAKE.x1 - 34) duck.dir *= -1;
    });
    petals.forEach((petal, i) => {
      petal.y += petal.speed * dt;
      petal.x += Math.sin(now / 700 + petal.sway) * 4 * dt;
      if (petal.y > 178) petals[i] = newPetal(false);
    });
    fireflies.forEach((fly) => {
      fly.t += dt;
      fly.x += Math.sin(fly.t * 0.9) * 3 * dt;
      fly.y += Math.cos(fly.t * 0.7) * 2 * dt;
    });
    if (phase === "day" && random() < dt * 0.08 && birds.length < 3)
      birds.push({ x: -6, y: 18 + random() * 40, speed: 12 + random() * 8 });
    birds.forEach((bird) => (bird.x += bird.speed * dt));
    for (let i = birds.length - 1; i >= 0; i--) if (birds[i].x > W + 6) birds.splice(i, 1);

    // Pelota: cae y rebota hasta quedar en el camino.
    if (ball.active && !ball.resting && !dog.carrying) {
      ball.vy += 260 * dt;
      ball.y += ball.vy * dt;
      if (ball.y >= PATH_Y - 2) {
        ball.y = PATH_Y - 2;
        ball.vy = -ball.vy * 0.45;
        if (Math.abs(ball.vy) < 18) ball.resting = true;
      }
    }

    // Perrito: pasea, se sienta, busca la pelota y la trae.
    if (dog.pose === "run") {
      const step = 46 * dt * Math.sign(dog.target - dog.x);
      dog.dir = Math.sign(dog.target - dog.x) || dog.dir;
      if (Math.abs(dog.target - dog.x) <= Math.abs(step)) {
        dog.x = dog.target;
        if (ball.active && !dog.carrying && Math.abs(ball.x - dog.x) < 4) {
          dog.carrying = true; // la agarró: la lleva al medio
          dog.target = 160;
        } else if (dog.carrying) {
          dog.carrying = false; // la suelta a sus pies
          Object.assign(ball, { x: dog.x + dog.dir * 9, y: PATH_Y - 2, resting: true });
          Object.assign(dog, { pose: "sit", wait: 3 + random() * 3 });
        } else {
          Object.assign(dog, { pose: random() < 0.6 ? "sit" : "stand", wait: 1.5 + random() * 3 });
        }
      } else {
        dog.x += step;
      }
    } else {
      dog.wait -= dt;
      if (dog.wait <= 0) {
        dog.target = DOG_MIN + random() * (DOG_MAX - DOG_MIN);
        dog.pose = "run";
      }
    }
  }

  function draw(now) {
    const p = painter(sceneCtx);
    const palette = PHASES[phase];

    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(sky, 0, 0);
    // Nubes (quedan detrás de los edificios).
    const cp = painter(ctx);
    clouds.forEach((cloud) => {
      cp.disc(cloud.x, cloud.y, cloud.w / 3, palette.cloud[0]);
      cp.disc(cloud.x + cloud.w / 3, cloud.y + 1, cloud.w / 4, palette.cloud[0]);
      cp.disc(cloud.x - cloud.w / 3, cloud.y + 2, cloud.w / 5, palette.cloud[1]);
      cp.rect(cloud.x - cloud.w / 2, cloud.y + 3, cloud.w, 2, palette.cloud[1]);
    });
    birds.forEach((bird) => {
      const flap = Math.floor(now / 200) % 2;
      cp.dot(bird.x - 1, bird.y - flap, "#3a3a4a");
      cp.dot(bird.x, bird.y, "#3a3a4a");
      cp.dot(bird.x + 1, bird.y - flap, "#3a3a4a");
    });
    if (phase === "night") {
      const random = seeded(Math.floor(now / 600));
      for (let i = 0; i < 6; i++) cp.dot(random() * W, random() * 90, "#ffffff");
    }

    // Todo lo que está "en el suelo" va a una capa aparte, para teñirla según la hora.
    sceneCtx.clearRect(0, 0, W, H);
    sceneCtx.drawImage(park, 0, 0);
    // Brillos del lago.
    const shimmer = seeded(Math.floor(now / 400)); // cambia cada 0,4 s
    for (let i = 0; i < 12; i++) {
      const y = LAKE.y0 + 3 + Math.floor(shimmer() * (LAKE.y1 - LAKE.y0 - 6));
      const x = shimmer() * (LAKE.x1 - 40);
      p.rect(x, y, 2 + Math.floor(shimmer() * 3), 1, "#b9dcf0");
    }
    ducks.forEach((duck) => {
      const bob = Math.floor(now / 600 + duck.x) % 2;
      const d = duck.dir;
      p.rect(duck.x, duck.y + bob, 5, 2, "#f4f1e8");
      p.rect(duck.x + (d > 0 ? 4 : -1), duck.y - 2 + bob, 2, 2, "#f4f1e8");
      p.dot(duck.x + (d > 0 ? 6 : -2), duck.y - 1 + bob, "#e8a23a");
      p.dot(duck.x + (d > 0 ? 5 : -1), duck.y - 2 + bob, "#141014");
      p.rect(duck.x, duck.y + 2 + bob, 5, 1, "#9ccbe6");
    });
    // Pelota y perrito.
    if (ball.active && !dog.carrying) p.rect(ball.x - 1, ball.y, 2, 2, "#d7e04a");
    const sprite = dogSprite(dog.pose, Math.floor(now / 140), dog.carrying);
    const dogX = Math.round(dog.x - 11);
    const dogY = PATH_Y - 15;
    if (dog.dir < 0) {
      sceneCtx.save();
      sceneCtx.translate(dogX + sprite.width, dogY);
      sceneCtx.scale(-1, 1);
      sceneCtx.drawImage(sprite, 0, 0);
      sceneCtx.restore();
    } else {
      sceneCtx.drawImage(sprite, dogX, dogY);
    }
    // Pétalos de jacarandá (de día y al atardecer).
    if (phase !== "night") petals.forEach((petal) => p.dot(petal.x, petal.y, petal.color));

    if (palette.tint) {
      sceneCtx.globalCompositeOperation = "source-atop";
      sceneCtx.globalAlpha = palette.tint[1];
      sceneCtx.fillStyle = palette.tint[0];
      sceneCtx.fillRect(0, 0, W, H);
      sceneCtx.globalAlpha = 1;
      sceneCtx.globalCompositeOperation = "source-over";
    }
    ctx.drawImage(scene, 0, 0);

    // Luces que no se tiñen: farol, ventanas, luciérnagas.
    if (phase !== "day") {
      ctx.globalAlpha = 0.25;
      cp.disc(214, 126, 9, "#f7e27a");
      ctx.globalAlpha = 1;
      cp.rect(213, 125, 3, 1, "#fff2a8");
    }
    if (phase === "night") {
      const random = seeded(99);
      for (let i = 0; i < 40; i++) {
        const x = random() * W;
        const y = 78 + random() * 30;
        if (random() < 0.5) cp.dot(x, y, "#f3d77a");
      }
      fireflies.forEach((fly) => {
        if (Math.sin(fly.t * 2.3) > 0.2) cp.dot(fly.x, fly.y, "#f7e27a");
      });
    }
  }

  function tick(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const wanted = currentPhase();
    if (wanted !== phase) rebuild(wanted);
    update(dt, now);
    draw(now);
    if (!reduceMotion) requestAnimationFrame(tick);
  }

  rebuild(currentPhase());
  draw(performance.now()); // primer cuadro enseguida
  if (!reduceMotion) requestAnimationFrame(tick);

  return {
    /** "auto" sigue la hora de Buenos Aires; si no, "day", "golden" o "night". */
    setPhase(next) {
      chosenPhase = next === "auto" ? null : next;
      rebuild(currentPhase());
      draw(performance.now());
    },
  };
}
