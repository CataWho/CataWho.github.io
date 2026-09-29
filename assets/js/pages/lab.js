// Página del laboratorio (laboratorio.html).

import { q } from "../core/dom.js";
import { boot } from "../core/boot.js";
import { openProjectDialog, renderLab, setupProjectDialog } from "../features/lab.js";

boot(() => {
  renderLab();
  setupProjectDialog();
  q('[data-action="new-project"]').addEventListener("click", openProjectDialog);
});
