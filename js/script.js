/* =========================================================
   Appliance Solutions 901 — JavaScript principal
   Sin dependencias externas. Todo vanilla JS.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- MENÚ MÓVIL ---------- */
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primaryNav');

  function closeNav() {
    if (!primaryNav || !navToggle) return;
    primaryNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú');
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = primaryNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
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
        dot.setAttribute('aria-label', 'Ir al testimonio ' + (i + 1) + ' de ' + total);
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
        messageField.value = 'Mi zona / código postal: ' + savedZip + '. ';
      }
    } catch (err) { /* sessionStorage puede no estar disponible */ }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var fields = [
        { el: document.getElementById('fName'), label: 'tu nombre' },
        { el: document.getElementById('fPhone'), label: 'tu teléfono' },
        { el: document.getElementById('fAppliance'), label: 'el tipo de electrodoméstico' },
        { el: document.getElementById('fMessage'), label: 'una breve descripción del problema' }
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
          ? 'Revisa tu email: parece que tiene un error.'
          : 'Falta ' + missing.join(', ') + '.';
        var firstBad = contactForm.querySelector('.has-error');
        if (firstBad) firstBad.focus();
        return;
      }

      errorBox.hidden = true;

      var data = new FormData(contactForm);
      var body = [
        'Nombre: ' + data.get('nombre'),
        'Teléfono: ' + data.get('telefono'),
        'Email: ' + (data.get('email') || 'No indicado'),
        'Electrodoméstico: ' + data.get('electrodomestico'),
        '',
        'Mensaje:',
        data.get('mensaje')
      ].join('\n');

      var mailto = 'mailto:Appliancesolutions901@gmail.com'
        + '?subject=' + encodeURIComponent('Solicitud de servicio - ' + data.get('electrodomestico') + ' - ' + data.get('nombre'))
        + '&body=' + encodeURIComponent(body);

      window.location.href = mailto;
      successBox.hidden = false;
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
