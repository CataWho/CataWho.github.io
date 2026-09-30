// Efectos: chispas de los golpes, el líquido que salpica al vencer a un monstruo
// (y queda en el piso como charquitos), textos flotantes y el dibujo de los disparos.

export const GOO = {
  green: ["#8df55a", "#5fcf2f", "#c9ff9a", "#3f9c1f"],
  pink: ["#ff8fd0", "#ff5fb8", "#ffc2e6", "#ff3fa4", "#ffd9ef"],
  neon: ["#39ff14", "#7dff5a", "#c8ff9a", "#1fbf0a"],
  volt: ["#2e8bff", "#7fd4ff", "#c8f0ff", "#1a4fd8"],
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function createEffects(ground) {
  let bits = [];
  let floating = [];
  const puddles = [];

  function addPuddle(x, color) {
    const near = puddles.find((puddle) => Math.abs(puddle.x - x) < puddle.w / 2 + 2 && puddle.w < 22);
    if (near) {
      near.w += 1;
      return;
    }
    puddles.push({ x, w: 3 + Math.floor(Math.random() * 3), color });
    if (puddles.length > 70) puddles.shift();
  }

  return {
    spark(x, y, colors, count = 8, speed = 1.8) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const power = speed * (0.4 + Math.random());
        bits.push({ x, y, vx: Math.cos(angle) * power, vy: Math.sin(angle) * power, life: 10 + Math.random() * 10, color: pick(colors), size: 1 });
      }
    },
    /** Salpicadura de líquido: sale para arriba, cae y deja charcos. dir = hacia dónde sale más. */
    goo(x, y, colors, count = 30, dir = 0, power = 2.6) {
      for (let i = 0; i < count; i++) {
        bits.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 10,
          vx: (Math.random() - 0.5) * power * 1.6 + dir * Math.random() * power,
          vy: -Math.random() * power * 1.6 - 0.5,
          life: 120,
          color: pick(colors),
          size: Math.random() < 0.3 ? 3 : Math.random() < 0.6 ? 2 : 1,
          goo: true,
        });
      }
    },
    text(str, x, y, color) {
      floating.push({ str, x, y, color, life: 50 });
    },
    update() {
      bits.forEach((bit) => {
        bit.x += bit.vx;
        bit.y += bit.vy;
        bit.life--;
        if (bit.goo) {
          bit.vy += 0.16;
          if (bit.y >= ground) {
            bit.life = 0;
            addPuddle(bit.x, bit.color);
          }
        } else {
          bit.vx *= 0.9;
          bit.vy *= 0.9;
        }
      });
      bits = bits.filter((bit) => bit.life > 0);
      floating.forEach((item) => {
        item.y -= 0.4;
        item.life--;
      });
      floating = floating.filter((item) => item.life > 0);
    },
    /** Los charcos van en el piso, detrás de los personajes. */
    drawFloor(p) {
      puddles.forEach(({ x, w, color }) => {
        p.rect(x - w / 2, ground, w, 1, color);
        p.rect(x - w / 2 + 1, ground + 1, w - 2, 1, color);
        p.rect(x - w / 2 + 1, ground, 1, 1, "#ffffff88");
      });
    },
    draw(p) {
      bits.forEach(({ x, y, size, color }) => p.rect(x - size / 2, y - size / 2, size, size, color));
      floating.forEach(({ str, x, y, color, life }) =>
        p.alpha(Math.min(1, life / 15), () => p.text(str, x, y, color, { align: "center", shadow: "#170c1c" })),
      );
    },
  };
}

/** Dibuja un disparo según su tipo. */
export function drawShot(p, shot) {
  const { x, y, t, facing } = shot;
  const { ctx } = p;
  if (shot.kind === "wave") {
    // Onda estelar: una estrella rosa con estela.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 1; i <= 4; i++) p.alpha(0.35 - i * 0.07, () => p.disc(x - facing * i * 5, y, 5 - i, "#ff4fb0"));
    p.alpha(0.5, () => p.disc(x, y, 7, "#ff4fb0"));
    ctx.restore();
    p.disc(x, y, 4, "#ff9ad5");
    const spin = t * 0.3;
    for (let i = 0; i < 4; i++) {
      const a = spin + (i * Math.PI) / 2;
      p.line(x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 7, "#ffe6f6");
    }
    p.disc(x, y, 2, "#ffffff");
  } else if (shot.kind === "spit") {
    // Escupitajo verde.
    p.disc(x, y, 3, "#5fcf2f");
    p.disc(x + facing, y - 1, 2, "#c9ff9a");
    p.rect(x - facing * 5, y + 1, 2, 2, "#8df55a");
    p.rect(x - facing * 9, y + 2, 1, 1, "#8df55a");
  } else if (shot.kind === "egg") {
    // Huevo-burbuja de la Babosa Reina: transparente, con algo adentro que se mueve.
    p.alpha(0.55, () => p.disc(x, y, 5, "#b6ff5a"));
    p.disc(x, y, 3, "#5fcf2f");
    p.rect(x - 1 + (t % 20 < 10 ? 0 : 1), y - 1, 2, 2, "#1f5a0a");
    p.rect(x - 3, y - 4, 1, 1, "#ffffff");
    p.rect(x + 1, y + 5, 1, 1 + (t % 12 < 6 ? 1 : 0), "#7dff5a");
  } else if (shot.kind === "slime") {
    // Vómito de baba de la Babosa Reina.
    p.disc(x, y, 2, "#39ff14");
    p.rect(x - 1, y - 1, 1, 1, "#c8ff9a");
    p.rect(x - shot.facing * 3, y - 1, 2, 1, "#7dff5a");
  } else if (shot.kind === "quake") {
    // Onda expansiva del Bruto: una ola violeta que corre por el piso.
    const h = 6 + Math.sin(t * 0.5) * 2;
    p.poly([[x - 6, y + 4], [x - facing * 2, y + 4 - h], [x + facing * 6, y + 4]], "#b98cff");
    p.poly([[x - 4, y + 4], [x - facing * 1, y + 6 - h], [x + facing * 3, y + 4]], "#f0e2ff");
    p.rect(x - facing * 10, y + 2, 3, 2, "#7b46c9");
  }
}
