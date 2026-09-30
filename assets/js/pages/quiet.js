// Página de la zona tranquila (zona-tranquila.html).

import { q, qa } from "../core/dom.js";
import { boot } from "../core/boot.js";
import { t } from "../core/i18n.js";
import { buenosAiresHour, startQuietPlace } from "../features/quiet-place.js";

boot(() => {
  const clock = q("[data-quiet-clock]");
  let phaseName = "";
  const scene = startQuietPlace(q("[data-quiet-canvas]"), {
    onPhase: (phase) => {
      phaseName = t(`quiet.${phase}`);
      showClock();
    },
  });

  // Reloj de Buenos Aires en la barra de la ventana.
  function showClock() {
    const hour = buenosAiresHour();
    const hh = String(Math.floor(hour)).padStart(2, "0");
    const mm = String(Math.round((hour % 1) * 60)).padStart(2, "0");
    clock.textContent = `${hh}:${mm} · ${phaseName}`;
  }
  showClock();
  setInterval(showClock, 30_000);

  qa("[data-phase]").forEach((button) =>
    button.addEventListener("click", () => {
      qa("[data-phase]").forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
      scene.setPhase(button.dataset.phase);
    }),
  );
}, { needsArchive: false }); // no usa datos del archivo: aparece enseguida
