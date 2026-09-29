// Ayudas compartidas para fotos y álbumes.
// Los álbumes se guardan como items de tipo "photo" con metadata.entity = "album".
// Cada foto guarda metadata.album_id y metadata.sort_order (su lugar en el orden).

import { esc, node, q } from "../core/dom.js";
import { itemsOf, state } from "../core/state.js";

export const LOOSE = "loose"; // id "virtual" para las fotos sin álbum

export const albums = () =>
  state.archive.items.filter((item) => item.type === "photo" && item.metadata?.entity === "album");

const orderOf = (photo) => photo.metadata?.sort_order ?? Number.MAX_SAFE_INTEGER;

export const orderedPhotos = () => itemsOf("photo").sort((a, b) => orderOf(a) - orderOf(b));

export const photosInAlbum = (albumId) =>
  orderedPhotos().filter((photo) => (photo.metadata?.album_id || LOOSE) === albumId);

export const findPhoto = (id) => itemsOf("photo").find((photo) => photo.id === id);

export const nextSortOrder = () =>
  Math.max(-1, ...itemsOf("photo").map((photo) => Number(photo.metadata?.sort_order) || 0)) + 1;

// --- Vista previa del inicio (06 / cosas que vi) ------------------------------

const PREVIEW_COUNT = 3;
const ROTATE_EVERY = 6000;
let rotateTimer = null;

export function renderPhotoPreview() {
  const container = q("[data-photo-preview]");
  if (!container) return;
  clearInterval(rotateTimer);
  const photos = orderedPhotos();
  let offset = 0;

  const show = () => {
    if (!photos.length) {
      container.replaceChildren(...Array.from({ length: PREVIEW_COUNT }, () => node("<figure></figure>")));
      return;
    }
    const visible = [...photos.slice(offset), ...photos.slice(0, offset)].slice(0, PREVIEW_COUNT);
    container.replaceChildren(
      ...visible.map((photo) =>
        node(`<figure><img src="${esc(photo.image_url)}" alt="${esc(photo.title)}" loading="lazy"></figure>`),
      ),
    );
  };

  show();
  if (photos.length > PREVIEW_COUNT) {
    rotateTimer = setInterval(() => {
      offset = (offset + 1) % photos.length;
      show();
    }, ROTATE_EVERY);
  }
}
