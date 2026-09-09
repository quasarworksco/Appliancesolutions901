/* =========================================================
   Panel de solicitudes — Appliance Solutions 901

   Se apoya en Firebase Auth (la contraseña nunca vive en este código)
   y en Firestore en tiempo real: si entra una solicitud mientras el
   panel está abierto, aparece sola.
   ========================================================= */
import { firebaseConfig, FIREBASE_SDK, ADMIN_EMAIL_DOMAIN, LEADS_COLLECTION }
  from '../js/firebase-config.js';

const CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK}`;

const ESTADOS = {
  nueva:      'Nueva',
  contactada: 'Contactada',
  agendada:   'Agendada',
  terminada:  'Terminada',
  perdida:    'Perdida'
};

const $ = (id) => document.getElementById(id);
const loginView = $('loginView');
const appView   = $('appView');
const banner    = $('banner');

let db, auth, fs, authMod;
let solicitudes = [];
let filtroEstado = 'todas';
let busqueda = '';

/* ---------- utilidades ---------- */

function escapar(texto) {
  return String(texto == null ? '' : texto)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function soloDigitos(tel) {
  return String(tel || '').replace(/\D/g, '');
}

function telNormalizado(tel) {
  const d = soloDigitos(tel);
  return d.length > 10 ? d.slice(-10) : d;   // ignora el 1 de país
}

/* Cuántas veces ha escrito este mismo teléfono */
function vecesQueLlamo(s) {
  const clave = telNormalizado(s.telefono);
  if (!clave) return 1;
  return solicitudes.filter((o) => telNormalizado(o.telefono) === clave).length;
}

/* Enlace a Google Maps con la dirección que escribió el cliente */
function enlaceMapa(s) {
  // Con solo el código postal no se llega a ninguna casa: mejor no ofrecer el botón
  if (!s.direccion) return '';
  const destino = s.direccion + (s.zona && s.direccion.indexOf(s.zona) === -1 ? ' ' + s.zona : '');
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(destino + ' Memphis TN');
}

function fechaLarga(ts) {
  if (!ts || !ts.toDate) return 'Recién llegada';
  return ts.toDate().toLocaleString('es-US', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function avisar(mensaje) {
  if (!mensaje) { banner.hidden = true; return; }
  banner.textContent = mensaje;
  banner.hidden = false;
}

/* ---------- arranque de Firebase ---------- */

async function cargarFirebase() {
  const [{ initializeApp }, firestore, authentication] = await Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-firestore.js`),
    import(`${CDN}/firebase-auth.js`)
  ]);
  const app = initializeApp(firebaseConfig);
  fs = firestore;
  authMod = authentication;
  db = firestore.getFirestore(app);
  auth = authentication.getAuth(app);
  await authentication.setPersistence(auth, authentication.browserLocalPersistence);
  return authentication.onAuthStateChanged(auth, (usuario) => {
    if (usuario) abrirPanel(usuario); else mostrarLogin();
  });
}

/* ---------- login ---------- */

function mostrarLogin() {
  appView.hidden = true;
  loginView.hidden = false;
  solicitudes = [];
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const error = $('loginError');
  const boton = $('loginBtn');
  const usuario = $('user').value.trim();
  const clave = $('pass').value;

  if (!usuario || !clave) {
    error.textContent = 'Escribe tu usuario y tu contraseña.';
    error.hidden = false;
    return;
  }

  // Se acepta "yeanochoa" o el correo completo
  const correo = usuario.includes('@') ? usuario : `${usuario}@${ADMIN_EMAIL_DOMAIN}`;

  error.hidden = true;
  boton.disabled = true;
  boton.textContent = 'Entrando…';

  try {
    await authMod.signInWithEmailAndPassword(auth, correo, clave);
    $('pass').value = '';
  } catch (err) {
    const codigo = err && err.code ? err.code : '';
    const mensajes = {
      'auth/invalid-credential': 'Usuario o contraseña incorrectos.',
      'auth/wrong-password': 'Usuario o contraseña incorrectos.',
      'auth/user-not-found': 'Ese usuario no existe en Firebase Authentication.',
      'auth/invalid-email': 'El usuario no forma un correo válido.',
      'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a probar.',
      'auth/network-request-failed': 'Sin conexión con Firebase. Revisa tu internet.',
      'auth/unauthorized-domain':
        'Este dominio no está autorizado en Firebase. Agrégalo en ' +
        'Authentication → Settings → Dominios autorizados.',
      'auth/operation-not-allowed':
        'Falta habilitar el acceso con correo y contraseña en ' +
        'Authentication → Sign-in method.'
    };
    error.textContent = mensajes[codigo] ||
      ('No se pudo entrar' + (codigo ? ' (' + codigo + ')' : '') + '. Revisa tu conexión e inténtalo otra vez.');
    error.hidden = false;
  } finally {
    boton.disabled = false;
    boton.textContent = 'Entrar';
  }
});

$('logoutBtn').addEventListener('click', () => authMod.signOut(auth));

/* ---------- panel ---------- */

