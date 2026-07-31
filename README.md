# 母语级英语 · 小初高英语辅导 — Landing page

Landing interactiva para clases particulares de inglés americano dirigidas a alumnos
chinos de primaria, secundaria y bachillerato. Incluye demo de clase, cuatro
minijuegos educativos y formulario de prueba gratuita.

**Stack:** HTML + CSS + JavaScript vanilla. Sin framework, sin build, sin dependencias.

---

## 📌 Antes de publicar: añade el QR

La web muestra el QR de WeChat desde un archivo llamado **`wechat_qr.png`**.

1. Guarda la imagen del QR en la **raíz del proyecto** (junto a `index.html`).
2. El nombre debe ser exactamente **`wechat_qr.png`**.

Si el archivo no está, la web detecta el fallo y muestra un marco con instrucciones
en su lugar — nunca aparece una imagen rota.

El WeChat ID (`wxid_qqmcz57ebybf22`) está en `index.html`; búscalo para cambiarlo.

---

## 🗂 Estructura

```
english-tutor-web/
├─ index.html                 Documento único: todo el contenido rastreable
├─ wechat_qr.png              ← AÑADIR TÚ
└─ assets/
   ├─ css/
   │  ├─ tokens.css           Design system: color, escala tipográfica, espacio, motion
   │  ├─ base.css             Reset, fondo, tipografía, botones, foco, reveal
   │  ├─ sections.css         Nav, hero, clase, método, comparativa, FAQ, CTA, footer
   │  └─ games.css            Minijuegos y panel de progreso
   └─ js/
      ├─ data.js              TODO el contenido de ejercicios (editar solo aquí)
      ├─ core.js              Motion policy, IntersectionObserver, rAF, progreso, TTS
      ├─ hero.js              Entrada, órbita de vocabulario, consola, parallax
      ├─ sections.js          Scroll, marquee, demo de clase, método, skills
      ├─ games.js             Los cuatro minijuegos + panel de puntuación
      └─ form.js              Validación y confirmación del formulario
```

### Añadir contenido sin tocar la lógica

Todo el contenido de los ejercicios vive en `assets/js/data.js`:

| Quiero añadir… | Edito el array |
|---|---|
| Una frase para ordenar | `sentences` |
| Una pregunta de opción múltiple | `quiz` |
| Una palabra de vocabulario | `vocab` |
| Una frase de listening | `listening` |
| Una fase del método | `method` |
| Una pregunta frecuente | directamente en `index.html` (es contenido SEO estático) |

Para añadir un **minijuego nuevo**: escribe una función `mount(body, verdict)` en
`games.js` y añade una entrada al array `games` del final. El sistema de pestañas,
puntuación y feedback lo hereda automáticamente.

> Tras editar cualquier `.css` o `.js`, sube el número de `?v=1` en `index.html`
> para que los visitantes reciban la versión nueva y no la cacheada.

---

## 🚀 Publicar en Vercel

### Opción A — Vercel CLI

```bash
npm i -g vercel
```

Después, dentro de esta carpeta:

```bash
vercel
```

Acepta los valores por defecto. Para actualizaciones posteriores:

```bash
vercel --prod
```

### Opción B — Desde GitHub (sin terminal)

1. Sube esta carpeta a un repositorio en github.com
2. En vercel.com → **Add New → Project → Import**
3. Framework Preset: **Other**. Sin build command ni output directory.
4. **Deploy**

---

## 🔍 Probar en local

No hay build. Puedes abrir `index.html` directamente en el navegador, o levantar
un servidor estático para que las rutas se comporten igual que en producción:

```bash
npx serve .
```

### Qué comprobar

- Los cuatro minijuegos con ratón, teclado (Tab / flechas / Enter) y táctil
- El formulario: enviar vacío debe marcar los tres campos
- Reduce el movimiento en el sistema operativo: la página debe seguir completa y usable
- Anchos 320 / 375 / 430 / 768 / 1024 / 1440 px sin scroll horizontal
