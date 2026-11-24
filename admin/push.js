import { PANEL_PUSH_URL } from '../js/firebase-config.js?v=push-1';

export function setupPanelPush(auth) {
  const activate = document.getElementById('pushEnable');
  const test = document.getElementById('pushTest');
  const disable = document.getElementById('pushDisable');
  const status = document.getElementById('pushStatus');
  const available = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const needsInstall = ios && !navigator.standalone && !matchMedia('(display-mode: standalone)').matches;
  let busy = false;
  let manager;
  let publicKey;
  let subscription;

  function render() {
    activate.disabled = busy || !publicKey || Notification.permission === 'denied';
    test.hidden = disable.hidden = !subscription;
    disable.disabled = busy;
    test.disabled = busy || !available || Notification.permission !== 'granted';
    activate.textContent = subscription ? 'Reactivar avisos' : 'Permitir avisos';
  }

  async function call(path, current) {
    const response = await fetch(PANEL_PUSH_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await auth.currentUser.getIdToken() },
      body: JSON.stringify({ subscription: current.toJSON() })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo completar la operación.');
  }

  async function remove() {
    if (!subscription) return;
    const current = subscription;
    // El dispositivo deja de recibir incluso si el borrado remoto falla.
    await current.unsubscribe();
    subscription = null;
    render();
    await call('/disable', current);
  }

  function action(button, run) {
    button.addEventListener('click', async () => {
      if (busy || !auth.currentUser) return;
      busy = true;
      render();
      try { await run(); }
      catch (error) { status.textContent = error.message || 'No se pudo completar la operación.'; }
      finally { busy = false; render(); }
    });
  }

  action(activate, async () => {
    if (await Notification.requestPermission() !== 'granted') {
      status.textContent = 'Permiso pendiente. Si lo bloqueaste, revisa Ajustes → Notificaciones.';
      return;
    }
    if (subscription) {
      const old = subscription;
      await old.unsubscribe();
      subscription = null;
      await call('/disable', old).catch(() => {});
    }
    const current = await manager.subscribe({
      userVisibleOnly: true, applicationServerKey: publicKey
    });
    try { await call('/enable', current); }
    catch (error) {
      await current.unsubscribe();
      throw error;
    }
    subscription = current;
    status.textContent = 'Avisos activos. Pulsa Enviar prueba y verifica el sonido en Ajustes → Notificaciones.';
  });

  action(test, async () => {
    await call('/test', subscription);
    status.textContent = 'Prueba aceptada por el servicio push. Revisa las notificaciones del dispositivo.';
  });

  action(disable, async () => {
    await remove();
    status.textContent = 'Avisos desactivados en este dispositivo.';
  });

  status.textContent = needsInstall ? 'En Safari, agrega este panel a Inicio y ábrelo desde el icono.'
    : !available ? 'Este navegador no admite notificaciones push.'
    : !PANEL_PUSH_URL ? 'Falta configurar el servicio de avisos.'
    : 'Conectando con el servicio de avisos…';
  render();
  if (available && !needsInstall && PANEL_PUSH_URL) {
    (async () => {
      await navigator.serviceWorker.register('/admin/push-worker.js', { scope: '/admin/' });
      manager = (await navigator.serviceWorker.ready).pushManager;
      const response = await fetch(PANEL_PUSH_URL + '/public-key');
      if (!response.ok) throw new Error('No se pudo obtener la clave pública de Web Push.');
      const { key } = await response.json();
      if (!key) throw new Error('Falta configurar la clave pública de Web Push.');
      subscription = await manager.getSubscription();
      publicKey = key;
      status.textContent = Notification.permission === 'denied' ? 'Permiso bloqueado. Revisa Ajustes → Notificaciones.'
        : subscription ? 'Este dispositivo tiene una suscripción. Puedes enviar una prueba.'
        : 'Recibe un aviso al guardarse una nueva solicitud.';
    })().catch(error => { status.textContent = error.message; }).finally(render);
  }

  return async () => {
    if (busy) throw new Error('Espera a que termine la operación de avisos.');
    await remove();
  };
}
