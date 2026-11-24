self.addEventListener('notificationclick', (event) => {
  if (event.notification.data?.panel !== true) return;
  event.notification.close();
  event.waitUntil((async () => {
    const panels = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const panel = panels.find((client) => new URL(client.url).pathname === '/admin/');
    return panel ? panel.focus() : self.clients.openWindow('/admin/');
  })());
});

function showPanelNotification({ kind, id } = {}) {
  if (!['test', 'lead'].includes(kind) || !id) return;
  return self.registration.showNotification(
    kind === 'test' ? 'Prueba de notificaciones' : 'Nueva solicitud de servicio',
    {
      body: kind === 'test' ? 'Los avisos del panel están funcionando.' : 'Abre el panel para revisar la solicitud.',
      icon: '/images/apple-touch-icon.png',
      tag: 'as901-' + kind + '-' + id,
      data: { panel: true }
    }
  );
}

self.addEventListener('push', (event) => {
  let payload;
  try { payload = event.data?.json(); } catch { return; }
  event.waitUntil(showPanelNotification(payload));
});
