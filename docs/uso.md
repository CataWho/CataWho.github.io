# Cómo usar el Archivo vivo

Todo lo que sigue requiere haber entrado con tu sesión desde `admin.html`. Las visitas ven el contenido,
pero no los controles.

El navegador recuerda tu sesión aunque cierres la pestaña. Mientras está iniciada, la barra de abajo
dice **modo edición** y tiene **cerrar sesión** (también está en `admin.html`). Para ver la web como la ve
el público, abrila en una ventana de incógnito. Aunque alguien viera los botones, la base de datos rechaza
cualquier cambio que no venga de tu cuenta.

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

## Zona tranquila

`zona-tranquila.html` muestra los Bosques de Palermo en pixel art, dibujados con código
(`assets/js/features/quiet-place.js`): el lago con patos, el Planetario, jacarandás, un palo borracho y un
perrito que pasea. Tocando el pasto se le tira la pelota y va a buscarla.

El cielo sigue la hora real de Buenos Aires (día, atardecer o noche) y también se puede elegir con los
botones de abajo.

## Juegos

`juegos.html` es la sala de arcade. A la derecha están los **cartuchos** (la lista de juegos); por ahora hay
uno, **Estela · buscadora de mundos**, y dos lugares de "próximamente".

**Cómo se juega.** En la compu, con el teclado (hay que hacer clic en la pantalla del juego primero):
**A/D** caminar, **W** saltar, **S** agacharse (también sirven las flechas); **J** golpe, **K** patada,
**L** onda estelar (también agachada), **W + L** corte lunar, **Espacio** defensa (de pie o agachada),
**Enter** empieza o pausa. En el aire se puede corregir el salto, así se pasa por encima de los monstruos
grandes. La pausa muestra todos los controles. En el celular aparece una botonera
(cruceta, golpe, patada, poder, defensa y start) y el botón **pantalla completa** la pone en horizontal.
Si el juego sale de la pantalla, se cambia de pestaña o se hace clic afuera, se pausa solo.

**La historia, en orden:** título → prólogo → nivel 1 (la nave nodriza, monstruos verdes, se avanza hacia el
hangar) → escena del viaje (despegue, hiperespacio y llegada al planeta rojo de tres lunas) → nivel 2 (el
planeta Carmín: tres rondas contra monstruos rosa y violeta que revientan en líquido rosa) → segundo viaje
(nebulosa esmeralda con asteroides) → nivel 3 (el planeta Ámbar, con anillos como Saturno: la Babosa Reina
verde neón, que se arrastra, vomita baba y escupe huevos; cuando parece muerta le sale del pecho el Gusano
Voltio azul, con tentáculos con pinzas; del jefe caen corazones que devuelven vida) → "continuará".

**Dónde se cambia cada cosa** (todo en `assets/js/games/estela/`):

- `texts.js`: todos los textos de la historia, en castellano e inglés.
- `index.js`: la lista de pantallas en orden (`STORY`). Para sumar un nivel: crear su archivo en `screens/`,
  agregarlo a `SCREENS` y ponerlo en `STORY` donde corresponde.
- `screens/mothership.js`: las oleadas del nivel 1 (qué monstruos salen, de dónde y cuándo).
- `screens/red-planet.js`: las rondas del nivel 2 (`ROUNDS`).
- `screens/amber-planet.js`: el nivel 3 (la escena de "¡todavía no!" y los corazones).
- `bosses.js`: la Babosa Reina y el Gusano Voltio (sus ataques y cómo se mueven).
- `screens/voyage.js`: los viajes entre planetas (`VOYAGES`: de dónde sale, qué zona cruza, adónde llega).
- `monsters.js`: cada monstruo es una ficha (vida, ataques, cómo piensa, cómo se dibuja).
- `heroine.js`: los golpes de Estela (daño, velocidad) y su dibujo; la cabeza es un dibujo hecho con letras.
- `audio.js`: efectos de sonido y música de 8 bits (se generan en el momento, no hay archivos de audio).

Para probar una pantalla directo, sin jugar desde el principio: `juegos.html?pantalla=planet`
(también `ship`, `voyage`, `voyage2`, `amber` o `ending`).

`assets/js/games/arcade/` es el motor compartido (dibujo pixel art, teclado y botonera, sonido): los juegos
nuevos lo reutilizan. Para sumar un juego a la sala: su carpeta en `games/`, sus textos de la página en
`i18n.js` (`games.<id>.title`, `.blurb`, `.bar`) y una línea en la lista `GAMES` de `assets/js/pages/games.js`.

## Cursor y destellos

El cursor es una flecha pixel art (`assets/cursors/`): clara de base y rosa sobre lo que se puede tocar.
Al mover el mouse aparecen destellos pixelados que se apagan solos. No aparecen en pantallas táctiles ni si
la compu tiene activado "reducir movimiento".

## Idiomas (español / inglés)

Arriba a la derecha está el selector **ES / EN**. La web recuerda la elección; la primera vez usa el idioma del
navegador. Un link con `?lang=en` (por ejemplo `https://catawho.github.io/?lang=en`) abre directo en inglés.

Todas las traducciones están en `assets/js/core/i18n.js`, con el español y el inglés de cada texto uno al
lado del otro: para corregir una, se cambia ahí. Lo que escribís vos (notas, títulos, descripciones) no se
traduce.

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
- **Editar código** (las visitas ven **Ver código**, en solo lectura): el sketch se vuelve a correr cuando dejás de escribir y se guarda solo al rato.
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