function abrirPanel(usuario) {
  loginView.hidden = true;
  appView.hidden = false;
  $('topbarUser').textContent = (usuario.email || '').split('@')[0];
  escucharSolicitudes();
}

let desuscribir = null;

function escucharSolicitudes() {
  if (desuscribir) return;
  const q = fs.query(fs.collection(db, LEADS_COLLECTION), fs.orderBy('createdAt', 'desc'));
  desuscribir = fs.onSnapshot(q,
    (snap) => {
      solicitudes = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      avisar('');
      pintar();
    },
    (err) => {
      console.error(err);
      avisar(err && err.code === 'permission-denied'
        ? 'Firestore rechazó la lectura. Falta publicar las reglas de firestore.rules en '
          + 'Firebase Console → Firestore Database → Rules.'
        : 'No se pudieron cargar las solicitudes. Revisa tu conexión y recarga la página.');
    }
  );
}

function contar() {
  const semana = Date.now() - 7 * 24 * 60 * 60 * 1000;
  $('statNuevas').textContent     = solicitudes.filter((s) => s.estado === 'nueva').length;
  $('statAgendadas').textContent  = solicitudes.filter((s) => s.estado === 'agendada').length;
  $('statTerminadas').textContent = solicitudes.filter((s) => s.estado === 'terminada').length;
  $('statSemana').textContent     = solicitudes.filter((s) =>
    s.createdAt && s.createdAt.toDate && s.createdAt.toDate().getTime() >= semana).length;
}

function filtrar() {
  const texto = busqueda.toLowerCase();
  return solicitudes.filter((s) => {
    if (filtroEstado !== 'todas' && s.estado !== filtroEstado) return false;
    if (!texto) return true;
    return [s.nombre, s.telefono, s.email, s.electrodomestico, s.mensaje, s.zona]
      .join(' ').toLowerCase().includes(texto);
  });
}

function tarjeta(s) {
  const tel = soloDigitos(s.telefono);
  const veces = vecesQueLlamo(s);
  const mapa = enlaceMapa(s);
  const estado = ESTADOS[s.estado] ? s.estado : 'nueva';
  const opciones = Object.keys(ESTADOS)
    .map((k) => `<option value="${k}"${k === estado ? ' selected' : ''}>${ESTADOS[k]}</option>`)
    .join('');

  return `
  <article class="lead" data-estado="${estado}" data-id="${escapar(s.id)}">
    <div class="lead__top">
      <div class="lead__who">
        <h3>${escapar(s.nombre) || 'Sin nombre'}</h3>
        <p class="lead__meta">
          ${escapar(s.electrodomestico) || 'Sin especificar'}
          ${s.marcaModelo ? '&middot; ' + escapar(s.marcaModelo) : ''}
          &middot; ${fechaLarga(s.createdAt)}
          ${s.zona ? '&middot; Zona ' + escapar(s.zona) : ''}
        </p>
        ${s.direccion ? `<p class="lead__addr">${escapar(s.direccion)}</p>` : ''}
      </div>
      <div>
        <span class="chip chip--${estado}">${ESTADOS[estado]}</span>
        <span class="chip chip--lang">${s.idioma === 'es' ? 'ES' : 'EN'}</span>
        ${s.pagoAdelantado ? '<span class="chip chip--paid">Pagó $69</span>' : ''}
        ${veces > 1 ? `<span class="chip chip--repeat">${veces}ª vez que escribe</span>` : ''}
      </div>
    </div>

    ${s.mensaje ? `<p class="lead__msg">${escapar(s.mensaje)}</p>` : ''}

    <div class="lead__actions">
      ${tel ? `<a class="act act--call" href="tel:${tel}">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><use href="#a-phone"></use></svg>
        ${escapar(s.telefono)}</a>` : ''}
      ${tel ? `<a class="act act--wa" href="https://wa.me/1${tel.slice(-10)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><use href="#a-whatsapp"></use></svg>
        WhatsApp</a>` : ''}
      ${s.email ? `<a class="act act--mail" href="mailto:${escapar(s.email)}">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><use href="#a-mail"></use></svg>
        ${escapar(s.email)}</a>` : ''}
      ${mapa ? `<a class="act act--map" href="${mapa}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><use href="#a-pin"></use></svg>
        Cómo llegar</a>` : ''}
      <button class="act act--del" type="button" data-accion="borrar">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><use href="#a-trash"></use></svg>
        Borrar
      </button>
    </div>

    <div class="lead__manage">
      <div class="field">
        <label for="est-${escapar(s.id)}">Estado</label>
        <select id="est-${escapar(s.id)}" data-accion="estado">${opciones}</select>
      </div>
      <div class="field">
        <label for="nota-${escapar(s.id)}">Notas internas</label>
        <textarea id="nota-${escapar(s.id)}" data-accion="nota"
          placeholder="Qué se habló, qué repuesto hace falta, cuándo volver a llamar…">${escapar(s.notas || '')}</textarea>
      </div>
      <div class="field">
        <label class="check">
          <input type="checkbox" data-accion="pago"${s.pagoAdelantado ? ' checked' : ''}>
          Pagó por adelantado
        </label>
        <span class="saved" data-guardado>Guardado</span>
      </div>
    </div>
  </article>`;
}

