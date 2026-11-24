// Web Push (RFC 8291 and RFC 8292), adapted from the ADV DGP Worker.
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const desB64u = s => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4)), c => c.charCodeAt(0));
export const vapidPublica = jwk => b64u(new Uint8Array([4, ...desB64u(jwk.x), ...desB64u(jwk.y)]));
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}
const junta = (...a) => { const out = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; a.forEach(x => { out.set(x, i); i += x.length; }); return out; };
const txt = s => new TextEncoder().encode(s);
// Cifrado aes128gcm (RFC 8291) del contenido para un celular
export async function cifrarPush(sub, datos) {
  const uaPub = desB64u(sub.keys.p256dh), auth = desB64u(sub.keys.auth);
  const efimera = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', efimera.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const secreto = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, efimera.privateKey, 256));
  const ikm = await hkdf(auth, secreto, junta(txt('WebPush: info\0'), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, txt('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, txt('Content-Encoding: nonce\0'), 12);
  const clave = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, clave, junta(txt(JSON.stringify(datos)), new Uint8Array([2]))));
  return junta(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([65]), asPub, cifrado);
}
export async function firmaVapid(jwk, endpoint) {
  const aud = new URL(endpoint).origin;
  const cab = b64u(txt(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const cuerpo = b64u(txt(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:Appliancesolutions901@gmail.com' })));
  const k = await crypto.subtle.importKey('jwk', { ...jwk, key_ops: ['sign'] }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, txt(`${cab}.${cuerpo}`));
  return `vapid t=${cab}.${cuerpo}.${b64u(firma)}, k=${vapidPublica(jwk)}`;
}
