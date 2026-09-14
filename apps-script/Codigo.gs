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
   Solo hacen falta dos cosas:
     1. Pegar aquí abajo el token que te dio @BotFather.
     2. Agregar el bot a tu grupo.

   El id del grupo NO hay que buscarlo: el script lo detecta solo la
   primera vez (Telegram avisa cuando agregan al bot a un grupo) y lo deja
   guardado. Si prefieres fijarlo a mano, escríbelo en TELEGRAM_CHAT_ID.

   El token vive SOLO aquí, nunca en el código del sitio: con él se puede
   escribir en el grupo, así que no debe quedar público. */
const TELEGRAM_TOKEN = '';
const TELEGRAM_CHAT_ID = '';   // opcional: se detecta solo si lo dejas vacío

/* Opcional: ID de una Google Sheet para ir guardando cada solicitud.
   Es el código largo que aparece en la URL de la hoja. Vacío = no usar. */
const SHEET_ID = '';


/**
 * Abrir la URL /exec en el navegador cae aquí. Sirve para comprobar de un
 * vistazo que la VERSIÓN IMPLEMENTADA es la correcta, sin depender del sitio.
 *
 * Añadiendo ?prueba=LA_PALABRA_CLAVE manda un mensaje de prueba al grupo.
 */
function doGet(e) {
  var p = (e && e.parameter) || {};

  if (p.prueba && p.prueba === TOKEN) {
    prueba();
    return ContentService.createTextOutput(
      'Mensaje de prueba enviado. Revisa el grupo de Telegram.');
  }

  var estado = [];
  estado.push('Appliance Solutions 901 - servicio de avisos');
  estado.push('');
  estado.push('Telegram configurado: ' + (TELEGRAM_TOKEN ? 'si' : 'NO, falta el token'));
  if (TELEGRAM_TOKEN) {
    var chat = chatDelGrupo();
    estado.push('Grupo detectado: ' + (chat || 'todavia ninguno'));
  }
  estado.push('Correo configurado: ' + (EMAIL_TO ? 'si' : 'no'));
  estado.push('WhatsApp configurado: ' + (CALLMEBOT_APIKEY ? 'si' : 'no'));
  estado.push('');
  estado.push('Si arriba dice que falta el token pero en el editor ya lo pegaste,');
  estado.push('lo que falta es volver a implementar el script con una version nueva.');
  estado.push('');
  estado.push('Para mandar un mensaje de prueba al grupo, abre esta misma URL');
  estado.push('agregando al final:  ?prueba=' + TOKEN);

  return ContentService.createTextOutput(estado.join('\n'));
}


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
  if (TELEGRAM_TOKEN) {
    try {
      var chat = chatDelGrupo();
      if (!chat) {
        console.error('Telegram: todavía no sé a qué grupo escribir. ' +
                      'Agrega el bot al grupo, escribe ahí /start@NOMBREDELBOT y ' +
                      'ejecuta diagnosticarTelegram() para ver qué falta.');
      } else {
        UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage', {
          method: 'post',
          contentType: 'application/json',
          muteHttpExceptions: true,
          payload: JSON.stringify({
            chat_id: chat,
            text: mensajeTelegram(lead, guardado),
            parse_mode: 'HTML',
            disable_web_page_preview: true
          })
        });
      }
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


/**
 * Devuelve el id del grupo de Telegram.
 * Orden: lo que esté escrito arriba -> lo ya detectado -> detectarlo ahora.
 *
 * Telegram genera un aviso ("my_chat_member") en cuanto agregan el bot a un
 * grupo, así que con eso basta: no hace falta escribir ningún comando.
 */
function chatDelGrupo() {
  if (TELEGRAM_CHAT_ID) return TELEGRAM_CHAT_ID;

  var props = PropertiesService.getScriptProperties();
  var guardado = props.getProperty('TELEGRAM_CHAT_ID');

  // Los grupos tienen id negativo. Si lo guardado es una conversación
  // privada, se vuelve a mirar por si ya apareció el grupo.
  if (guardado && guardado.charAt(0) === '-') return guardado;

  var encontrado = buscarChat();
  if (guardado && !encontrado) return guardado;
  if (guardado && encontrado === guardado) return guardado;
  if (encontrado) {
    props.setProperty('TELEGRAM_CHAT_ID', encontrado);
    console.log('Grupo detectado y guardado: ' + encontrado);
  }
  return encontrado;
}


