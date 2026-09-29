// Orden y tamaño de las ventanas del inicio. La dueña puede arrastrarlas
// y agrandarlas; el resultado se guarda en profiles.layout.

import { node, q, qa } from "../core/dom.js";
import { updateProfile } from "../core/db.js";
import { state } from "../core/state.js";

/** Guarda la disposición en la base y la aplica. Devuelve true si salió bien. */
export async function saveHomeLayout(layout) {
  try {
    await updateProfile({ layout });
    state.archive.profile.layout = layout;
    applyHomeLayout();
    return true;
  } catch (error) {
    alert(`No se pudo guardar la disposición: ${error.message}`);
    return false;
  }
}

export function applyHomeLayout() {
  const grid = q(".collection");
  if (!grid) return;
  const layout = state.archive.profile.layout || {};
  const order = layout.order || [];
  qa("[data-home-section]", grid).forEach((section, index) => {
    const key = section.dataset.homeSection;
    section.style.order = String(order.includes(key) ? order.indexOf(key) : order.length + index);
    section.classList.toggle("section-wide", Boolean(layout.sizes?.[key]?.wide));
    section.classList.toggle("section-tall", Boolean(layout.sizes?.[key]?.tall));
  });
}

/** Agrega los controles ↔ ↕ ⠿ a cada ventana y escucha el arrastre. Una sola vez. */
export function setupHomeLayout() {
  const grid = q(".collection");
  if (!grid) return;
  applyHomeLayout();
  if (!state.isOwner) return;

  qa("[data-home-section] .window-bar", grid).forEach((bar) =>
    bar.append(
      node(`
        <span class="section-layout-controls">
          <button type="button" data-layout-size="wide" title="Aumentar o reducir ancho" aria-label="Cambiar ancho de sección">↔</button>
          <button type="button" data-layout-size="tall" title="Aumentar o reducir alto" aria-label="Cambiar alto de sección">↕</button>
          <button type="button" data-layout-grip draggable="true" title="Arrastrar para reordenar" aria-label="Arrastrar para reordenar sección">⠿</button>
        </span>`),
    ),
  );

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-layout-size]");
    if (!button) return;
    const key = button.closest("[data-home-section]").dataset.homeSection;
    const dimension = button.dataset.layoutSize;
    const layout = state.archive.profile.layout || {};
    const sizes = { ...(layout.sizes || {}) };
    sizes[key] = { ...(sizes[key] || {}), [dimension]: !sizes[key]?.[dimension] };
    saveHomeLayout({ ...layout, sizes });
  });

  let dragged = null;
  grid.addEventListener("dragstart", (event) => {
    const grip = event.target.closest("[data-layout-grip]");
    if (!grip) return event.preventDefault();
    dragged = grip.closest("[data-home-section]");
    event.dataTransfer.setData("text/plain", dragged.dataset.homeSection);
    event.dataTransfer.effectAllowed = "move";
  });
  grid.addEventListener("dragover", (event) => {
    if (dragged && event.target.closest("[data-home-section]")) event.preventDefault();
  });
  grid.addEventListener("drop", (event) => {
    const target = event.target.closest("[data-home-section]");
    if (!dragged || !target || dragged === target) return;
    event.preventDefault();
    // Reordenamos la lista de claves según dónde se soltó.
    const keys = qa("[data-home-section]", grid)
      .sort((a, b) => Number(a.style.order) - Number(b.style.order))
      .map((section) => section.dataset.homeSection)
      .filter((key) => key !== dragged.dataset.homeSection);
    const rect = target.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    keys.splice(keys.indexOf(target.dataset.homeSection) + (after ? 1 : 0), 0, dragged.dataset.homeSection);
    dragged = null;
    saveHomeLayout({ ...state.archive.profile.layout, order: keys });
  });
  grid.addEventListener("dragend", () => (dragged = null));
}
