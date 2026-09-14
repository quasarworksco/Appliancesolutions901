/* Lógica de la página de diagnóstico.
   Va en archivo aparte para poder aplicar un CSP estricto. */
import { firebaseConfig, FIREBASE_SDK, LEADS_COLLECTION, NOTIFY_URL, NOTIFY_TOKEN }
  from '../js/firebase-config.js';

const pasos = document.getElementById('pasos');
const final = document.getElementById('final');

/* Versiones a probar: la configurada primero, luego otras conocidas */
const VERSIONES = [...new Set([FIREBASE_SDK, '10.12.2', '10.14.1', '11.0.2', '9.23.0'])];

function paso(titulo, estado, detalle, arreglo) {
  const el = document.createElement('div');
  el.className = 'paso ' + (estado === true ? 'ok' : estado === false ? 'mal' : '');
  el.innerHTML = `
    <span class="marca">${estado === true ? '✓' : estado === false ? '!' : '·'}</span>
    <div>
      <h2>${titulo}</h2>
      <p>${detalle || ''}</p>
      ${arreglo ? `<p class="arreglo">${arreglo}</p>` : ''}
    </div>`;
  pasos.appendChild(el);
  return el;
}

function terminar(texto) {
  final.innerHTML = texto;
  final.classList.add('visible');
}

const PISTAS = {
  'permission-denied':
    'Las reglas de Firestore están rechazando la escritura. Ve a Firebase Console → Firestore Database → Rules, ' +
    'pega el contenido actualizado de <code>firestore.rules</code> del repositorio y pulsa Publicar. ' +
    'Ojo: las reglas viejas rechazan los campos nuevos (marca y modelo, dirección, ubicación).',
  'not-found':
    'No existe la base de datos. En Firebase Console → Firestore Database, pulsa "Crear base de datos" ' +
    'en modo producción.',
  'failed-precondition':
    'Firestore existe pero no está listo, o el proyecto usa una base con otro nombre. ' +
    'Revisa Firebase Console → Firestore Database.',
  'unavailable':
    'No hay conexión con Firestore. Revisa tu internet o si alguna extensión del navegador está bloqueando Google.',
  'invalid-argument':
    'Los datos no cumplen lo que esperan las reglas. Vuelve a publicar <code>firestore.rules</code>.',
  'unauthenticated':
    'Las reglas exigen sesión iniciada para escribir. Revisa que la sección de "create" en las reglas ' +
    'sea la del repositorio.'
};

/* --- Prueba del aviso a Telegram --- */
const avisoPaso = document.getElementById('avisoPaso');
const avisoTexto = document.getElementById('avisoTexto');
const avisoBtn = document.getElementById('avisoBtn');

if (!NOTIFY_URL) {
  avisoPaso.hidden = false;
  avisoBtn.remove();
  avisoTexto.innerHTML = 'No hay ningún script conectado: <code>NOTIFY_URL</code> está vacío ' +
    'en <code>js/firebase-config.js</code>.';
} else {
  avisoPaso.hidden = false;
  avisoTexto.innerHTML = 'El sitio enviará el aviso a <code>' +
    NOTIFY_URL.slice(0, 62) + '…</code>';

  avisoBtn.addEventListener('click', async () => {
    avisoBtn.disabled = true;
    avisoBtn.textContent = 'Enviando…';
    const lead = {
      nombre: 'PRUEBA DESDE EL DIAGNOSTICO',
      telefono: '901-000-0000', email: '', electrodomestico: 'Otro',
      marcaModelo: '', direccion: 'Prueba 123, Memphis, TN 38118', zona: '',
      idioma: 'es',
      mensaje: 'Aviso de prueba lanzado desde /admin/diagnostico.html'
    };
    try {
      await fetch(NOTIFY_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          token: NOTIFY_TOKEN, guardado: true, lead: lead,
          texto: 'PRUEBA DESDE EL DIAGNOSTICO\n\nSi ves esto en el grupo, el sitio ' +
                 'alcanza el script y los avisos funcionan.'
        })
      });
      avisoPaso.classList.add('ok');
      avisoPaso.querySelector('.marca').textContent = '✓';
      avisoTexto.innerHTML = '<strong>Enviado.</strong> Mira el grupo de Telegram.<br>' +
        'Si no llega, el problema está en el script de Google: entra a script.google.com → ' +
        'menú <b>Ejecuciones</b> y mira si aparece un <code>doPost</code> de hace un momento. ' +
        'Si aparece pero no llegó el mensaje, falta <b>volver a implementar</b> el script con ' +
        'una <b>versión nueva</b>. Si no aparece, la implementación no está abierta a ' +
        '"cualquier usuario".';
    } catch (err) {
      avisoPaso.classList.add('mal');
      avisoPaso.querySelector('.marca').textContent = '!';
      avisoTexto.innerHTML = 'No se pudo enviar: <code>' + (err.message || err) + '</code>';
    }
    avisoBtn.textContent = 'Enviar otro aviso de prueba';
    avisoBtn.disabled = false;
  });
}

