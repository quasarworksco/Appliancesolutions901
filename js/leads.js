/* =========================================================
   Guarda las solicitudes del formulario en Firestore.

   Se carga como módulo y expone window.AS901.saveLead() para que
   js/script.js (que es un script clásico) pueda usarlo.
   Si Firestore no responde, script.js cae al respaldo por correo,
   así no se pierde ninguna solicitud.
   ========================================================= */
import { firebaseConfig, FIREBASE_SDK, LEADS_COLLECTION, PANEL_PUSH_URL } from './firebase-config.js?v=push-requests-1';
import { notifyNewLead, notifyPaymentIntent } from './notify.js';

const CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK}`;

let dbPromise = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { initializeApp } = await import(`${CDN}/firebase-app.js`);
      const firestore = await import(`${CDN}/firebase-firestore.js`);
      const app = initializeApp(firebaseConfig);
      return { db: firestore.getFirestore(app), firestore };
    })();
  }
  return dbPromise;
}

function recortar(valor, max) {
  return String(valor == null ? '' : valor).trim().slice(0, max);
}

/**
 * Guarda una solicitud. Devuelve true si quedó registrada.
 * Nunca lanza: si algo falla, devuelve false y quien llama decide el respaldo.
 */
async function saveLead(datos) {
  // Los datos se arman primero, sin depender del SDK: así el aviso al dueño
  // puede salir aunque Firestore falle y la solicitud no se pierda.
  const solicitud = {
    nombre: recortar(datos.nombre, 120),
    telefono: recortar(datos.telefono, 40),
    email: recortar(datos.email, 160),
    electrodomestico: recortar(datos.electrodomestico, 60),
    mensaje: recortar(datos.mensaje, 2000),
    marcaModelo: recortar(datos.marcaModelo, 120),
    direccion: recortar(datos.direccion, 200),
    zona: recortar(datos.zona, 60),
    idioma: datos.idioma === 'es' ? 'es' : 'en',
    origen: recortar(datos.origen || 'formulario-contacto', 40),
    estado: 'nueva',
    notas: '',
    pagoAdelantado: false
  };

  let guardado = false;
  let leadId;
  try {
    const { db, firestore } = await getDb();
    const { collection, doc, setDoc, serverTimestamp, writeBatch } = firestore;
    const lead = doc(collection(db, LEADS_COLLECTION));
    const data = { ...solicitud, createdAt: serverTimestamp() };
    let pushReceipt = false;
    if (PANEL_PUSH_URL) {
      const batch = writeBatch(db);
      batch.set(lead, data);
      batch.set(doc(db, 'leadPushReceipts', lead.id), { createdAt: serverTimestamp() });
      try {
        await batch.commit();
        pushReceipt = true;
      } catch (error) {
        if (error.code !== 'permission-denied') throw error;
        // Durante el despliegue, las reglas anteriores todavía permiten guardar la solicitud.
        await setDoc(lead, data);
      }
    } else {
      await setDoc(lead, data);
    }
    leadId = lead.id;
    guardado = true;
    if (pushReceipt) {
      fetch(PANEL_PUSH_URL + '/new-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId }), keepalive: true
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[AS901] No se pudo guardar la solicitud en Firestore:', err);
  }

  // El aviso sale SIEMPRE, se haya guardado o no. Si no se guardó, el mensaje
  // lo advierte para que la solicitud se registre a mano.
  try {
    notifyNewLead(solicitud, guardado, leadId);
  } catch (err) {
    console.warn('[AS901] Falló el aviso:', err);
  }

  return guardado;
}

window.AS901 = Object.assign(window.AS901 || {}, { saveLead, notifyPaymentIntent });

// Avisa a script.js que ya puede contar con el guardado en base de datos
document.dispatchEvent(new CustomEvent('as901:leads-ready'));
