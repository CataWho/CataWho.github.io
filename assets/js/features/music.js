// 01 / Escuchando: lista de música y reproductor de previews de iTunes (inicio).
// Cada canción o disco guardado tiene una o varias "tracks" con su preview de 30 s.
// Las canciones se agrupan por género (el que informa iTunes). Al elegir un género,
// la lista y la cola de reproducción muestran solo ese género.

import { esc, node, q, qa } from "../core/dom.js";
import { deleteItem, updateItem } from "../core/db.js";
import { genreName, t } from "../core/i18n.js";
import { findItem, itemsOf, removeItem, state } from "../core/state.js";

// Claves internas de los filtros (lo que se muestra sale de las traducciones).
const ALL = "todo";
const NO_GENRE = "otros";
const RESTART_AFTER = 3; // segundos: "anterior" reinicia la canción si ya pasó este tiempo

let activeGenre = ALL;
let queue = [];
let queueIndex = 0;
let genresRequested = false;

const audio = () => q("[data-audio-player]");
const playButton = () => q('[data-action="toggle-music"]');
const genreOf = (item) => item.metadata?.genre || NO_GENRE;
const visibleMusic = () =>
  itemsOf("music").filter((item) => activeGenre === ALL || genreOf(item) === activeGenre);

// --- Lista ------------------------------------------------------------------

export function renderMusic() {
  const list = q("[data-music-list]");
  if (!list) return;
  renderGenres();
  const music = visibleMusic();
  list.replaceChildren(...music.map(musicRow));
  if (!music.length) list.append(node(`<p class="mini-empty">${t("music.emptyGenre")}</p>`));
  qa("[data-play-music]", list).forEach((button) => {
    button.onclick = () => playItem(button.dataset.playMusic);
  });
  qa("[data-delete-music]", list).forEach((button) => {
    button.onclick = () => deleteMusic(button.dataset.deleteMusic);
  });
  markPlaying();
  showFirstIfIdle();
  fillMissingGenres();
}

function renderGenres() {
  const bar = q("[data-music-genres]");
  if (!bar) return;
  const counts = new Map();
  itemsOf("music").forEach((item) => counts.set(genreOf(item), (counts.get(genreOf(item)) || 0) + 1));
  // Con un solo género no tiene sentido mostrar filtros.
  bar.hidden = counts.size < 2;
  if (!counts.has(activeGenre)) activeGenre = ALL;
  const genres = [...counts.keys()].sort(
    (a, b) => (a === NO_GENRE) - (b === NO_GENRE) || a.localeCompare(b, "es"),
  );
  const label = (genre) =>
    genre === ALL ? t("music.all") : genre === NO_GENRE ? t("music.otherGenre") : genreName(genre);
  const chip = (genre, count) =>
    `<button type="button" class="genre-chip" data-genre="${esc(genre)}" aria-pressed="${genre === activeGenre}">${esc(label(genre))} <span>${count}</span></button>`;
  bar.innerHTML = [
    chip(ALL, itemsOf("music").length),
    ...genres.map((genre) => chip(genre, counts.get(genre))),
  ].join("");
  qa("[data-genre]", bar).forEach((button) => {
    button.onclick = () => {
      activeGenre = button.dataset.genre;
      renderMusic();
    };
  });
}

function musicRow(item, index) {
  const art = item.metadata?.artworkUrl || item.metadata?.tracks?.[0]?.artworkUrl100;
  return node(`
    <div class="mini-row" data-music-row="${esc(item.id)}">
      <span class="mini-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="mini-art">${art ? `<img src="${esc(art)}" alt="" loading="lazy">` : "♫"}</span>
      <div><b>${esc(item.title)}</b><br><small>${esc(item.detail || item.metadata?.artist || item.kind)}</small></div>
      <button class="mini-play" data-play-music="${esc(item.id)}" aria-label="${esc(t("music.playItem", { title: item.title }))}">▶</button>
      <button class="mini-delete" data-edit-only data-delete-music="${esc(item.id)}" aria-label="${esc(t("common.delete", { title: item.title }))}">×</button>
    </div>`);
}

/** Resalta la canción que está sonando y la mantiene visible dentro de la lista. */
function markPlaying() {
  const list = q("[data-music-list]");
  const playingId = q("[data-current-title]")?.dataset.parentId;
  qa("[data-music-row]", list).forEach((row) => {
    const isPlaying = Boolean(playingId) && row.dataset.musicRow === playingId && audio().hasAttribute("src");
    row.classList.toggle("is-playing", isPlaying);
    if (!isPlaying) return;
    // Scrolleamos solo la lista (no la página entera).
    const top = row.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTo({ top: top - list.clientHeight / 3, behavior: "smooth" });
  });
}

async function deleteMusic(id) {
  const item = findItem(id);
  if (!item || !confirm(t("music.confirmDelete", { title: item.title }))) return;
  try {
    await deleteItem(item.id);
    removeItem(item.id);
    if (String(q("[data-current-title]")?.dataset.parentId) === String(id)) resetPlayer();
    renderMusic();
  } catch (error) {
    alert(t("common.deleteFailed", { message: error.message }));
  }
}

/**
 * Las canciones guardadas antes de que existieran los géneros no lo tienen.
 * Se lo pedimos a iTunes en una sola consulta; si mira la dueña, además se guarda.
 */
