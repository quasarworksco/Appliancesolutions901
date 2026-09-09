# Appliance Solutions 901

Landing page del negocio de **reparación de electrodomésticos Appliance Solutions 901**, en Memphis, TN.

Hecha con **HTML, CSS y JavaScript puro** — sin frameworks, sin dependencias ni paso de compilación.

## Estructura

```
index.html        Página principal (todas las secciones + sprite de iconos SVG)
css/styles.css    Estilos (mobile-first, con tokens de color y tipografía)
js/script.js      Menú, animaciones, carrusel, acordeón y formulario
images/           Fondo del hero y favicon (SVG)
```

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
2. **Foto del hero** — hoy usa `images/hero-bg.svg`, una ilustración propia como placeholder.
   Reemplazar por una foto real (técnico trabajando) optimizada en `.webp` o `.jpg`
   y actualizar la ruta en `.hero__bg` dentro de `css/styles.css`.
3. **Imagen Open Graph** — crear una imagen de 1200×630 px y apuntar `og:image` a ella.
4. **Formulario** — hoy arma un correo con `mailto:`. Para recibir las solicitudes por
   backend, conectar Formspree, Netlify Forms, EmailJS o un endpoint propio en el
   handler de `#contactForm` (`js/script.js`).
5. **Testimonios** — los cuatro que aparecen son de ejemplo. Reemplazarlos por reseñas
   reales de clientes.
6. **Garantía** — precisar los términos exactos (días/meses y cobertura) en la sección
   "Por Qué Elegirnos" y en la pregunta frecuente correspondiente.
7. **Dominio** — actualizar `canonical`, `og:url` y el JSON-LD cuando el dominio esté listo.

## Decisiones técnicas

- **Iconos**: todos en SVG, en un sprite al inicio de `index.html` y referenciados con
  `<use href="#i-...">`. No se usan emojis en ninguna parte.
- **Responsive**: mobile-first, con breakpoints en 600, 768 y 1024 px. Probado en
  375, 768, 1024 y 1440 px sin scroll horizontal.
- **Sticky header**: `body` usa `overflow-x: clip` (no `hidden`), porque `hidden`
  convierte al body en contenedor de scroll y rompe `position: sticky`.
- **Accesibilidad**: skip link, foco visible, `aria-label`/`aria-expanded` en menú,
  acordeón y carrusel, y contrastes verificados contra WCAG AA.
- **Movimiento**: todas las animaciones respetan `prefers-reduced-motion`.
