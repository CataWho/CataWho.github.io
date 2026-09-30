// Página de juegos (juegos.html): la sala de arcade.
// Cada juego vive en su carpeta dentro de assets/js/games/ y se carga solo cuando se elige.

import { esc, node, q } from "../core/dom.js";
import { boot } from "../core/boot.js";
import { t } from "../core/i18n.js";

// Los juegos de la sala. Para sumar uno: su carpeta en games/, sus textos en i18n.js y una línea acá.
const GAMES = [{ id: "estela", load: () => import("../games/estela/index.js") }];
const COMING_SOON = 2; // cartuchos vacíos de "próximamente"

function renderCartridges(current) {
  const list = q("[data-game-list]");
  GAMES.forEach((game) => {
    const active = game === current;
    list.append(
      node(`
        <li>
          <a class="cartridge${active ? " is-active" : ""}" href="?juego=${game.id}"${active ? ' aria-current="true"' : ""}>
            <strong>${esc(t(`games.${game.id}.title`))}</strong>
            <span>${esc(t(`games.${game.id}.blurb`))}</span>
          </a>
        </li>`),
    );
  });
  for (let i = 0; i < COMING_SOON; i++) {
    list.append(node(`<li><span class="cartridge is-empty">${esc(t("games.soon"))}</span></li>`));
  }
}

/** Pantalla completa: la de verdad si el navegador la tiene; si no (iPhone), una que ocupa toda la ventana. */
function mountFullscreen(root, button) {
  const exit = () => root.classList.remove("is-full");
  button.addEventListener("click", async () => {
    if (root.classList.contains("is-full")) {
      if (document.fullscreenElement) await document.exitFullscreen();
      exit();
      return;
    }
    root.classList.add("is-full");
    try {
      await root.requestFullscreen?.();
      await screen.orientation?.lock?.("landscape");
    } catch {
      // Algunos navegadores no dejan girar la pantalla: queda como está.
    }
    q("[data-arcade-canvas]").focus();
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) exit();
  });
}

boot(async () => {
  const params = new URLSearchParams(location.search);
  const current = GAMES.find((game) => game.id === params.get("juego")) ?? GAMES[0];
  renderCartridges(current);

  const root = q("[data-arcade]");
  q("[data-arcade-title]").textContent = t(`games.${current.id}.bar`);
  const { startGame } = await current.load();
  const arcade = await startGame({
    root,
    canvas: q("[data-arcade-canvas]"),
    pad: q("[data-arcade-pad]"),
    first: params.get("pantalla"), // para probar un nivel directo: ?pantalla=planet
  });

  const mute = q("[data-arcade-mute]");
  const showMute = () => {
    mute.setAttribute("aria-pressed", String(arcade.muted));
    mute.textContent = t(arcade.muted ? "games.muted" : "games.sound");
  };
  showMute();
  mute.addEventListener("click", () => {
    arcade.toggleMute();
    showMute();
    q("[data-arcade-canvas]").focus(); // así el teclado sigue manejando el juego
  });
  mountFullscreen(root, q("[data-arcade-full]"));
});
