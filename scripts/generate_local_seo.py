"""Build static service-area pages and the production sitemap for GitHub Pages."""

import argparse
import json
import sys
from html import escape
from pathlib import Path
from xml.etree import ElementTree as ET

sys.dont_write_bytecode = True
from locations import LOCATIONS

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://" + (ROOT / "CNAME").read_text().strip()
BUSINESS = "Appliance Solutions 901"
NAMES = {slug: name for slug, name, *_ in LOCATIONS}
LANGUAGES = ("en", "es")
SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML_NS = "http://www.w3.org/1999/xhtml"


def location_path(slug, lang):
    return f"/es/zonas/{slug}/" if lang == "es" else f"/service-areas/{slug}/"


def alternate_urls(paths):
    return {"en": ORIGIN + paths[0], "es": ORIGIN + paths[1], "x-default": ORIGIN + paths[0]}


def render_location(location, lang):
    slug, name, place_type, nearby, english, spanish = location
    es = lang == "es"
    note = spanish if es else english
    home = "/es/" if es else "/"
    terms = "/es/terminos.html" if es else "/terms.html"
    paths = [location_path(slug, language) for language in LANGUAGES]
    alternates = alternate_urls(paths)
    url = alternates[lang]
    area = f"{name}, Memphis, TN" if name != "Memphis" and place_type == "Place" else f"{name}, TN"
    heading = f"Reparación de electrodomésticos en {area}" if es else f"Appliance Repair in {area}"
    title = heading + " | " + BUSINESS
    desc = (
        f"Reparación a domicilio de refrigeradores, lavadoras, secadoras y más en {area}. Llama al 901-686-2035 para confirmar cobertura y solicitar una cita."
        if es else
        f"In-home refrigerator, washer, dryer and other appliance repair in {area}. Call 901-686-2035 to confirm coverage and request an appointment."
    )
    lead = (
        f"Vamos a tu domicilio en {name}, revisamos el equipo y te damos un presupuesto antes de reparar."
        if es else
        f"We come to your address in {name}, diagnose the problem and quote the repair before work starts."
    )
    ui = {
        "skip": ("Skip to main content", "Saltar al contenido"),
        "home": ("Home", "Inicio"),
        "coverage": ("Memphis service area", "Cobertura de Memphis"),
        "request": ("Request service", "Solicitar servicio"),
        "call": ("Call 901-686-2035", "Llamar al 901-686-2035"),
        "services": ("Appliances we repair", "Electrodomésticos que reparamos"),
        "appointment": (f"Plan your visit in {name}", f"Prepara tu visita en {name}"),
        "process": ("What happens during a service call", "Qué incluye la visita"),
        "diagnosis": ("Diagnosis and estimate", "Diagnóstico y presupuesto"),
        "diagnosis_copy": ("The technician checks the unit at your address, explains the problem and gives you the price before you decide whether to proceed.", "El técnico revisa el equipo en tu domicilio, explica el problema y te da el precio antes de que decidas si autorizas la reparación."),
        "warranty": ("30-day repair warranty", "Garantía de reparación de 30 días"),
        "warranty_copy": ("The warranty covers the original issue and the replaced part under the service terms.", "La garantía cubre la falla original y la pieza reemplazada según los términos del servicio."),
        "pricing": ("View current service call pricing", "Consultar el precio de la visita"),
        "terms": ("Terms and conditions", "Términos y condiciones"),
        "nearby": ("Nearby service areas", "Otras zonas de servicio cercanas"),
        "all_areas": ("View all Memphis-area communities", "Ver todas las zonas del área de Memphis"),
        "details": ("Include your address, appliance type, brand and symptoms when requesting an appointment.", "Incluye tu dirección, tipo de equipo, marca y síntomas al solicitar la cita."),
    }
    copy = {key: pair[es] for key, pair in ui.items()}
    questions = (
        (f"¿Qué datos ayudan a programar una visita en {name}?",
         f"What information helps schedule a visit in {name}?"),
        ("¿Tengo que llevar el electrodoméstico a un taller?",
         "Do I need to take the appliance to a shop?"),
        ("¿La visita se descuenta de la reparación?",
         "Does the service call count toward the repair?"),
    )
    answers = (
        note,
        "El técnico va a tu domicilio. Envía la marca y el modelo si los tienes, y menciona si el equipo es empotrado o de difícil acceso."
        if es else "The technician comes to your address. Send the brand and model if available, and tell us whether the unit is built in or difficult to access.",
        "Si autorizas el trabajo, el cargo por la visita se descuenta del precio final de la reparación."
        if es else "If you approve the work, the service call charge is credited toward the final repair price.",
    )
    faq_items = []
    for index, (question, answer) in enumerate(zip(questions, answers)):
        initial_state = " open" if index == 0 else ""
        faq_items.append(
            f'          <details class="card"{initial_state}><summary>{escape(question[1 if es else 0])}</summary>'
            f'<p>{escape(answer)}</p></details>'
        )
    faq = "\n".join(faq_items)
    services = (
        [("Refrigeradores y congeladores", "Pérdida de frío, acumulación de escarcha y fugas."),
         ("Lavadoras y secadoras", "Problemas de desagüe, centrifugado o calor."),
         ("Lavavajillas", "Agua estancada, fugas o lavado deficiente."),
         ("Hornos, estufas y microondas", "Problemas de encendido o temperatura.")]
        if es else
        [("Refrigerators and freezers", "Loss of cooling, frost buildup and leaks."),
         ("Washers and dryers", "Drainage, spin and heating problems."),
         ("Dishwashers", "Standing water, leaks or poor cleaning."),
         ("Ovens, ranges and microwaves", "Ignition or temperature problems.")]
    )
    cards = "\n".join(f'          <article class="card"><h3>{escape(label)}</h3><p>{escape(detail)}</p></article>'
                      for label, detail in services)
    nearby_links = "\n".join(f'          <li class="area-card__linked"><a href="{location_path(other, lang)}">{NAMES[other]}</a></li>'
                             for other in nearby)
    hreflang = "\n".join(f'  <link rel="alternate" hreflang="{language}" href="{target}">'
                         for language, target in alternates.items())
    image = ORIGIN + ("/images/og-image-es.png" if es else "/images/og-image.png")
    locale = "es_US" if es else "en_US"
    alternate_locale = "en_US" if es else "es_US"
    other_lang = "en" if es else "es"
    other_label = "English" if es else "Español"
    area_data = {"@type": place_type, "name": name}
    if place_type == "Place":
        area_data["containedInPlace"] = {"@type": "City", "name": "Memphis"}
    trail = [
        {"@type": "ListItem", "position": 1, "name": copy["home"], "item": ORIGIN + home},
        {"@type": "ListItem", "position": 2, "name": name, "item": url},
    ]
    schema = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "WebPage", "@id": url + "#page", "url": url, "name": title,
             "description": desc, "inLanguage": lang, "breadcrumb": {"@id": url + "#breadcrumbs"},
             "mainEntity": {"@id": url + "#service"}},
            {"@type": "Service", "@id": url + "#service", "name": heading,
             "serviceType": "Reparación de electrodomésticos" if es else "Appliance repair",
             "provider": {"@id": ORIGIN + "/#business"}, "areaServed": area_data, "url": url},
            {"@type": "BreadcrumbList", "@id": url + "#breadcrumbs", "itemListElement": trail},
        ],
    }
    schema_json = json.dumps(schema, ensure_ascii=False, indent=2).replace("<", "\\u003c")
    return f"""<!DOCTYPE html>
<!-- Generated by scripts/generate_local_seo.py -->
<html lang="{lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'none'; style-src 'self'; img-src 'self'; font-src 'self'; form-action 'self'; frame-src 'none'">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(desc)}">
  <meta name="theme-color" content="#D62828">
  <link rel="canonical" href="{url}">
{hreflang}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="{BUSINESS}">
  <meta property="og:locale" content="{locale}">
  <meta property="og:locale:alternate" content="{alternate_locale}">
  <meta property="og:title" content="{escape(title)}">
  <meta property="og:description" content="{escape(desc)}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{BUSINESS}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/css/fonts.css">
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="icon" href="/images/favicon-96.png" type="image/png" sizes="96x96">
  <script type="application/ld+json">
{schema_json}
  </script>
</head>
<body>
  <a class="skip-link" href="#main">{copy["skip"]}</a>
  <header class="legal__top">
    <div class="container legal__top-inner">
      <a class="logo" href="{home}">
        <img class="logo__img" src="/images/logo-dark.png" width="720" height="164" alt="{BUSINESS}">
      </a>
      <nav class="legal__top-links" aria-label="{copy["coverage"]}">
        <a href="{home}#zonas">{copy["coverage"]}</a>
        <a href="{location_path(slug, other_lang)}" hreflang="{other_lang}" lang="{other_lang}">{other_label}</a>
      </nav>
    </div>
  </header>
  <main id="main">
    <nav class="container location-trail" aria-label="{'Ruta de navegación' if es else 'Breadcrumb'}">
      <a href="{home}">{copy["home"]}</a><span aria-hidden="true">/</span><span aria-current="page">{escape(name)}</span>
    </nav>
    <section class="hero">
      <div class="hero__bg" aria-hidden="true"></div>
      <div class="hero__overlay" aria-hidden="true"></div>
      <div class="container hero__inner">
        <p class="hero__eyebrow">{escape(area)}</p>
        <h1 class="hero__title">{escape(heading)}</h1>
        <p class="hero__subtitle">{escape(lead)}</p>
        <div class="hero__ctas">
          <a class="btn btn--red btn--lg" href="{home}#contacto">{copy["request"]}</a>
          <a class="btn btn--ghost btn--lg" href="tel:+19016862035">{copy["call"]}</a>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <header class="section__head"><h2>{copy["services"]}</h2></header>
        <div class="cards">
{cards}
        </div>
      </div>
    </section>
    <section class="section section--soft">
      <div class="container">
        <header class="section__head">
          <h2>{copy["process"]}</h2>
          <p class="section__lead">{copy["details"]}</p>
        </header>
        <div class="location-visit">
          <article class="card">
            <h3>{copy["diagnosis"]}</h3>
            <p>{copy["diagnosis_copy"]}</p>
            <a class="location-link" href="{home}#precio-visita">{copy["pricing"]}</a>
          </article>
          <article class="card">
            <h3>{copy["warranty"]}</h3>
            <p>{copy["warranty_copy"]}</p>
            <a class="location-link" href="{terms}">{copy["terms"]}</a>
          </article>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <header class="section__head"><h2>{escape(copy["appointment"])}</h2></header>
        <div class="location-faq">
{faq}
        </div>
      </div>
    </section>
    <section class="section section--dark location-areas">
      <div class="container">
        <header class="section__head"><h2>{copy["nearby"]}</h2></header>
        <ul class="area-card__list location-links">
{nearby_links}
        </ul>
        <a class="btn btn--ghost" href="{home}#zonas">{copy["all_areas"]}</a>
      </div>
    </section>
  </main>
  <footer class="footer">
    <div class="container footer__grid">
      <div class="footer__brand">
        <a class="logo logo--footer" href="{home}">
          <img class="logo__img" src="/images/logo-white.png" width="720" height="164" alt="{BUSINESS}" loading="lazy">
        </a>
      </div>
      <div class="footer__col"><a href="tel:+19016862035">{copy["call"]}</a></div>
      <div class="footer__col"><a href="{terms}">{copy["terms"]}</a></div>
    </div>
  </footer>
</body>
</html>
"""