function pintar() {
  contar();
  const lista = filtrar();
  const cont = $('leads');
  cont.innerHTML = lista.map(tarjeta).join('');
  const vacio = $('empty');
  vacio.hidden = lista.length > 0;
  $('emptyText').textContent = solicitudes.length === 0
    ? 'Todavía no hay solicitudes. Cuando alguien llene el formulario del sitio, aparece aquí sola.'
    : 'Ninguna solicitud coincide con este filtro.';
}

/* ---------- guardar cambios ---------- */

async function guardar(id, datos, elemento) {
  try {
    await fs.updateDoc(fs.doc(db, LEADS_COLLECTION, id), datos);
    const aviso = elemento.closest('.lead').querySelector('[data-guardado]');
    if (aviso) {
      aviso.classList.add('is-on');
      setTimeout(() => aviso.classList.remove('is-on'), 1600);
    }
  } catch (err) {
    console.error(err);
    avisar('No se pudo guardar el cambio. Revisa tu conexión.');
  }
}

$('leads').addEventListener('change', (e) => {
  const tarjeta = e.target.closest('.lead');
  if (!tarjeta) return;
  const id = tarjeta.dataset.id;
  const accion = e.target.dataset.accion;

  if (accion === 'estado') guardar(id, { estado: e.target.value }, e.target);
  if (accion === 'pago')   guardar(id, { pagoAdelantado: e.target.checked }, e.target);
});

// Las notas se guardan al salir del campo, no en cada tecla
$('leads').addEventListener('focusout', (e) => {
  if (e.target.dataset.accion !== 'nota') return;
  const tarjeta = e.target.closest('.lead');
  const id = tarjeta.dataset.id;
  const original = (solicitudes.find((s) => s.id === id) || {}).notas || '';
  if (e.target.value === original) return;
  guardar(id, { notas: e.target.value.slice(0, 4000) }, e.target);
});

$('leads').addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-accion="borrar"]');
  if (!boton) return;
  const tarjeta = boton.closest('.lead');
  const id = tarjeta.dataset.id;
  const nombre = tarjeta.querySelector('h3').textContent;
  if (!confirm(`¿Borrar la solicitud de ${nombre}? Esto no se puede deshacer.`)) return;
  try {
    await fs.deleteDoc(fs.doc(db, LEADS_COLLECTION, id));
  } catch (err) {
    console.error(err);
    avisar('No se pudo borrar la solicitud.');
  }
});

/* ---------- exportar a Excel ---------- */

function csvSeguro(valor) {
  const texto = String(valor == null ? '' : valor).replace(/"/g, '""');
  // Evita que Excel interprete un valor como fórmula
  const prefijo = /^[=+\-@]/.test(texto) ? "'" : '';
  return '"' + prefijo + texto + '"';
}

$('exportBtn').addEventListener('click', () => {
  const lista = filtrar();
  if (!lista.length) { avisar('No hay solicitudes que exportar con este filtro.'); return; }

  const cabecera = ['Fecha', 'Nombre', 'Telefono', 'Email', 'Electrodomestico',
                    'Marca y modelo', 'Direccion', 'Zona', 'Idioma',
                    'Estado', 'Pago adelantado', 'Mensaje', 'Notas'];

  const filas = lista.map((s) => [
    s.createdAt && s.createdAt.toDate ? s.createdAt.toDate().toLocaleString('es-US') : '',
    s.nombre, s.telefono, s.email, s.electrodomestico, s.marcaModelo, s.direccion,
    s.zona, s.idioma === 'es' ? 'Espanol' : 'Ingles',
    ESTADOS[s.estado] || s.estado, s.pagoAdelantado ? 'Si' : 'No',
    s.mensaje, s.notas
  ].map(csvSeguro).join(','));

  // sep=, y BOM para que Excel abra bien las tildes y las columnas
  const csv = '\ufeff' + 'sep=,\n' + cabecera.map(csvSeguro).join(',') + '\n' + filas.join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  const hoy = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `solicitudes-as901-${hoy}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* ---------- filtros ---------- */

$('tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  [...$('tabs').children].forEach((t) => {
    const activo = t === tab;
    t.classList.toggle('is-active', activo);
    t.setAttribute('aria-selected', activo ? 'true' : 'false');
  });
  filtroEstado = tab.dataset.estado;
  pintar();
});

let esperaBusqueda;
$('search').addEventListener('input', (e) => {
  clearTimeout(esperaBusqueda);
  esperaBusqueda = setTimeout(() => { busqueda = e.target.value.trim(); pintar(); }, 180);
});

/* ---------- inicio ---------- */

cargarFirebase().catch((err) => {
  console.error(err);
  const error = $('loginError');
  error.textContent = 'No se pudo cargar Firebase (SDK ' + FIREBASE_SDK + '). '
    + 'Revisa tu conexión; si el problema sigue, cambia FIREBASE_SDK en js/firebase-config.js.';
  error.hidden = false;
});
