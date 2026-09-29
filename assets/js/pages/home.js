// Página de inicio (index.html).

import { q, qa } from "../core/dom.js";
import { boot } from "../core/boot.js";
import { renderBooks } from "../features/books.js";
import { openItemDialog, setupItemDialog } from "../features/catalog.js";
import { renderChannels } from "../features/channels.js";
import { setupHomeLayout } from "../features/home-layout.js";
import { listenTo } from "../features/audio-analyser.js";
import { startHeroVisual } from "../features/hero-visual.js";
import { renderLabPreview } from "../features/lab.js";
import { bindMusicPlayer, renderMusic } from "../features/music.js";
import { openNoteDialog, renderNotes, setupNoteDialog } from "../features/notes.js";
import { renderPhotoPreview } from "../features/photos.js";
import { openProfileDialog, renderProfile, setupProfileDialog } from "../features/profile.js";

// Qué sección redibujar después de guardar algo desde el diálogo "sumar".
const RENDER_BY_TYPE = { music: renderMusic, book: renderBooks, channel: renderChannels };

// Qué hace cada botón con data-action="…".
const ACTIONS = {
  "edit-profile": openProfileDialog,
  "add-music": () => openItemDialog("music"),
  "add-book": () => openItemDialog("book"),
  "add-channel": () => openItemDialog("channel"),
  "new-note": () => openNoteDialog(),
};

boot(() => {
  renderProfile();
  renderMusic();
  renderLabPreview();
  renderBooks();
  renderChannels();
  renderNotes();
  renderPhotoPreview();
  setupHomeLayout();

  bindMusicPlayer();
  listenTo(q("[data-audio-player]"));
  startHeroVisual();
  setupProfileDialog();
  setupItemDialog((type) => RENDER_BY_TYPE[type]?.());
  setupNoteDialog();
  qa("[data-action]").forEach((button) => {
    const action = ACTIONS[button.dataset.action];
    if (action) button.addEventListener("click", action);
  });
});
