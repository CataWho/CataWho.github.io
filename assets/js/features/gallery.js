// Galería (galeria.html): álbumes, grilla de fotos, orden, subida y visor.

import { esc, node, q, qa } from "../core/dom.js";
import { deleteItem, deleteMedia, safeFileName, saveItem, updateItem, uploadMedia } from "../core/db.js";
import { removeItem, state } from "../core/state.js";
import { bindDialog, openDialog } from "../core/ui.js";
import { LOOSE, albums, findPhoto, nextSortOrder, orderedPhotos, photosInAlbum } from "./photos.js";

// Qué se está viendo: "albums" (portadas), "all" (todas las fotos) o el id de un álbum.
let view = "albums";
// Mientras se guarda algo, bloqueamos la galería para no mezclar cambios.
let busy = false;

const visiblePhotos = () => (view === "all" ? orderedPhotos() : photosInAlbum(view));
const findAlbum = (id) => albums().find((album) => album.id === id);

function setStatus(message) {
  q("[data-gallery-status]").textContent = message;
}

// --- Dibujar ------------------------------------------------------------------

export function renderGallery() {
  const list = q("[data-gallery-list]");
  if (!list) return;
  const showingAlbums = view === "albums";
  const activeAlbum = findAlbum(view);

  q("[data-gallery-heading]").textContent = showingAlbums
    ? "Mis álbumes"
    : view === "all"
      ? "Todas las fotografías"
      : activeAlbum?.title || "Sin álbum";
  q("[data-gallery-back]").hidden = showingAlbums;
  qa("[data-gallery-view]").forEach((button) =>
    button.setAttribute("aria-pressed", String(button.dataset.galleryView === view)),
  );
  q("[data-album-edit]").hidden = !activeAlbum;
  q("[data-album-delete]").hidden = !activeAlbum;
  list.classList.toggle("album-grid", showingAlbums);

  if (showingAlbums) {
    list.replaceChildren(...[...albums(), { id: LOOSE, title: "Sin álbum" }].map(albumCard));
  } else {
    const photos = visiblePhotos();
    list.replaceChildren(
      ...(photos.length
        ? photos.map((photo, index) => photoCard(photo, index, photos.length))
        : [node('<p class="empty-state">Este álbum todavía no tiene fotos.</p>')]),
    );
    bindPhotoOrdering(list);
  }
  list.setAttribute("aria-busy", String(busy));
  if (busy) qa("button", list).forEach((button) => (button.disabled = true));
}

function albumCard(album) {
  const photos = photosInAlbum(album.id);
  const cover = photos.find((photo) => photo.id === album.metadata?.cover_id) || photos[0];
  return node(`
    <button type="button" class="album-card" data-open-album="${esc(album.id)}">
      <span class="album-tab">${String(photos.length).padStart(2, "0")} fotografías</span>
      <span class="album-cover">${cover ? `<img src="${esc(cover.image_url)}" alt="" loading="lazy">` : '<span class="album-empty">＋</span>'}</span>
      <span class="album-title">${esc(album.title)} <span aria-hidden="true">↗</span></span>
    </button>`);
}

function photoCard(photo, index, total) {
  const id = esc(photo.id);
  const title = esc(photo.title);
  const actions = state.isOwner
    ? `<div class="photo-actions">
         <button type="button" data-edit-photo="${id}">✎ Editar</button>
         <button type="button" data-photo-move="up" data-photo-id="${id}" ${index === 0 ? "disabled" : ""} aria-label="Mover ${title} antes">←</button>
         <button type="button" data-photo-move="down" data-photo-id="${id}" ${index === total - 1 ? "disabled" : ""} aria-label="Mover ${title} después">→</button>
         <button type="button" data-delete-photo="${id}" aria-label="Eliminar ${title}">Eliminar</button>
       </div>`
    : "";
  return node(`
    <figure class="gallery-item" data-photo-id="${id}" draggable="${state.isOwner && !busy}">
      <button type="button" class="photo-open" data-open-photo="${id}" aria-label="Ver ${esc(photo.title)} completa">
        <img src="${esc(photo.image_url)}" alt="${esc(photo.title)}" loading="lazy" draggable="false">
      </button>
      <figcaption><span class="photo-number">${String(index + 1).padStart(2, "0")}</span><h3>${esc(photo.title)}</h3></figcaption>
      ${actions}
    </figure>`);
}

// --- Eventos ------------------------------------------------------------------

