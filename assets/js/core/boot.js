// Arranque común de todas las páginas públicas: carga los datos, detecta si
// quien mira es la dueña y después dibuja la página.

import { q } from "./dom.js";
import { state } from "./state.js";
import { currentUser, getArchive } from "./db.js";

export async function boot(renderPage) {
  const footerStatus = q("[data-storage-state]");
  try {
    state.archive = await getArchive();
  } catch (error) {
    console.error(error);
    if (footerStatus) footerStatus.textContent = "sin conexión";
    alert(`No se pudieron cargar los datos: ${error.message}`);
  }

  const user = await currentUser();
  state.isOwner = Boolean(user && state.archive.profile.owner_id === user.id);
  // Con esta clase, el CSS muestra los controles de edición (ver base.css).
  document.body.classList.toggle("is-owner", state.isOwner);

  renderPage();
  document.body.classList.remove("is-loading");
}
