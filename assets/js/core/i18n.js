// Traducciones de la interfaz (español / inglés).
// Cada texto tiene sus dos versiones una al lado de la otra: [español, inglés].
// Lo que escribe la dueña (notas, descripciones, títulos) no se traduce: queda como lo escribió.
//
// En el HTML se marcan los textos con:
//   data-i18n="clave"               → reemplaza el texto del elemento
//   data-i18n-aria-label="clave"    → reemplaza ese atributo (también placeholder y title)
// En el JavaScript se usa t("clave") o t("clave", { nombre: valor }) para textos con {huecos}.

const STRINGS = {
  // --- Comunes ---------------------------------------------------------------
  "nav.home": ["inicio", "home"],
  "nav.lab": ["laboratorio", "lab"],
  "nav.notes": ["notas", "notes"],
  "nav.gallery": ["galería", "gallery"],
  "nav.quiet": ["zona tranquila", "quiet place"],
  "nav.aria": ["Navegación principal", "Main navigation"],
  "header.edit": ["editar mi archivo", "edit my archive"],
  "lang.aria": ["Idioma", "Language"],
  "common.close": ["Cerrar", "Close"],
  "common.cancel": ["cancelar", "cancel"],
  "common.save": ["guardar", "save"],
  "common.saveChanges": ["guardar cambios", "save changes"],
  "common.saving": ["guardando…", "saving…"],
  "common.loading": ["cargando…", "loading…"],
  "common.title": ["Título", "Title"],
  "common.description": ["Descripción", "Description"],
  "common.edit": ["Editar {title}", "Edit {title}"],
  "common.editButton": ["✎ Editar", "✎ Edit"],
  "common.delete": ["Eliminar {title}", "Delete {title}"],
  "common.deleteButton": ["× Eliminar", "× Delete"],
  "common.deleteShort": ["Eliminar", "Delete"],
  "common.confirmDelete": ["¿Eliminar “{title}” de {section}?", "Delete “{title}” from {section}?"],
  "common.saveFailed": ["No se pudo guardar: {message}", "Couldn't save: {message}"],
  "common.deleteFailed": ["No se pudo eliminar: {message}", "Couldn't delete: {message}"],
  "common.addFailed": ["No se pudo agregar: {message}", "Couldn't add: {message}"],
  "footer.offline": ["sin conexión", "offline"],
  "footer.loadFailed": ["No se pudieron cargar los datos: {message}", "Couldn't load the data: {message}"],
  "session.editMode": ["modo edición", "edit mode"],
  "session.signOut": ["cerrar sesión", "sign out"],
  "db.noPermission": [
    "No se guardó: la sesión venció o no tenés permiso. Volvé a entrar desde admin.html.",
    "Not saved: your session expired or you don't have permission. Sign in again from admin.html.",
  ],
  "db.notConfigured": [
    "Supabase no está configurado (revisá assets/js/config.js).",
    "Supabase isn't configured (check assets/js/config.js).",
  ],
  "db.noSession": ["No hay una sesión activa", "There's no active session"],
  "db.otherOwner": [
    "Este perfil ya pertenece a otra cuenta",
    "This profile already belongs to another account",
  ],

  // --- Inicio ------------------------------------------------------------------
  // En la cinta, " " es un espacio que no se achica (como &nbsp; en el HTML).
  ticker: [
    "un lugar para guardar lo que me mueve  /  música, imágenes, palabras y experimentos  /  un lugar para guardar lo que me mueve  /  música, imágenes, palabras y experimentos  / ",
    "a place to keep what moves me  /  music, images, words and experiments  /  a place to keep what moves me  /  music, images, words and experiments  / ",
  ],
  "hero.eyebrow": ["diario personal · buenos aires", "personal diary · buenos aires"],
  "hero.title1": ["Mi pequeño", "My little"],
  "hero.title2": ["universo.", "universe."],
  "hero.text": [
    "Un archivo de cosas que escucho, leo, miro, hago y todavía quiero hacer.",
    "An archive of things I listen to, read, watch, make and still want to make.",
  ],
  "hero.cta": ["explorar archivo ↓", "explore the archive ↓"],
  "hero.visualTitle": ["Visual de fondo hecho con Hydra", "Background visual made with Hydra"],
  "profile.eyebrow": ["perfil activo", "active profile"],
  "profile.edit": ["editar perfil →", "edit profile →"],
  "profile.dialogTitle": ["editar perfil", "edit profile"],
  "profile.name": ["Nombre", "Name"],
  "profile.bio": ["Bio", "Bio"],
  "profile.avatar": ["Avatar", "Avatar"],
  "profile.usePixel": ["Usar mi avatar pixel art", "Use my pixel art avatar"],
  "profile.pixelAlt": ["Tu avatar pixel art con cámara", "Your pixel art avatar with a camera"],
  "profile.avatarAlt": ["Avatar de {name}", "{name}'s avatar"],
  "layout.saveFailed": [
    "No se pudo guardar la disposición: {message}",
    "Couldn't save the layout: {message}",
  ],
  "layout.wide": ["Aumentar o reducir ancho", "Make wider or narrower"],
  "layout.wideAria": ["Cambiar ancho de sección", "Change section width"],
  "layout.tall": ["Aumentar o reducir alto", "Make taller or shorter"],
  "layout.tallAria": ["Cambiar alto de sección", "Change section height"],
  "layout.grip": ["Arrastrar para reordenar", "Drag to reorder"],
  "layout.gripAria": ["Arrastrar para reordenar sección", "Drag to reorder section"],

  // --- Música ------------------------------------------------------------------
  "music.bar": ["01 / escuchando", "01 / listening"],
  "music.title": ["En repeat", "On repeat"],
  "music.add": ["+ buscar y agregar", "+ search and add"],
  "music.loading": ["Cargando música…", "Loading music…"],
  "music.empty": ["Todavía no agregaste música", "No music added yet"],
  "music.emptyHint": ["Buscá una canción o un disco.", "Search for a song or an album."],
  "music.play": ["▶ reproducir", "▶ play"],
  "music.pause": ["Ⅱ pausa", "Ⅱ pause"],
  "music.playAria": ["Reproducir", "Play"],
  "music.pauseAria": ["Pausar", "Pause"],
  "music.playItem": ["Reproducir {title}", "Play {title}"],
  "music.prev": ["Canción anterior", "Previous song"],
  "music.next": ["Canción siguiente", "Next song"],
  "music.volume": ["Volumen de la música", "Music volume"],
  "music.filter": ["Filtrar por género", "Filter by genre"],
  "music.credit": ["Contenido cortesía de iTunes", "Content courtesy of iTunes"],
  "music.all": ["todo", "all"],
  "music.otherGenre": ["otros", "other"],
  "music.emptyGenre": ["Todavía no hay canciones acá.", "No songs here yet."],
  "music.noPreview": [
    "Apple no ofrece una preview para esta canción/disco en este catálogo.",
    "Apple doesn't offer a preview for this song/album in this catalog.",
  ],
  "music.confirmDelete": ["¿Eliminar “{title}” de la lista?", "Remove “{title}” from the list?"],

  // --- Diálogo "sumar" (música, libros, canales) ------------------------------------
  "item.title": ["sumar al archivo", "add to the archive"],
  "item.searchMusic": ["Buscar música", "Search music"],
  "item.searchBook": ["Buscar libro", "Search book"],
  "item.addChannel": ["Agregar canal o video", "Add channel or video"],
  "item.editBook": ["Editar libro", "Edit book"],
  "item.editChannel": ["Editar canal o video", "Edit channel or video"],
  "item.song": ["Canción o disco", "Song or album"],
  "item.bookTitle": ["Título del libro", "Book title"],
  "item.channelName": ["Nombre del canal o video", "Channel or video name"],
  "item.songPlaceholder": ["Escribí canción o disco…", "Type a song or album…"],
  "item.bookPlaceholder": ["Escribí título…", "Type a title…"],
  "item.artist": ["Artista o autor", "Artist or author"],
  "item.artistPlaceholder": ["Artista", "Artist"],
  "item.authorPlaceholder": ["Autor/a", "Author"],
  "item.searchAs": ["Buscar como", "Search as"],
  "item.track": ["canción", "song"],
  "item.album": ["disco", "album"],
  "item.comment": ["Comentario opcional", "Optional comment"],
  "item.readingState": ["Estado de lectura", "Reading status"],
  "item.link": ["Enlace del canal, video o playlist", "Channel, video or playlist link"],
  "item.featured": ["Video o playlist destacado (opcional)", "Featured video or playlist (optional)"],
  "item.rating": ["Mi puntuación", "My rating"],
  "item.noRating": ["sin puntuación", "no rating"],
  "item.ratingAria": ["Puntuación de cero a cinco estrellas", "Rating from zero to five stars"],
  "item.submit": ["sumar", "add"],
  "item.searching": ["Buscando…", "Searching…"],
  "item.searchFailed": [
    "No pude buscar ahora. Revisá la conexión e intentá de nuevo.",
    "I couldn't search right now. Check your connection and try again.",
  ],
  "item.noResults": [
    "No encontré coincidencias. Probá con otro título o agregá también artista/autor.",
    "No matches found. Try another title or add the artist/author too.",
  ],
  "item.add": ["agregar", "add"],
  "item.alreadySaved": ["ya está", "already added"],
  "item.unknownAuthor": ["Autor desconocido", "Unknown author"],
  "item.albumFallback": ["Álbum", "Album"],
  "item.itunesDown": ["iTunes no respondió", "iTunes didn't respond"],
  "item.openLibraryDown": ["Open Library no respondió", "Open Library didn't respond"],
  "item.albumTracksFailed": ["No pude cargar las canciones del disco", "I couldn't load the album's songs"],
  "item.youtubeOnly": ["Pegá un enlace de YouTube.", "Paste a YouTube link."],
  "item.youtubeFeatured": [
    "El destacado tiene que ser un video o una playlist pública de YouTube.",
    "The featured link must be a public YouTube video or playlist.",
  ],
  "reading.por leer": ["por leer", "to read"],
  "reading.leyendo": ["leyendo", "reading"],
  "reading.leído": ["leído", "read"],

  // --- Libros y YouTube -------------------------------------------------------------
  "books.bar": ["03 / mesa de luz", "03 / bedside table"],
  "books.title": ["Libros", "Books"],
  "books.add": ["+ buscar libro", "+ search book"],
  "books.section": ["libros", "books"],
  "books.cover": ["Portada de {title}", "Cover of {title}"],
  "books.stars": ["{rating} de 5 estrellas", "{rating} out of 5 stars"],
  "channels.bar": ["04 / canales y videos", "04 / channels & videos"],
  "channels.title": ["En YouTube", "On YouTube"],
  "channels.add": ["+ sumar", "+ add"],
  "channels.section": ["canales y videos", "channels & videos"],
  "channels.openYoutube": ["abrir en YouTube ↗", "open on YouTube ↗"],
  "channels.preview": ["Abrir previsualización", "Open preview"],
  "channels.hint": [
    "Los videos y playlists se previsualizan acá. Para un canal con URL @..., agregá un video destacado desde editar.",
    "Videos and playlists preview here. For a channel with an @... URL, add a featured video from edit.",
  ],
  "channels.frameTitle": ["{title} en YouTube", "{title} on YouTube"],

  // --- Notas ----------------------------------------------------------------------------
  "notes.bar": ["05 / cuaderno abierto", "05 / open notebook"],
  "notes.homeTitle": ["Notas & artículos", "Notes & articles"],
  "notes.writeShort": ["+ escribir", "+ write"],
  "notes.readAll": ["leer todo →", "read all →"],
  "notes.write": ["+ escribir nota", "+ write a note"],
  "notes.eyebrow": ["cuaderno abierto", "open notebook"],
  "notes.title1": ["Notas", "Notes"],
  "notes.title2": ["& artículos", "& articles"],
  "notes.intro": [
    "Ideas, diarios y textos para dejar a la vista.",
    "Ideas, diaries and writings left out in the open.",
  ],
  "notes.empty": ["Todavía no hay notas.", "No notes yet."],
  "notes.section": ["tus notas", "your notes"],
  "notes.dialogNew": ["escribir una nota", "write a note"],
  "notes.dialogEdit": ["editar nota", "edit note"],
  "notes.text": ["Texto", "Text"],
  "notes.format": ["Formato", "Format"],
  "notes.kind.nota": ["nota", "note"],
  "notes.kind.artículo": ["artículo", "article"],
  "notes.publish": ["publicar", "publish"],

  // --- Fotos (inicio y galería) --------------------------------------------------------------
  "photos.bar": ["06 / cosas que vi", "06 / things I saw"],
  "photos.title": ["Fotografías", "Photographs"],
  "photos.open": ["abrir galería →", "open gallery →"],
  "gallery.upload": ["+ subir fotografías", "+ upload photos"],
  "gallery.eyebrow": ["06 / registro visual", "06 / visual record"],
  "gallery.title1": ["Cosas", "Things"],
  "gallery.title2": ["que vi.", "I saw."],
  "gallery.intro": [
    "Pequeñas colecciones de lugares, momentos y cosas que me hicieron mirar.",
    "Small collections of places, moments and things that made me look.",
  ],
  "gallery.albums": ["Álbumes", "Albums"],
  "gallery.all": ["Todas las fotos", "All photos"],
  "gallery.allHeading": ["Todas las fotografías", "All photographs"],
  "gallery.newAlbum": ["+ crear álbum", "+ create album"],
  "gallery.back": ["← volver a álbumes", "← back to albums"],
  "gallery.myAlbums": ["Mis álbumes", "My albums"],
  "gallery.loose": ["Sin álbum", "No album"],
  "gallery.rename": ["Renombrar álbum", "Rename album"],
  "gallery.deleteAlbum": ["Eliminar álbum", "Delete album"],
  "gallery.help": [
    "Entrá a un álbum para subir fotos allí. Usá “Editar” para nombrarlas, moverlas o elegir la portada. Arrastrá las fotos o usá las flechas para ordenarlas.",
    "Open an album to upload photos into it. Use “Edit” to name them, move them or choose the cover. Drag the photos or use the arrows to reorder them.",
  ],
  "gallery.photoCount": ["{count} fotografías", "{count} photos"],
  "gallery.emptyAlbum": ["Este álbum todavía no tiene fotos.", "This album has no photos yet."],
  "gallery.viewPhoto": ["Ver {title} completa", "View {title} full size"],
  "gallery.moveBefore": ["Mover {title} antes", "Move {title} earlier"],
  "gallery.moveAfter": ["Mover {title} después", "Move {title} later"],
  "gallery.editPhoto": ["Editar fotografía", "Edit photo"],
  "gallery.photoName": ["Nombre de la foto", "Photo name"],
  "gallery.album": ["Álbum", "Album"],
  "gallery.useCover": ["Usar como portada del álbum elegido", "Use as cover of the chosen album"],
  "gallery.newAlbumTitle": ["Nuevo álbum", "New album"],
  "gallery.albumName": ["Nombre del álbum", "Album name"],
  "gallery.albumPlaceholder": ["Por ejemplo: tardes de verano", "For example: summer afternoons"],
  "gallery.saveAlbum": ["guardar álbum", "save album"],
  "gallery.closeViewer": ["× Cerrar", "× Close"],
  "gallery.closePhoto": ["Cerrar fotografía", "Close photo"],
  "gallery.prev": ["← anterior", "← previous"],
  "gallery.next": ["siguiente →", "next →"],
  "gallery.prevPhoto": ["Foto anterior", "Previous photo"],
  "gallery.nextPhoto": ["Foto siguiente", "Next photo"],
  "gallery.viewAria": ["Vista de galería", "Gallery view"],
  "gallery.collectionAria": ["Colección de fotografías", "Photo collection"],
  "gallery.photoSaved": ["Foto guardada.", "Photo saved."],
  "gallery.albumSaved": ["Álbum guardado.", "Album saved."],
  "gallery.confirmDeleteAlbum": [
    "¿Eliminar el álbum “{title}”? Sus fotos se conservarán en “Sin álbum”.",
    "Delete the album “{title}”? Its photos will be kept in “No album”.",
  ],
  "gallery.albumDeleted": [
    "Álbum eliminado. Las fotos se conservaron.",
    "Album deleted. The photos were kept.",
  ],
  "gallery.couldNotFinish": ["No se pudo completar", "Couldn't finish"],
  "gallery.savingOrder": ["Guardando orden…", "Saving order…"],
  "gallery.orderSaved": ["Orden guardado.", "Order saved."],
  "gallery.orderFailed": ["No se pudo guardar todo el orden", "Couldn't save the whole order"],
  "gallery.confirmDeletePhoto": ["¿Eliminar “{title}” de la galería?", "Delete “{title}” from the gallery?"],
  "gallery.photoDeleted": ["Foto eliminada.", "Photo deleted."],
  "gallery.storageLeft": [
    "Foto eliminada de la galería. Quedó pendiente limpiar el archivo en Storage.",
    "Photo removed from the gallery. The file still needs to be cleaned up in Storage.",
  ],
  "gallery.deleteFailed": ["No se pudo eliminar", "Couldn't delete"],
  "gallery.uploading": ["Subiendo {current} de {total}…", "Uploading {current} of {total}…"],
  "gallery.uploaded": [
    "{count} foto(s) cargada(s). Usá “Editar” para cambiar sus nombres.",
    "{count} photo(s) uploaded. Use “Edit” to rename them.",
  ],
  "gallery.uploadPartial": [
    "{count} foto(s) cargada(s). No se pudo completar la subida: {message}",
    "{count} photo(s) uploaded. The upload couldn't finish: {message}",
  ],
  "gallery.uploadFailed": ["No se pudo subir", "Couldn't upload"],

  // --- Laboratorio ---------------------------------------------------------------------------
  "lab.bar": ["02 / laboratorio creativo", "02 / creative lab"],
  "lab.homeTitle": ["Código vivo", "Live code"],
  "lab.seeAll": ["ver todos →", "see all →"],
  "lab.eyebrowHome": ["laboratorio abierto", "open lab"],
  "lab.defaultTitle": ["Proyectos interactivos", "Interactive projects"],
  "lab.defaultDescription": [
    "Experimentos hechos con código creativo.",
    "Experiments made with creative code.",
  ],
  "lab.featuredAria": ["Proyecto destacado", "Featured project"],
  "lab.noProject": ["Todavía no hay proyecto", "No project yet"],
  "lab.noProjectHint": ["Creá uno en el laboratorio creativo.", "Create one in the creative lab."],
  "lab.new": ["+ nuevo proyecto", "+ new project"],
  "lab.eyebrow": ["código creativo abierto", "open creative code"],
  "lab.title1": ["Laboratorio", "Lab"],
  "lab.title2": ["código vivo", "live code"],
  "lab.intro": [
    "Mis experimentos en p5.js y Hydra, juntos y corriendo en vivo.",
    "My experiments in p5.js and Hydra, together and running live.",
  ],
  "lab.empty": [
    "Todavía no hay proyectos. Tocá “nuevo proyecto” para empezar.",
    "No projects yet. Tap “new project” to start.",
  ],
  "lab.public": ["{engine} · público", "{engine} · public"],
  "lab.noDescription": ["Sin descripción todavía.", "No description yet."],
  "lab.untitled": ["Proyecto sin título", "Untitled project"],
  "lab.editTitle": ["Editar título", "Edit title"],
  "lab.titleAria": ["Título del proyecto", "Project title"],
  "lab.editDescription": ["Editar descripción", "Edit description"],
  "lab.descriptionAria": ["Descripción del proyecto", "Project description"],
  "lab.canvasTitle": ["Canvas de {title}", "Canvas of {title}"],
  "lab.preparing": ["Preparando canvas…", "Preparing canvas…"],
  "lab.canvasSize": [
    "Canvas: {width} × {height}px · completo y a escala.",
    "Canvas: {width} × {height}px · full and to scale.",
  ],
  "lab.hydraNote": [
    "Hydra en vivo · acá a.fft se mueve solo; en el inicio sigue la música.",
    "Live Hydra · here a.fft moves on its own; on the home page it follows the music.",
  ],
  "lab.codeError": ["Error en el código: {message}", "Code error: {message}"],
  "lab.openHydra": ["abrir en el editor de Hydra ↗", "open in the Hydra editor ↗"],
  "lab.editCode": ["Editar código", "Edit code"],
  "lab.viewCode": ["Ver código", "View code"],
  "lab.codeAria": ["Código de {title}", "Code of {title}"],
  "lab.saved": ["guardado", "saved"],
  "lab.unsaved": ["cambios sin guardar", "unsaved changes"],
  "lab.saveFailed": ["no se pudo guardar", "couldn't save"],
  "lab.onHome": ["✓ en el inicio", "✓ on home"],
  "lab.showOnHome": ["mostrar en inicio", "show on home"],
  "lab.refresh": ["actualizar vista ↻", "refresh view ↻"],
  "lab.delete": ["eliminar", "delete"],
  "lab.confirmDelete": ["¿Eliminar el proyecto “{title}”?", "Delete the project “{title}”?"],
  "lab.dialogTitle": ["nuevo proyecto", "new project"],
  "lab.language": ["Lenguaje", "Language"],
  "lab.code": ["Código (opcional)", "Code (optional)"],
  "lab.create": ["crear", "create"],
  "lab.hydraHint": [
    "Pegá tu código de Hydra o el link del editor (hydra.ojack.xyz/?code=…). Si lo dejás vacío, arranca con un ejemplo.",
    "Paste your Hydra code or the editor link (hydra.ojack.xyz/?code=…). Leave it empty to start with an example.",
  ],
  "lab.p5Hint": [
    "Pegá tu sketch de p5.js. Si lo dejás vacío, arranca con un ejemplo.",
    "Paste your p5.js sketch. Leave it empty to start with an example.",
  ],
  "lab.needsMigration": [
    "falta actualizar la base de datos. Corré {file} en Supabase → SQL Editor.",
    "the database needs an update. Run {file} in Supabase → SQL Editor.",
  ],

  // --- Zona tranquila -------------------------------------------------------------------------
  "quiet.eyebrow": ["07 / un rato de calma", "07 / a calm moment"],
  "quiet.title1": ["Zona", "Quiet"],
  "quiet.title2": ["tranquila.", "place."],
  "quiet.intro": [
    "Un parquecito de Palermo para frenar un momento. El cielo sigue la hora de Buenos Aires.",
    "A little park in Palermo to slow down for a moment. The sky follows Buenos Aires time.",
  ],
  "quiet.bar": ["bosques de palermo · buenos aires", "palermo woods · buenos aires"],
  "quiet.canvasAria": [
    "Parque de Palermo en pixel art: un lago con patos, el Planetario, jacarandás y un perrito que pasea por el camino.",
    "Palermo park in pixel art: a lake with ducks, the Planetarium, jacaranda trees and a little dog walking along the path.",
  ],
  "quiet.hint": [
    "Tocá el pasto para tirarle la pelota al perrito.",
    "Tap the grass to throw the ball to the dog.",
  ],
  "quiet.phaseAria": ["Momento del día", "Time of day"],
  "quiet.now": ["ahora", "now"],
  "quiet.day": ["día", "day"],
  "quiet.golden": ["atardecer", "sunset"],
  "quiet.night": ["noche", "night"],

  // --- Acceso privado --------------------------------------------------------------------------
  "admin.title": ["Editar mi archivo", "Edit my archive"],
  "admin.back": ["volver al sitio", "back to the site"],
  "admin.eyebrow": ["acceso privado", "private access"],
  "admin.title1": ["Editar", "Edit"],
  "admin.title2": ["mi archivo.", "my archive."],
  "admin.intro": [
    "Esta pantalla no forma parte del perfil público. Escribí tu email y recibirás un enlace de acceso de un solo uso.",
    "This screen isn't part of the public profile. Enter your email and you'll get a one-time access link.",
  ],
  "admin.bar": ["cata / administración", "cata / admin"],
  "admin.email": ["Tu email", "Your email"],
  "admin.emailPlaceholder": ["tu@email.com", "you@email.com"],
  "admin.configure": [
    "Configurá Supabase primero para activar el acceso.",
    "Set up Supabase first to enable access.",
  ],
  "admin.enterEmail": [
    "Ingresá el email que usarás siempre para administrar este perfil.",
    "Enter the email you'll always use to manage this profile.",
  ],
  "admin.send": ["enviarme enlace de acceso", "send me an access link"],
  "admin.sent": [
    "Listo: revisá tu email y abrí el enlace de acceso.",
    "Done: check your email and open the access link.",
  ],
  "admin.active": [
    "Sesión activa. Podés volver al sitio: allí aparecerán los controles de edición.",
    "Session active. Go back to the site: the editing controls will appear there.",
  ],
  "admin.open": ["abrir edición", "open editing"],

  // --- Títulos de pestaña ------------------------------------------------------------------------
  "title.lab": ["Laboratorio — Archivo vivo", "Lab — Archivo vivo"],
  "title.notes": ["Notas — Archivo vivo", "Notes — Archivo vivo"],
  "title.gallery": ["Cosas que vi — Archivo vivo", "Things I saw — Archivo vivo"],
  "title.quiet": ["Zona tranquila — Archivo vivo", "Quiet place — Archivo vivo"],

  // --- Géneros de iTunes (llegan en castellano) -------------------------------------------------------
  "genre.Alternativa": ["Alternativa", "Alternative"],
  "genre.Electrónica": ["Electrónica", "Electronic"],
  "genre.Música urbana": ["Música urbana", "Urban"],
  "genre.Cantautores": ["Cantautores", "Singer/Songwriter"],
  "genre.Clásica": ["Clásica", "Classical"],
  "genre.Bandas sonoras": ["Bandas sonoras", "Soundtrack"],
  "genre.Latina": ["Latina", "Latin"],
  "genre.Música latina": ["Música latina", "Latin"],
  "genre.Rock y Alternativo": ["Rock y Alternativo", "Rock & Alternative"],
};

