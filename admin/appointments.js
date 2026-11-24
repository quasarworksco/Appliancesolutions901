export const WINDOWS = {
  '09': '9:00 a. m.–11:00 a. m.',
  '11': '11:00 a. m.–1:00 p. m.',
  '13': '1:00 p. m.–3:00 p. m.',
  '15': '3:00 p. m.–5:00 p. m.'
};

export function centralToday() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Chicago' }).format(new Date());
}

export async function updateAppointment(fs, db, leadsCollection, id, target, { removeLead, state } = {}) {
  const ref = fs.doc(db, leadsCollection, id);
  const slot = (date, window) => fs.doc(db, 'appointmentSlots', date + '_' + window);
  return fs.runTransaction(db, async transaction => {
    const current = await transaction.get(ref);
    if (!current.exists()) throw new Error('Esta solicitud ya no existe.');
    const data = current.data();
    if (target && (data.estado === 'terminada' || data.estado === 'perdida')) {
      throw new Error('Reabre la solicitud antes de programar una cita.');
    }
    const oldSlot = data.citaFecha && Object.hasOwn(WINDOWS, data.citaTurno) ? slot(data.citaFecha, data.citaTurno) : null;
    const newSlot = target ? slot(target.date, target.window) : null;
    const previous = oldSlot ? await transaction.get(oldSlot) : null;
    const next = newSlot && newSlot.id !== oldSlot?.id ? await transaction.get(newSlot) : previous;
    if (newSlot && next?.exists() && next.data().leadId !== id) {
      throw new Error('Ese turno ya está ocupado. Selecciona otro.');
    }
    if (oldSlot && oldSlot.id !== newSlot?.id && previous.exists() && previous.data().leadId === id) {
      transaction.delete(oldSlot);
    }
    if (removeLead) {
      transaction.delete(ref);
    } else if (newSlot) {
      transaction.set(newSlot, { leadId: id });
      transaction.update(ref, { citaFecha: target.date, citaTurno: target.window, estado: 'agendada' });
    } else {
      transaction.update(ref, {
        citaFecha: fs.deleteField(), citaTurno: fs.deleteField(),
        estado: state || (data.estado === 'agendada' ? 'contactada' : data.estado)
      });
    }
  });
}
