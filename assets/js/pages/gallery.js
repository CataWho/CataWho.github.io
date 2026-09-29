// Página de la galería (galeria.html).

import { boot } from "../core/boot.js";
import { renderGallery, setupGallery } from "../features/gallery.js";

boot(() => {
  renderGallery();
  setupGallery();
});
