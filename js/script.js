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
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 60);
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
})();