const STORAGE_KEY = "archivo-vivo-idioma";
const LANGS = ["es", "en"];

function readSavedLanguage() {
  // Un link con ?lang=en abre la web directamente en inglés.
  const fromLink = new URLSearchParams(location.search).get("lang");
  if (fromLink) return fromLink;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Idioma actual: el que eligió la persona, o el de su navegador (español si habla español). */
export const lang = LANGS.includes(readSavedLanguage())
  ? readSavedLanguage()
  : navigator.language?.toLowerCase().startsWith("es")
    ? "es"
    : "en";

/** Para fechas: 20/9/2026 en español, 9/20/2026 en inglés. */
export const dateLocale = lang === "es" ? "es-AR" : "en-US";

/** Texto traducido. Los {huecos} se completan con vars. Si falta una clave, devuelve la clave. */
export function t(key, vars) {
  const entry = STRINGS[key];
  const text = entry ? entry[lang === "en" ? 1 : 0] : key;
  return vars ? text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "") : text;
}

/** Nombre de un género de iTunes en el idioma actual (si no está en la lista, queda como vino). */
export const genreName = (genre) => (STRINGS[`genre.${genre}`] ? t(`genre.${genre}`) : genre);

const TRANSLATED_ATTRIBUTES = ["aria-label", "placeholder", "title", "alt"];

