// 01 / Escuchando: lista de música y reproductor de previews de iTunes (inicio).
// Cada canción o disco guardado tiene una o varias "tracks" con su preview de 30 s.
// La cola recorre todas las previews de la lista y vuelve a empezar al terminar.

import { esc, node, q, qa } from "../core/dom.js";
import { deleteItem } from "../core/db.js";
import { findItem, itemsOf, removeItem } from "../core/state.js";

let queue = [];
let queueIndex = 0;

const audio = () => q("[data-audio-player]");
const playButton = () => q('[data-action="toggle-music"]');

// --- Lista ------------------------------------------------------------------

export function renderMusic() {
  const list = q("[data-music-list]");
  if (!list) return;
  list.replaceChildren(...itemsOf("music").map(musicRow));
  qa("[data-play-music]", list).forEach((button) => {
    button.onclick = () => playItem(button.dataset.playMusic);
  });
  qa("[data-delete-music]", list).forEach((button) => {
    button.onclick = () => deleteMusic(button.dataset.deleteMusic);
  });
  showFirstIfIdle();
}

function musicRow(item, index) {
  const art = item.metadata?.artworkUrl || item.metadata?.tracks?.[0]?.artworkUrl100;
  return node(`
    <div class="mini-row">
      <span class="mini-number">${String(index + 1).padStart(2, "0")}</span>
      <span class="mini-art">${art ? `<img src="${esc(art)}" alt="">` : "♫"}</span>
      <div><b>${esc(item.title)}</b><br><small>${esc(item.detail || item.metadata?.artist || item.kind)}</small></div>
      <button class="mini-play" data-play-music="${esc(item.id)}" aria-label="Reproducir ${esc(item.title)}">▶</button>
      <button class="mini-delete" data-edit-only data-delete-music="${esc(item.id)}" aria-label="Eliminar ${esc(item.title)}">×</button>
    </div>`);
}

async function deleteMusic(id) {
  const item = findItem(id);
  if (!item || !confirm(`¿Eliminar “${item.title}” de la lista?`)) return;
  try {
    await deleteItem(item.id);
    removeItem(item.id);
    if (String(q("[data-current-title]")?.dataset.parentId) === String(id)) resetPlayer();
    renderMusic();
  } catch (error) {
    alert(`No se pudo eliminar: ${error.message}`);
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

const buildQueue = () => itemsOf("music").flatMap(tracksOf);

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
  playButton().disabled = false;
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
  playButton().disabled = true;
  playButton().textContent = "▶ reproducir preview";
  q("[data-current-title]").textContent = "Todavía no agregaste música";
  q("[data-current-title]").dataset.parentId = "";
  q("[data-current-artist]").textContent = "Buscá una canción o un disco.";
  q("[data-current-art]").textContent = "♫";
  q("[data-music-credit]").hidden = true;
}

function playItem(id) {
  queue = buildQueue();
  queueIndex = queue.findIndex((entry) => String(entry.item.id) === String(id));
  if (queueIndex < 0) {
    alert("Apple no ofrece una preview para esta canción/disco en este catálogo.");
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
    .then(() => (playButton().textContent = "Ⅱ pausar preview"))
    .catch(() => (playButton().textContent = "▶ reproducir preview"));
}

function playNext() {
  queue = buildQueue();
  if (!queue.length) return;
  queueIndex = (queueIndex + 1) % queue.length;
  playCurrent();
}

function togglePlay() {
  const player = audio();
  if (!player.getAttribute("src")) {
    const first = buildQueue()[0];
    if (first) playItem(first.item.id);
    return;
  }
  if (player.paused) {
    player.play().then(() => (playButton().textContent = "Ⅱ pausar preview"));
  } else {
    player.pause();
    playButton().textContent = "▶ reproducir preview";
  }
}

/** Conecta los controles del reproductor. Se llama una sola vez. */
export function bindMusicPlayer() {
  const player = audio();
  if (!player) return;
  const volume = q("[data-volume]");
  player.volume = Number(volume.value);
  volume.addEventListener("input", () => (player.volume = Number(volume.value)));
  player.addEventListener("ended", playNext);
  playButton().addEventListener("click", togglePlay);
}
