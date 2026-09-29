// 03 / Mesa de luz: libros (inicio).

import { esc, node, q, qa } from "../core/dom.js";
import { findItem, itemsOf, state } from "../core/state.js";
import { confirmAndDelete } from "./delete.js";
import { openItemDialog } from "./catalog.js";

export const READING_STATES = ["por leer", "leyendo", "leído"];
const BOOKS_ON_HOME = 3;

export function renderBooks() {
  const list = q("[data-book-list]");
  if (!list) return;
  list.replaceChildren(...itemsOf("book").slice(0, BOOKS_ON_HOME).map(bookCard));
  qa("[data-edit-book]", list).forEach((button) => {
    button.onclick = () => openItemDialog("book", findItem(button.dataset.editBook));
  });
  qa("[data-delete-book]", list).forEach((button) => {
    button.onclick = () => confirmAndDelete(button.dataset.deleteBook, "libros", renderBooks);
  });
}

function stars(rating) {
  return [1, 2, 3, 4, 5]
    .map((value) => {
      const kind = rating >= value ? "star-full" : rating >= value - 0.5 ? "star-half" : "star-empty";
      return `<span class="${kind}">★</span>`;
    })
    .join("");
}

function bookCard(book) {
  const rating = Number(book.metadata?.rating) || 0;
  const status = READING_STATES.includes(book.kind) ? book.kind : "";
  const cover = book.metadata?.coverUrl
    ? `<img class="book-cover" src="${esc(book.metadata.coverUrl)}" alt="Portada de ${esc(book.title)}" loading="lazy">`
    : "";
  const actions = state.isOwner
    ? `<span class="card-actions">
         <button class="icon-button" data-edit-book="${esc(book.id)}" aria-label="Editar ${esc(book.title)}">✎</button>
         <button class="icon-button delete-button" data-delete-book="${esc(book.id)}" aria-label="Eliminar ${esc(book.title)}">×</button>
       </span>`
    : "";
  return node(`
    <article class="book-card">
      ${cover}
      <div>
        ${status ? `<small>${esc(status)}</small>` : ""}
        <b>${esc(book.title)}</b>
        <small>${esc(book.metadata?.author || "")}</small>
      </div>
      ${rating ? `<p class="book-rating" aria-label="${rating} de 5 estrellas">${stars(rating)}</p>` : ""}
      ${book.detail ? `<p class="book-comment">${esc(book.detail)}</p>` : ""}
      ${actions}
    </article>`);
}