/* Busca en los avisos recientes de Telegram un grupo donde esté el bot */
function buscarChat() {
  if (!TELEGRAM_TOKEN) return '';
  try {
    var res = UrlFetchApp.fetch(
      'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/getUpdates',
      { muteHttpExceptions: true });
    var datos = JSON.parse(res.getContentText());

    if (!datos.ok) {
      console.error('Telegram rechazó la consulta: ' + (datos.description || res.getContentText()));
      return '';
    }
    if (!datos.result || !datos.result.length) {
      console.error('Telegram no tiene avisos pendientes. Escribe en el grupo el comando ' +
                    '/start@NOMBREDELBOT (con la arroba y el nombre del bot) y vuelve a ejecutar.');
      return '';
    }

    // Se recorre TODO antes de decidir: un grupo siempre gana a una
    // conversación privada, sin importar el orden en que lleguen los avisos.
    var grupo = '', privado = '';
    for (var i = 0; i < datos.result.length; i++) {
      var u = datos.result[i];
      var chat = (u.my_chat_member || u.message || u.channel_post ||
                  u.edited_message || {}).chat;
      if (!chat) continue;
      if (!grupo && (chat.type === 'group' || chat.type === 'supergroup' ||
                     chat.type === 'channel')) {
        grupo = String(chat.id);
      }
      if (!privado) privado = String(chat.id);
    }
    if (!grupo && privado) {
      console.log('Aviso: solo encuentro una conversación privada (' + privado + '). ' +
                  'Si querías el grupo, agrega el bot al grupo y escribe ahí /start@' +
                  'NOMBREDELBOT.');
    }
    return grupo || privado;
  } catch (err) {
    console.error('No se pudo consultar Telegram: ' + err);
    return '';
  }
}


/* Si alguna vez cambias de grupo, ejecuta esto para que vuelva a detectarlo */
function olvidarGrupo() {
  PropertiesService.getScriptProperties().deleteProperty('TELEGRAM_CHAT_ID');
  console.log('Listo. El próximo aviso volverá a detectar el grupo.');
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


/**
 * Diagnóstico de Telegram. Ejecútala cuando algo no cuadre: dice quién es el
 * bot, si hay un webhook estorbando y qué avisos ha recibido.
 */
function diagnosticarTelegram() {
  if (!TELEGRAM_TOKEN) {
    console.log('Falta pegar el TELEGRAM_TOKEN arriba.');
    return;
  }

  function pedir(metodo) {
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/' + metodo,
                                { muteHttpExceptions: true });
    return JSON.parse(res.getContentText());
  }

  // 1. ¿El token sirve?
  var yo = pedir('getMe');
  if (!yo.ok) {
    console.log('1) TOKEN INVÁLIDO: ' + (yo.description || 'sin detalle'));
    console.log('   Pide uno nuevo a @BotFather y pégalo arriba.');
    return;
  }
  console.log('1) Token correcto. Bot: @' + yo.result.username);

  // 2. ¿Hay un webhook robándose los avisos?
  var hook = pedir('getWebhookInfo');
  if (hook.ok && hook.result && hook.result.url) {
    console.log('2) PROBLEMA: hay un webhook configurado en ' + hook.result.url);
    console.log('   Mientras exista, getUpdates no devuelve nada. Ejecuta borrarWebhook().');
    return;
  }
  console.log('2) Sin webhook: los avisos se pueden leer.');

  // 3. ¿Qué avisos hay?
  var ups = pedir('getUpdates');
  if (!ups.ok) {
    console.log('3) Telegram rechazó getUpdates: ' + (ups.description || ''));
    return;
  }
  if (!ups.result.length) {
    console.log('3) NO HAY AVISOS. Telegram solo los guarda 24 horas.');
    console.log('   Haz esto en el grupo: escribe  /start@' + yo.result.username);
    console.log('   (con la arroba y el nombre del bot) y vuelve a ejecutar esta función.');
    return;
  }
  console.log('3) Avisos recibidos: ' + ups.result.length);
  var vistos = {};
  ups.result.forEach(function (u) {
    var chat = (u.my_chat_member || u.message || u.channel_post || u.edited_message || {}).chat;
    if (chat && !vistos[chat.id]) {
      vistos[chat.id] = true;
      console.log('   - ' + chat.type + '  id ' + chat.id +
                  '  ' + (chat.title || chat.username || ''));
    }
  });

  // 4. ¿Qué va a usar el script?
  var elegido = chatDelGrupo();
  console.log(elegido
    ? '4) Los avisos se enviarán al chat ' + elegido
    : '4) Ninguno sirve todavía. Agrega el bot a un GRUPO y escribe ahí /start@' + yo.result.username);
}


/* Borra un webhook que esté impidiendo leer los avisos */
function borrarWebhook() {
  if (!TELEGRAM_TOKEN) { console.log('Falta el token.'); return; }
  var res = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/deleteWebhook?drop_pending_updates=false',
    { muteHttpExceptions: true });
  console.log(res.getContentText());
}


/* Comprobación opcional: dice si el bot ya sabe a qué grupo escribir.
   No hace falta ejecutarla, el script lo detecta solo. */
function obtenerChatId() {
  if (!TELEGRAM_TOKEN) {
    console.log('Primero pega el TELEGRAM_TOKEN arriba.');
    return;
  }
  var yaSabe = chatDelGrupo();
  if (yaSabe) {
    console.log('Todo listo: los avisos van al grupo ' + yaSabe);
    return;
  }
  console.log('Todavía no encuentro el grupo. Revisa que el bot esté dentro.');
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
