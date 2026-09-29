# Archivo vivo

Portfolio y diario personal: música, libros, videos, notas, fotos y experimentos varios.
Es un sitio estático (HTML + CSS + JavaScript, sin herramientas de compilación) que guarda sus datos
en [Supabase](https://supabase.com).



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
│   ├── hydra/            código de Hydra del fondo del inicio (se pega tal cual del editor)
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