(async () => {
  // --- 1. Configuración ---
  const faltan = ['apiKey','authDomain','projectId','appId'].filter(k => !firebaseConfig[k]);
  paso('Configuración de Firebase', faltan.length === 0,
    faltan.length ? 'Faltan valores: ' + faltan.join(', ')
                  : 'Proyecto <code>' + firebaseConfig.projectId + '</code>');
  if (faltan.length) return terminar('Completa <code>js/firebase-config.js</code> y vuelve a probar.');

  // --- 2. Cargar el SDK ---
  let mods = null, versionOk = null;
  const fallos = [];
  for (const v of VERSIONES) {
    try {
      const base = `https://www.gstatic.com/firebasejs/${v}`;
      const [app, fs] = await Promise.all([
        import(`${base}/firebase-app.js`),
        import(`${base}/firebase-firestore.js`)
      ]);
      mods = { app, fs }; versionOk = v; break;
    } catch (err) {
      fallos.push(v);
    }
  }
  if (!mods) {
    paso('Descargar el SDK de Firebase', false,
      'Ninguna versión pudo cargarse. Probadas: <code>' + fallos.join(', ') + '</code>',
      'O no hay conexión con <code>gstatic.com</code>, o una extensión del navegador lo está bloqueando. ' +
      'Prueba en otro navegador o con el modo incógnito sin extensiones.');
    return terminar('El sitio no puede descargar Firebase. Nada más va a funcionar hasta resolver esto.');
  }
  paso('Descargar el SDK de Firebase', true,
    'Cargó la versión <code>' + versionOk + '</code>' +
    (versionOk !== FIREBASE_SDK
      ? ' — la configurada (<code>' + FIREBASE_SDK + '</code>) NO existe.' : '.'),
    versionOk !== FIREBASE_SDK
      ? 'Cambia FIREBASE_SDK a "' + versionOk + '" en js/firebase-config.js.' : '');

  // --- 3. Iniciar la app y conectar ---
  let db;
  try {
    const app = mods.app.initializeApp(firebaseConfig);
    db = mods.fs.getFirestore(app);
    paso('Conectar con el proyecto', true, 'Conectado a <code>' + firebaseConfig.projectId + '</code>');
  } catch (err) {
    paso('Conectar con el proyecto', false, '<code>' + (err.message || err) + '</code>');
    return terminar('Revisa que los valores de js/firebase-config.js sean los de tu proyecto.');
  }

  // --- 4. Escribir una solicitud de prueba ---
  const prueba = {
    nombre: 'PRUEBA DE DIAGNOSTICO',
    telefono: '901-000-0000',
    email: '',
    electrodomestico: 'Otro',
    mensaje: 'Documento creado por la página de diagnóstico. Se puede borrar desde el panel.',
    marcaModelo: '', direccion: 'Prueba 123, Memphis, TN 38118', zona: '',
    idioma: 'es', origen: 'diagnostico',
    estado: 'nueva', notas: '', pagoAdelantado: false,
    createdAt: mods.fs.serverTimestamp()
  };

  try {
    const ref = await mods.fs.addDoc(mods.fs.collection(db, LEADS_COLLECTION), prueba);
    paso('Guardar una solicitud de prueba', true,
      'Guardada con id <code>' + ref.id + '</code> en la colección <code>' + LEADS_COLLECTION + '</code>');
    terminar('<strong>Todo funciona.</strong> El formulario del sitio debería estar guardando bien. ' +
      'Entra al panel, comprueba que aparece "PRUEBA DE DIAGNOSTICO" y bórrala con el botón Borrar.');
  } catch (err) {
    const codigo = err && err.code ? err.code : 'desconocido';
    paso('Guardar una solicitud de prueba', false,
      'Firestore respondió: <code>' + codigo + '</code><br>' + (err.message || ''),
      PISTAS[codigo] || 'Error no reconocido. Copia este mensaje y pásamelo.');
    terminar('Aquí está el problema. Arregla lo que indica el recuadro rojo y recarga esta página.');
  }
})();