async function fillMissingGenres() {
  if (genresRequested) return;
  const missing = itemsOf("music").filter((item) => !item.metadata?.genre);
  const idOf = (item) => item.metadata?.trackId || item.metadata?.albumId;
  const ids = [...new Set(missing.map(idOf).filter(Boolean))];
  if (!ids.length) return;
  genresRequested = true;
  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${ids.join(",")}&country=AR`);
    const { results = [] } = await response.json();
    const genreById = new Map(
      results.map((result) => [String(result.trackId || result.collectionId), result.primaryGenreName]),
    );
    const updated = missing.filter((item) => genreById.get(String(idOf(item))));
    updated.forEach(
      (item) => (item.metadata = { ...item.metadata, genre: genreById.get(String(idOf(item))) }),
    );
    if (updated.length) renderMusic();
    if (state.isOwner) for (const item of updated) await updateItem(item.id, { metadata: item.metadata });
  } catch (error) {
    console.warn("No se pudieron completar los géneros", error);
  }
}

// --- Reproductor ------------------------------------------------------------

function tracksOf(item) {
  const tracks = item.metadata?.tracks?.length
    ? item.metadata.tracks
    : [
        {
          trackName: item.title,
          artistName: item.metadata?.artist || item.detail,
          collectionName: item.metadata?.collection,
          previewUrl: item.metadata?.previewUrl,
          artworkUrl100: item.metadata?.artworkUrl,
        },
      ];
  return tracks.filter((track) => track.previewUrl).map((track) => ({ item, track }));
}

// La cola sigue el género elegido: "siguiente" y "anterior" se mueven dentro de él.
const buildQueue = () => visibleMusic().flatMap(tracksOf);

function showEntry(entry) {
  const { item, track } = entry || {};
  if (!item || !track) return;
  const title = q("[data-current-title]");
  title.textContent = track.trackName || item.title;
  title.dataset.parentId = item.id;
  q("[data-current-artist]").textContent = [
    track.artistName || item.metadata?.artist,
    track.collectionName || item.title,
  ]
    .filter(Boolean)
    .join(" · ");
  const art = track.artworkUrl100 || item.metadata?.artworkUrl;
  q("[data-current-art]").innerHTML = art ? `<img src="${esc(art)}" alt="">` : "♫";
  const credit = q("[data-music-credit]");
  credit.href = track.trackViewUrl || item.external_url || "https://music.apple.com/";
  credit.hidden = false;
  qa("[data-music-control]").forEach((button) => (button.disabled = false));
  markPlaying();
}

/** Si no está sonando nada, muestra la primera canción de la cola. */
function showFirstIfIdle() {
  if (!audio() || audio().hasAttribute("src")) return;
  queue = buildQueue();
  queueIndex = 0;
  if (queue.length) showEntry(queue[0]);
  else resetPlayer();
}

function resetPlayer() {
  const player = audio();
  player.pause();
  player.removeAttribute("src");
  qa("[data-music-control]").forEach((button) => (button.disabled = true));
  setPlaying(false);
  q("[data-current-title]").textContent = t("music.empty");
  q("[data-current-title]").dataset.parentId = "";
  q("[data-current-artist]").textContent = t("music.emptyHint");
  q("[data-current-art]").textContent = "♫";
  q("[data-music-credit]").hidden = true;
}

function setPlaying(isPlaying) {
  playButton().textContent = t(isPlaying ? "music.pause" : "music.play");
  playButton().setAttribute("aria-label", t(isPlaying ? "music.pauseAria" : "music.playAria"));
  q(".now-playing")?.classList.toggle("is-playing", isPlaying);
}

function playItem(id) {
  queue = buildQueue();
  queueIndex = queue.findIndex((entry) => String(entry.item.id) === String(id));
  if (queueIndex < 0) {
    alert(t("music.noPreview"));
    return;
  }
  playCurrent();
}

function playCurrent() {
  const entry = queue[queueIndex];
  if (!entry) return;
  audio().src = entry.track.previewUrl;
  showEntry(entry);
  audio()
    .play()
    .then(() => setPlaying(true))
    .catch(() => setPlaying(false));
}

/** Avanza (+1) o retrocede (-1) en la cola, dando la vuelta al llegar a un extremo. */
function step(direction) {
  const playingId = q("[data-current-title]")?.dataset.parentId;
  const playingUrl = audio().getAttribute("src");
  queue = buildQueue();
  if (!queue.length) return;
  // Buscamos dónde quedó lo que suena (la cola pudo cambiar al filtrar por género).
  // Si todavía no sonó nada, partimos de la canción que se ve en pantalla.
  const current = queue.findIndex(
    (entry) =>
      String(entry.item.id) === String(playingId) && (!playingUrl || entry.track.previewUrl === playingUrl),
  );
  if (current < 0) queueIndex = direction > 0 ? 0 : queue.length - 1;
  else queueIndex = (current + direction + queue.length) % queue.length;
  playCurrent();
}

function previous() {
  // Como en cualquier reproductor: si la canción ya avanzó, "anterior" vuelve a empezarla.
  if (audio().currentTime > RESTART_AFTER) {
    audio().currentTime = 0;
    return;
  }
  step(-1);
}

function togglePlay() {
  const player = audio();
  if (!player.getAttribute("src")) {
    const first = buildQueue()[0];
    if (first) playItem(first.item.id);
    return;
  }
  if (player.paused) player.play().then(() => setPlaying(true));
  else {
    player.pause();
    setPlaying(false);
  }
}

/** Conecta los controles del reproductor. Se llama una sola vez. */
export function bindMusicPlayer() {
  const player = audio();
  if (!player) return;
  const volume = q("[data-volume]");
  player.volume = Number(volume.value);
  volume.addEventListener("input", () => (player.volume = Number(volume.value)));
  player.addEventListener("ended", () => step(1));
  player.addEventListener("pause", () => setPlaying(false));
  player.addEventListener("play", () => setPlaying(true));
  playButton().addEventListener("click", togglePlay);
  q('[data-action="previous-music"]').addEventListener("click", previous);
  q('[data-action="next-music"]').addEventListener("click", () => step(1));
}
