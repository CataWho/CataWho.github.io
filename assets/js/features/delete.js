// Borrado genérico de un item (libro, canal, nota…) con confirmación.

import { deleteItem } from "../core/db.js";
import { t } from "../core/i18n.js";
import { findItem, removeItem } from "../core/state.js";

/**
 * Pregunta, borra de la base y vuelve a dibujar la sección.
 * Devuelve true si se borró.
 */
export async function confirmAndDelete(id, sectionLabel, rerender) {
  const item = findItem(id);
  if (!item || !confirm(t("common.confirmDelete", { title: item.title, section: sectionLabel })))
    return false;
  try {
    await deleteItem(item.id);
    removeItem(item.id);
    rerender();
    return true;
  } catch (error) {
    alert(t("common.deleteFailed", { message: error.message }));
    return false;
  }
}
