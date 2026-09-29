// Diálogo "sumar al archivo" del inicio. Sirve para tres cosas:
// - música: busca en iTunes y guarda la canción o el disco elegido,
// - libros: busca en Open Library y guarda el libro elegido (y permite editarlo),
// - canales/videos de YouTube: formulario simple (agregar y editar).

import { esc, node, q, qa } from "../core/dom.js";
import { saveItem, updateItem } from "../core/db.js";
import { t } from "../core/i18n.js";
import { addItem, findItem, itemsOf } from "../core/state.js";
import { bindDialog, openDialog, setFormStatus, whileBusy } from "../core/ui.js";
import { isYoutubeUrl, youtubeEmbedUrl } from "./youtube.js";

const DIALOG_TITLES = { music: "item.searchMusic", book: "item.searchBook", channel: "item.addChannel" };

let dialog;
let hits = [];
let searchTimer;
let searchSerial = 0;
let onChange = () => {};

/**
 * Prepara el diálogo. `rerender(type)` se llama después de guardar,
 * para que la página vuelva a dibujar la sección que cambió.
 */
export function setupItemDialog(rerender) {
  dialog = q('[data-modal="item"]');
  if (!dialog) return;
  onChange = rerender;
  const fields = q("form", dialog).elements;

  bindDialog(dialog, saveForm);
  const scheduleSearch = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(search, 350);
  };
  fields.title.addEventListener("input", scheduleSearch);
  fields.author.addEventListener("input", scheduleSearch);
  fields.musicMode.addEventListener("change", search);
  fields.rating.addEventListener("input", () => showRating(Number(fields.rating.value)));
  q("[data-catalog-results]", dialog).addEventListener("click", (event) => {
    const button = event.target.closest("[data-result-index]");
    if (button) chooseResult(button);
  });
}

export function openItemDialog(type, editItem = null) {
  if (!dialog) return;
  openDialog(dialog);
  const fields = q("form", dialog).elements;
  const isSearch = ["music", "book"].includes(type) && !editItem;

  dialog.dataset.itemType = type;
  dialog.dataset.editingItemId = editItem?.id || "";
  fields.type.value = type;
  fields.title.value = editItem?.title || "";
  fields.author.value = editItem?.metadata?.author || "";
  fields.detail.value = editItem?.detail || "";
  fields.kind.value = editItem?.kind || "por leer";
  fields.rating.value = String(editItem?.metadata?.rating || 0);
  fields.link.value = editItem?.external_url || "";
  fields.link.required = type === "channel" && !editItem;
  fields.videoLink.value = editItem?.metadata?.preview_url || "";
  showRating(Number(fields.rating.value));
  resetResults();

  q("[data-modal-title]", dialog).textContent = t(
    editItem ? (type === "book" ? "item.editBook" : "item.editChannel") : DIALOG_TITLES[type],
  );
  q("[data-title-label]", dialog).firstChild.textContent = t(
    type === "music" ? "item.song" : type === "book" ? "item.bookTitle" : "item.channelName",
  );
  fields.title.placeholder = t(
    type === "music" ? "item.songPlaceholder" : type === "book" ? "item.bookPlaceholder" : "item.channelName",
  );
  fields.author.placeholder = t(type === "music" ? "item.artistPlaceholder" : "item.authorPlaceholder");

  // Qué campos se ven según el tipo.
  const show = {
    "[data-author-label]": ["music", "book"].includes(type),
    "[data-music-mode]": type === "music",
    "[data-detail-label]": type !== "music",
    "[data-kind-label]": type === "book",
    "[data-rating-label]": type === "book",
    "[data-link-label]": type === "channel",
    "[data-video-label]": type === "channel",
  };
  Object.entries(show).forEach(([selector, visible]) => (q(selector, dialog).hidden = !visible));

  // En música y libros nuevos no hay botón "sumar": se agrega tocando un resultado.
  const submit = q("[data-item-submit]", dialog);
  submit.hidden = isSearch;
  submit.textContent = t(editItem ? "common.saveChanges" : "item.submit");
}

