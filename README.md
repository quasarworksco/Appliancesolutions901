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
js/firebase-config.js  Configuración de Firebase (pública, no es secreta)
js/leads.js       Guarda las solicitudes del formulario en Firestore
js/notify.js      Avisa por WhatsApp y correo cuando entra una solicitud
apps-script/      Script de Google que reenvía el aviso (gratis, sin tarjeta)
admin/            Panel privado de solicitudes (/admin)
firestore.rules   Reglas de seguridad de la base de datos
robots.txt        Indexación; bloquea /admin/
images/           Logo, favicon, icono de app, fondo del hero e imágenes Open Graph
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
| WhatsApp   | [wa.me/19016862035](https://wa.me/19016862035) |
| Email      | [Appliancesolutions901@gmail.com](mailto:Appliancesolutions901@gmail.com) |
| Instagram  | [@appliance_901](https://www.instagram.com/appliance_901) |
| Cobertura  | Memphis, TN y alrededores (servicio a domicilio) |

## Pago anticipado (Square)

El cliente puede pagar la visita por adelantado y ahorrar un 10%: **$79.98** en vez de los $89
que cuesta pagando el día del servicio. En ambos casos el monto se descuenta del total de la
reparación.

El cobro va por un **enlace de pago alojado de Square**
(`https://square.link/u/HoCxbR6f`). Los datos de la tarjeta **nunca pasan por este sitio**:
Square aloja el formulario y asume el cumplimiento PCI. Por eso no hace falta backend y por eso
el enlace es lo único que hay que mantener actualizado si cambia el precio.

Aparece en tres sitios, por orden de conversión:

1. **Al enviar el formulario** — el bloque de pago se muestra junto al mensaje de éxito. Es el
   mejor momento: el cliente acaba de decidir.
2. **En la tarjeta de precio prepago** de la sección "Cuánto Cuesta la Visita".
3. **En el hero**, una cinta discreta que enlaza a esa sección. Un botón de pago grande ahí le
   competiría al objetivo principal, que es que te contacten.

**Si cambia el precio** hay que tocarlo en los dos HTML: la tarjeta de precio, la pregunta
frecuente del presupuesto, el bloque de pago del formulario y el distintivo del panel.

### Verificar los pagos

Un enlace alojado no sabe qué solicitud pagó: llega el dinero, pero no viene atado a un cliente
de la base de datos. Por eso conviene configurar el enlace en Square para que **pida nombre y
teléfono** al pagar.

En el panel hay una casilla "Pagó los $79.98" por solicitud, un contador de cuántas pagaron, una
pestaña **Pagadas** para filtrarlas y un botón **Pagos** que abre las transacciones en Square.
De momento la conciliación es manual; el siguiente paso es el webhook de Square hacia el Apps
Script para que cada pago avise por Telegram.

## Seguridad del sitio

### Content-Security-Policy

Las cuatro páginas (las dos públicas, el panel y el diagnóstico) llevan un CSP estricto en una
etiqueta `<meta>`. Solo se permite cargar recursos de este dominio y de los servicios
necesarios: el SDK de Firebase desde `gstatic.com`, Firestore, Firebase Authentication y el
Apps Script de los avisos.

Qué impide, en concreto: **si alguien lograra inyectar un script en la página, el navegador lo
bloquea**. Eso importa especialmente al añadir pagos — el ataque típico no roba tarjetas, sino
que cambia el enlace de pago por el de otra cuenta. Con este CSP, un enlace a un dominio no
permitido falla.

Para que el CSP pueda ser estricto, el código no usa nada en línea: ni atributos `style=`, ni
manejadores `onclick=`, ni bloques `<style>`/`<script>` embebidos. **Al añadir código nuevo hay
que mantener esa regla**, y si aparece un servicio externo nuevo, agregar su dominio al CSP de
las páginas que lo usen.

GitHub Pages no permite enviar cabeceras HTTP propias, así que el CSP va en `<meta>`. Eso tiene
una limitación: las directivas `frame-ancestors`, `report-uri` y `sandbox` **solo funcionan como
cabecera**, no en `<meta>`. Si algún día el sitio se mueve a un hosting con cabeceras
(Vercel, Cloudflare, Netlify), conviene añadir `frame-ancestors 'none'` contra el clickjacking.

### Pendiente de configurar en las consolas

Dos cosas que no se pueden hacer desde el código:

1. **App Check con reCAPTCHA** (Firebase Console → App Check). Hoy las reglas validan el
   *formato* de una solicitud, pero no *quién* la envía: con la configuración pública cualquiera
   puede escribir en la base desde una terminal. App Check hace que Firestore solo acepte
   escrituras que vengan del sitio real. Es gratis y es la mejora de seguridad más importante
   que queda.
2. **Restringir la API key por dominio** (Google Cloud Console → APIs y servicios →
   Credenciales → la clave del proyecto → Restricciones de aplicación → Sitios web).

## Pendientes marcados en el código (`TODO`)

1. **Horario de atención** — aún no definido. Hay un `TODO` en el header, en la sección
   "Sobre Nosotros", en el bloque de contacto y en el footer para agregarlo cuando se decida.
2. **Logo en vectorial** — el sitio usa el logo real (`images/logo.png`), del que se derivaron
   `logo-dark.png` (para el header claro) y `logo-white.png` (para el footer oscuro), ambos con
   fondo transparente. Si algún día aparece el archivo vectorial (SVG/AI/EPS), conviene
   cambiarlo: pesa menos y se ve nítido en cualquier pantalla.
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
- **Líneas de servicio**: además de electrodomésticos, hay una sección de oficios encabezada por
  **electricidad**, seguida de **plomería** (con el detalle de las cámaras de inspección) y una
  tarjeta breve de mantenimiento.
- **WhatsApp**: el 901-686-2035 recibe WhatsApp. Está en los botones flotantes, en la sección de
  contacto y en el footer, con un mensaje inicial precargado distinto por idioma.
- **Costo de la visita**: $89 pagando el día del servicio, $69 pagando por adelantado, y en
  ambos casos se descuenta del total de la reparación si el cliente aprueba el trabajo.
- **Derivados del logo**: las variantes transparentes, el favicon, el icono de app y las dos
  imágenes Open Graph se generaron a partir de `images/logo.png`. Si el logo cambia, hay que
  regenerarlas para que todo siga coherente.

## Panel de solicitudes (`/admin`)

Las solicitudes del formulario se guardan en **Firestore** (proyecto `yeanochoa-4b1c9`) y se
administran desde `/admin`. El sitio sigue siendo estático en GitHub Pages: Firebase solo
guarda los datos.

### Cómo entrar

Usuario `yeanochoa` y la contraseña que registraste en Firebase Authentication. El panel le
agrega el dominio por detrás, así que `yeanochoa` se convierte en
`yeanochoa@appliancesolutions901.com`. También se acepta el correo completo.

La contraseña **no está en este repositorio**: vive solo en Firebase. Para cambiarla, se hace
desde Firebase Console → Authentication → Users.

### Qué hace el panel

- Bandeja en **tiempo real**: una solicitud nueva aparece sin recargar la página
- Estados: Nueva → Contactada → Agendada → Terminada → Perdida
- Notas internas por solicitud y marca de "pagó por adelantado"
- Botones directos de llamar, WhatsApp, correo y **Cómo llegar** (Google Maps)
- **Dirección** del cliente (obligatoria en el formulario) y **marca y modelo** del equipo
- **Cliente repetido**: si el mismo teléfono ya había escrito, lo marca ("2ª vez que escribe")
- Filtros por estado, búsqueda y contadores (nuevas, de esta semana, agendadas, terminadas)
- **Exportar a Excel**: descarga lo que se ve en pantalla como CSV, listo para el contador

### El botón "Cómo llegar"

Abre Google Maps con la dirección que escribió el cliente. Solo aparece si hay dirección: con
el código postal a secas no se llega a ninguna casa, así que en ese caso no se muestra.

### Seguridad

- Los valores de `js/firebase-config.js` son **públicos por diseño**; Firebase los expone en
  el navegador a propósito. La protección real está en `firestore.rules`.
- Un visitante anónimo **solo puede crear** una solicitud, con la forma exacta validada por las
  reglas. No puede leer, listar, modificar ni borrar nada.
- Leer y administrar requiere sesión iniciada. Las reglas además impiden alterar el nombre, el
  teléfono y la fecha originales de una solicitud ya recibida.
- El formulario tiene un campo trampa invisible (`company`) para bots. Si llega lleno, la
  solicitud se descarta en silencio.
- `robots.txt` bloquea `/admin/` y la página lleva `noindex`.

**Al cambiar las reglas hay que publicarlas**: Firebase Console → Firestore Database → Rules,
pegar el contenido de `firestore.rules` y publicar.

### Página de diagnóstico

`/admin/diagnostico.html` comprueba paso por paso dónde se rompe la conexión: la configuración,
la descarga del SDK (probando varias versiones), la conexión con el proyecto y una escritura
real de prueba. Cuando algo falla, muestra el código exacto de Firestore y qué hacer para
arreglarlo. La solicitud de prueba que crea se llama "PRUEBA DE DIAGNOSTICO" y se borra desde
el panel con el botón Borrar.

### Si Firestore falla

Pasan dos cosas, para que la solicitud no se pierda de ninguna manera:

1. El formulario cae al envío por `mailto:` que había antes y el visitante ve un mensaje
   distinto según el caso.
2. **El aviso (Telegram, WhatsApp, correo) sale igual**, con todos los datos y una advertencia
   arriba: *"OJO: esta solicitud NO se guardó en el panel. Anótala a mano."*

Esto funciona incluso si el SDK de Firebase no llegó a cargarse.

## Aviso de solicitud nueva (WhatsApp y correo)

Cuando una solicitud queda guardada, el sitio dispara un aviso. Es opcional: si falla o no
está configurado, la solicitud igual está guardada y aparece en `/admin`.

Se configura en `js/firebase-config.js`. Hay dos formas, elige una:

### Opción A — Google Apps Script (recomendada)

Un solo script reenvía cada solicitud a **Telegram**, **WhatsApp** y **correo**, y opcionalmente
la copia a una Google Sheet. Las claves viven dentro del script de Google, nunca en el código
público del sitio.

1. Abre https://script.google.com, crea un proyecto y pega `apps-script/Codigo.gs`
2. Rellena las constantes que vayas a usar (`TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID`,
   `CALLMEBOT_APIKEY`, `EMAIL_TO`, `SHEET_ID`)
3. Implementar → Nueva implementación → Aplicación web
   (ejecutar como: **yo**; acceso: **cualquier usuario**)
4. Copia la URL que termina en `/exec` y pégala en `NOTIFY_URL`

Para probar hay dos formas:

- Ejecutar la función `prueba()` desde el editor (usa el código **actual**)
- Abrir la URL `/exec` en el navegador (usa el código **implementado**), que muestra el estado
  de la configuración; añadiendo `?prueba=as901-aviso` manda un mensaje al grupo

La diferencia importa: Apps Script sirve en la URL una *foto* del código del momento en que se
implementó. Si cambias el script y no vuelves a implementar con una **versión nueva**, la URL
sigue ejecutando el código viejo aunque el editor muestre el nuevo.

#### Telegram

1. Habla con **@BotFather** en Telegram, manda `/newbot` y guarda el token
2. Pega el token en `TELEGRAM_TOKEN`
3. Agrega el bot a tu grupo

El id del grupo **no hay que buscarlo**: Telegram avisa cuando agregan al bot a un grupo, y el
script detecta ese aviso la primera vez que envía algo y lo guarda en las propiedades del
proyecto.

Si no detecta el grupo, ejecuta **`diagnosticarTelegram()`**: comprueba el token, si hay un
webhook estorbando, qué avisos ha recibido el bot y a qué chat va a escribir. Las otras
funciones de apoyo son `borrarWebhook()`, `olvidarGrupo()` (para volver a detectar el grupo si
lo cambias) y `obtenerChatId()`.

Telegram guarda los avisos solo **24 horas**. Si el bot lleva más tiempo en el grupo sin
actividad, escribe en el grupo `/start@nombredelbot` para generar uno nuevo: los comandos
dirigidos al bot le llegan siempre, aunque el modo privacidad esté activado, que es lo que pasa
por defecto con los mensajes normales.

El mensaje llega con nombre, teléfono con enlace de llamada, enlace de WhatsApp, equipo,
marca y modelo, dirección con enlace a Google Maps, el mensaje del cliente y el idioma.

**El token de Telegram no debe ir nunca en el código del sitio**: con él se puede leer y
escribir en el grupo. Por eso Telegram solo se conecta a través del Apps Script.

### Opción B — CallMeBot directo desde el navegador

Deja `NOTIFY_URL` vacío y rellena `CALLMEBOT.apikey`. Se configura en dos minutos.

**Advertencia:** la clave queda visible en el código del sitio. Quien la encuentre puede
enviarte mensajes de WhatsApp. La clave se puede cambiar volviendo a activar el servicio.

### Límites

- CallMeBot es un servicio no oficial y gratuito: puede fallar o cambiar sin aviso. Por eso
  el correo de la opción A sirve de respaldo.
- Apps Script envía hasta unos 100 correos al día con una cuenta de Gmail normal.

## Pago anticipado (Square)

El cliente puede pagar la visita por adelantado y ahorrar un 10%: **$79.98** en vez de los $89
que cuesta pagando el día del servicio. En ambos casos el monto se descuenta del total de la
reparación.

El cobro va por un **enlace de pago alojado de Square**
(`https://square.link/u/HoCxbR6f`). Los datos de la tarjeta **nunca pasan por este sitio**:
Square aloja el formulario y asume el cumplimiento PCI. Por eso no hace falta backend y por eso
el enlace es lo único que hay que mantener actualizado si cambia el precio.

Aparece en tres sitios, por orden de conversión:

1. **Al enviar el formulario** — el bloque de pago se muestra junto al mensaje de éxito. Es el
   mejor momento: el cliente acaba de decidir.
2. **En la tarjeta de precio prepago** de la sección "Cuánto Cuesta la Visita".
3. **En el hero**, una cinta discreta que enlaza a esa sección. Un botón de pago grande ahí le
   competiría al objetivo principal, que es que te contacten.

**Si cambia el precio** hay que tocarlo en los dos HTML: la tarjeta de precio, la pregunta
frecuente del presupuesto, el bloque de pago del formulario y el distintivo del panel.

### Verificar los pagos

Un enlace alojado no sabe qué solicitud pagó: llega el dinero, pero no viene atado a un cliente
de la base de datos. Por eso conviene configurar el enlace en Square para que **pida nombre y
teléfono** al pagar.

En el panel hay una casilla "Pagó los $79.98" por solicitud, un contador de cuántas pagaron, una
pestaña **Pagadas** para filtrarlas y un botón **Pagos** que abre las transacciones en Square.
De momento la conciliación es manual; el siguiente paso es el webhook de Square hacia el Apps
Script para que cada pago avise por Telegram.

## Seguridad del sitio

### Content-Security-Policy

Las cuatro páginas (las dos públicas, el panel y el diagnóstico) llevan un CSP estricto en una
etiqueta `<meta>`. Solo se permite cargar recursos de este dominio y de los servicios
necesarios: el SDK de Firebase desde `gstatic.com`, Firestore, Firebase Authentication y el
Apps Script de los avisos.

Qué impide, en concreto: **si alguien lograra inyectar un script en la página, el navegador lo
bloquea**. Eso importa especialmente al añadir pagos — el ataque típico no roba tarjetas, sino
que cambia el enlace de pago por el de otra cuenta. Con este CSP, un enlace a un dominio no
permitido falla.

Para que el CSP pueda ser estricto, el código no usa nada en línea: ni atributos `style=`, ni
manejadores `onclick=`, ni bloques `<style>`/`<script>` embebidos. **Al añadir código nuevo hay
que mantener esa regla**, y si aparece un servicio externo nuevo, agregar su dominio al CSP de
las páginas que lo usen.

GitHub Pages no permite enviar cabeceras HTTP propias, así que el CSP va en `<meta>`. Eso tiene
una limitación: las directivas `frame-ancestors`, `report-uri` y `sandbox` **solo funcionan como
cabecera**, no en `<meta>`. Si algún día el sitio se mueve a un hosting con cabeceras
(Vercel, Cloudflare, Netlify), conviene añadir `frame-ancestors 'none'` contra el clickjacking.

### Pendiente de configurar en las consolas

Dos cosas que no se pueden hacer desde el código:

1. **App Check con reCAPTCHA** (Firebase Console → App Check). Hoy las reglas validan el
   *formato* de una solicitud, pero no *quién* la envía: con la configuración pública cualquiera
   puede escribir en la base desde una terminal. App Check hace que Firestore solo acepte
   escrituras que vengan del sitio real. Es gratis y es la mejora de seguridad más importante
   que queda.
2. **Restringir la API key por dominio** (Google Cloud Console → APIs y servicios →
   Credenciales → la clave del proyecto → Restricciones de aplicación → Sitios web).

## Pendiente

- **App Check con reCAPTCHA** si algún día llega spam pese al campo trampa.
- Fase 2 del panel: calendario de citas, historial por cliente e ingresos por trabajo.
- Cloud Functions (aviso nativo de Firestore) si algún día se pasa al plan Blaze: en este
  volumen costaría $0, pero exige registrar una tarjeta.
