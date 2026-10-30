/* ============================================================
   OPCIÓN A — LECTOR DE LIBROS DENTRO DE LA PÁGINA
   En vez de abrir el PDF aparte: las páginas (ya pasadas a imagen
   en web/libros/) se leen como un libro y la hoja se
   da vuelta. En compu, libro abierto a doble página; en el celular
   (y en manuales apaisados) de a una página. Flechas, teclado,
   deslizar o tocar el borde de la hoja para pasar.
   ============================================================ */
(function () {
  'use strict';
  var HERE = 'web/libros/';
  var LIBROS = {
    koizone:   { t: 'Koizone', n: 5, ar: 1200 / 1674 },
    spiderman: { t: 'Spider-Man Arquitectura', n: 62, ar: 1200 / 2000 },
    cactus:    { t: 'cactus® · Manual de marca', n: 17, ar: 1600 / 1130 }
  };
  var DUR = 720;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function pag(id, i) { return HERE + id + '/' + (i < 10 ? '0' : '') + i + '.jpg'; }

  var ov = el('div', 'lb');
  ov.hidden = true;
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('data-lenis-prevent', '');
  ov.innerHTML =
    '<div class="lb__top"><span class="lb__t"></span><button class="lb__close" type="button">Cerrar ✕</button></div>' +
    '<div class="lb__mesa"><div class="lb__libro"></div></div>' +
    '<div class="lb__bar">' +
      '<button class="lb__nav lb__nav--prev" type="button" aria-label="Página anterior">←</button>' +
      '<span class="lb__n"></span>' +
      '<button class="lb__nav lb__nav--next" type="button" aria-label="Página siguiente">→</button>' +
    '</div>';
  document.body.appendChild(ov);
  var mesa = ov.querySelector('.lb__mesa'), libro = ov.querySelector('.lb__libro');
  var tEl = ov.querySelector('.lb__t'), nEl = ov.querySelector('.lb__n');

  var cur = null, id = '', doble = true, pos = 0, ocupado = false, lastFocus = null;

  /* doble página: tapa sola a la derecha, después pares [2,3], [4,5]…
     una página: de a una */
  function hojas(p) {
    if (!doble) return [p];
    if (p === 0) return [0, 1];
    var l = p * 2; return [l, l + 1 <= cur.n ? l + 1 : 0];
  }
  function total() { return doble ? Math.floor(cur.n / 2) + 1 : cur.n; }
  function ponerIdx(p) { return doble ? p : p + 1; }

  function img(i) {
    var w = el('div', 'lb__hoja');
    if (i > 0 && i <= cur.n) { var im = el('img'); im.alt = cur.t + ', página ' + i; im.decoding = 'async'; im.draggable = false; im.src = pag(id, i); w.appendChild(im); }
    else w.classList.add('is-vacia');
    return w;
  }
  function precargar(p) {
    [p - 1, p + 1, p + 2].forEach(function (q) {
      if (q < 0 || q >= total()) return;
      (doble ? hojas(q) : [ponerIdx(q)]).forEach(function (i) { if (i > 0) { var im = new Image(); im.src = pag(id, i); } });
    });
  }

  function medir() {
    var vw = window.innerWidth;
    doble = cur.ar < 1 && vw > 760;
    var r = mesa.getBoundingClientRect();
    var W = r.width, H = r.height;
    var cols = doble ? 2 : 1;
    var h = Math.min(H, W / (cols * cur.ar)), w = h * cur.ar;
    libro.style.width = Math.round(w * cols) + 'px';
    libro.style.height = Math.round(h) + 'px';
    libro.classList.toggle('is-doble', doble);
  }

  function pintar() {
    libro.innerHTML = '';
    if (doble) {
      var hs = hojas(pos);
      var L = img(hs[0]), R = img(hs[1]);
      L.classList.add('lb__l'); R.classList.add('lb__r');
      libro.appendChild(L); libro.appendChild(R);
      libro.classList.toggle('is-tapa', pos === 0);
      libro.classList.toggle('is-contra', hs[1] === 0 && pos > 0);
    } else {
      var S = img(ponerIdx(pos)); S.classList.add('lb__s');
      libro.appendChild(S);
      libro.classList.remove('is-tapa', 'is-contra');
    }
    var n = total();
    if (doble) {
      var hh = hojas(pos).filter(function (i) { return i > 0; });
      nEl.textContent = hh.join('–') + ' / ' + cur.n;
    } else nEl.textContent = ponerIdx(pos) + ' / ' + cur.n;
    ov.querySelector('.lb__nav--prev').disabled = pos <= 0;
    ov.querySelector('.lb__nav--next').disabled = pos >= n - 1;
    precargar(pos);
  }

  /* la hoja que se da vuelta: frente y dorso, gira sobre el lomo */
  function hojaQueGira(frente, dorso, lado) {
    var h = el('div', 'lb__gira lb__gira--' + lado);
    var a = img(frente), b = img(dorso);
    a.classList.add('lb__cara', 'lb__cara--frente'); b.classList.add('lb__cara', 'lb__cara--dorso');
    h.appendChild(a); h.appendChild(b);
    h.appendChild(el('span', 'lb__sombra'));
    return h;
  }

  function ir(d) {
    if (!cur || ocupado) return;
    var n = total(), dest = pos + d;
    if (dest < 0 || dest >= n) return;
    if (!libro.animate) { pos = dest; pintar(); return; }
    ocupado = true;
    if (doble) {
      var a = hojas(pos), b = hojas(dest);
      var giro;
      if (d > 0) {
        /* debajo ya está la derecha nueva; la izquierda queda hasta que apoye la hoja */
        libro.querySelector('.lb__r').replaceWith(Object.assign(img(b[1]), { className: 'lb__hoja lb__r' + (b[1] ? '' : ' is-vacia') }));
        giro = hojaQueGira(a[1], b[0], 'der');
        libro.appendChild(giro);
        giro.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], { duration: DUR, easing: 'cubic-bezier(.45,.05,.25,1)' });
      } else {
        libro.querySelector('.lb__l').replaceWith(Object.assign(img(b[0]), { className: 'lb__hoja lb__l' + (b[0] ? '' : ' is-vacia') }));
        giro = hojaQueGira(a[0], b[1], 'izq');
        libro.appendChild(giro);
        giro.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }], { duration: DUR, easing: 'cubic-bezier(.45,.05,.25,1)' });
      }
      libro.classList.toggle('is-tapa', dest === 0);
      libro.classList.toggle('is-contra', b[1] === 0 && dest > 0);
      var sh = giro.querySelector('.lb__sombra');
      sh.animate([{ opacity: 0 }, { opacity: .55, offset: .5 }, { opacity: 0 }], { duration: DUR });
    } else {
      var adelante = d > 0;
      var debajo = img(ponerIdx(adelante ? dest : pos)); debajo.classList.add('lb__s');
      var hoja = img(ponerIdx(adelante ? pos : dest)); hoja.classList.add('lb__s', 'lb__suelta');
      libro.innerHTML = ''; libro.appendChild(debajo); libro.appendChild(hoja);
      var kf = [{ transform: 'rotateY(0deg)', opacity: 1 }, { transform: 'rotateY(-104deg)', opacity: 0 }];
      if (!adelante) kf.reverse();
      hoja.animate(kf, { duration: DUR * .85, easing: 'cubic-bezier(.45,.05,.25,1)', fill: 'forwards' });
    }
    setTimeout(function () { pos = dest; pintar(); ocupado = false; }, doble ? DUR : DUR * .85);
  }

  function abrir(cual, desde) {
    var c = LIBROS[cual]; if (!c) return;
    cur = c; id = cual; pos = desde || 0;
    tEl.textContent = c.t;
    lastFocus = document.activeElement;
    ov.hidden = false; ov.classList.remove('is-open'); void ov.offsetWidth; ov.classList.add('is-open');
    document.documentElement.classList.add('lb-abierto');
    if (window.__plLenis) window.__plLenis.stop();
    medir(); pintar();
    setTimeout(function () { ov.querySelector('.lb__close').focus({ preventScroll: true }); }, 30);
  }
  function cerrar() {
    ov.hidden = true; cur = null; libro.innerHTML = '';
    document.documentElement.classList.remove('lb-abierto');
    if (window.__plLenis && !document.querySelector('.dgv:not([hidden])')) window.__plLenis.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  ov.querySelector('.lb__close').addEventListener('click', cerrar);
  ov.querySelector('.lb__nav--prev').addEventListener('click', function () { ir(-1); });
  ov.querySelector('.lb__nav--next').addEventListener('click', function () { ir(1); });
  document.addEventListener('keydown', function (e) {
    if (ov.hidden) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); cerrar(); }
    else if (e.key === 'ArrowRight') { e.stopImmediatePropagation(); ir(1); }
    else if (e.key === 'ArrowLeft') { e.stopImmediatePropagation(); ir(-1); }
  }, true);
  /* tocar la mitad izquierda o derecha del libro pasa de hoja */
  mesa.addEventListener('click', function (e) {
    if (!cur) return;
    var r = libro.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    ir(e.clientX < r.left + r.width / 2 ? -1 : 1);
  });
  (function deslizar() {
    var x0 = 0, y0 = 0, on = false;
    mesa.addEventListener('touchstart', function (e) { var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; on = true; }, { passive: true });
    mesa.addEventListener('touchend', function (e) {
      if (!on) return; on = false;
      var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) { e.preventDefault(); ir(dx < 0 ? 1 : -1); }
    });
  })();
  var rz = 0;
  window.addEventListener('resize', function () {
    if (!cur) return; clearTimeout(rz);
    rz = setTimeout(function () {
      var antes = doble; medir();
      if (antes !== doble) pos = doble ? Math.ceil(pos / 2) : Math.max(0, pos * 2 - 1);
      pintar();
    }, 120);
  });

  window.AtusLibro = { abrir: abrir, cerrar: cerrar, libros: LIBROS };
})();