function showRating(value) {
  q("[data-rating-display]", dialog).textContent = value
    ? `${"★".repeat(Math.floor(value))}${value % 1 ? "½" : ""} · ${value}/5`
    : t("item.noRating");
}

// --- Guardar desde el formulario (canales y edición de libros) --------------

async function saveForm(fields) {
  const type = fields.type.value;
  const old = findItem(dialog.dataset.editingItemId);
  let item;

  if (type === "channel") {
    const url = fields.link.value.trim();
    const previewUrl = fields.videoLink.value.trim();
    if (url && !isYoutubeUrl(url)) throw new Error(t("item.youtubeOnly"));
    if (previewUrl && !youtubeEmbedUrl(previewUrl)) throw new Error(t("item.youtubeFeatured"));
    item = {
      type,
      title: fields.title.value.trim(),
      detail: fields.detail.value.trim(),
      kind: "canal",
      external_url: url || null,
      metadata: { ...(old?.metadata || {}), preview_url: previewUrl || null },
    };
  } else if (type === "book" && old) {
    const rating = Number(fields.rating.value);
    item = {
      title: fields.title.value.trim(),
      detail: fields.detail.value.trim(),
      kind: fields.kind.value,
      metadata: { ...(old.metadata || {}), author: fields.author.value.trim(), rating: rating || null },
    };
  } else {
    return;
  }

  if (old) {
    await updateItem(old.id, item);
    Object.assign(old, item);
  } else {
    addItem(await saveItem(item));
  }
  onChange(type);
  dialog.close("saved");
}

// --- Búsqueda en catálogos --------------------------------------------------

function resetResults() {
  clearTimeout(searchTimer);
  searchSerial++;
  hits = [];
  const results = q("[data-catalog-results]", dialog);
  results.hidden = true;
  results.replaceChildren();
}

async function search() {
  const type = dialog.dataset.itemType;
  const fields = q("form", dialog).elements;
  const results = q("[data-catalog-results]", dialog);
  if (!["music", "book"].includes(type) || dialog.dataset.editingItemId) return;

  const query = [fields.title.value, fields.author.value].filter(Boolean).join(" ").trim();
  if (query.length < 2) return resetResults();

  const request = ++searchSerial;
  results.hidden = false;
  results.innerHTML = `<p class="catalog-status">${t("item.searching")}</p>`;
  try {
    const found =
      type === "music"
        ? await searchItunes(query, fields.musicMode.value)
        : await searchOpenLibrary(fields.title.value, fields.author.value);
    if (request !== searchSerial) return; // llegó una búsqueda más nueva
    hits = found;
    renderResults(results, type);
  } catch (error) {
    if (request !== searchSerial) return;
    results.innerHTML = `<p class="catalog-status">${t("item.searchFailed")} <small>${esc(error.message)}</small></p>`;
  }
}

async function searchItunes(query, mode) {
  const entity = mode === "album" ? "album" : "song";
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=${entity}&limit=8&country=AR`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(t("item.itunesDown"));
  return (await response.json()).results || [];
}

async function searchOpenLibrary(title, author) {
  const params = new URLSearchParams({
    title,
    limit: "8",
    fields: "key,title,author_name,cover_i,first_publish_year",
  });
  if (author) params.set("author", author);
  const response = await fetch(`https://openlibrary.org/search.json?${params}`);
  if (!response.ok) throw new Error(t("item.openLibraryDown"));
  return (await response.json()).docs || [];
}

/** ¿Este resultado ya está guardado? Así evitamos repetidos. */
function alreadySaved(type, hit, mode) {
  if (type === "book") return itemsOf("book").some((book) => book.metadata?.workKey === hit.key);
  return itemsOf("music").some((music) =>
    mode === "album"
      ? music.metadata?.mode === "album" && String(music.metadata?.albumId) === String(hit.collectionId)
      : music.metadata?.mode !== "album" && String(music.metadata?.trackId) === String(hit.trackId),
  );
}

