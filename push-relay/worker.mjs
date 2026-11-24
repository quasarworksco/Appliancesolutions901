import { cifrarPush, firmaVapid, vapidPublica } from './web-push.mjs';

const ORIGIN = 'https://appliancesolution901.com';
const RECEIPT_URL = 'https://firestore.googleapis.com/v1/projects/yeanochoa-4b1c9/databases/(default)/documents/leadPushReceipts/';
const DEVICE_PREFIX = 'device:';
const DEVICE_LIMIT = 20;
const TEST_COOLDOWN_MS = 5000;

function json(data, status = 200) {
  return Response.json(data, { status, headers: {
    'Access-Control-Allow-Origin': ORIGIN,
    'Cache-Control': 'no-store'
  } });
}

function validSubscription(sub) {
  if (typeof sub?.endpoint !== 'string' || sub.endpoint.length > 2048) return false;
  let url;
  try { url = new URL(sub.endpoint); } catch { return false; }
  const host = url.hostname;
  const knownHost = host === 'fcm.googleapis.com' || host === 'updates.push.services.mozilla.com'
    || host === 'web.push.apple.com' || /^[a-z0-9-]+\.push\.apple\.com$/.test(host);
  return knownHost && url.protocol === 'https:' && !url.port && !url.username && !url.password
    && !url.hash && /^[A-Za-z0-9_-]{87}$/.test(sub.keys?.p256dh)
    && /^[A-Za-z0-9_-]{22}$/.test(sub.keys?.auth);
}

async function deviceKey(endpoint) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return DEVICE_PREFIX + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function isAdmin(request, env) {
  const idToken = request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];
  if (!idToken || !env.PUSH_ADMIN_UID || !env.FIREBASE_API_KEY) return false;
  const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='
    + encodeURIComponent(env.FIREBASE_API_KEY), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
  });
  if (!response.ok) return false;
  const { users } = await response.json();
  return users?.[0]?.localId === env.PUSH_ADMIN_UID && !users[0].disabled;
}

async function push(env, jwk, key, subscription, payload) {
  if (!validSubscription(subscription)) return { ok: false, status: 400 };
  const result = await fetch(subscription.endpoint, {
    method: 'POST', redirect: 'manual', headers: {
      Authorization: await firmaVapid(jwk, subscription.endpoint),
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
      TTL: payload.kind === 'test' ? '120' : '3600', Urgency: 'high'
    },
    body: await cifrarPush(subscription, payload)
  });
  if (result.status === 404 || result.status === 410) await env.DEVICES.delete(key);
  return { ok: result.ok, status: result.status };
}

async function handle(request, env) {
  const route = new URL(request.url).pathname;
  const origin = request.headers.get('Origin');
  if (origin && origin !== ORIGIN) return json({ error: 'Origen inválido.' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type'
  } });
  if (!env.VAPID_PRIVATE_JWK) return json({ error: 'Falta configurar Web Push.' }, 503);
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  if (route === '/public-key' && request.method === 'GET') return json({ key: vapidPublica(jwk) });
  if (request.method !== 'POST' || !['/lead', '/new-request', '/enable', '/disable', '/test'].includes(route)) {
    return json({ error: 'Ruta desconocida.' }, 404);
  }
  if (route === '/lead' || route === '/new-request') {
    const { id } = await request.json();
    if (typeof id !== 'string' || !/^[A-Za-z0-9]{20}$/.test(id)) return json({ error: 'Solicitud inválida.' }, 400);
    if (route === '/new-request') {
      if (origin !== ORIGIN) return json({ error: 'Origen inválido.' }, 403);
      const receipt = await fetch(RECEIPT_URL + id, { redirect: 'manual' });
      if (!receipt.ok) {
        console.warn('Web Push receipt lookup rejected:', receipt.status);
        return json({ error: 'No se pudo verificar el recibo.' }, 403);
      }
      const doc = await receipt.json();
      const age = Date.now() - Date.parse(doc.fields?.createdAt?.timestampValue);
      if (!Number.isFinite(age) || age < -30000 || age > 300000) {
        return json({ error: 'El recibo no es reciente.' }, 403);
      }
    } else {
      const provided = request.headers.get('Authorization') || '';
      const expected = 'Bearer ' + env.PUSH_RELAY_SECRET;
      const encode = value => new TextEncoder().encode(value);
      const [a, b] = await Promise.all([provided, expected].map(value => crypto.subtle.digest('SHA-256', encode(value))));
      if (!env.PUSH_RELAY_SECRET || !crypto.subtle.timingSafeEqual(a, b)) return json({ error: 'Acceso denegado.' }, 403);
    }
    const sentKey = 'sent:' + id;
    if (await env.DEVICES.get(sentKey)) return json({ accepted: 0 });
    await env.DEVICES.put(sentKey, '1', { expirationTtl: 600 });
    const { keys } = await env.DEVICES.list({ prefix: DEVICE_PREFIX, limit: DEVICE_LIMIT });
    const results = await Promise.allSettled(keys.map(async ({ name }) =>
      push(env, jwk, name, await env.DEVICES.get(name, 'json'), { kind: 'lead', id })));
    const accepted = results.filter(result => result.status === 'fulfilled' && result.value.ok).length;
    console.info('Web Push receipt verified:', { devices: keys.length, accepted });
    return json({ accepted });
  }
  if (!await isAdmin(request, env)) return json({ error: 'Entra con la cuenta autorizada del panel.' }, 403);
  const { subscription } = await request.json();
  if (!validSubscription(subscription)) return json({ error: 'Suscripción inválida.' }, 400);
  const key = await deviceKey(subscription.endpoint);
  if (route === '/enable') {
    const devices = await env.DEVICES.list({ prefix: DEVICE_PREFIX, limit: DEVICE_LIMIT });
    if (devices.keys.length >= DEVICE_LIMIT && !devices.keys.some(item => item.name === key)) {
      return json({ error: 'Alcanzaste el límite de dispositivos.' }, 409);
    }
    await env.DEVICES.put(key, JSON.stringify({ endpoint: subscription.endpoint, keys: subscription.keys }));
    return json({ ok: true });
  }
  if (route === '/disable') {
    await env.DEVICES.delete(key);
    return json({ ok: true });
  }
  // La prueba usa la suscripción del dispositivo actual. KV puede tardar en propagar un alta.
  const rateKey = 'test:' + key;
  const lastTest = Number(await env.DEVICES.get(rateKey));
  if (Date.now() - lastTest < TEST_COOLDOWN_MS) {
    return json({ error: 'Espera cinco segundos entre pruebas.' }, 429);
  }
  let delivery;
  try {
    delivery = await push(env, jwk, key, subscription, { kind: 'test', id: String(Date.now()) });
  } catch (error) {
    console.warn('Web Push test failed before provider response:', error.name);
    return json({ error: 'Cloudflare no pudo preparar o enviar la prueba (PUSH-TRANSPORT).' }, 502);
  }
  if (!delivery.ok) {
    const renew = [401, 403, 404, 410].includes(delivery.status) ? ' Pulsa Reactivar avisos y vuelve a probar.' : '';
    return json({ error: `El proveedor push rechazó la prueba (HTTP ${delivery.status}).${renew}` }, 502);
  }
  // Un problema al registrar el límite no convierte un envío aceptado en un error.
  await env.DEVICES.put(rateKey, String(Date.now()), { expirationTtl: 60 }).catch(error => {
    console.warn('Web Push cooldown was not saved:', error.name);
  });
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    try { return await handle(request, env); }
    catch { return json({ error: 'No se pudo completar la operación de avisos.' }, 500); }
  }
};
