/**
 * Aviso de solicitudes nuevas — Appliance Solutions 901
 *
 * Recibe la solicitud desde el sitio y te avisa por WhatsApp (CallMeBot)
 * y por correo. Opcionalmente la guarda en una Google Sheet.
 *
 * Todo lo de aquí es gratuito: no necesita el plan Blaze de Firebase
 * ni tarjeta de crédito.
 *
 * ---------------------------------------------------------------
 * CÓMO INSTALARLO (5 minutos)
 *
 * 1. Entra a https://script.google.com y crea un proyecto nuevo.
 * 2. Borra lo que traiga y pega TODO este archivo.
 * 3. Rellena las cuatro constantes de abajo.
 * 4. Implementar -> Nueva implementación -> tipo "Aplicación web":
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier usuario
 *    Autoriza los permisos que pida (son para enviar el correo).
 * 5. Copia la URL que te da (termina en /exec) y pégala en
 *    js/firebase-config.js, en NOTIFY_URL.
 *
 * Para probar sin llenar el formulario: ejecuta la función prueba()
 * desde el editor y revisa tu WhatsApp y tu correo.
 * ---------------------------------------------------------------
 */

/* Tu número de WhatsApp con código de país, sin + ni espacios */
const WHATSAPP_PHONE = '19016862035';

/* La clave que te da CallMeBot al activar el servicio.
   Se obtiene en https://www.callmebot.com/blog/free-api-whatsapp-messages/
   siguiendo los pasos que indican ahí (mandarle un mensaje a su número
   de activación y esperar la clave). Déjala vacía para no usar WhatsApp. */
const CALLMEBOT_APIKEY = '';

/* Correo donde quieres el respaldo. Vacío para no enviar correo. */
const EMAIL_TO = 'Appliancesolutions901@gmail.com';

/* Debe ser idéntica a NOTIFY_TOKEN en js/firebase-config.js */
const TOKEN = 'as901-aviso';

/* ---------- TELEGRAM ----------
   1. En Telegram habla con @BotFather, manda /newbot y sigue los pasos.
      Te devuelve un token con esta pinta: 123456789:AAH...
   2. Agrega el bot a tu grupo (Añadir miembro -> busca el nombre del bot).
   3. Escribe cualquier mensaje en el grupo.
   4. Pega el token abajo, guarda, y ejecuta la función obtenerChatId()
      desde el editor. En el registro te va a aparecer el id del grupo
      (empieza con guión, por ejemplo -1001234567890). Pégalo abajo.

   El token vive SOLO aquí, nunca en el código del sitio: con él se puede
   leer y escribir en el grupo, así que no debe quedar público. */
const TELEGRAM_TOKEN = '';
const TELEGRAM_CHAT_ID = '';

/* Opcional: ID de una Google Sheet para ir guardando cada solicitud.
   Es el código largo que aparece en la URL de la hoja. Vacío = no usar. */
const SHEET_ID = '';


function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);

    // Ignora peticiones que no vengan del sitio
    if (datos.token !== TOKEN) {
      return ContentService.createTextOutput('token invalido');
    }

    avisar(datos.texto || 'Nueva solicitud en el sitio', datos.lead || {},
           datos.guardado !== false);
    return ContentService.createTextOutput('ok');

  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput('error');
  }
}


function avisar(texto, lead, guardado) {
  // 1) Telegram
  if (TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
    try {
      UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
        method: 'post',
        contentType: 'application/json',
        muteHttpExceptions: true,
        payload: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: mensajeTelegram(lead, guardado),
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      });
    } catch (err) {
      console.error('Telegram falló: ' + err);
    }
  }

  // 2) WhatsApp
  if (CALLMEBOT_APIKEY) {
    var url = 'https://api.callmebot.com/whatsapp.php'
      + '?phone=' + encodeURIComponent(WHATSAPP_PHONE)
      + '&apikey=' + encodeURIComponent(CALLMEBOT_APIKEY)
      + '&text=' + encodeURIComponent(texto);
    try {
      UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    } catch (err) {
      console.error('WhatsApp falló: ' + err);
    }
  }

  // 3) Correo de respaldo
  if (EMAIL_TO) {
    try {
      MailApp.sendEmail({
        to: EMAIL_TO,
        subject: 'Nueva solicitud: ' + (lead.electrodomestico || 'sitio web')
                 + ' - ' + (lead.nombre || 'sin nombre'),
        body: texto
      });
    } catch (err) {
      console.error('Correo falló: ' + err);
    }
  }

  // 4) Copia en la hoja de cálculo
  if (SHEET_ID) {
    try {
      var hoja = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
      if (hoja.getLastRow() === 0) {
        hoja.appendRow(['Fecha', 'Nombre', 'Teléfono', 'Email',
                        'Electrodoméstico', 'Zona', 'Idioma', 'Mensaje']);
      }
      hoja.appendRow([
        new Date(), lead.nombre || '', lead.telefono || '', lead.email || '',
        lead.electrodomestico || '', lead.zona || '', lead.idioma || '',
        lead.mensaje || ''
      ]);
    } catch (err) {
      console.error('Hoja falló: ' + err);
    }
  }
}


