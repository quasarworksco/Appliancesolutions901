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

    avisar(datos.texto || 'Nueva solicitud en el sitio', datos.lead || {});
    return ContentService.createTextOutput('ok');

  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput('error');
  }
}


function avisar(texto, lead) {
  // 1) WhatsApp
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

  // 2) Correo de respaldo
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

  // 3) Copia en la hoja de cálculo
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


/* Ejecuta esta función desde el editor para comprobar que todo llega */
function prueba() {
  avisar(
    'PRUEBA - Appliance Solutions 901\n\n'
    + 'Nombre: Cliente de Prueba\n'
    + 'Telefono: 901-555-0000\n'
    + 'Electrodomestico: Refrigerador\n\n'
    + 'Si estás leyendo esto, los avisos funcionan.',
    { nombre: 'Cliente de Prueba', telefono: '901-555-0000',
      electrodomestico: 'Refrigerador', idioma: 'es' }
  );
}
