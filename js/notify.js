/* =========================================================
   Aviso de solicitud nueva.

   Se dispara SOLO cuando la solicitud ya quedó guardada en Firestore,
   y nunca bloquea al visitante: si el aviso falla, la solicitud igual
   está guardada y aparece en /admin.
   ========================================================= */
import { NOTIFY_URL, NOTIFY_TOKEN, CALLMEBOT } from './firebase-config.js';

function armarTexto(lead) {
  const lineas = [
    'NUEVA SOLICITUD - Appliance Solutions 901',
    '',
    'Nombre: ' + (lead.nombre || 'Sin nombre'),
    'Telefono: ' + (lead.telefono || 'Sin telefono'),
    'Electrodomestico: ' + (lead.electrodomestico || 'Sin especificar')
  ];
  if (lead.email) lineas.push('Email: ' + lead.email);
  if (lead.zona) lineas.push('Zona: ' + lead.zona);
  lineas.push('Idioma: ' + (lead.idioma === 'es' ? 'espanol' : 'ingles'));
  if (lead.mensaje) {
    lineas.push('', 'Mensaje: ' + String(lead.mensaje).slice(0, 400));
  }
  lineas.push('', 'Panel: https://appliancesolutions901.dgp-link.com/admin/');
  return lineas.join('\n');
}

/**
 * Manda el aviso. Nunca lanza ni hace esperar al visitante.
 */
export function notifyNewLead(lead) {
  const texto = armarTexto(lead);

  try {
    // Opción A: el script de Google reenvía a WhatsApp y al correo
    if (NOTIFY_URL) {
      fetch(NOTIFY_URL, {
        method: 'POST',
        mode: 'no-cors',
        // text/plain evita la petición previa de CORS que Apps Script no responde
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token: NOTIFY_TOKEN, texto: texto, lead: lead })
      }).catch(function () { /* el aviso es opcional */ });
      return;
    }

    // Opción B: CallMeBot directo (la clave queda visible en el código)
    if (CALLMEBOT && CALLMEBOT.apikey) {
      const url = 'https://api.callmebot.com/whatsapp.php'
        + '?phone=' + encodeURIComponent(CALLMEBOT.phone)
        + '&apikey=' + encodeURIComponent(CALLMEBOT.apikey)
        + '&text=' + encodeURIComponent(texto);
      fetch(url, { mode: 'no-cors' }).catch(function () { /* el aviso es opcional */ });
    }
  } catch (err) {
    console.warn('[AS901] No se pudo enviar el aviso:', err);
  }
}
