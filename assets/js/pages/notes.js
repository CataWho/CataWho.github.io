// Página de notas (notas.html).

import { q } from "../core/dom.js";
import { boot } from "../core/boot.js";
import { openNoteDialog, renderNotes, setupNoteDialog } from "../features/notes.js";

boot(() => {
  renderNotes();
  setupNoteDialog();
  q('[data-action="new-note"]').addEventListener("click", () => openNoteDialog());
});