/** Traduce todo lo marcado con data-i18n en la página. En español no hace falta: el HTML ya viene así. */
export function translatePage(root = document) {
  document.documentElement.lang = lang;
  if (lang === "es") return;
  root.querySelectorAll("[data-i18n]").forEach((element) => (element.textContent = t(element.dataset.i18n)));
  TRANSLATED_ATTRIBUTES.forEach((attribute) =>
    root
      .querySelectorAll(`[data-i18n-${attribute}]`)
      .forEach((element) =>
        element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`))),
      ),
  );
}

/** Agrega el selector ES / EN arriba a la derecha. Al cambiar, se guarda y se recarga la página. */
export function mountLanguageSwitch() {
  const header = document.querySelector(".site-header");
  if (!header || header.querySelector(".lang-switch")) return;
  const tools = document.createElement("div");
  tools.className = "header-tools";
  const switcher = document.createElement("div");
  switcher.className = "lang-switch";
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", t("lang.aria"));
  LANGS.forEach((code) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = code.toUpperCase();
    button.lang = code;
    button.setAttribute("aria-pressed", String(code === lang));
    button.addEventListener("click", () => {
      if (code === lang) return;
      const url = new URL(location.href);
      url.searchParams.delete("lang");
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // Si el navegador no deja guardar, el idioma viaja en el link.
        url.searchParams.set("lang", code);
      }
      location.href = url.href;
    });
    switcher.append(button);
  });
  const right = header.lastElementChild;
  right.before(tools);
  tools.append(switcher, right);
}
