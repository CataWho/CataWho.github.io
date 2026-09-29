// Tarjeta de perfil del inicio (nombre, bio y avatar) y su diálogo de edición.

import { esc, q } from "../core/dom.js";
import { deleteMedia, safeFileName, storagePathFromUrl, updateProfile, uploadMedia } from "../core/db.js";
import { t } from "../core/i18n.js";
import { state } from "../core/state.js";
import { bindDialog, openDialog } from "../core/ui.js";

// El avatar pixel art vive dentro del sitio, así que no hace falta subirlo a Storage.
const PIXEL_AVATAR = "assets/images/cata-avatar-pixel.webp";
let dialog;

export function renderProfile() {
  const { profile } = state.archive;
  q("[data-profile-name]").textContent = profile.display_name;
  q("[data-profile-bio]").textContent = profile.bio || "";
  const avatarUrl = profile.avatar_url || PIXEL_AVATAR;
  q("[data-avatar]").innerHTML =
    `<img src="${esc(avatarUrl)}" alt="${esc(t("profile.avatarAlt", { name: profile.display_name }))}">`;
}

export function setupProfileDialog() {
  dialog = q('[data-modal="profile"]');
  bindDialog(dialog, saveProfile);
}

export function openProfileDialog() {
  openDialog(dialog);
  const fields = q("form", dialog).elements;
  fields.name.value = state.archive.profile.display_name;
  fields.bio.value = state.archive.profile.bio || "";
}

async function saveProfile(fields) {
  const { profile } = state.archive;
  const previous = profile.avatar_url;
  let avatar_url = previous;

  if (fields.generatedAvatar.checked) {
    avatar_url = PIXEL_AVATAR;
  } else if (fields.avatar.files[0]) {
    const file = fields.avatar.files[0];
    avatar_url = await uploadMedia(
      `${profile.owner_id}/avatar-${Date.now()}-${safeFileName(file.name)}`,
      file,
    );
  }

  const changes = { display_name: fields.name.value.trim(), bio: fields.bio.value.trim(), avatar_url };
  await updateProfile(changes);
  Object.assign(profile, changes);

  // Si el avatar cambió, borramos el archivo viejo de Storage para no acumular basura.
  if (avatar_url !== previous) {
    deleteMedia(storagePathFromUrl(previous)).catch((error) =>
      console.warn("No se borró el avatar viejo", error),
    );
  }
  renderProfile();
  dialog.close("saved");
}
