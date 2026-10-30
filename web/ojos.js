/* ============================================================
   OPCIÓN A — LOS OJOS DEL PERSONAJE SIGUEN AL MOUSE
   El personaje (intro y "Sobre mí") venía como <img>: para mover
   las pupilas se mete el SVG adentro de la página. El <img> queda
   encima, invisible, para que los clicks y el cambio a la cara de
   golpeado sigan funcionando igual (se mira su src).
   Pupilas: en la cara normal, los caminos 11 y 13 (ojo izq. y der.,
   con el blanco del ojo en el 10 y el 12); en la de golpeado sólo
   el ojo derecho (12 = blanco, 13 = pupila).
   ============================================================ */
(function () {
  'use strict';
  var SRC = { normal: 'intro/easteregg-es.svg', golpe: 'intro/easteregg-golpe.svg' };
  var OJOS = { normal: [[9, 10], [11, 12]], golpe: [[11, 12]] };
  var cache = {};
  function traer(url) {
    if (!cache[url]) cache[url] = fetch(url).then(function (r) { return r.text(); });
    return cache[url];
  }
  var n = 0, todos = [], mx = -1, my = -1, raf = 0;

  function armarSvg(texto, tipo, pref) {
    var d = document.createElement('div');
    /* ids únicos por personaje (los clipPath del SVG se repetirían) */
    d.innerHTML = texto.replace(/id="([^"]+)"/g, 'id="' + pref + '$1"').replace(/url\(#([^)]+)\)/g, 'url(#' + pref + '$1)');
    var svg = d.querySelector('svg');
    svg.setAttribute('class', 'ojos-' + tipo);
    svg.setAttribute('aria-hidden', 'true');
    svg.removeAttribute('width'); svg.removeAttribute('height');
    var paths = svg.querySelectorAll('path');
    var ojos = OJOS[tipo].map(function (par) { return { blanco: paths[par[0]], pupila: paths[par[1]], x: 0, y: 0 }; })
      .filter(function (o) { return o.blanco && o.pupila; });
    return { svg: svg, ojos: ojos };
  }

  function montar(img) {
    if (!img || img.__ojos || !window.fetch) return;
    img.__ojos = true;
    var pref = 'oj' + (++n) + '_';
    Promise.all([traer(SRC.normal), traer(SRC.golpe)]).then(function (t) {
      var a = armarSvg(t[0], 'normal', pref + 'n'), b = armarSvg(t[1], 'golpe', pref + 'g');
      var w = document.createElement('span');
      w.className = 'ojos ' + (img.className || '');
      img.className = 'ojos-img';
      img.parentNode.insertBefore(w, img);
      w.appendChild(a.svg); w.appendChild(b.svg); w.appendChild(img);
      var p = { w: w, normal: a, golpe: b };
      var mirar = function () { w.classList.toggle('is-golpe', /golpe/.test(img.getAttribute('src') || '')); pedir(); };
      new MutationObserver(mirar).observe(img, { attributes: true, attributeFilter: ['src'] });
      mirar();
      /* cuánto se puede correr cada pupila sin salirse del ojo (en unidades del SVG) */
      [a, b].forEach(function (cara) {
        cara.ojos.forEach(function (o) {
          try {
            var bb = o.blanco.getBBox(), pb = o.pupila.getBBox();
            o.mx = Math.max(0, (bb.width - pb.width) / 2 * 0.72);
            o.my = Math.max(0, (bb.height - pb.height) / 2 * 0.72);
          } catch (e) { o.mx = o.my = 0; }
        });
      });
      todos.push(p);
      pedir();
    }).catch(function () {});
  }

  function mover() {
    raf = 0;
    if (mx < 0) return;
    var vh = window.innerHeight;
    todos.forEach(function (p) {
      if (!p.w.isConnected) return;
      var r = p.w.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50 || !r.width) return;
      var cara = p.w.classList.contains('is-golpe') ? p.golpe : p.normal;
      cara.ojos.forEach(function (o) {
        var e = o.blanco.getBoundingClientRect();
        var cx = e.left + e.width / 2, cy = e.top + e.height / 2;
        var dx = mx - cx, dy = my - cy, dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var k = Math.min(1, dist / 260);
        var x = dx / dist * o.mx * k, y = dy / dist * o.my * k;
        if (Math.abs(x - o.x) < 0.3 && Math.abs(y - o.y) < 0.3) return;
        o.x = x; o.y = y;
        o.pupila.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
    });
  }
  function pedir() { if (!raf) raf = requestAnimationFrame(mover); }
  function apuntar(e) { mx = e.clientX; my = e.clientY; pedir(); }
  window.addEventListener('pointermove', apuntar, { passive: true });
  window.addEventListener('pointerdown', apuntar, { passive: true });
  window.addEventListener('scroll', pedir, { passive: true });

  window.AtusOjos = { montar: montar };
})();
