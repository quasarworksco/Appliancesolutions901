# -*- coding: utf-8 -*-
"""Enlaza las pastillas de la seccion de zonas de la portada a su pagina de localidad.

Solo toca las pastillas cuyo nombre coincide con una localidad de locations.py;
las que no tienen pagina (barrios sueltos, condados) se quedan como texto.
Correr despues de generate_local_seo.py: python3 scripts/link_area_chips.py
"""
import io, os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, 'scripts'))
sys.dont_write_bytecode = True
from locations import LOCATIONS            # noqa: E402

POR_NOMBRE = {nombre: slug for slug, nombre, *_ in LOCATIONS}
RUTA = {'en': '/service-areas/%s/', 'es': '/es/zonas/%s/'}


def enlazar(archivo, idioma):
    s = io.open(archivo, encoding='utf-8').read()
    ini = s.index('id="zonas"')
    fin = s.index('</section>', ini)
    bloque = s[ini:fin]
    hechos = [0]

    def cambia(m):
        nombre = m.group(1).strip()
        slug = POR_NOMBRE.get(nombre)
        if not slug:
            return m.group(0)
        hechos[0] += 1
        return ('<li class="area-card__linked"><a href="%s">%s</a></li>'
                % (RUTA[idioma] % slug, nombre))

    nuevo = re.sub(r'<li>([^<]+)</li>', cambia, bloque)
    io.open(archivo, 'w', encoding='utf-8').write(s[:ini] + nuevo + s[fin:])
    return hechos[0]


for nombre, idioma in (('index.html', 'en'), ('es/index.html', 'es')):
    ruta = os.path.join(RAIZ, nombre)
    print('%s: %d pastillas enlazadas' % (nombre, enlazar(ruta, idioma)))