function renderResults(container, type) {
  if (!hits.length) {
    container.innerHTML = `<p class="catalog-status">${t("item.noResults")}</p>`;
    return;
  }
  const mode = q("form", dialog).elements.musicMode.value;
  container.replaceChildren(
    ...hits.map((hit, index) => {
      const title = type === "music" ? hit.trackName || hit.collectionName : hit.title;
      const subtitle =
        type === "music"
          ? hit.artistName || t("item.albumFallback")
          : (hit.author_name || []).join(", ") || t("item.unknownAuthor");
      const year = hit.first_publish_year ? ` · ${hit.first_publish_year}` : "";
      const image =
        type === "music"
          ? hit.artworkUrl100
          : hit.cover_i
            ? `https://covers.openlibrary.org/b/id/${hit.cover_i}-S.jpg?default=false`
            : null;
      const saved = alreadySaved(type, hit, mode);
      return node(`
        <button class="catalog-result" type="button" data-result-index="${index}" ${saved ? "disabled" : ""}>
          ${image ? `<img src="${esc(image)}" alt="" loading="lazy">` : "<span></span>"}
          <span><b>${esc(title)}</b><small>${esc(subtitle)}${year}</small></span>
          <span class="catalog-add">${t(saved ? "item.alreadySaved" : "item.add")}</span>
        </button>`);
    }),
  );
}

async function chooseResult(button) {
  const type = dialog.dataset.itemType;
  const fields = q("form", dialog).elements;
  const hit = hits[Number(button.dataset.resultIndex)];
  const label = q(".catalog-add", button);
  const allResults = qa(".catalog-result", dialog);
  setFormStatus(dialog, "");
  label.textContent = t("common.loading");
  try {
    // Bloqueamos todos los resultados para que no se guarden dos a la vez.
    await whileBusy(
      allResults,
      async () => {
        const item =
          type === "music" ? await musicItemFrom(hit, fields.musicMode.value) : bookItemFrom(hit, fields);
        addItem(await saveItem(item));
      },
      null,
    );
    onChange(type);
    dialog.close("saved");
  } catch (error) {
    label.textContent = t("item.add");
    setFormStatus(dialog, t("common.addFailed", { message: error.message }));
  }
}

const trackInfo = (track) => ({
  trackName: track.trackName,
  artistName: track.artistName,
  collectionName: track.collectionName,
  previewUrl: track.previewUrl,
  artworkUrl100: track.artworkUrl100,
  trackViewUrl: track.trackViewUrl,
});

async function musicItemFrom(hit, mode) {
  if (mode === "album") {
    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(hit.collectionId)}&entity=song&country=AR`,
    );
    if (!response.ok) throw new Error(t("item.albumTracksFailed"));
    const tracks = ((await response.json()).results || [])
      .filter((track) => track.wrapperType === "track")
      .map(trackInfo);
    return {
      type: "music",
      title: hit.collectionName,
      detail: hit.artistName,
      kind: "disco",
      external_url: hit.collectionViewUrl,
      metadata: {
        mode: "album",
        genre: hit.primaryGenreName || null,
        artist: hit.artistName,
        artworkUrl: hit.artworkUrl100,
        albumId: hit.collectionId,
        tracks,
      },
    };
  }
  return {
    type: "music",
    title: hit.trackName,
    detail: hit.artistName,
    kind: "canción",
    external_url: hit.trackViewUrl,
    metadata: {
      mode: "track",
      genre: hit.primaryGenreName || null,
      artist: hit.artistName,
      artworkUrl: hit.artworkUrl100,
      previewUrl: hit.previewUrl,
      trackId: hit.trackId,
      collection: hit.collectionName,
      tracks: [trackInfo(hit)],
    },
  };
}

function bookItemFrom(hit, fields) {
  const rating = Number(fields.rating.value);
  return {
    type: "book",
    title: hit.title,
    detail: fields.detail.value.trim(),
    kind: fields.kind.value,
    external_url: `https://openlibrary.org${hit.key}`,
    metadata: {
      author: (hit.author_name || []).join(", "),
      coverUrl: hit.cover_i ? `https://covers.openlibrary.org/b/id/${hit.cover_i}-M.jpg?default=false` : null,
      coverId: hit.cover_i || null,
      workKey: hit.key,
      year: hit.first_publish_year || null,
      rating: rating || null,
    },
  };
}
