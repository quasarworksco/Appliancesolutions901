# -*- coding: utf-8 -*-
"""Inyecta (o refresca) el bloque FAQPage de la portada a partir del FAQ visible.

El schema se arma leyendo el HTML, asi que nunca se desincroniza del texto que
ve el cliente. Correr despues de editar las preguntas:

    python3 scripts/faq_schema.py [--check]
"""
import argparse, html, io, json, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INI = '  <!-- FAQ SCHEMA (generado por scripts/faq_schema.py) -->'
FIN = '  <!-- /FAQ SCHEMA -->'
ARCHIVOS = ('index.html', 'es/index.html')


def texto_plano(fragmento):
    return ' '.join(html.unescape(re.sub(r'<[^>]+>', '', fragmento)).split())


def construir(fuente):
    pares = re.findall(
        r'<button class="faq__q".*?<span>(.*?)</span>.*?</button>\s*</h3>\s*'
        r'<div class="faq__a"[^>]*>(.*?)</div>', fuente, re.S)
    if not pares:
        raise SystemExit('no se encontraron preguntas en el FAQ')
    entradas = [
        '      { "@type": "Question", "name": %s,\n'
        '        "acceptedAnswer": { "@type": "Answer", "text": %s } }'
        % (json.dumps(texto_plano(q), ensure_ascii=False),
           json.dumps(texto_plano(a), ensure_ascii=False))
        for q, a in pares]
    return (INI + '\n  <script type="application/ld+json">\n  {\n'
            '    "@context": "https://schema.org",\n    "@type": "FAQPage",\n'
            '    "mainEntity": [\n' + ',\n'.join(entradas) + '\n    ]\n  }\n'
            '  </script>\n' + FIN), len(entradas)


def aplicar(ruta, solo_revisar):
    s = io.open(ruta, encoding='utf-8').read()
    bloque, n = construir(s)
    viejo = re.search(re.escape(INI) + r'.*?' + re.escape(FIN), s, re.S)
    nuevo = (s[:viejo.start()] + bloque + s[viejo.end():] if viejo
             else s.replace('</head>', bloque + '\n</head>', 1))
    if nuevo != s:
        if solo_revisar:
            return n, True
        io.open(ruta, 'w', encoding='utf-8').write(nuevo)
    return n, False


p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--check', action='store_true', help='falla si el schema esta desactualizado')
args = p.parse_args()
viejos = []
for nombre in ARCHIVOS:
    n, desfasado = aplicar(os.path.join(RAIZ, nombre), args.check)
    print('%s: %d preguntas en el schema%s' % (nombre, n, ' (DESACTUALIZADO)' if desfasado else ''))
    if desfasado:
        viejos.append(nombre)
if viejos:
    p.exit(1, 'Regenera el schema: python3 scripts/faq_schema.py\n')
