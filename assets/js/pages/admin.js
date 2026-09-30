// Acceso privado (admin.html): pide el Magic Link por email.
// La primera vez que la dueña entra, se crea su perfil.

import { q } from "../core/dom.js";
import { mountLanguageSwitch, t, translatePage } from "../core/i18n.js";
import { mountSoundSwitch } from "../core/room-sound.js";
import { currentUser, ensureProfile, hasDatabase, sendMagicLink, signOut } from "../core/db.js";

translatePage();
mountLanguageSwitch();
mountSoundSwitch();

const form = q("[data-admin-form]");
const status = q("[data-admin-status]");

async function start() {
  if (!hasDatabase) return;
  const user = await currentUser();
  if (!user) {
    status.textContent = t("admin.enterEmail");
    return;
  }
  try {
    await ensureProfile();
    form.hidden = true;
    q("[data-admin-signed-in]").hidden = false;
  } catch (error) {
    status.textContent = error.message;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = q("button", form);
  button.disabled = true;
  try {
    await sendMagicLink(new FormData(form).get("email"), `${location.origin}${location.pathname}`);
    status.textContent = t("admin.sent");
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

q("[data-sign-out]").addEventListener("click", async () => {
  await signOut();
  location.reload();
});

start();
