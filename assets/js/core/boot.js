// Arranque común de todas las páginas públicas: carga los datos, detecta si
// quien mira es la dueña y después dibuja la página.

import { node, q } from "./dom.js";
import { state } from "./state.js";
import { currentUser, getArchive, signOut } from "./db.js";
import { startCursorSparkles } from "../features/cursor-sparkles.js";
import { mountLanguageSwitch, t, translatePage } from "./i18n.js";
import { mountSoundSwitch } from "./room-sound.js";

/**
 * Solo la dueña ve este aviso en la barra de abajo: así siempre sabe que tiene
 * la sesión iniciada (el navegador la recuerda aunque cierre la pestaña).
 */
function showOwnerBadge() {
  const footer = q(".site-footer");
  if (!footer) return;
  const badge = node(`
    <span class="owner-badge">
      <span class="owner-dot" aria-hidden="true"></span>${t("session.editMode")}
      <button type="button">${t("session.signOut")}</button>
    </span>`);
  q("button", badge).addEventListener("click", async () => {
    await signOut();
    location.reload();
  });
  footer.lastElementChild.before(badge);
}

function show(renderPage) {
  renderPage();
  document.body.classList.remove("is-loading");
  startCursorSparkles();
}

/**
 * needsArchive: false para las páginas que no muestran datos del archivo (juegos, zona tranquila):
 * aparecen enseguida y los datos (solo para saber si es la dueña) se buscan mientras tanto.
 */
export async function boot(renderPage, { needsArchive = true } = {}) {
  // Primero el idioma, así la página no se ve un instante en el otro.
  translatePage();
  mountLanguageSwitch();
  mountSoundSwitch();
  if (!needsArchive) show(renderPage);
  const footerStatus = q("[data-storage-state]");
  try {
    state.archive = await getArchive();
  } catch (error) {
    console.error(error);
    if (footerStatus) footerStatus.textContent = t("footer.offline");
    if (needsArchive) alert(t("footer.loadFailed", { message: error.message }));
  }

  const user = await currentUser();
  state.isOwner = Boolean(user && state.archive.profile.owner_id === user.id);
  // Con esta clase, el CSS muestra los controles de edición (ver base.css).
  document.body.classList.toggle("is-owner", state.isOwner);
  if (state.isOwner) showOwnerBadge();

  if (needsArchive) show(renderPage);
}