def render_sitemap():
    ET.register_namespace("", SITEMAP_NS)
    ET.register_namespace("xhtml", XHTML_NS)
    urlset = ET.Element(f"{{{SITEMAP_NS}}}urlset")
    pairs = [("/", "/es/"), ("/terms.html", "/es/terminos.html")]
    pairs.extend(tuple(location_path(slug, lang) for lang in LANGUAGES) for slug in NAMES)
    for paths in pairs:
        alternates = alternate_urls(paths)
        for lang in LANGUAGES:
            item = ET.SubElement(urlset, f"{{{SITEMAP_NS}}}url")
            ET.SubElement(item, f"{{{SITEMAP_NS}}}loc").text = alternates[lang]
            for language, url in alternates.items():
                ET.SubElement(item, f"{{{XHTML_NS}}}link",
                              rel="alternate", hreflang=language, href=url)
    news = ET.SubElement(urlset, f"{{{SITEMAP_NS}}}url")
    ET.SubElement(news, f"{{{SITEMAP_NS}}}loc").text = ORIGIN + "/Novedades/"
    ET.indent(urlset, space="  ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(urlset, encoding="unicode") + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if generated files need updating")
    args = parser.parse_args()
    files = {ROOT / "sitemap.xml": render_sitemap()}
    for location in LOCATIONS:
        for lang in LANGUAGES:
            path = ROOT / location_path(location[0], lang).lstrip("/") / "index.html"
            files[path] = render_location(location, lang)

    stale = []
    for file, content in files.items():
        if args.check:
            if not file.is_file() or file.read_text(encoding="utf-8") != content:
                stale.append(str(file.relative_to(ROOT)))
        else:
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text(content, encoding="utf-8")
    if stale:
        parser.exit(1, "Regenerate outdated files:\n" + "\n".join(stale) + "\n")


if __name__ == "__main__":
    main()
