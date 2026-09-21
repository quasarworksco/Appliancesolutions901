/* =========================================================
   Aviso de solicitud nueva.

   Se dispara SOLO cuando la solicitud ya quedó guardada en Firestore,
   y nunca bloquea al visitante: si el aviso falla, la solicitud igual
   está guardada y aparece en /admin.
   ========================================================= */
import { NOTIFY_URL, NOTIFY_TOKEN, CALLMEBOT } from './firebase-config.js';

function armarTexto(lead, guardado) {
  const lineas = [
    'NUEVA SOLICITUD - Appliance Solutions 901',
    ''
  ];
  if (guardado === false) {
    lineas.push('OJO: esta solicitud NO se guardo en el panel. Anotala a mano.', '');
  }
  lineas.push.apply(lineas, [
    'Nombre: ' + (lead.nombre || 'Sin nombre'),
    'Telefono: ' + (lead.telefono || 'Sin telefono'),
    'Electrodomestico: ' + (lead.electrodomestico || 'Sin especificar')
  ]);
  if (lead.marcaModelo) lineas.push('Marca/modelo: ' + lead.marcaModelo);
  if (lead.email) lineas.push('Email: ' + lead.email);
  if (lead.direccion) lineas.push('Direccion: ' + lead.direccion);
  if (lead.zona) lineas.push('Zona: ' + lead.zona);
  lineas.push('Idioma: ' + (lead.idioma === 'es' ? 'espanol' : 'ingles'));
  if (lead.mensaje) {
    lineas.push('', 'Mensaje: ' + String(lead.mensaje).slice(0, 400));
  }
  if (guardado !== false) {
    lineas.push('', 'Panel: https://appliancesolutions901.dgp-link.com/admin/');
  }
  return lineas.join('\n');
}

/**
 * Avisa de que un cliente pulsó el botón de pagar. No es prueba de pago:
 * sirve para saber a quién corresponde el cobro que llegue a Square.
 */
export function notifyPaymentIntent(lead) {
  const lineas = [
    'FUE A PAGAR LA VISITA',
    '',
    (lead.nombre || 'Sin nombre') + ' acaba de abrir el pago de $79.98.',
    '',
    'Telefono: ' + (lead.telefono || 'Sin telefono')
  ];
  if (lead.electrodomestico) lineas.push('Equipo: ' + lead.electrodomestico);
  if (lead.direccion) lineas.push('Direccion: ' + lead.direccion);
  lineas.push('');
  lineas.push('Cuando Square confirme el cobro, marca la casilla en el panel.');
  enviar(lineas.join('\n'), lead, 'intento-pago');
}

/**
 * Manda el aviso. Nunca lanza ni hace esperar al visitante.
 */
export function notifyNewLead(lead, guardado) {
  enviar(armarTexto(lead, guardado), lead, 'solicitud', guardado);
}

function enviar(texto, lead, tipo, guardado) {
  try {
    // Opción A: el script de Google reenvía a WhatsApp y al correo
    if (NOTIFY_URL) {
      fetch(NOTIFY_URL, {
        method: 'POST',
        mode: 'no-cors',
        // text/plain evita la petición previa de CORS que Apps Script no responde
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token: NOTIFY_TOKEN, texto: texto, lead: lead,
                               tipo: tipo, guardado: guardado !== false })
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