/* Mensaje con formato para el grupo de Telegram */
function mensajeTelegram(lead, guardado) {
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  var l = [];
  l.push('<b>NUEVA SOLICITUD</b>');
  if (guardado === false) {
    l.push('<b>OJO: no se guardó en el panel. Anótala a mano.</b>');
  }
  l.push('');
  l.push('<b>' + esc(lead.nombre || 'Sin nombre') + '</b>');

  var tel = String(lead.telefono || '').replace(/\D/g, '');
  if (tel) {
    l.push('Teléfono: <a href="tel:' + tel + '">' + esc(lead.telefono) + '</a>');
    l.push('WhatsApp: https://wa.me/1' + tel.slice(-10));
  }
  if (lead.email) l.push('Email: ' + esc(lead.email));
  l.push('');
  l.push('Equipo: ' + esc(lead.electrodomestico || 'Sin especificar')
         + (lead.marcaModelo ? ' — ' + esc(lead.marcaModelo) : ''));
  if (lead.direccion) {
    l.push('Dirección: ' + esc(lead.direccion));
    l.push('Mapa: https://www.google.com/maps/search/?api=1&query='
           + encodeURIComponent(lead.direccion + ' Memphis TN'));
  }
  if (lead.mensaje) {
    l.push('');
    l.push('<i>' + esc(String(lead.mensaje).slice(0, 700)) + '</i>');
  }
  l.push('');
  l.push('Escribió en ' + (lead.idioma === 'es' ? 'español' : 'inglés'));
  if (guardado !== false) {
    l.push('Panel: https://appliancesolutions901.dgp-link.com/admin/');
  }
  return l.join('\n');
}


/* Ejecútala una vez, después de agregar el bot al grupo y escribir ahí un
   mensaje. Muestra en el registro el id del grupo para pegarlo arriba. */
function obtenerChatId() {
  if (!TELEGRAM_TOKEN) {
    console.log('Primero pega el TELEGRAM_TOKEN arriba.');
    return;
  }
  var res = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/getUpdates',
    { muteHttpExceptions: true });
  var datos = JSON.parse(res.getContentText());

  if (!datos.ok) {
    console.log('Telegram respondió con error. Revisa el token.');
    console.log(res.getContentText());
    return;
  }
  if (!datos.result || !datos.result.length) {
    console.log('No hay mensajes todavía. Escribe algo en el grupo con el bot dentro y vuelve a ejecutar.');
    return;
  }
  var vistos = {};
  datos.result.forEach(function (u) {
    var chat = (u.message || u.channel_post || {}).chat;
    if (chat && !vistos[chat.id]) {
      vistos[chat.id] = true;
      console.log('chat_id: ' + chat.id + '   (' + (chat.title || chat.username || chat.type) + ')');
    }
  });
  console.log('Copia el id que corresponde a tu grupo y pégalo en TELEGRAM_CHAT_ID.');
}


/* Ejecuta esta función desde el editor para comprobar que todo llega */
function prueba() {
  avisar(
    'PRUEBA - Appliance Solutions 901\n\n'
    + 'Nombre: Cliente de Prueba\n'
    + 'Telefono: 901-555-0000\n'
    + 'Electrodomestico: Refrigerador\n\n'
    + 'Si estás leyendo esto, los avisos funcionan.',
    { nombre: 'Cliente de Prueba', telefono: '901-555-0000',
      electrodomestico: 'Refrigerador', marcaModelo: 'Whirlpool WRS325',
      direccion: '1234 Poplar Ave, Memphis, TN 38118',
      mensaje: 'Si estás leyendo esto, los avisos funcionan.', idioma: 'es' },
    true
  );
}
