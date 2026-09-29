// Notas y artículos: la vista previa del inicio (05 / cuaderno abierto)
// y el muro completo de notas.html. Las dos se pueden editar y borrar.

import { esc, node, q, qa } from "../core/dom.js";
import { saveItem, updateItem } from "../core/db.js";
import { addItem, findItem, itemsOf, newestFirst } from "../core/state.js";
import { bindDialog, openDialog } from "../core/ui.js";
import { confirmAndDelete } from "./delete.js";

const NOTES_ON_HOME = 2;
let dialog;

const allNotes = () => itemsOf("note", "article").sort(newestFirst);
const formatDate = (value) => new Date(value || Date.now()).toLocaleDateString("es-AR");

export function renderNotes() {
  const preview = q("[data-note-list]");
  const wall = q("[data-full-note-list]");
  const notes = allNotes();

  preview?.replaceChildren(...notes.slice(0, NOTES_ON_HOME).map((note) => noteCard(note, "note-card", "h3")));
  if (wall) {
    wall.replaceChildren(...notes.map((note) => noteCard(note, "full-note", "h2")));
    if (!notes.length) wall.append(node('<p class="empty-state">Todavía no hay notas.</p>'));
  }

  qa("[data-edit-note]").forEach((button) => {
    button.onclick = () => openNoteDialog(findItem(button.dataset.editNote));
  });
  qa("[data-delete-note]").forEach((button) => {
    button.onclick = () => confirmAndDelete(button.dataset.deleteNote, "tus notas", renderNotes);
  });
}

function noteCard(note, className, heading) {
  return node(`
    <article class="${className}">
      <p class="eyebrow">${esc(note.kind)} · ${formatDate(note.created_at)}</p>
      <${heading}>${esc(note.title)}</${heading}>
      <p>${esc(note.detail)}</p>
      <span class="card-actions" data-edit-only>
        <button class="icon-button" data-edit-note="${esc(note.id)}" aria-label="Editar ${esc(note.title)}">✎</button>
        <button class="icon-button delete-button" data-delete-note="${esc(note.id)}" aria-label="Eliminar ${esc(note.title)}">×</button>
      </span>
    </article>`);
}

// --- Diálogo para escribir o editar ------------------------------------------
// Se crea desde acá (y no en el HTML) para que inicio y notas usen el mismo.

export function setupNoteDialog() {
  dialog = node(`
    <dialog data-modal="note">
      <form class="modal">
        <header>
          <span data-note-dialog-title>escribir una nota</span>
          <button class="close" type="button" data-close-dialog aria-label="Cerrar">×</button>
        </header>
        <label>Título<input name="title" required maxlength="140"></label>
        <label>Texto<textarea name="detail" required maxlength="5000"></textarea></label>
        <label>Formato
          <select name="kind"><option>nota</option><option>artículo</option></select>
        </label>
        <menu>
          <button class="button light" type="button" data-close-dialog>cancelar</button>
          <button class="button dark" type="submit">publicar</button>
        </menu>
      </form>
    </dialog>`);
  document.body.append(dialog);
  bindDialog(dialog, saveNote);
}

export function openNoteDialog(note = null) {
  openDialog(dialog);
  const fields = q("form", dialog).elements;
  dialog.dataset.editingId = note?.id || "";
  fields.title.value = note?.title || "";
  fields.detail.value = note?.detail || "";
  fields.kind.value = note?.kind === "artículo" ? "artículo" : "nota";
  q("[data-note-dialog-title]", dialog).textContent = note ? "editar nota" : "escribir una nota";
  q('[type="submit"]', dialog).textContent = note ? "guardar cambios" : "publicar";
}

async function saveNote(fields) {
  const changes = {
    type: fields.kind.value === "artículo" ? "article" : "note",
    title: fields.title.value.trim(),
    detail: fields.detail.value.trim(),
    kind: fields.kind.value,
  };
  const old = findItem(dialog.dataset.editingId);
  if (old) {
    await updateItem(old.id, changes);
    Object.assign(old, changes);
  } else {
    addItem(await saveItem(changes));
  }
  renderNotes();
  dialog.close("saved");
}
