// Piezas de interfaz reutilizables: diálogos y botones "ocupados".

import { q, qa } from "./dom.js";
import { t } from "./i18n.js";

/**
 * Desactiva uno o más botones mientras corre una tarea (por ejemplo, guardar).
 * Así un doble clic no crea el mismo contenido dos veces.
 */
export async function whileBusy(buttons, task, busyText = t("common.saving")) {
  const list = [buttons].flat().filter(Boolean);
  const before = list.map((button) => ({ label: button.textContent, disabled: button.disabled }));
  list.forEach((button) => {
    button.disabled = true;
    if (busyText) button.textContent = busyText;
  });
  try {
    return await task();
  } finally {
    list.forEach((button, index) => {
      button.disabled = before[index].disabled;
      if (busyText) button.textContent = before[index].label;
    });
  }
}

/** Muestra un mensaje dentro del diálogo (errores, avisos). */
export function setFormStatus(dialog, message) {
  let status = q(".form-status", dialog);
  if (!status) {
    status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("role", "status");
    q("form", dialog)?.append(status);
  }
  status.textContent = message;
}

/**
 * Conecta un <dialog> que tiene un <form>:
 * - los botones con data-close-dialog lo cierran,
 * - Escape lo cierra,
 * - al enviar, corre onSubmit con el botón bloqueado y muestra el error si falla.
 */
export function bindDialog(dialog, onSubmit) {
  const form = q("form", dialog);
  dialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-dialog]")) dialog.close("cancel");
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!onSubmit) return;
    setFormStatus(dialog, "");
    try {
      await whileBusy(qa('[type="submit"]', form), () => onSubmit(form.elements, dialog));
    } catch (error) {
      console.error(error);
      setFormStatus(dialog, t("common.saveFailed", { message: error.message }));
    }
  });
}

/** Abre un diálogo limpio (formulario vacío y sin mensajes viejos). */
export function openDialog(dialog) {
  q("form", dialog)?.reset();
  setFormStatus(dialog, "");
  dialog.showModal();
}