export function setupGallery() {
  if (!q("[data-gallery-list]")) return;

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || busy) return;
    const data = button.dataset;
    if ("openAlbum" in data) showView(data.openAlbum);
    if ("galleryView" in data) showView(data.galleryView);
    if ("galleryBack" in data) showView("albums");
    if ("openPhoto" in data) openViewer(data.openPhoto);
    if ("photoStep" in data) stepViewer(Number(data.photoStep));
    if ("viewerClose" in data) q("[data-photo-viewer]").close();
    if (!state.isOwner) return;
    if ("editPhoto" in data) openPhotoEditor(data.editPhoto);
    if ("deletePhoto" in data) deletePhoto(data.deletePhoto);
    if ("newAlbum" in data) openAlbumEditor();
    if ("albumEdit" in data) openAlbumEditor(view);
    if ("albumDelete" in data) deleteAlbum(view);
    if ("uploadPhoto" in data) q("[data-photo-input]").click();
  });

  bindDialog(q("[data-photo-editor]"), savePhotoDetails);
  bindDialog(q("[data-album-editor]"), saveAlbum);
  q("[data-photo-input]").addEventListener("change", uploadPhotos);
  q("[data-photo-viewer]").addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") stepViewer(-1);
    if (event.key === "ArrowRight") stepViewer(1);
  });
}

function showView(next) {
  view = next;
  renderGallery();
}

// --- Editar foto y álbum -------------------------------------------------------

function openPhotoEditor(id) {
  const photo = findPhoto(id);
  if (!photo) return;
  const dialog = q("[data-photo-editor]");
  openDialog(dialog);
  const fields = q("form", dialog).elements;
  dialog.dataset.photoId = id;
  fields.title.value = photo.title;
  fields.album.replaceChildren(
    node('<option value="">Sin álbum</option>'),
    ...albums().map((album) => node(`<option value="${esc(album.id)}">${esc(album.title)}</option>`)),
  );
  fields.album.value = photo.metadata?.album_id || "";
}

async function savePhotoDetails(fields, dialog) {
  const photo = findPhoto(dialog.dataset.photoId);
  const title = fields.title.value.trim();
  const albumId = fields.album.value;
  const metadata = { ...photo.metadata, album_id: albumId || null };
  // Al cambiar de álbum, la foto pasa al final.
  if ((photo.metadata?.album_id || "") !== albumId) metadata.sort_order = nextSortOrder();

  await updateItem(photo.id, { title, metadata });
  Object.assign(photo, { title, metadata });
  const album = findAlbum(albumId);
  if (fields.cover.checked && album) {
    const albumMeta = { ...album.metadata, cover_id: photo.id };
    await updateItem(album.id, { metadata: albumMeta });
    album.metadata = albumMeta;
  }
  dialog.close();
  setStatus("Foto guardada.");
  renderGallery();
}

function openAlbumEditor(id) {
  const album = findAlbum(id);
  const dialog = q("[data-album-editor]");
  openDialog(dialog);
  dialog.dataset.albumId = id || "";
  q("[data-album-dialog-title]", dialog).textContent = album ? "Renombrar álbum" : "Nuevo álbum";
  q('[name="title"]', dialog).value = album?.title || "";
}

async function saveAlbum(fields, dialog) {
  const title = fields.title.value.trim();
  const old = findAlbum(dialog.dataset.albumId);
  if (old) {
    await updateItem(old.id, { title });
    old.title = title;
  } else {
    const saved = await saveItem({ type: "photo", kind: "álbum", title, metadata: { entity: "album" } });
    state.archive.items.push(saved);
    view = saved.id;
  }
  dialog.close();
  setStatus("Álbum guardado.");
  renderGallery();
}

async function deleteAlbum(id) {
  const album = findAlbum(id);
  if (!album || !confirm(`¿Eliminar el álbum “${album.title}”? Sus fotos se conservarán en “Sin álbum”.`))
    return;
  await withGalleryBusy(async () => {
    for (const photo of photosInAlbum(id)) {
      const metadata = { ...photo.metadata, album_id: null };
      await updateItem(photo.id, { metadata });
      photo.metadata = metadata;
    }
    await deleteItem(id);
    removeItem(id);
    view = "albums";
    setStatus("Álbum eliminado. Las fotos se conservaron.");
  }, "No se pudo completar");
}

async function withGalleryBusy(task, errorPrefix) {
  busy = true;
  renderGallery();
  try {
    await task();
  } catch (error) {
    setStatus(`${errorPrefix}: ${error.message}`);
  } finally {
    busy = false;
    renderGallery();
  }
}

// --- Ordenar fotos --------------------------------------------------------------

