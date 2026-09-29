// Arranque común de todas las páginas públicas: carga los datos, detecta si
// quien mira es la dueña y después dibuja la página.

import { node, q } from "./dom.js";
import { state } from "./state.js";
import { currentUser, getArchive, signOut } from "./db.js";

/**
 * Solo la dueña ve este aviso en la barra de abajo: así siempre sabe que tiene
 * la sesión iniciada (el navegador la recuerda aunque cierre la pestaña).
 */
function showOwnerBadge() {
  const footer = q(".site-footer");
  if (!footer) return;
  const badge = node(`
    <span class="owner-badge">
      <span class="owner-dot" aria-hidden="true"></span>modo edición
      <button type="button">cerrar sesión</button>
    </span>`);
  q("button", badge).addEventListener("click", async () => {
    await signOut();
    location.reload();
  });
  footer.lastElementChild.before(badge);
}

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
  if (state.isOwner) showOwnerBadge();

  renderPage();
  document.body.classList.remove("is-loading");
}
