// Acceso privado (admin.html): pide el Magic Link por email.
// La primera vez que la dueña entra, se crea su perfil.

import { q } from "../core/dom.js";
import { currentUser, ensureProfile, hasDatabase, sendMagicLink, signOut } from "../core/db.js";

const form = q("[data-admin-form]");
const status = q("[data-admin-status]");

async function start() {
  if (!hasDatabase) return;
  const user = await currentUser();
  if (!user) {
    status.textContent = "Ingresá el email que usarás siempre para administrar este perfil.";
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
    status.textContent = "Listo: revisá tu email y abrí el enlace de acceso.";
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
