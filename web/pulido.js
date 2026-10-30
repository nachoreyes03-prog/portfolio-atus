/* ============================================================
   OPCIÓN A — PULIDO (movimiento)
   - scroll suave (Lenis)
   - bloques, títulos y tarjetas que entran al scrollear
   - logo del inicio que se pinta cuando termina la intro
   - piezas que asoman en las tarjetas Diseño / Ilustración
   - reloj de Buenos Aires, grano sutil
   React re-renderiza al cambiar de vista: todo se re-aplica con
   un MutationObserver (mismo patrón que overrides.js).
   ============================================================ */
(function(){
  'use strict';
  var html = document.documentElement;
  if (/[?&]motion=0\b/.test(location.search)) { html.classList.add('pl-calm'); return; }
  html.classList.add('pl-ready');

  var MINI = 'web/mini/';
  var FAN = {
    design: ['design__posters__poster-fosforos-azul.jpg','design__posters__poster-torty.jpg','design__9r-afiche-cover.jpg','design__posters__poster-ba-intervenido.jpg','design__posters__poster-atuskmi.jpg'],
    illu:   ['img__ilu__spiderman-color-atus.jpg','img__ilu__grafitti-man.jpg','img__ilu__sound-atus-3.jpg','img__ilu__samurai-atus.jpg','img__ilu__fuu-atus.jpg']
  };
  /* abanico: rotación de reposo, rotación y posición al abrirse */
  var POSE = [
    {r0:-4, r1:-13, x:-64, y: 2},
    {r0: 3, r1: -6, x:-32, y:-8},
    {r0:-2, r1:  1, x:  0, y:-13},
    {r0: 5, r1:  7, x: 32, y:-8},
    {r0:-3, r1: 13, x: 64, y: 2}
  ];

  /* ---------- logo: se pinta cuando la intro se va ---------- */
  /* la intro se arma con un script diferido: recién después de que el
     documento terminó de cargar se sabe si hay intro o no */
  function esperarIntro(){
    var intro = document.getElementById('atus-intro');
    if (!intro || intro.classList.contains('saliendo')) { html.classList.add('pl-go'); return; }
    setTimeout(esperarIntro, 90);
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive' && window.__plDcl) esperarIntro();
  else document.addEventListener('DOMContentLoaded', function(){ setTimeout(esperarIntro, 0); });

  /* ---------- grano ---------- */
  (function grano(){
    return; /* sacado: la capa de grano animada sobre toda la pantalla bajaba los fps */
    try {
      var c = document.createElement('canvas'); c.width = c.height = 180;
      var x = c.getContext('2d'), d = x.createImageData(180, 180), p = d.data;
      for (var i = 0; i < p.length; i += 4) {
        var v = Math.random() < .5 ? 0 : 255;
        p[i] = p[i+1] = p[i+2] = v; p[i+3] = Math.random() * 26;
      }
      x.putImageData(d, 0, 0);
      var g = document.createElement('div');
      g.className = 'pl-grain';
      g.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
      document.body.appendChild(g);
    } catch (e) {}
  })();

  /* ---------- scroll suave ---------- */
  /* la intro corre en cada carga: la página arranca siempre arriba (si Chrome
     devolvía la posición al recargar, el recibo aparecía ya desenrollado) */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  window.scrollTo(0, 0);

  var lenis = null;
  function bloqueado(){
    var b = document.body.style.overflow, h = html.style.overflow;
    return b === 'hidden' || h === 'hidden';
  }
  (function cargarLenis(){
    if (!window.requestAnimationFrame) return;
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
    s.onload = function(){
      if (!window.Lenis) return;
      lenis = new window.Lenis({
        lerp: 0.11,
        smoothWheel: true,
        prevent: function(n){
          return !!(n.closest && n.closest('.modal, .svcov, .dgv, [class*="viewer"], [class*="reader"], [class*="lightbox"], [class*="comic-"], .tesis-sub, [class*="overlay"]'));
        }
      });
      window.__plLenis = lenis;
      var parado = false;
      (function raf(t){
        var b = bloqueado();
        if (b && !parado) { lenis.stop(); parado = true; }
        else if (!b && parado) { lenis.start(); parado = false; }
        lenis.raf(t);
        requestAnimationFrame(raf);
      })(0);
      /* cambiar de vista o saltar a una sección: que Lenis no pelee
         con el scroll que hace el propio sitio */
      document.addEventListener('click', function(e){
        if (!e.target.closest) return;
        if (e.target.closest('.nav, .hero-card, .section-view-bar, .section-jump, .mini-cta, a[href^="#"]')) {
          lenis.stop();
          requestAnimationFrame(function(){ requestAnimationFrame(function(){ if (!bloqueado()) lenis.start(); }); });
        }
      }, true);
    };
    document.head.appendChild(s);
  })();

  /* ---------- entradas al scrollear ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    var nuevos = entries.filter(function(en){ return en.isIntersecting; })
                        .sort(function(a, b){ return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
    nuevos.forEach(function(en, i){
      var el = en.target;
      /* un título recortado no "se ve" para el observer: se mira a su padre */
      var obj = el.__plTitulo || el;
      if (obj.classList.contains('gcard') || obj.classList.contains('pj-poster-mini')) obj.style.transitionDelay = Math.min(i, 7) * 55 + 'ms';
      obj.classList.add('pl-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 }) : null;

  function marcar(sel, clase){
    var els = document.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.dataset.pl) continue;
      el.dataset.pl = '1';
      if (el.classList.contains('reveal-up')) continue;           /* ya lo anima el sitio */
      if (el.closest('.modal, .svcov, .nav, #atus-intro')) continue;
      if (!io) continue;
      /* los títulos de Ilustración ya entran con su efecto de letras (el de Atus) */
      if (clase === 'pl-tt' && el.closest('.sec-dark')) continue;
      el.classList.add(clase);
      if (clase === 'pl-tt' && el.parentElement) {
        var p = el.parentElement;
        if (p.__plTitulo) { el.classList.add('pl-in'); continue; }
        p.__plTitulo = el;
        io.observe(p);
      } else {
        io.observe(el);
      }
    }
  }

  /* ---------- piezas en las tarjetas del inicio ---------- */
  function abanicos(){
    [['.hero-card-design', FAN.design], ['.hero-card-illu', FAN.illu]].forEach(function(par){
      var card = document.querySelector(par[0]);
      if (!card || card.querySelector('.pl-fan')) return;
      var fan = document.createElement('div');
      fan.className = 'pl-fan'; fan.setAttribute('aria-hidden', 'true');
      par[1].forEach(function(src, i){
        var im = new Image(); im.alt = ''; im.decoding = 'async'; im.loading = 'lazy';
        im.src = MINI + src;
        var p = POSE[i];
        im.style.setProperty('--r0', p.r0 + 'deg');
        im.style.setProperty('--r1', p.r1 + 'deg');
        im.style.setProperty('--x', p.x + '%');
        im.style.setProperty('--y', p.y + '%');
        im.style.setProperty('--d', (i * 35) + 'ms');
        im.style.setProperty('--d2', (i * 0.35) + 's');
        fan.appendChild(im);
        if (SOLA) solas.push(peek(im, p, i));
      });
      card.appendChild(fan);
      if (SOLA && ioFan) ioFan.observe(fan);
    });
  }
  /* en el teléfono (sin hover) la pila se abre y se cierra sola. Va con Web Animations y valores fijos
     (no con var() en los keyframes): así la mueve la placa de video y no recalcula estilos en cada cuadro.
     Cuando las tarjetas no se ven, se pausa. */
  /* Los desplazamientos van en px (medidos de cada pieza): con % + rotate Chrome tampoco la mandaba a la placa. */
  var SOLA = window.matchMedia && window.matchMedia('(hover:none), (max-width:760px)').matches;
  var solas = [], fanVisible = true;
  var ioFan = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    fanVisible = es.some(function (e) { return e.isIntersecting; });
    solas.forEach(function (o) {
      var a = o.im.__peek; if (!a) return;
      if (fanVisible) { if (a.playState === 'paused') a.play(); } else if (a.playState === 'running') a.pause();
    });
  }) : null;
  function peek(im, p, i){
    if (!im.animate) return null;
    function armar(){
      var w = im.offsetWidth, h = im.offsetHeight;
      if (!w || !h) return;
      if (im.__peek) im.__peek.cancel();
      var ease = (getComputedStyle(document.documentElement).getPropertyValue('--pl-ease') || '').trim() || 'ease-in-out';
      var cerrado = 'translate3d(' + (-w / 2).toFixed(1) + 'px,' + (-h / 2).toFixed(1) + 'px,0) rotate(' + p.r0 + 'deg)';
      var abierto = 'translate3d(' + ((p.x - 50) / 100 * w).toFixed(1) + 'px,' + ((p.y - 50) / 100 * h).toFixed(1) + 'px,0) rotate(' + p.r1 + 'deg)';
      im.__peek = im.animate([
        { transform: cerrado, offset: 0, easing: ease },
        { transform: cerrado, offset: 0.25, easing: ease },
        { transform: abierto, offset: 0.65, easing: ease },
        { transform: abierto, offset: 1 }
      ], { duration: 6000, delay: i * 350, iterations: Infinity, direction: 'alternate', fill: 'backwards' });
      if (!fanVisible) im.__peek.pause();
    }
    if (im.complete && im.naturalWidth) armar(); else im.addEventListener('load', armar, { once: true });
    return { im: im, armar: armar };
  }
  var rzFan = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rzFan);
    rzFan = setTimeout(function () { solas.forEach(function (o) { if (o) o.armar(); }); }, 200);
  });

  /* ---------- reloj ---------- */
  var fmt = null;
  try { fmt = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }); } catch (e) {}
  function reloj(){
    if (!fmt) return;
    var top = document.querySelector('.hero-top');
    if (!top) return;
    var c = top.querySelector('.pl-clock');
    if (!c) {
      var spans = top.querySelectorAll('span');
      var ba = null;
      for (var i = 0; i < spans.length; i++) if (/Buenos Aires/i.test(spans[i].textContent)) ba = spans[i];
      if (!ba) return;
      c = document.createElement('span'); c.className = 'pl-clock';
      ba.appendChild(c);
    }
    /* sólo si cambió: reescribirlo igual disparaba los observadores de la página y se armaba un bucle
       que corría en cada cuadro (aplicar -> reloj -> cambio -> aplicar...) */
    var txt = fmt.format(new Date());
    if (c.textContent !== txt) c.textContent = txt;
  }
  setInterval(reloj, 15000);

  /* ---------- barra "Volver" del color de la página ---------- */
  /* (escribe sólo si cambia algo: cada escritura obligaba a recalcular los estilos de toda la página) */
  function poner(el, prop, v){ if (el.style[prop] !== v) el.style[prop] = v; }
  function barra(){
    var bar = document.querySelector('.section-view-bar');
    if (!bar) { poner(document.body, 'backgroundColor', ''); document.documentElement.classList.remove('pl-claro-page'); return; }
    var sec = bar.nextElementSibling;
    while (sec && sec.tagName !== 'SECTION') sec = sec.nextElementSibling;
    if (!sec) return;
    var cs = getComputedStyle(sec), bg = cs.backgroundColor;
    var vacio = !bg || bg === 'transparent' || /rgba\(0, 0, 0, 0\)/.test(bg);
    /* página oscura: el fondo de atrás también, así no asoma una franja clara */
    poner(document.body, 'backgroundColor', vacio ? '' : bg);
    poner(bar, 'backgroundColor', vacio ? getComputedStyle(document.body).backgroundColor : bg);
    /* página clara (Diseño Gráfico): la barra va con letras oscuras */
    bar.classList.toggle('pl-claro', sec.id === 'design');
    document.documentElement.classList.toggle('pl-claro-page', sec.id === 'design');
  }

  /* ---------- cambio de vista ---------- */
  var vistaActual = '';
  function vista(){
    var app = document.getElementById('app');
    if (!app) return;
    var sec = app.querySelector(':scope > section');
    var id = sec ? (sec.id || sec.className) : '';
    if (id && id !== vistaActual) {
      if (vistaActual) {
        sec.classList.add('pl-enter');
        sec.addEventListener('animationend', function f(){ sec.classList.remove('pl-enter'); sec.removeEventListener('animationend', f); });
      }
      vistaActual = id;
    }
  }

  /* Ilustración: "Guts Atus" sale del roster de series cortas */
  function sinGuts(){
    var hs = document.querySelectorAll('.se-shorts-h');
    for (var i = 0; i < hs.length; i++) {
      if (/^\s*Guts Atus\s*$/i.test(hs[i].textContent)) {
        var card = hs[i].closest('.se-shorts-card'); if (card) card.style.display = 'none';
      }
    }
  }

  /* Escribime: un cuarto dato con la web de cactus® (el estudio con Cami) */
  function cactusLink(){
    var g = document.querySelector('.contact .contact-grid');
    if (!g || g.querySelector('.ci--cactus')) return;
    var c = document.createElement('div');
    c.className = 'ci ci--cactus';
    c.innerHTML = '<a href="https://cactusestudio.com" target="_blank" rel="noopener">cactusestudio.com</a>';
    g.appendChild(c);
  }

  function aplicar(){
    try {
      sinGuts();
      cactusLink();
      vista();
      abanicos();
      reloj();
      barra();
      marcar('.projects-list > *, .simp-web-item, .pj-9r-list-group, .about-stat, .svc-banner, .contact .wrap > *, .section-jump, .pj-koizone-side > *', 'pl-rv');
      marcar('.gcard, .pj-poster-mini', 'pl-rv');
      marcar('.se-title, .projects-list h3, .simp-web-head h3, .hero-card-title', 'pl-tt');
    } catch (e) {}
  }

  var pend = false;
  function cola(){ if (pend) return; pend = true; requestAnimationFrame(function(){ pend = false; aplicar(); }); }
  /* sólo cuando entran o salen ELEMENTOS (una vista nueva, una sección): los cambios de texto (las letras
     que se mezclan en Ilustración, el reloj) no cambian nada de lo que se marca acá y disparaban esto sin parar */
  function relevante(ms){
    for (var i = 0; i < ms.length; i++) {
      var a = ms[i].addedNodes, r = ms[i].removedNodes, j;
      for (j = 0; j < a.length; j++) if (a[j].nodeType === 1) return true;
      for (j = 0; j < r.length; j++) if (r[j].nodeType === 1) return true;
    }
    return false;
  }
  window.__plRelevante = relevante;
  var app = document.getElementById('app');
  if (app) new MutationObserver(function (ms) { if (relevante(ms)) cola(); }).observe(app, { childList: true, subtree: true });
  if (document.readyState !== 'loading') aplicar(); else document.addEventListener('DOMContentLoaded', aplicar);
  setTimeout(aplicar, 500);
})();
