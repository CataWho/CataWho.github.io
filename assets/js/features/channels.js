// 04 / Canales y videos de YouTube (inicio).

import { esc, node, q, qa } from "../core/dom.js";
import { findItem, itemsOf } from "../core/state.js";
import { confirmAndDelete } from "./delete.js";
import { openItemDialog } from "./catalog.js";
import { isYoutubeUrl, youtubeEmbedUrl } from "./youtube.js";

export function renderChannels() {
  const list = q("[data-channel-list]");
  if (!list) return;
  list.replaceChildren(...itemsOf("channel").map(channelCard));
  qa("[data-edit-channel]", list).forEach((button) => {
    button.onclick = () => openItemDialog("channel", findItem(button.dataset.editChannel));
  });
  qa("[data-delete-channel]", list).forEach((button) => {
    button.onclick = () => confirmAndDelete(button.dataset.deleteChannel, "canales y videos", renderChannels);
  });
}

function channelCard(item, index) {
  const embed = youtubeEmbedUrl(item.metadata?.preview_url || item.external_url || "");
  const player = embed
    ? `<div class="youtube-frame"><iframe src="${esc(embed)}" title="${esc(item.title)} en YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`
    : `<p class="channel-hint">Los videos y playlists se previsualizan acá. Para un canal con URL @..., agregá un video destacado desde editar.</p>`;
  const external = isYoutubeUrl(item.external_url)
    ? `<a href="${esc(item.external_url)}" target="_blank" rel="noreferrer">abrir en YouTube ↗</a>`
    : "";
  return node(`
    <div class="channel-entry">
      <details class="channel-card" ${index === 0 ? "open" : ""}>
        <summary>
          <span class="play-icon">▶</span>
          <span><b>${esc(item.title)}</b><small>${esc(item.detail || "Abrir previsualización")}</small></span>
          <span class="channel-chevron">⌄</span>
        </summary>
        <div class="channel-expanded">${player}${external}</div>
      </details>
      <span class="channel-actions" data-edit-only>
        <button class="text-action" data-edit-channel="${esc(item.id)}" aria-label="Editar ${esc(item.title)}">✎ Editar</button>
        <button class="text-action delete-button" data-delete-channel="${esc(item.id)}" aria-label="Eliminar ${esc(item.title)}">× Eliminar</button>
      </span>
    </div>`);
}
