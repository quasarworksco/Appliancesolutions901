/* =========================================================
   Appliance Solutions 901 — JavaScript principal
   Sin dependencias externas. Todo vanilla JS.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- TEXTOS SEGÚN EL IDIOMA DE LA PÁGINA ----------
     El idioma se toma de <html lang="...">: index.html = en, es/index.html = es. */
  var LANG = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2) === 'es' ? 'es' : 'en';
  var STRINGS = {
    en: {
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      dotLabel: function (i, total) { return 'Go to review ' + i + ' of ' + total; },
      missing: function (list) { return 'Please add ' + list + '.'; },
      badEmail: 'Please check your email address — it looks incorrect.',
      fName: 'your name',
      fPhone: 'your phone number',
      fAppliance: 'the appliance type',
      fMessage: 'a short description of the problem',
      areaPrefix: 'My area / ZIP code: ',
      sentOk: 'Got it! Your request is in — we\'ll call you shortly at the number you gave us. Need it sooner? Call 901-686-2035.',
      sentFallback: 'Your email app opened with the details. If it didn\'t, email us at Appliancesolutions901@gmail.com or call 901-686-2035.',
      sending: 'Sending…',
      send: 'Send Request',
      geoAsking: 'Getting your location…',
      geoOk: 'Location attached — the technician will know exactly where to go.',
      geoDenied: 'You blocked location access. No problem: type the address instead.',
      geoFail: 'We couldn\'t get your location. Type the address instead.',
      geoUnsupported: 'Your browser does not support this. Type the address instead.',
      geoDone: 'Location attached',
      subject: function (appliance, name) { return 'Service request - ' + appliance + ' - ' + name; },
      mailName: 'Name', mailPhone: 'Phone', mailEmail: 'Email',
      mailAppliance: 'Appliance', mailMessage: 'Message', mailNone: 'Not provided',
      mailBrand: 'Brand and model', mailAddress: 'Address'
    },
    es: {
      openMenu: 'Abrir menú',
      closeMenu: 'Cerrar menú',
      dotLabel: function (i, total) { return 'Ir al testimonio ' + i + ' de ' + total; },
      missing: function (list) { return 'Falta ' + list + '.'; },
      badEmail: 'Revisa tu email: parece que tiene un error.',
      fName: 'tu nombre',
      fPhone: 'tu teléfono',
      fAppliance: 'el tipo de electrodoméstico',
      fMessage: 'una breve descripción del problema',
      areaPrefix: 'Mi zona / código postal: ',
      sentOk: '¡Listo! Tu solicitud quedó registrada — te llamamos en breve al número que dejaste. ¿Lo necesitas antes? Llámanos al 901-686-2035.',
      sentFallback: 'Se abrió tu correo con los datos. Si no se abrió, escríbenos a Appliancesolutions901@gmail.com o llámanos al 901-686-2035.',
      sending: 'Enviando…',
      send: 'Enviar Solicitud',
      geoAsking: 'Obteniendo tu ubicación…',
      geoOk: 'Ubicación adjuntada — el técnico va a saber exactamente a dónde llegar.',
      geoDenied: 'Bloqueaste el acceso a la ubicación. No hay problema: escribe la dirección.',
      geoFail: 'No pudimos obtener tu ubicación. Escribe la dirección.',
      geoUnsupported: 'Tu navegador no lo permite. Escribe la dirección.',
      geoDone: 'Ubicación adjuntada',
      subject: function (appliance, name) { return 'Solicitud de servicio - ' + appliance + ' - ' + name; },
      mailName: 'Nombre', mailPhone: 'Teléfono', mailEmail: 'Email',
      mailAppliance: 'Electrodoméstico', mailMessage: 'Mensaje', mailNone: 'No indicado',
      mailBrand: 'Marca y modelo', mailAddress: 'Dirección'
    }
  };
  var T = STRINGS[LANG];

  /* ---------- MENÚ MÓVIL ---------- */
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primaryNav');

  function closeNav() {
    if (!primaryNav || !navToggle) return;
    primaryNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', T.openMenu);
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = primaryNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.setAttribute('aria-label', isOpen ? T.closeMenu : T.openMenu);
    });

    // Cierra el menú al elegir una sección o al presionar Escape
    primaryNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---------- HEADER QUE SE ACHICA AL HACER SCROLL ---------- */
  var header = document.getElementById('header');
  var ticking = false;

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 60);
    var topBtn = document.getElementById('toTop');
    if (topBtn) topBtn.classList.toggle('is-visible', window.scrollY > 600);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- ANIMACIONES AL HACER SCROLL (FADE-IN / SLIDE-UP) ---------- */
  var revealables = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 70 + 'ms';
      observer.observe(el);
    });
  }

  /* ---------- WIDGET DE SOLICITUD DEL HERO ---------- */
  /* TODO: conectar con un backend real (o servicio tipo Formspree/Netlify Forms).
     Por ahora lleva al formulario de contacto y precarga el electrodoméstico y la zona. */
  var quoteForm = document.getElementById('quoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var appliance = document.getElementById('quoteAppliance');
      var zip = document.getElementById('quoteZip');

      if (appliance && !appliance.value) {
        appliance.focus();
        return;
      }

      try {
        sessionStorage.setItem('as901_appliance', appliance ? appliance.value : '');
        sessionStorage.setItem('as901_zip', zip ? zip.value.trim() : '');
      } catch (err) { /* sessionStorage puede no estar disponible */ }

      var target = document.getElementById('contacto');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.location.href = 'tel:9016862035';
      }
    });
  }
  /* ---------- CARRUSEL DE TESTIMONIOS ---------- */
  var track = document.getElementById('testimonialTrack');
  var dotsWrap = document.getElementById('testimonialDots');
  var carousel = document.getElementById('testimonialCarousel');

  if (track && dotsWrap && carousel) {
    var slides = Array.prototype.slice.call(track.children);
    var autoplayId = null;
    var paused = false;

    function perPage() {
      // cuántos testimonios se ven a la vez (1 en mobile, 2 en tablet, 3 en escritorio)
      var slideWidth = slides[0].getBoundingClientRect().width;
      if (!slideWidth) return 1;
      return Math.max(1, Math.round(track.clientWidth / slideWidth));
    }
    function maxIndex() {
      return Math.max(0, slides.length - perPage());
    }
    function offsetOf(i) {
      return slides[i].offsetLeft - slides[0].offsetLeft;
    }
    function currentPage() {
      var pos = track.scrollLeft;
      var best = 0;
      var bestDist = Infinity;
      for (var i = 0; i <= maxIndex(); i++) {
        var dist = Math.abs(offsetOf(i) - pos);
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
      return best;
    }
    function goToPage(i) {
      var total = maxIndex() + 1;
      var page = ((i % total) + total) % total;
      track.scrollTo({ left: offsetOf(page), behavior: 'smooth' });
    }
    function buildDots() {
      var total = maxIndex() + 1;
      dotsWrap.innerHTML = '';
      for (var i = 0; i < total; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('aria-label', T.dotLabel(i + 1, total));
        dot.dataset.page = i;
        dotsWrap.appendChild(dot);
      }
      syncDots();
    }
    function syncDots() {
      var page = currentPage();
      Array.prototype.forEach.call(dotsWrap.children, function (dot, i) {
        var active = i === page;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
    }

    dotsWrap.addEventListener('click', function (e) {
      var dot = e.target.closest('.carousel__dot');
      if (dot) goToPage(parseInt(dot.dataset.page, 10));
    });
    carousel.querySelector('[data-carousel-prev]').addEventListener('click', function () { goToPage(currentPage() - 1); });
    carousel.querySelector('[data-carousel-next]').addEventListener('click', function () { goToPage(currentPage() + 1); });

    // Navegación con teclado sobre el carrusel
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goToPage(currentPage() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goToPage(currentPage() - 1); }
    });

    var scrollTimer;
    track.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(syncDots, 90);
    }, { passive: true });

    // Auto-rotación (se pausa al interactuar o si el usuario prefiere menos movimiento)
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function startAutoplay() {
      if (reduceMotion || autoplayId) return;
      autoplayId = setInterval(function () {
        if (!paused && document.visibilityState === 'visible') goToPage(currentPage() + 1);
      }, 6000);
    }
    ['mouseenter', 'focusin', 'touchstart', 'pointerdown'].forEach(function (evt) {
      carousel.addEventListener(evt, function () { paused = true; }, { passive: true });
    });
    ['mouseleave', 'focusout'].forEach(function (evt) {
      carousel.addEventListener(evt, function () { paused = false; }, { passive: true });
    });

    buildDots();
    startAutoplay();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildDots, 200);
    });
  }

  /* ---------- ACORDEÓN DE PREGUNTAS FRECUENTES ---------- */
  var faqButtons = document.querySelectorAll('.faq__q');

  function closePanel(btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.closest('.faq__item').classList.remove('is-open');
    panel.style.height = panel.scrollHeight + 'px';
    requestAnimationFrame(function () { panel.style.height = '0px'; });
    panel.addEventListener('transitionend', function handler() {
      panel.hidden = true;
      panel.style.height = '';
      panel.removeEventListener('transitionend', handler);
    });
  }

  function openPanel(btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    btn.setAttribute('aria-expanded', 'true');
    btn.closest('.faq__item').classList.add('is-open');
    panel.hidden = false;
    panel.style.height = '0px';
    requestAnimationFrame(function () { panel.style.height = panel.scrollHeight + 'px'; });
    panel.addEventListener('transitionend', function handler() {
      panel.style.height = 'auto';
      panel.removeEventListener('transitionend', handler);
    });
  }

  faqButtons.forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) panel.style.transition = 'height .32s cubic-bezier(.2,.7,.3,1)';

    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      // Un solo panel abierto a la vez
      faqButtons.forEach(function (other) {
        if (other !== btn && other.getAttribute('aria-expanded') === 'true') closePanel(other);
      });
      if (isOpen) { closePanel(btn); } else { openPanel(btn); }
    });
  });

  /* ---------- FORMULARIO DE CONTACTO ---------- */
  /* TODO: reemplazar el envío por mailto: con un backend real
     (Formspree, Netlify Forms, EmailJS o endpoint propio). */
  var contactForm = document.getElementById('contactForm');
  var ubicacion = '';   // "lat,lng" si el visitante decide compartirla

  /* Botón de ubicación: siempre opcional y siempre a pedido del visitante */
  var geoBtn = document.getElementById('geoBtn');
  var geoStatus = document.getElementById('geoStatus');

  function estadoGeo(texto, error) {
    if (!geoStatus) return;
    geoStatus.textContent = texto;
    geoStatus.classList.toggle('is-error', !!error);
    geoStatus.hidden = false;
  }

  if (geoBtn) {
    geoBtn.addEventListener('click', function () {
      if (!navigator.geolocation) {
        estadoGeo(T.geoUnsupported, true);
        return;
      }
      estadoGeo(T.geoAsking, false);
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          ubicacion = pos.coords.latitude.toFixed(6) + ',' + pos.coords.longitude.toFixed(6);
          estadoGeo(T.geoOk, false);
          geoBtn.classList.add('is-done');
          geoBtn.lastChild.textContent = ' ' + T.geoDone;
        },
        function (err) {
          estadoGeo(err && err.code === 1 ? T.geoDenied : T.geoFail, true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  if (contactForm) {
    var errorBox = document.getElementById('formError');
    var successBox = document.getElementById('formSuccess');

    // Precarga lo que el visitante eligió en el widget del hero
    try {
      var savedAppliance = sessionStorage.getItem('as901_appliance');
      var savedZip = sessionStorage.getItem('as901_zip');
      var applianceSelect = document.getElementById('fAppliance');
      var messageField = document.getElementById('fMessage');

      if (savedAppliance && applianceSelect) {
        var match = Array.prototype.find.call(applianceSelect.options, function (o) { return o.value === savedAppliance; });
        if (match) applianceSelect.value = savedAppliance;
      }
      if (savedZip && messageField && !messageField.value) {
        messageField.value = T.areaPrefix + savedZip + '. ';
      }
    } catch (err) { /* sessionStorage puede no estar disponible */ }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var fields = [
        { el: document.getElementById('fName'), label: T.fName },
        { el: document.getElementById('fPhone'), label: T.fPhone },
        { el: document.getElementById('fAppliance'), label: T.fAppliance },
        { el: document.getElementById('fMessage'), label: T.fMessage }
      ];

      var missing = [];
      fields.forEach(function (f) {
        if (!f.el) return;
        var empty = !f.el.value.trim();
        f.el.classList.toggle('has-error', empty);
        if (empty) missing.push(f.label);
      });

      var emailEl = document.getElementById('fEmail');
      var emailValue = emailEl ? emailEl.value.trim() : '';
      var emailInvalid = emailValue !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue);
      if (emailEl) emailEl.classList.toggle('has-error', emailInvalid);

      if (missing.length || emailInvalid) {
        successBox.hidden = true;
        errorBox.hidden = false;
        errorBox.textContent = emailInvalid && !missing.length
          ? T.badEmail
          : T.missing(missing.join(', '));
        var firstBad = contactForm.querySelector('.has-error');
        if (firstBad) firstBad.focus();
        return;
      }

      errorBox.hidden = true;

      var data = new FormData(contactForm);

      // Campo trampa: si viene lleno es un bot. Se finge exito y no se envia nada.
      if ((data.get('company') || '').trim() !== '') {
        successBox.hidden = false;
        return;
      }

      var body = [
        T.mailName + ': ' + data.get('nombre'),
        T.mailPhone + ': ' + data.get('telefono'),
        T.mailEmail + ': ' + (data.get('email') || T.mailNone),
        T.mailAppliance + ': ' + data.get('electrodomestico'),
        T.mailBrand + ': ' + (data.get('marcaModelo') || T.mailNone),
        T.mailAddress + ': ' + (data.get('direccion') || (ubicacion ? 'https://www.google.com/maps?q=' + ubicacion : T.mailNone)),
        '',
        T.mailMessage + ':',
        data.get('mensaje')
      ].join('\n');

      var mailto = 'mailto:Appliancesolutions901@gmail.com'
        + '?subject=' + encodeURIComponent(T.subject(data.get('electrodomestico'), data.get('nombre')))
        + '&body=' + encodeURIComponent(body);

      var boton = contactForm.querySelector('button[type=submit]');
      var textoBoton = boton ? boton.textContent : '';
      var mensajeExito = successBox.querySelector('span');

      function mostrarExito(texto) {
        if (mensajeExito) mensajeExito.textContent = texto;
        successBox.hidden = false;
        contactForm.reset();
        if (boton) { boton.disabled = false; boton.textContent = textoBoton; }
      }

      // Respaldo: si no hay base de datos disponible, se abre el correo
      function usarCorreo() {
        window.location.href = mailto;
        mostrarExito(T.sentFallback);
      }

      if (!(window.AS901 && window.AS901.saveLead)) {
        usarCorreo();
        return;
      }

      if (boton) { boton.disabled = true; boton.textContent = T.sending; }

      var zona = '';
      try { zona = sessionStorage.getItem('as901_zip') || ''; } catch (err) { /* sin sessionStorage */ }

      window.AS901.saveLead({
        nombre: data.get('nombre'),
        telefono: data.get('telefono'),
        email: data.get('email') || '',
        electrodomestico: data.get('electrodomestico'),
        mensaje: data.get('mensaje'),
        marcaModelo: data.get('marcaModelo') || '',
        direccion: data.get('direccion') || '',
        ubicacion: ubicacion,
        zona: zona,
        idioma: LANG,
        origen: 'formulario-contacto'
      }).then(function (guardado) {
        if (guardado) {
          mostrarExito(T.sentOk);
        } else {
          usarCorreo();
        }
      });
    });

    // Limpia el estado de error al corregir
    contactForm.addEventListener('input', function (e) {
      if (e.target.classList.contains('has-error') && e.target.value.trim()) {
        e.target.classList.remove('has-error');
      }
    });
  }
  /* ---------- AÑO DINÁMICO DEL COPYRIGHT ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- BOTÓN VOLVER ARRIBA ---------- */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- RESALTAR LA SECCIÓN ACTIVA EN EL MENÚ ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (section) { navObserver.observe(section); });
  }

})();
