# Archivo vivo

Portfolio y diario personal de Cata: música, libros, videos, notas, fotos y experimentos con p5.js.
Es un sitio estático (HTML + CSS + JavaScript, sin herramientas de compilación) que guarda sus datos
en [Supabase](https://supabase.com) (plan gratuito).

- **Visitantes:** ven todo, sin cuenta.
- **Dueña:** entra por `admin.html` con un enlace mágico que llega por email, y ve los controles para
  agregar, editar, ordenar y borrar. La base de datos es la que lo impide para cualquier otra persona
  (reglas RLS), no solo los botones ocultos.

## Estructura

```
archivo-vivo/
├── index.html            inicio (hero + ventanas de la colección)
├── laboratorio.html      proyectos p5.js
├── notas.html            notas y artículos
├── galeria.html          álbumes y fotos
├── admin.html            acceso privado (Magic Link)
│
├── assets/
│   ├── css/
│   │   ├── base.css      colores, tipografía, header, botones, diálogos (todas las páginas)
│   │   └── home.css, lab.css, notes.css, gallery.css, admin.css   (una por página)
│   ├── images/           avatar pixel art (optimizado)
│   └── js/
│       ├── config.js     URL y clave pública de Supabase
│       ├── core/         piezas base: base de datos, estado, arranque, ayudas de HTML y diálogos
│       ├── features/     una sección por archivo (música, libros, notas, galería, laboratorio…)
│       └── pages/        el punto de entrada de cada página: arma la página con sus secciones
│
├── supabase/
│   ├── schema.sql        tablas, bucket de fotos y reglas de seguridad (proyecto nuevo)
│   └── migrations/       cambios para aplicar sobre un proyecto que ya existe
│
└── docs/
    ├── uso.md            cómo usar cada sección
    └── avatar-original.png   avatar en alta resolución (no lo usa la web)
```

**Cómo se conecta todo:** cada HTML carga `base.css`, su propio CSS y un solo script de `assets/js/pages/`.
Ese script importa lo que necesita de `features/` y `core/`. Ejemplo: `pages/notes.js` usa
`features/notes.js`, que usa `core/db.js` para hablar con Supabase.

## Verlo en tu compu

Los módulos de JavaScript necesitan un servidor local (abrir el HTML con doble clic no alcanza).
Desde esta carpeta:

```bash
npx http-server . -p 8000 -c-1
```

y abrí <http://localhost:8000>. También sirve la extensión **Live Server** de VS Code (puerto 5500).

## Crear Supabase desde cero

1. Entrá a [database.new](https://database.new), creá un proyecto (por ejemplo `archivo-vivo`) y guardá la
   contraseña de la base **fuera de este proyecto**.
2. En **SQL Editor → New query**, pegá todo `supabase/schema.sql` y tocá **Run**.
3. En **Project Settings → API**, copiá `Project URL` y la clave **publishable / anon** en
   `assets/js/config.js`. Nunca uses la clave `service_role`: esa es secreta.
4. En **Authentication → URL Configuration**, poné tu dominio en `Site URL` y agregá como Redirect URLs
   `http://localhost:8000/admin.html`, `http://127.0.0.1:8000/admin.html` (y las mismas con `5500` si usás
   Live Server). Al publicar, sumá `https://tu-dominio/admin.html`.
5. Entrá a `admin.html`, escribí tu email y abrí el enlace que te llega. Esa primera sesión crea el perfil
   `cata` y te deja como única dueña. **Hacelo antes de publicar el sitio.**

Si tu base se creó con una versión vieja de `schema.sql` (sin la columna `layout` en `profiles`), corré una
vez `supabase/migrations/2026-09-23-profile-layout.sql`. Agrega el orden y tamaño de las ventanas del inicio.

## Seguridad

- `config.js` tiene la clave **publishable**, que está pensada para ser pública. Lo que protege los datos
  son las reglas RLS de `schema.sql`.
- No hay otras claves ni contraseñas en el código. Si algún día hace falta una clave secreta (por ejemplo,
  de la API de YouTube), tiene que vivir en Supabase como secreto, nunca en estos archivos.