function bindPhotoOrdering(list) {
  if (!state.isOwner) return;
  let draggedId = null;
  qa(".gallery-item", list).forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      if (busy) return event.preventDefault();
      draggedId = card.dataset.photoId;
      event.dataTransfer.setData("text/plain", draggedId);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      draggedId = null;
      card.classList.remove("dragging");
    });
    card.addEventListener("dragover", (event) => {
      if (draggedId) event.preventDefault();
    });
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      if (!draggedId || busy) return;
      const ids = visiblePhotos().map((photo) => photo.id);
      const from = ids.indexOf(draggedId);
      const to = ids.indexOf(card.dataset.photoId);
      if (from < 0 || to < 0 || from === to) return;
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      savePhotoOrder(ids);
    });
  });
  qa("[data-photo-move]", list).forEach((button) => {
    button.onclick = () => {
      const ids = visiblePhotos().map((photo) => photo.id);
      const index = ids.indexOf(button.dataset.photoId);
      const next = index + (button.dataset.photoMove === "up" ? -1 : 1);
      if (next < 0 || next >= ids.length || busy) return;
      [ids[index], ids[next]] = [ids[next], ids[index]];
      savePhotoOrder(ids);
    };
  });
}

/** Guarda el nuevo orden. Solo cambia los lugares de las fotos que se ven; el resto queda igual. */
async function savePhotoOrder(ids) {
  setStatus("Guardando orden…");
  const selected = new Set(ids);
  const reordered = ids.values();
  const ordered = orderedPhotos().map((photo) =>
    selected.has(photo.id) ? findPhoto(reordered.next().value) : photo,
  );
  await withGalleryBusy(async () => {
    for (const [index, photo] of ordered.entries()) {
      if (photo.metadata?.sort_order === index) continue;
      const metadata = { ...photo.metadata, sort_order: index };
      await updateItem(photo.id, { metadata });
      photo.metadata = metadata;
    }
    setStatus("Orden guardado.");
  }, "No se pudo guardar todo el orden");
}

// --- Subir y borrar fotos -------------------------------------------------------

async function deletePhoto(id) {
  const photo = findPhoto(id);
  if (!photo || !confirm(`¿Eliminar “${photo.title}” de la galería?`)) return;
  await withGalleryBusy(async () => {
    await deleteItem(id);
    removeItem(id);
    setStatus("Foto eliminada.");
    if (photo.metadata?.storagePath) {
      try {
        await deleteMedia(photo.metadata.storagePath);
      } catch {
        setStatus("Foto eliminada de la galería. Quedó pendiente limpiar el archivo en Storage.");
      }
    }
  }, "No se pudo eliminar");
}

async function uploadPhotos(event) {
  const files = [...event.target.files].filter((file) => file.type.startsWith("image/"));
  if (!files.length || busy) return;
  const albumId = findAlbum(view) ? view : null;
  let count = 0;
  await withGalleryBusy(async () => {
    try {
      for (const file of files) {
        setStatus(`Subiendo ${count + 1} de ${files.length}…`);
        await uploadOne(file, albumId);
        count++;
      }
      setStatus(`${count} foto(s) cargada(s). Usá “Editar” para cambiar sus nombres.`);
    } catch (error) {
      setStatus(`${count} foto(s) cargada(s). No se pudo completar la subida: ${error.message}`);
    }
    view = albumId || LOOSE;
  }, "No se pudo subir");
  event.target.value = "";
}

async function uploadOne(file, albumId) {
  const path = `${state.archive.profile.owner_id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const url = await uploadMedia(path, file);
  try {
    const saved = await saveItem({
      type: "photo",
      title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
      detail: "",
      kind: "foto",
      image_url: url,
      metadata: { sort_order: nextSortOrder(), storagePath: path, album_id: albumId },
    });
    state.archive.items.push(saved);
  } catch (error) {
    // Si no se pudo guardar el registro, borramos el archivo para no dejarlo huérfano.
    await deleteMedia(path).catch(() => {});
    throw error;
  }
}

// --- Visor ------------------------------------------------------------------------

function openViewer(id) {
  const photo = findPhoto(id);
  if (!photo) return;
  const viewer = q("[data-photo-viewer]");
  const photos = visiblePhotos();
  viewer.dataset.photoId = id;
  q("img", viewer).src = photo.image_url;
  q("img", viewer).alt = photo.title;
  q("[data-viewer-title]", viewer).textContent = photo.title;
  q("[data-viewer-count]", viewer).textContent =
    `${photos.findIndex((item) => item.id === id) + 1} / ${photos.length}`;
  if (!viewer.open) viewer.showModal();
}

function stepViewer(step) {
  const photos = visiblePhotos();
  if (!photos.length) return;
  const index = photos.findIndex((photo) => photo.id === q("[data-photo-viewer]").dataset.photoId);
  openViewer(photos[(index + step + photos.length) % photos.length].id);
}
