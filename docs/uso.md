# Cómo usar el Archivo vivo

Todo lo que sigue requiere haber entrado con tu sesión desde `admin.html`. Las visitas ven el contenido,
pero no los controles.

## Inicio

- **Perfil:** "editar perfil →" cambia nombre, bio y avatar. Podés subir una imagen o marcar
  **Usar mi avatar pixel art**. Cuando cambiás el avatar, el archivo anterior se borra de Storage.
- **Ventanas:** en la barra de cada ventana aparecen ↔ (más ancha), ↕ (más alta) y ⠿ (arrastrar para
  reordenar). La disposición se guarda en tu perfil. Los botones "— □ ×" son decorativos por ahora.

## Música

**+ buscar y agregar** → elegí *canción* o *disco* y escribí título y artista. La búsqueda usa el catálogo
de iTunes: tocá un resultado y queda guardado. Si ya está en tu lista, aparece como "ya está".

El reproductor tiene ⏮ anterior, ▶ / Ⅱ y ⏭ siguiente, y recorre todas las previews de 30 segundos
(incluidas las canciones de los discos) volviendo a empezar al terminar. "Anterior" reinicia la canción si
ya pasaron 3 segundos.

Arriba de la lista aparecen los **géneros** (los informa iTunes, en castellano). Al tocar uno, la lista y la
reproducción quedan solo en ese género. La lista tiene alto fijo y se desliza por dentro. Apple solo permite previews promocionales; cada una muestra el enlace
"Contenido cortesía de iTunes".

## Fondo animado del inicio (Hydra)

Detrás de "Mi pequeño universo" corre un visual de [Hydra](https://hydra.ojack.xyz). El código está en
`assets/hydra/fondo-inicio.js`: para cambiarlo, pegá ahí cualquier código del editor de Hydra.

- `a.fft` no usa el micrófono: sigue a la música que suena en "escuchando". Si no suena nada, se mueve solo
  con una onda suave, así nunca queda en negro.
- Se dibuja a la mitad de resolución y se pausa cuando no está en pantalla, para no gastar batería.
- Quien tenga activado "reducir movimiento" en su compu ve el fondo liso.
- No uses `s0.initCam()` ni otras fuentes de cámara: le pedirían permiso a cada visitante.

## Libros

**+ buscar libro** consulta Open Library por título (y autor, opcional). Antes de elegir el resultado
podés poner estado de lectura, puntuación y comentario. Con ✎ se editan después. El inicio muestra los 3
más recientes.

## YouTube

Pegá un enlace público de video o playlist y se ve el reproductor en la tarjeta. Si agregás un canal
(`youtube.com/@…`), editalo y poné un video destacado para que se vea ahí mismo: para listar los videos
de un canal automáticamente haría falta la API de YouTube, que requiere una clave.

## Notas

"+ escribir" (en el inicio) o "+ escribir nota" (en notas.html). Cada nota tiene ✎ para editar y × para
borrar, tanto en el inicio como en la página de notas. Se ordenan de la más nueva a la más vieja.

## Laboratorio (p5.js y Hydra)

"+ nuevo proyecto" pide título, descripción y **lenguaje** (p5.js o Hydra). En el campo de código podés:

- pegar tu código (las marcas ``` que aparecen al copiar desde un chat se sacan solas),
- en Hydra, pegar directamente el **link del editor** (`hydra.ojack.xyz/?code=…`): se lee el código del link,
- o dejarlo vacío para arrancar con un ejemplo.

Los proyectos de Hydra tienen el botón **abrir en el editor de Hydra ↗** para seguir trabajándolos ahí.
En el laboratorio, su `a.fft` se mueve solo; si lo elegís con **mostrar en inicio**, sigue la música de
"escuchando", igual que el fondo.

> Antes del primer proyecto de Hydra hay que correr una vez
> `supabase/migrations/2026-09-29-project-engine.sql` en Supabase → SQL Editor (agrega la columna `engine`).

En cada tarjeta:

- ✎ al lado del título o la descripción para editarlos.
- **Editar código:** el sketch se vuelve a correr cuando dejás de escribir y se guarda solo al rato.
  Si el código tiene un error, aparece debajo del canvas con el número de línea.
- **mostrar en inicio** elige qué proyecto se ve en la portada.
- Los sketches que no están en pantalla se pausan solos, para no gastar batería.

Si tu sketch no llama a `createCanvas(ancho, alto)`, p5 usa un canvas de 100 × 100.

## Galería

1. **+ crear álbum** y ponele nombre. Entrá al álbum y tocá **+ subir fotografías**.
2. Las fotos sin álbum quedan en **Sin álbum**. **✎ Editar** permite cambiar nombre, álbum y marcarla
   como portada.
3. Arrastrá las fotos o usá las flechas para ordenarlas. **Todas las fotos** ordena la colección entera.
4. Tocá una foto para verla grande; ← → (o las flechas del teclado) para recorrer, Escape para cerrar.
5. Eliminar un álbum conserva sus fotos en "Sin álbum". Eliminar una foto borra también su archivo.

### Cómo se guarda

Los álbumes son registros de `items` con `type: photo` y `metadata.entity: album`. Cada foto guarda
`metadata.album_id`, `metadata.sort_order` y `metadata.storagePath`; la portada del álbum va en
`metadata.cover_id`. Los archivos están en el bucket público `archive-media`, pero solo tu cuenta puede
subir, cambiar o borrar.

## Avatar pixel art

Ilustración estática generada a partir de dos fotos de referencia (las fotos no se copiaron al sitio).
La web usa `assets/images/cata-avatar-pixel.webp` (480 px, ~50 KB). La versión en alta resolución está en
`docs/avatar-original.png`.

Prompt usado:

> Use case: stylized-concept. Create a pixel-art profile avatar of Cata based on the two reference photos
> (same woman). Preserve recognizable facial features, warm medium skin, dark brown eyes, long slightly wavy
> dark brown hair. Bust portrait including her hands holding her vintage silver-and-black film camera from
> reference 1. Dark casual jacket, subtle burgundy accents. Crisp deliberate pixel clusters, dark ink
> outlines, limited 16-bit palette, charming retro desktop-game character portrait, not photorealistic and no
> smooth vector edges. Square composition with generous margin around hair and shoulders, warm pale gray
> background with a few sparse burgundy pixel sparkles. Palette burgundy, muted rose, near-black, warm skin
> and off-white. No text, no logos, no watermark. Intended as a personal blog avatar. References are identity
> and camera references, do not reproduce either photograph's background.
