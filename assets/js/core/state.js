// Estado compartido de la página: los datos del archivo y si quien mira es la dueña.

export const state = {
  archive: { profile: { display_name: "Cata", bio: "", layout: {} }, items: [], projects: [] },
  isOwner: false,
};

/** Items de uno o más tipos ("music", "book", "note"…). Los álbumes no cuentan como fotos. */
export const itemsOf = (...types) =>
  state.archive.items.filter((item) => types.includes(item.type) && item.metadata?.entity !== "album");

export const findItem = (id) => state.archive.items.find((item) => String(item.id) === String(id));

export const addItem = (item) => state.archive.items.unshift(item);

export const removeItem = (id) => {
  state.archive.items = state.archive.items.filter((item) => String(item.id) !== String(id));
};

/** Para ordenar de lo más nuevo a lo más viejo. */
export const newestFirst = (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0);
