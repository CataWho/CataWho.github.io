// Página de juegos (juegos.html): la sala de juegos.
// Arriba, la sala retro (features/game-room.js); abajo, un panel de teles: cada canal es un juego.
// Al tocar una tele, el juego viaja desde el fondo de la sala hacia adelante y se juega ahí.
// Cada juego vive en su carpeta dentro de assets/js/games/ y se carga solo cuando se elige.

import { esc, node, q } from "../core/dom.js";
import { boot } from "../core/boot.js";
import { t } from "../core/i18n.js";
import { onSoundChange, playEffect, setAmbience, setAmbienceLevel, soundOn } from "../core/room-sound.js";
import { NO_SIGNAL, mountGameRoom } from "../features/game-room.js";
import { channelClick, spaceAmbience } from "../features/space-ambience.js";

// Los juegos de la sala. Para sumar uno: su carpeta en games/, sus textos en i18n.js y una línea acá.
const GAMES = [{ id: "estela", load: () => import("../games/estela/index.js") }];
const CHANNELS = 4; // teles del panel (las que no tienen juego muestran "sin señal")

/** Arma las teles del panel: un canal por juego y el resto "sin señal". */
function renderTvs() {
  const wall = q("[data-tv-wall]");
  const tvs = [];
  for (let i = 0; i < CHANNELS; i++) {
    const game = GAMES[i];
    const channel = esc(t("games.channel", { n: String(i + 1).padStart(2, "0") }));
    const tv = game
      ? node(`
          <button type="button" class="tv" data-tv="${game.id}" title="${esc(t(`games.${game.id}.blurb`))}"
                  aria-label="${esc(t("games.playAria", { title: t(`games.${game.id}.title`) }))}">
            <span class="tv-top">${channel}</span>
            <span class="tv-body">
              <span class="tv-glass">
                <canvas class="tv-screen" width="240" height="180"></canvas>
                <span class="tv-play">${esc(t("games.play"))}</span>
                <span class="tv-live">${esc(t("games.onAir"))}</span>
              </span>
            </span>
            <span class="tv-label">${esc(t(`games.${game.id}.title`))}</span>
          </button>`)
      : node(`
          <div class="tv is-off">
            <span class="tv-top">${channel}</span>
            <span class="tv-body">
              <span class="tv-glass">
                <canvas class="tv-screen" width="80" height="60"></canvas>
                <span class="tv-nosignal">${esc(t("games.noSignal"))}</span>
              </span>
            </span>
            <span class="tv-label">—</span>
          </div>`);
    wall.append(tv);
    tvs.push({ element: tv, game, canvas: q("canvas", tv) });
  }
  return tvs;
}

/** Pantalla completa: la de verdad si el navegador la tiene; si no (iPhone), una que ocupa toda la ventana. */
function mountFullscreen(stage, button, canvas) {
  const exit = () => stage.classList.remove("is-full");
  button.addEventListener("click", async () => {
    if (stage.classList.contains("is-full")) {
      if (document.fullscreenElement) await document.exitFullscreen();
      exit();
      return;
    }
    stage.classList.add("is-full");
    try {
      await stage.requestFullscreen?.();
      await screen.orientation?.lock?.("landscape");
    } catch {
      // Algunos navegadores no dejan girar la pantalla: queda como está.
    }
    canvas.focus();
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) exit();
  });
  return async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    exit();
  };
}

boot(async () => {
  const params = new URLSearchParams(location.search);
  const current = GAMES.find((game) => game.id === params.get("juego")) ?? GAMES[0];
  const room = q("[data-room]");
  const stage = q("[data-arcade]");
  const canvas = q("[data-arcade-canvas]");
  const readout = q("[data-arcade-title]");
  const tvs = renderTvs();

  mountGameRoom({
    view: q(".room-view"),
    canvas: q("[data-room-canvas]"),
    marquee: t("games.marquee"),
    tvs: tvs.map((tv, i) => ({ canvas: tv.canvas, source: tv.game === current ? canvas : null, mode: NO_SIGNAL[i % NO_SIGNAL.length] })),
  });
  readout.textContent = t("games.roomIdle");
  setAmbience(spaceAmbience); // el sonido intergaláctico de la sala

  const { startGame } = await current.load();
  const arcade = await startGame({
    root: stage,
    canvas,
    pad: q("[data-arcade-pad]"),
    first: params.get("pantalla"), // para probar un nivel directo: ?pantalla=planet
  });
  const leaveFullscreen = mountFullscreen(stage, q("[data-arcade-full]"), canvas);

  // Jugar: la pantalla sale del fondo de la sala hacia adelante.
  function play() {
    room.classList.add("is-playing");
    readout.textContent = t(`games.${current.id}.bar`);
    canvas.tabIndex = 0;
    canvas.focus({ preventScroll: true });
    setAmbienceLevel(0.25); // el ambiente baja para que se escuche el juego
    stage.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  // Sacar el juego: se pausa y la pantalla vuelve al fondo (la sala queda vacía otra vez).
  function back() {
    arcade.pause();
    leaveFullscreen();
    room.classList.remove("is-playing");
    readout.textContent = t("games.roomIdle");
    canvas.tabIndex = -1;
    setAmbienceLevel(1);
  }

  tvs.forEach((tv) => {
    if (!tv.game) return;
    tv.element.addEventListener("click", () => {
      // Tocar la tele del juego que está adelante lo saca (como apagarla).
      if (tv.game !== current) location.search = `?juego=${tv.game.id}`;
      else if (room.classList.contains("is-playing")) back();
      else play();
    });
  });
  q("[data-room-back]").addEventListener("click", back);
  // Pasar por una tele suena como cambiar de canal.
  tvs.forEach(({ element }) => {
    element.addEventListener("pointerenter", () => playEffect(channelClick));
    element.addEventListener("focus", () => playEffect(channelClick));
  });
  if (params.get("pantalla")) play(); // al probar un nivel directo, ya arranca adelante

  // El botón de volumen de arriba también calla (o prende) el juego.
  arcade.setMuted(!soundOn());
  onSoundChange((on) => arcade.setMuted(!on));
});
