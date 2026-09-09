# Appliance Solutions 901

Landing page del negocio de **reparación de electrodomésticos Appliance Solutions 901**, en Memphis, TN.

Hecha con **HTML, CSS y JavaScript puro** — sin frameworks, sin dependencias ni paso de compilación.

El sitio es **bilingüe**: inglés por defecto (el mercado principal de Memphis) y español
como versión alterna, con un selector EN/ES en el header.

## Estructura

```
index.html        Versión en INGLÉS (principal) — se sirve en /
es/index.html     Versión en ESPAÑOL — se sirve en /es/
css/styles.css    Estilos compartidos (mobile-first, con tokens de color y tipografía)
css/fonts.css     @font-face de las fuentes auto-hospedadas
fonts/            Inter, Poppins y Chakra Petch (subconjunto latino, .woff2)
js/script.js      JS compartido: menú, animaciones, carrusel, acordeón y formulario
images/           Fondo del hero, favicon, icono de app e imágenes Open Graph
site.webmanifest  Manifiesto para instalar el sitio en el móvil
CNAME             Dominio del sitio en GitHub Pages
```

Ambas versiones comparten CSS, JS e imágenes. El JavaScript detecta el idioma con
`<html lang>` y elige los textos (errores del formulario, etiquetas ARIA, asunto del
correo) desde un diccionario en `js/script.js`.

### Cómo editar el contenido

El contenido está duplicado a propósito en los dos HTML (sin build ni plantillas).
**Al cambiar un texto, hay que cambiarlo en los dos archivos** para que las versiones
no se desincronicen.

### SEO de las dos versiones

Cada archivo lleva su `canonical` y las etiquetas `hreflang` (`en`, `es` y `x-default`
apuntando al inglés), para que Google indexe ambas sin considerarlas contenido duplicado.

## Cómo verla

No necesita servidor: se puede abrir `index.html` en el navegador.
Para probarla como en producción:

```bash
npx http-server -p 8080 .
```

## Datos del negocio

| Dato       | Valor |
|------------|-------|
| Teléfono   | [901-686-2035](tel:9016862035) |
| Email      | [Appliancesolutions901@gmail.com](mailto:Appliancesolutions901@gmail.com) |
| Instagram  | [@appliance_901](https://www.instagram.com/appliance_901) |
| Cobertura  | Memphis, TN y alrededores (servicio a domicilio) |

## Pendientes marcados en el código (`TODO`)

1. **Horario de atención** — aún no definido. Hay un `TODO` en el header, en la sección
   "Sobre Nosotros", en el bloque de contacto y en el footer para agregarlo cuando se decida.
2. **Logo oficial** — el logo del header y del footer es una **reproducción** del logo real,
   hecha con la tipografía Chakra Petch más los detalles de color (punto rojo sobre la "i",
   líneas rojas de "SOLUTIONS 901" y la línea ELECTRICAL | PLUMBING | MAINTENANCE).
   Cuando el archivo original (SVG o PNG con fondo transparente) esté en `images/`,
   se reemplaza el bloque `.logo__lockup` por un `<img>` en los dos HTML.
3. **Foto del hero** — hoy usa `images/hero-bg.svg`, una ilustración propia como placeholder.
   Reemplazar por una foto real (técnico trabajando) optimizada en `.webp` o `.jpg`
   y actualizar la ruta en `.hero__bg` dentro de `css/styles.css`.
4. **Imagen Open Graph** — ya generada (`images/og-image.png` en inglés y
   `images/og-image-es.png` en español). Si cambia el logo, conviene regenerarlas.
5. **Formulario** — hoy arma un correo con `mailto:`. Para recibir las solicitudes por
   backend, conectar Formspree, Netlify Forms, EmailJS o un endpoint propio en el
   handler de `#contactForm` (`js/script.js`).
6. **Testimonios** — los cuatro que aparecen son de ejemplo. Reemplazarlos por reseñas
   reales de clientes.
7. **Garantía** — precisar los términos exactos (días/meses y cobertura) en la sección
   "Por Qué Elegirnos" y en la pregunta frecuente correspondiente.
8. **Dominio** — el sitio se publica en `https://appliancesolutions901.dgp-link.com`
   (definido en el archivo `CNAME`). Si algún día se cambia a un dominio propio, hay que
   actualizar `canonical`, `hreflang`, `og:url` y el JSON-LD en **ambos** archivos HTML.

## Decisiones técnicas

- **Iconos**: todos en SVG, en un sprite al inicio de cada HTML y referenciados con
  `<use href="#i-...">`. No se usan emojis en ninguna parte.
- **Responsive**: mobile-first, con breakpoints en 600, 768 y 1024 px. Probado en
  375, 768, 1024 y 1440 px sin scroll horizontal.
- **Sticky header**: `body` usa `overflow-x: clip` (no `hidden`), porque `hidden`
  convierte al body en contenedor de scroll y rompe `position: sticky`.
- **Accesibilidad**: skip link, foco visible, `aria-label`/`aria-expanded` en menú,
  acordeón y carrusel, y contrastes verificados contra WCAG AA.
- **Movimiento**: todas las animaciones respetan `prefers-reduced-motion`.
- **Fuentes auto-hospedadas**: se sirven desde `fonts/` (196 KB, subconjunto latino) en vez
  de `fonts.googleapis.com`, para no bloquear el render con una petición externa.
- **Líneas de servicio**: además de electrodomésticos, el sitio incluye la sección
  "Electricidad, Plomería y Mantenimiento", tal como declara el logo de la empresa.
