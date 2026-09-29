// Atajos para trabajar con el HTML de la página.

/** Primer elemento que coincide con el selector. */
export const q = (selector, root = document) => root.querySelector(selector);

/** Todos los elementos que coinciden, como array. */
export const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Escapa texto antes de meterlo en HTML, para que nadie pueda inyectar código. */
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );

/** Convierte un string de HTML en un elemento. */
export const node = (html) => {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
};
