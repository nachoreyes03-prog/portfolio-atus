/* ============================================================
   OPCIÓN A — SERVICIOS COMO RECIBO TÉRMICO
   Un recibo de verdad: angosto, derecho, papel térmico con dientes
   arriba y abajo, renglones de asteriscos, ítems a la izquierda y el
   número a la derecha, totales, "gracias" y código de barras. La
   impresión pasa por un filtro de tinta (bordes corridos, sangrado
   y zonas más gastadas). Se tilda con un click (con mouse) o
   tocando (celular) y abajo se arma el mensaje para WhatsApp o mail.
   ============================================================ */
(function () {
  'use strict';
  if (window.__tkListo) return; window.__tkListo = true;

  var HERE = 'web/tk/';
  var WPP = '5491159769593';
  var MAIL = 'atus.graphic@gmail.com';

  var T = {
    es: {
      slogan: 'Dejá de buscar diseñador gráfico.',
      local: 'Buenos Aires · @atus_dg',
      title: 'Servicios',
      fecha: 'Fecha', hora: 'Hora', hint: 'Tildá lo que necesitás',
      rows: [
        ['Ilustración', 'Ilustraciones a color / blanco y negro / ilustración digital / piezas para redes / editorial / publicidad.'],
        ['Branding / identidad visual', 'Dirección creativa / identidad de marca / logotipo principal & secundarios / paleta cromática / sistema tipográfico / recursos gráficos / brand guidelines.', 'Packs de branding básico - completo'],
        ['Edición de video', 'Edición de video / rotoscopia / stop motion / animación gráfica / piezas audiovisuales para redes.'],
        ['Packaging', 'Cajas / bolsas / etiquetas / stickers / envases / piezas gráficas para producto.'],
        ['Diseño editorial', 'Catálogos / folletos / brochures / tarjetas / manuales / presentaciones / newsletters / publicaciones digitales.'],
        ['Diseño web · UX/UI', 'Sitios web / landing pages / e-commerce / diseño responsive / rediseño web / diseño UI / UX research / wireframes / prototipos.']
      ],
      elegidos: 'Servicios elegidos', total: 'Total', cotizar: 'A cotizar',
      ask: 'Solicitá tu presupuesto',
      wpp: 'Enviar por WhatsApp', mail: 'Enviar por mail',
      gracias: '¡Gracias!',
      msgList: 'Hola Atus! Vi tu portfolio y quiero pedir presupuesto para:',
      msgNone: 'Hola Atus! Vi tu portfolio y quiero pedir un presupuesto.',
      subject: 'Presupuesto desde tu portfolio'
    },
    en: {
      slogan: 'You found your graphic designer.',
      local: 'Buenos Aires · @atus_dg',
      title: 'Services',
      fecha: 'Date', hora: 'Time', hint: 'Tick what you need',
      rows: [
        ['Illustration', 'Full-color illustrations / black-and-white illustrations / digital illustration / social media graphics / editorial / advertising.'],
        ['Branding / visual identity', 'Creative direction / brand identity / primary & secondary logos / color palette / typographic system / graphic assets / brand guidelines.', 'Basic - full branding packages'],
        ['Video editing', 'Video editing / rotoscoping / stop motion / motion graphics / audiovisual content for social media.'],
        ['Packaging', 'Boxes / bags / labels / stickers / containers / wraps / cases / graphic design for products.'],
        ['Editorial design', 'Catalogs / flyers / brochures / cards / manuals / presentations / newsletters / digital publications.'],
        ['Web design · UX/UI', 'Websites / landing pages / e-commerce / responsive design / website redesign / UI design / UX research / wireframes / prototypes.']
      ],
      elegidos: 'Selected services', total: 'Total', cotizar: 'To be quoted',
      ask: 'Request a quote',
      wpp: 'Send on WhatsApp', mail: 'Send by email',
      gracias: 'Thank you!',
      msgList: 'Hi Atus! I saw your portfolio and I would like a quote for:',
      msgNone: 'Hi Atus! I saw your portfolio and I would like a quote.',
      subject: 'Quote from your portfolio'
    }
  };

  function $(s, c) { return (c || document).querySelector(s); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'es'; }
  /* como el resto del sitio ("mucho motion"), corre aunque el sistema pida
     reducir movimiento (Windows con los efectos de animación apagados) */
  var MOTION = !/[?&]motion=0/.test(location.search);
  /* Safari dibuja mal los filtros SVG sobre HTML: ahí la tinta se imita con una sombra corta */
  var SAFARI = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);


  /* el filtro de tinta térmica: bordes un poco corridos, sangrado, y la
     impresión despareja (manchas apenas más claras, sin franjas) */
  var FILTRO =
    '<svg class="tk-defs" width="0" height="0" aria-hidden="true" focusable="false">' +
      '<filter id="tk-tinta" x="-3%" y="-15%" width="106%" height="130%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="7" result="grano"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="grano" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="corrida"/>' +
        '<feGaussianBlur in="corrida" stdDeviation="0.42" result="blur"/>' +
        '<feComponentTransfer in="blur" result="sangrado"><feFuncA type="table" tableValues="0 0.5 0.9 1 1"/></feComponentTransfer>' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="13" result="cabezal"/>' +
        '<feColorMatrix in="cabezal" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.5 1.2" result="gastado"/>' +
        '<feComposite in="sangrado" in2="gastado" operator="in" result="impreso"/>' +
        /* puntitos sin tinta, como los del cabezal térmico */
        '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="21" result="pin"/>' +
        '<feColorMatrix in="pin" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -12 9.9" result="huecos"/>' +
        '<feComposite in="impreso" in2="huecos" operator="in"/>' +
      '</filter>' +
      /* tinta de birome: casi pareja, con grano y el borde apenas blando */
      '<filter id="tk-boli" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="5" result="n"/>' +
        '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.5 0 0 0 1.85" result="a"/>' +
        '<feComposite in="SourceGraphic" in2="a" operator="in" result="t"/>' +
        '<feGaussianBlur in="t" stdDeviation="0.22"/>' +
      '</filter>' +
    '</svg>';

  var elegidos = [false, false, false, false, false, false];
  var root = el('div', 'tk' + (SAFARI ? ' tk--sf' : ''));
  var papel, totalN, aWpp, aMail;

  function ahora() {
    var d = new Date(), f, h;
    try {
      var o = { timeZone: 'America/Argentina/Buenos_Aires' };
      f = new Intl.DateTimeFormat('es-AR', Object.assign({ day: '2-digit', month: '2-digit', year: 'numeric' }, o)).format(d);
      h = new Intl.DateTimeFormat('es-AR', Object.assign({ hour: '2-digit', minute: '2-digit', hour12: false }, o)).format(d);
    } catch (e) { f = d.toLocaleDateString(); h = d.toTimeString().slice(0, 5); }
    return { f: f, h: h, n: '0001 ' + f.replace(/\D/g, '').slice(0, 4) + f.slice(-2) + ' ' + h.replace(/\D/g, '') };
  }
  function renglon(c) { return '<div class="tk-ink tk-sep" aria-hidden="true">' + new Array(80).join(c + ' ') + '</div>'; }

  function armar() {
    var t = T[lang()], a = ahora();
    root.innerHTML = FILTRO;
    papel = el('div', 'tk-papel');
    var items = t.rows.map(function (r, i) {
      return '<li class="tk-row" style="--i:' + i + '">' +
        '<button class="tk-item' + (elegidos[i] ? ' is-on' : '') + '" type="button" aria-pressed="' + elegidos[i] + '" data-i="' + i + '">' +
          '<span class="tk-ink tk-line"><span class="tk-box" aria-hidden="true"></span><span class="tk-name">' + esc(r[0]) + '</span><span class="tk-num">0' + (i + 1) + '</span></span>' +
          '<span class="tk-ink tk-desc">' + esc(r[1]) + (r[2] ? '<b>' + esc(r[2]) + '</b>' : '') + '</span>' +
        '</button></li>';
    }).join('');
    papel.innerHTML =
      '<header class="tk-ink tk-head">' +
        '<img class="tk-logo" src="img/logo-atus.png" alt="Atus">' +
        '<p class="tk-slogan">' + esc(t.slogan) + '</p>' +
        '<p class="tk-local">' + esc(t.local) + '</p>' +
        '<h2 class="tk-title"><span>' + esc(t.title) + '</span></h2>' +
      '</header>' +
      renglon('*') +
      '<p class="tk-vivo tk-meta"><span>' + t.fecha + ' ' + a.f + '</span><span>' + t.hora + ' ' + a.h + '</span></p>' +
      renglon('*') +
      '<p class="tk-ink tk-hint">' + t.hint + '</p>' +
      '<ul class="tk-list">' + items + '</ul>' +
      renglon('*') +
      '<div class="tk-tot" aria-live="polite">' +
        '<p><span class="tk-ink">' + t.elegidos + '</span><i class="tk-ink" aria-hidden="true"></i><b class="tk-vivo tk-total__v">0</b></p>' +
        '<p class="tk-tot__big"><span class="tk-ink">' + t.total + '</span><i class="tk-ink" aria-hidden="true"></i><b class="tk-ink">' + t.cotizar + '</b></p>' +
      '</div>' +
      renglon('*') +
      '<p class="tk-ink tk-ask">' + t.ask + '</p>' +
      '<div class="tk-send">' +
        '<a class="tk-btn tk-btn--wpp" target="_blank" rel="noopener">' + t.wpp + ' <span aria-hidden="true">→</span></a>' +
        '<a class="tk-btn tk-btn--mail">' + t.mail + ' <span aria-hidden="true">→</span></a>' +
      '</div>' +
      '<a class="tk-ink tk-mailtxt" href="mailto:' + MAIL + '">' + MAIL + '</a>' +
      '<p class="tk-ink tk-gracias">' + t.gracias + '</p>' +
      '<div class="tk-ink tk-barcode" aria-hidden="true"></div>' +
      '<p class="tk-vivo tk-code" aria-hidden="true">' + a.n + '</p>';
    barcode($('.tk-barcode', papel));
    totalN = $('.tk-total__v', papel);
    aWpp = $('.tk-btn--wpp', papel); aMail = $('.tk-btn--mail', papel);
    Array.prototype.forEach.call(papel.querySelectorAll('.tk-item'), function (b) {
      b.addEventListener('click', function (e) { tildar(+b.dataset.i, b, e); });
    });
    root.appendChild(papel);
    renglones();
    escala();
    actualizar();
    /* lo que ya estaba tildado (al cambiar de idioma) vuelve con su tilde, sin animar */
    Array.prototype.forEach.call(papel.querySelectorAll('.tk-item.is-on'), function (b) { ponerTilde(b, null); });
    if (vio) vio.observe(root);
    if (MOTION) {
      /* el rollo: una cortina del color de la sección tapa lo que todavía
         no salió, con el rollo de papel en el borde. Sólo se mueve con
         transform (no repinta el papel ni la tinta) */
      telon = el('div', 'tk-telon', '<div class="tk-telon__i"><span class="tk-rollo"><span class="tk-rollo__cuerpo"></span><span class="tk-rollo__tapa tk-rollo__tapa--i"></span><span class="tk-rollo__tapa tk-rollo__tapa--d"></span></span></div>');
      telon.setAttribute('role', 'button');
      telon.setAttribute('tabindex', '0');
      telon.setAttribute('aria-label', lang() === 'en' ? 'Unroll the receipt' : 'Desenrollar el recibo');
      telon.addEventListener('click', abrirSolo);
      telon.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirSolo(); } });
      rollo = $('.tk-rollo', telon);
      root.appendChild(telon);
      root.classList.add('tk--rollo');
      if (abierto > minimoVisible() + 6) root.classList.add('is-tocado');
      requestAnimationFrame(desenrollar);
      /* tocar la parte de arriba del recibo (lo que ya se ve) también lo abre */
      papel.addEventListener('click', function (e) {
        if (root.classList.contains('is-abierto') || e.target.closest('.tk-item, .tk-btn, a')) return;
        abrirSolo();
      });
      if (!root.classList.contains('is-abierto')) intentar3D();
    }
  }

  /* ---------- el rollo en 3D (rollo3d.js) ----------
     Mientras carga, o si no hay WebGL, queda el rollo de CSS de arriba.
     En 3D se ve la imagen del recibo enrollada; al terminar de abrirse se
     pasa al recibo real (son idénticos de frente) para poder tildar. */
  var r3d = null, cv3 = null, M3 = { izq: 150, der: 150, arr: 130, aba: 300 }, dpr3 = 1, extra = 0, cargando3d = false;
  /* recto: 0 = en ángulo (como llega), 1 = de frente. De frente, arriba va el recibo
     real (se puede tildar) y el 3D sólo pone el rollo */
  var recto = 0, rafE = 0;
  function intentar3D() {
    if (r3d || cargando3d || !window.AtusRollo3D || lang() !== 'es') return;
    if (/[?&]tex=1/.test(location.search)) return; /* captura de la textura: el recibo tal cual */
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var tipo = vw <= 760 ? 'celu' : 'compu';
    cargando3d = true;
    var img = new Image();
    var meta = fetch(HERE + 'rollo-' + tipo + '.json').then(function (r) { return r.json(); });
    var foto = new Promise(function (ok, mal) { img.onload = ok; img.onerror = mal; img.src = HERE + 'rollo-' + tipo + '.webp'; });
    Promise.all([meta, foto]).then(function (res) {
      var j = res[0];
      return (document.fonts && document.fonts.load ? document.fonts.load(j.font) : Promise.resolve()).then(function () { return j; });
    }).then(function (j) {
      if (!papel || !papel.isConnected || root.classList.contains('is-abierto')) return;
      /* la imagen no tiene fecha ni hora: se dibujan en vivo, igual que en el recibo */
      var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      var x = c.getContext('2d'); x.drawImage(img, 0, 0);
      var k = j.escala, a = ahora(), t = T[lang()];
      var fp = j.font.split(' ');
      x.font = fp[0] + ' ' + (parseFloat(fp[1]) * k) + 'px "JetBrains Mono", monospace';
      x.fillStyle = j.color; x.textBaseline = 'alphabetic';
      x.textAlign = 'left'; x.fillText((t.fecha + ' ' + a.f).toUpperCase(), j.fecha.x * k, j.fecha.base * k);
      x.textAlign = 'right'; x.fillText((t.hora + ' ' + a.h).toUpperCase(), j.hora.r * k, j.hora.base * k);
      /* el número debajo del código de barras, centrado y con su espaciado */
      if (j.codigo) {
        var cf = j.codFont.split(' '), ls = (parseFloat(j.codLs) || 0) * k;
        x.font = cf[0] + ' ' + (parseFloat(cf[1]) * k) + 'px "JetBrains Mono", monospace';
        x.textAlign = 'left';
        var txt = a.n, ancho = 0, ci;
        for (ci = 0; ci < txt.length; ci++) ancho += x.measureText(txt[ci]).width + ls;
        var cx = (j.codigo.x + j.codigo.w / 2) * k - ancho / 2;
        for (ci = 0; ci < txt.length; ci++) { x.fillText(txt[ci], cx, j.codigo.base * k); cx += x.measureText(txt[ci]).width + ls; }
      }
      /* el papel de la página pasa a ser esta misma foto (con la tinta ya
         impresa): el filtro de tinta no se recalcula al scrollear y de frente
         es idéntico al 3D. El texto real queda invisible encima para tildar,
         leer y los lectores de pantalla; lo que cambia (fecha, total, botones)
         sigue vivo. Si la medida no coincide (otra letra), queda el de siempre */
      if (!/[?&]nofoto=1/.test(location.search) && Math.abs(papel.offsetHeight - j.h) <= 3 && Math.abs(papel.offsetWidth - j.w) <= 3) {
        var poner = function () {
          papel.style.backgroundImage = 'url("' + img.src + '")';
          root.classList.add('tk--foto');
        };
        /* ya decodificada, así no traba la primera vez que se dibuja */
        if (img.decode) img.decode().then(poner, poner); else poner();
      }
      cv3 = document.createElement('canvas');
      cv3.className = 'tk-3d';
      cv3.setAttribute('role', 'button');
      cv3.setAttribute('aria-label', 'Desenrollar el recibo');
      cv3.addEventListener('click', abrirSolo);
      root.appendChild(cv3);
      r3d = window.AtusRollo3D.crear({ canvas: cv3, textura: c, W: papel.offsetWidth, L: papel.offsetHeight, gap: tipo === 'celu' ? 8 : 10, rmin: tipo === 'celu' ? 7 : 9,
        tilt: tipo === 'celu' ? 0.55 : 0.62, yaw: tipo === 'celu' ? 0.06 : 0.2, corrida: tipo === 'celu' ? 0 : 0.05, atras: tipo === 'celu' ? 190 : 90 });
      if (!r3d) { cv3.remove(); cv3 = null; return; }
      medir3D();
      root.classList.add('tk--3d');
      pintarRollo();
      tiron();
    }).catch(function () { if (cv3) { cv3.remove(); cv3 = null; } r3d = null; })
      .then(function () { cargando3d = false; });
  }
  /* el lienzo cubre sólo la parte de la pantalla donde está el recibo (y se
     corre con el scroll en el mismo cuadro): así es chico y liviano */
  var cvAlto = 0;
  function medir3D() {
    if (!cv3) return;
    var W = papel.offsetWidth, s = root.__s || 1, vh = window.innerHeight;
    cvAlto = Math.round(vh / s + 240);
    dpr3 = Math.min(window.devicePixelRatio || 1, 1.6);
    var cssW = W + M3.izq + M3.der;
    var px = cssW * cvAlto * s * s * dpr3 * dpr3, tope = 5.5e6;
    if (px > tope) dpr3 *= Math.sqrt(tope / px);
    cv3.style.left = -M3.izq + 'px'; cv3.style.top = '0px';
    cv3.style.width = cssW + 'px'; cv3.style.height = cvAlto + 'px';
    cv3.width = Math.round(cssW * s * dpr3);
    cv3.height = Math.round(cvAlto * s * dpr3);
  }
  /* dónde va el lienzo (en px del recibo) para el papel con su borde de arriba en "top" */
  function topeLienzo(top) {
    var s = root.__s || 1, L = papel.offsetHeight;
    var y = -top / s - 120;
    return Math.max(-M3.arr, Math.min(L + M3.aba - cvAlto, y));
  }
  /* apenas se empieza a abrir, se pone de frente (medio segundo) y desde ahí se tilda */
  function enderezar() {
    if (!r3d || recto >= 1 || rafE) return;
    var t0 = 0, desde = recto;
    rafE = requestAnimationFrame(function paso(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / 520), e = k * k * (3 - 2 * k);
      recto = desde + (1 - desde) * e;
      if (k >= 1) { recto = 1; rafE = 0; root.classList.add('tk--3d-recto'); }
      else rafE = requestAnimationFrame(paso);
      if (!anim) pintarRollo();
    });
  }
  /* la cámara: el ojo en el centro de la pantalla. top = dónde está (o estaría) el papel */
  function vista3D(top) {
    var W = papel.offsetWidth, L = papel.offsetHeight, s = root.__s || 1;
    var pr = papel.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    if (top == null) top = pr.top;
    var ct = topeLienzo(top);
    return {
      ojoX: (vw / 2 - pr.left) / s, ojoY: -(vh / 2 - top) / s,
      D: (vh / 2) / Math.tan(32 * Math.PI / 360) / s,
      izq: -M3.izq, der: W + M3.der, arr: -ct, aba: -(ct + cvAlto),
      top: top, s: s, ct: ct, alto: cvAlto * s
    };
  }
  /* bajando: cuando la cabecera pasa el 30 % de la pantalla el papel empieza a salir
     y el rollo baja (el papel sale al doble de rápido) hasta casi el borde de abajo;
     ahí se queda y el papel sigue saliendo. Lo que salió ya se puede tildar, así que
     se va leyendo y tildando de arriba a abajo, sin volver a subir */
  function abiertoPorScroll(minimo) {
    var vh = window.innerHeight, s = root.__s || 1, L = papel.offsetHeight;
    var t = papel.getBoundingClientRect().top, t0 = vh * 0.3, d = t0 - t;
    if (d <= 0) return minimo;
    var tope = vh * (window.innerWidth <= 760 ? 0.86 : 0.88), y0 = t0 + minimo * s;
    var y = Math.min(Math.max(tope, y0), y0 + d);
    return Math.max(minimo, Math.min(L, (y - t) / s));
  }
  function dibujar3D() {
    if (!r3d || !cv3) return;
    var L = papel.offsetHeight, v = vista3D(), vh = window.innerHeight;
    if (v.top + L * v.s + M3.aba < -50 || v.top - M3.arr > vh + 50) return;
    cv3.style.transform = 'translate3d(0,' + v.ct.toFixed(1) + 'px,0)';
    var F = Math.min(L, abierto + extra);
    /* de frente, el papel es el recibo real (quieto, no se vuelve a pintar), la
       cortina del color de la sección tapa lo que no salió (sólo se corre) y el
       3D pone encima el rollo y su sombra: así el scroll va liviano */
    r3d.dibujar(F, recto, v);
  }
  /* al terminar de abrirse: se pasa al recibo real (de frente son iguales) */
  function terminar3D() {
    if (!cv3) return;
    var c = cv3, r = r3d; cv3 = null; r3d = null;
    if (rafE) { cancelAnimationFrame(rafE); rafE = 0; }
    root.classList.add('tk--3d-fin');
    root.classList.remove('tk--3d', 'tk--3d-recto');
    c.style.opacity = '0';
    setTimeout(function () { r.destruir(); c.remove(); root.classList.remove('tk--3d-fin'); }, 450);
  }
  /* mientras nadie lo tocó, cada tanto asoma un poquito más de papel */
  var tironT = 0;
  function tiron() {
    clearInterval(tironT);
    tironT = setInterval(function () {
      if (!r3d || root.classList.contains('is-tocado') || anim) return;
      var t0 = 0;
      (function paso(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / 900);
        extra = 22 * Math.sin(Math.PI * k) * (1 - 0.3 * k);
        pintarRollo();
        if (k < 1 && r3d) requestAnimationFrame(paso); else { extra = 0; pintarRollo(); }
      })(performance.now());
    }, 3800);
  }

  /* ---------- enrollado al llegar; se abre bajando o tocándolo ---------- */
  var telon = null, rollo = null, abierto = 0, rafR = 0, anim = 0, visto = false;
  function fondoDe(n) {
    while (n && n !== document.documentElement) {
      var c = getComputedStyle(n).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\(\d+, \d+, \d+, 0\)/.test(c)) return c;
      n = n.parentElement;
    }
    return '#0a0907';
  }
  function minimoVisible() {
    var hint = $('.tk-hint', papel);
    return hint ? hint.offsetTop + hint.offsetHeight + 16 : 280;
  }
  /* dibuja el estado: hasta dónde salió el papel y el grosor del rollo
     (cuanto más papel queda enrollado, más gordo el rollo) */
  function pintarRollo() {
    var h = papel.offsetHeight;
    /* nunca más enrollado que la cabecera: así llega (antes arrancaba en 0, todo
       enrollado, y saltaba de golpe a la cabecera al aparecer) */
    var minimo = minimoVisible();
    if (abierto < minimo) abierto = minimo;
    if (abierto >= h - 2) { abierto = h; root.classList.add('is-abierto'); }
    if (r3d) { dibujar3D(); if (root.classList.contains('is-abierto')) terminar3D(); }
    /* con el 3D en ángulo la cortina tapa todo el papel real */
    telon.style.transform = 'translate3d(0,' + (r3d && recto < 1 ? 0 : Math.round(abierto)) + 'px,0)';
    var resto = Math.max(0, h - abierto);
    var dmax = window.innerWidth <= 760 ? 78 : 104;
    var d = Math.max(26, Math.min(dmax, 26 + resto * 0.06));
    if (rollo) rollo.style.setProperty('--d', d.toFixed(1) + 'px');
  }
  function desenrollar() {
    rafR = 0;
    if (!telon || !papel || !papel.isConnected || anim) return;
    var inner = telon.firstChild;
    /* 99 % y no opaca: si es opaca, el navegador no dibuja de antemano el papel que
       tapa y al correrse la cortina lo tiene que dibujar de golpe (un tirón) */
    if (inner && !inner.style.backgroundColor) inner.style.backgroundColor = fondoDe(root.parentNode).replace(/^rgba?\(([^,]+),([^,]+),([^,)]+).*$/, 'rgba($1,$2,$3,.99)');
    var r = papel.getBoundingClientRect(), vh = window.innerHeight, minimo = minimoVisible();
    /* llegás y está enrollado (se ve la cabecera con "Servicios"); si seguís
       bajando, el rollo se queda quieto en la pantalla y el papel va saliendo */
    /* si la página aparece ya pasada (recargar a mitad de página, un salto), no se
       abre de golpe: primero tiene que verse enrollado con la cabecera arriba */
    if (!visto) { if (r.top > -40 && r.top < vh * 0.7) visto = true; else { pintarRollo(); return; } }
    var ver = abiertoPorScroll(minimo);
    if (ver > abierto) abierto = ver;
    if (abierto > minimo + 6) { root.classList.add('is-tocado'); enderezar(); }
    pintarRollo();
  }
  /* tocarlo: se desenrolla solo hasta el final */
  function abrirSolo() {
    if (!telon || anim || root.classList.contains('is-abierto')) return;
    root.classList.add('is-tocado');
    enderezar();
    var h = papel.offsetHeight, desde = Math.max(abierto, minimoVisible()), t0 = 0;
    var dur = Math.min(1500, 600 + (h - desde) * 0.6);
    function paso(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      abierto = desde + (h - desde) * e;
      pintarRollo();
      if (k < 1) anim = requestAnimationFrame(paso); else { anim = 0; abierto = h; pintarRollo(); }
    }
    anim = requestAnimationFrame(paso);
  }
  function pedirRollo() {
    /* con Lenis y el 3D ya se dibuja desde el scroll de Lenis: no dos veces por cuadro */
    if (r3d && window.__plLenis) return;
    if (!rafR && telon && !root.classList.contains('is-abierto')) rafR = requestAnimationFrame(desenrollar);
  }
  window.addEventListener('scroll', pedirRollo, { passive: true });
  window.addEventListener('resize', function () { if (r3d) { medir3D(); } pedirRollo(); });
  /* con el scroll suave (Lenis) el 3D se dibuja en el mismo cuadro que el scroll: no tiembla */
  (function engancharLenis() {
    if (window.__plLenis && window.__plLenis.on) { window.__plLenis.on('scroll', function () { if (r3d && !anim) desenrollar(); }); return; }
    setTimeout(engancharLenis, 300);
  })();

  /* los renglones de asteriscos: justo los que entran, sin medio asterisco en los bordes */
  function renglones() {
    var seps = papel.querySelectorAll('.tk-sep');
    if (!seps.length) return;
    var m = el('span'); m.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    m.textContent = '* * * * * * * * * * '; /* 10 pares asterisco + espacio */
    seps[0].appendChild(m);
    var paso = m.getBoundingClientRect().width / 10; m.remove();
    var w = seps[0].clientWidth;
    if (!paso || !w) return;
    var n = Math.max(4, Math.floor((w + paso / 2) / paso));
    var txt = new Array(n + 1).join('* ').trim();
    Array.prototype.forEach.call(seps, function (s) { s.textContent = txt; });
  }
  /* el recibo tiene ancho fijo (800 en compu, 366 en celu: así coincide con su
     imagen en 3D) y se escala entero si la pantalla es más chica */
  function escala() {
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var cel = vw <= 760, base = cel ? 366 : 800, margen = cel ? 24 : 48;
    var s = Math.min(cel ? 1.12 : 1, (vw - margen) / base);
    root.__s = s;
    root.style.transform = Math.abs(s - 1) > 0.001 ? 'scale(' + s.toFixed(4) + ')' : '';
    root.style.marginBottom = Math.abs(s - 1) > 0.001 ? Math.round(root.offsetHeight * (s - 1)) + 'px' : '';
  }
  var rzT = 0;
  window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { if (papel) { escala(); renglones(); } }, 150); });
  /* se vuelven a medir cuando termina de cargar la letra (antes medían con otra) */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (papel) renglones(); });

  /* código de barras fijo (siempre el mismo dibujo) */
  function barcode(box) {
    var s = 7, x = 0, h = '';
    for (var k = 0; k < 58; k++) {
      s = (s * 9301 + 49297) % 233280; var w = 1 + Math.floor(s / 233280 * 3.4);
      s = (s * 9301 + 49297) % 233280; var g = 1 + Math.floor(s / 233280 * 2.6);
      h += '<rect x="' + x + '" width="' + w + '" height="40"/>'; x += w + g;
    }
    box.innerHTML = '<svg viewBox="0 0 ' + x + ' 40" preserveAspectRatio="none">' + h + '</svg>';
  }

  function actualizar() {
    var t = T[lang()];
    var lista = t.rows.filter(function (r, i) { return elegidos[i]; }).map(function (r) { return r[0]; });
    totalN.textContent = lista.length;
    var msg = lista.length ? t.msgList + '\n' + lista.map(function (x) { return '• ' + x; }).join('\n') : t.msgNone;
    aWpp.href = 'https://wa.me/' + WPP + '?text=' + encodeURIComponent(msg);
    aMail.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(t.subject) + '&body=' + encodeURIComponent(msg);
  }

  function tildar(i, b, e) {
    elegidos[i] = !elegidos[i];
    b.setAttribute('aria-pressed', elegidos[i] ? 'true' : 'false');
    if (elegidos[i]) {
      b.classList.add('is-on');
      ponerTilde(b, e);
    } else {
      b.classList.remove('is-on');
      Array.prototype.forEach.call(b.querySelectorAll('.tk-tilde'), function (sv) {
        sv.classList.add('is-fuera'); setTimeout(function () { sv.remove(); }, 260);
      });
    }
    actualizar();
  }

  /* ---------- el tilde: un trazo de birome, distinto cada vez ----------
     Se arma con el pulso de una mano: arranca con una gotita de tinta, baja
     corto hasta el vértice (ahí aprieta un poco) y sube largo, afinándose al
     levantar la lapicera. Ángulos, largos y curvas cambian en cada tilde. */
  var tildeN = 0;
  function azar(a, b) { return a + Math.random() * (b - a); }
  function curvaQ(p0, c, p1, n) {
    var o = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      o.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
    }
    return o;
  }
  /* punto de control corrido hacia un costado del segmento (curva > 0: a la derecha de la dirección) */
  function control(p0, p1, curva) {
    var dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1;
    return [(p0[0] + p1[0]) / 2 - dy / l * curva, (p0[1] + p1[1]) / 2 + dx / l * curva];
  }
  function trazoTilde(b) {
    /* coordenadas desde la esquina del casillero (lado b) */
    var a = [b * azar(-.18, .28), b * azar(.22, .6)];
    var v = [b * azar(.3, .6), b * azar(.82, 1.22)];
    var z = [b * azar(1.5, 2.6), b * azar(-1.25, -.3)];
    /* cada uno con su tamaño y su inclinación (gira alrededor del vértice) */
    var esc = azar(.9, 1.25), giro = azar(-.2, .14), cg = Math.cos(giro), sg = Math.sin(giro);
    [a, z].forEach(function (p) {
      var dx = (p[0] - v[0]) * esc, dy = (p[1] - v[1]) * esc;
      p[0] = v[0] + dx * cg - dy * sg; p[1] = v[1] + dx * sg + dy * cg;
    });
    var pts = [];
    /* a veces la lapicera apoya un poquito antes y arrastra */
    if (Math.random() < .45) {
      pts = curvaQ([a[0] - b * azar(.04, .12), a[1] - b * azar(.05, .16)], [a[0] - b * .02, a[1] - b * .05], a, 4);
      pts.pop();
    }
    var uIni = pts.length;
    pts = pts.concat(curvaQ(a, control(a, v, b * azar(-.09, .08)), v, 14));
    var iV = pts.length - 1;
    pts = pts.concat(curvaQ(v, control(v, z, -b * azar(-.06, .3)), z, 28).slice(1));
    /* a veces, al levantar la lapicera, la punta se va un poco para el costado */
    if (Math.random() < .3) {
      var ult = pts[pts.length - 1], dir = [z[0] - v[0], z[1] - v[1]], dl = Math.hypot(dir[0], dir[1]) || 1;
      var cola = b * azar(.12, .3), gira = azar(.5, 1.1);
      var fx = ult[0] + (dir[0] / dl * Math.cos(gira) - dir[1] / dl * Math.sin(gira)) * cola;
      var fy = ult[1] + (dir[0] / dl * Math.sin(gira) + dir[1] / dl * Math.cos(gira)) * cola;
      pts = pts.concat(curvaQ(ult, [ult[0] + dir[0] / dl * cola * .6, ult[1] + dir[1] / dl * cola * .6], [fx, fy], 5).slice(1));
    }
    /* largo acumulado y normales */
    var n = pts.length, acc = [0], i;
    for (i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var total = acc[n - 1], uV = acc[iV] / total, u0 = acc[uIni] / total;
    var W = b * azar(.1, .135), fin = azar(.3, .55), gota = azar(.12, .3), aprieta = azar(.08, .25);
    var f1 = azar(0, 6.3), f2 = azar(0, 6.3), temblor = b * .011;
    var izq = [], der = [], centro = [];
    for (i = 0; i < n; i++) {
      var p = pts[Math.max(0, i - 1)], q = pts[Math.min(n - 1, i + 1)];
      var dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      var u = acc[i] / total;
      var tiembla = temblor * (Math.sin(u * 15 + f1) + .6 * Math.sin(u * 33 + f2));
      var c = [pts[i][0] + nx * tiembla, pts[i][1] + ny * tiembla];
      var w = W * (1 + aprieta * Math.exp(-Math.pow((u - uV) / .08, 2)));
      if (u < u0 + .08) w *= 1 + gota * (1 - (u - u0) / .08) * (u >= u0 ? 1 : .4);
      if (u > .68) w *= 1 - (1 - fin) * Math.pow((u - .68) / .32, 1.3);
      centro.push(c);
      izq.push([c[0] + nx * w / 2, c[1] + ny * w / 2]);
      der.push([c[0] - nx * w / 2, c[1] - ny * w / 2]);
      if (i === 0) var r0 = w / 2;
      if (i === n - 1) var r1 = w / 2;
    }
    function f(x) { return x.toFixed(2); }
    var d = 'M' + izq.map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') +
      'L' + der.reverse().map(function (p) { return f(p[0]) + ' ' + f(p[1]); }).join('L') + 'Z';
    /* puntas redondas */
    [[centro[0], r0], [centro[n - 1], r1]].forEach(function (k) {
      var x = k[0][0], y = k[0][1], r = k[1];
      d += 'M' + f(x - r) + ' ' + f(y) + 'a' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(2 * r) + ' 0a' + f(r) + ' ' + f(r) + ' 0 1 0 ' + f(-2 * r) + ' 0';
    });
    return { d: d, centro: centro, acc: acc, total: total, uV: uV, ancho: W * (1 + aprieta + gota) };
  }
  /* avance del trazo en el tiempo: baja despacio, frena en el vértice y sube de un tirón */
  function avance(t, uV) {
    if (t < .45) { var x = t / .45; return uV * x * x * (3 - 2 * x); }
    var y = (t - .45) / .55; return uV + (1 - uV) * Math.pow(y, 1.35);
  }
  var NS = 'http://www.w3.org/2000/svg';
  function ponerTilde(b, e) {
    var box = $('.tk-box', b);
    if (!box) return;
    var s = root.__s || 1, rb = box.getBoundingClientRect(), ri = b.getBoundingClientRect();
    var lado = rb.width / s, padX = lado * .45, padY = lado * .9;
    var W = lado * 2.4, H = lado * 2.3;
    var tr = trazoTilde(lado), id = 'tk-m' + (++tildeN);
    var sv = document.createElementNS(NS, 'svg');
    sv.setAttribute('class', 'tk-tilde');
    sv.setAttribute('aria-hidden', 'true');
    sv.setAttribute('width', W.toFixed(1)); sv.setAttribute('height', H.toFixed(1));
    sv.setAttribute('viewBox', '0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1));
    sv.style.left = ((rb.left - ri.left) / s - padX).toFixed(1) + 'px';
    sv.style.top = ((rb.top - ri.top) / s - padY).toFixed(1) + 'px';
    var linea = 'M' + tr.centro.map(function (p) { return (p[0] + padX).toFixed(2) + ' ' + (p[1] + padY).toFixed(2); }).join('L');
    sv.innerHTML =
      '<defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="' + (-W).toFixed(1) + '" y="' + (-H).toFixed(1) + '" width="' + (3 * W).toFixed(1) + '" height="' + (3 * H).toFixed(1) + '">' +
        '<path class="tk-tilde__m" d="' + linea + '" fill="none" stroke="#fff" stroke-width="' + (tr.ancho + 3).toFixed(2) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</mask></defs>' +
      '<g mask="url(#' + id + ')"><path class="tk-tilde__tinta" transform="translate(' + padX.toFixed(2) + ' ' + padY.toFixed(2) + ')" d="' + tr.d + '"/></g>';
    b.appendChild(sv);
    var m = sv.querySelector('.tk-tilde__m'), largo = tr.total + 4;
    m.style.strokeDasharray = largo + ' ' + (largo + 20);
    if (!e || !m.animate) { m.style.strokeDashoffset = '0'; return; }
    var dibujo = 300, kf = [];
    for (var k = 0; k <= 16; k++) kf.push({ strokeDashoffset: largo * (1 - avance(k / 16, tr.uV)), offset: k / 16 });
    m.style.strokeDashoffset = String(largo);
    var an = m.animate(kf, { duration: dibujo, easing: 'linear', fill: 'both' });
    an.onfinish = function () { m.style.strokeDashoffset = '0'; an.cancel(); };
  }

  /* el recibo sale como de una impresora cuando aparece */
  var vio = ('IntersectionObserver' in window) && MOTION ? new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { root.classList.add('is-in'); vio.unobserve(root); } });
  }, { threshold: 0.12 }) : null;
  if (!vio) root.classList.add('is-in');

  /* ---------- "Servicios" en el menú de arriba (después de "Sobre mí") ---------- */
  var navLi = null;
  function irAServicios() {
    var ir = function () {
      var s = document.getElementById('services'); if (!s) return false;
      var y = s.getBoundingClientRect().top + window.pageYOffset + 40;
      if (window.__plLenis) window.__plLenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
      return true;
    };
    var nav = document.querySelector('.nav');
    if (nav && nav.classList.contains('menu-open')) { var b = $('.nav-burger', nav); if (b) b.click(); }
    if (ir()) return;
    /* desde Diseño o Ilustración: primero al inicio, después baja */
    var inicio = Array.prototype.filter.call(document.querySelectorAll('.nav-mid a'), function (a) { return a !== (navLi && navLi.firstChild) && /^(Inicio|Home)$/i.test(a.textContent.trim()); })[0];
    if (inicio) inicio.click();
    var n = 0, t = setInterval(function () { if (ir() || ++n > 20) clearInterval(t); }, 120);
  }
  function menu() {
    var ul = document.querySelector('.nav .nav-mid');
    if (!ul) return;
    var etiqueta = lang() === 'en' ? 'Services' : 'Servicios';
    if (!navLi || !ul.contains(navLi)) {
      navLi = el('li', 'nav-svc');
      var a = el('a', 'nav-svc__a', etiqueta);
      a.href = '#services';
      a.addEventListener('click', function (e) { e.preventDefault(); irAServicios(); });
      navLi.appendChild(a);
      var items = ul.children, ref = items[4] || null; /* antes de "Contacto" */
      ul.insertBefore(navLi, ref);
    } else if (navLi.firstChild.textContent !== etiqueta) navLi.firstChild.textContent = etiqueta;
    /* subrayado cuando estás mirando Servicios */
    var s = document.getElementById('services'), on = false;
    if (s) { var r = s.getBoundingClientRect(), vh = window.innerHeight; on = r.top < vh * 0.5 && r.bottom > vh * 0.5; }
    navLi.firstChild.classList.toggle('active', on);
    document.documentElement.classList.toggle('nav-svc-on', on);
  }
  var rafM = 0;
  window.addEventListener('scroll', function () { if (!rafM) rafM = requestAnimationFrame(function () { rafM = 0; menu(); }); }, { passive: true });

  /* ---------- montar dentro de la sección de servicios del inicio ---------- */
  function montar() {
    menu();
    var sec = document.getElementById('services');
    if (!sec) return;
    if (!sec.classList.contains('tk-sec')) sec.classList.add('tk-sec');
    if (root.parentNode !== sec) { sec.appendChild(root); if (!papel) armar(); }
  }
  var idioma = lang();
  new MutationObserver(function () {
    if (lang() !== idioma) { idioma = lang(); if (papel) armar(); }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  var cola = false;
  function pedir() { if (cola) return; cola = true; requestAnimationFrame(function () { cola = false; montar(); }); }
  var app = document.getElementById('app');
  if (app) new MutationObserver(pedir).observe(app, { childList: true, subtree: true });
  if (document.readyState !== 'loading') montar(); else document.addEventListener('DOMContentLoaded', montar);
  setTimeout(montar, 400);
})();
