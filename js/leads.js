/* =========================================================
   Guarda las solicitudes del formulario en Firestore.

   Se carga como módulo y expone window.AS901.saveLead() para que
   js/script.js (que es un script clásico) pueda usarlo.
   Si Firestore no responde, script.js cae al respaldo por correo,
   así no se pierde ninguna solicitud.
   ========================================================= */
import { firebaseConfig, FIREBASE_SDK, LEADS_COLLECTION } from './firebase-config.js';
import { notifyNewLead } from './notify.js';

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
  try {
    const { db, firestore } = await getDb();
    const { collection, addDoc, serverTimestamp } = firestore;

    const datosLead = {
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
      pagoAdelantado: false,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, LEADS_COLLECTION), datosLead);

    // Aviso al dueño. Va después de guardar y no bloquea la respuesta.
    notifyNewLead(datosLead);

    return true;
  } catch (err) {
    console.error('[AS901] No se pudo guardar la solicitud en Firestore:', err);
    return false;
  }
}

window.AS901 = Object.assign(window.AS901 || {}, { saveLead });

// Avisa a script.js que ya puede contar con el guardado en base de datos
document.dispatchEvent(new CustomEvent('as901:leads-ready'));
