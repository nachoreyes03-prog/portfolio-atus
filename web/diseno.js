/* ============================================================
   OPCIÓN A — DISEÑO GRÁFICO con el formato de la B
   Reemplaza la vista "Diseño Gráfico" del sitio (React) por:
   - carrusel de proyectos que se arrastra, con la ficha del
     proyecto activo a la izquierda y contador 01/10
   - loops de motion que corren solos (tocás uno y se abre con sonido)
   - visor a pantalla completa: imagen grande + panel con título,
     una frase, botones de sección y links a los PDF
   El bloque vive fuera de React: se mete en la sección #design
   cada vez que aparece y el contenido viejo se oculta (diseno.css).
   ============================================================ */
(function () {
  'use strict';

  var HERE = 'web/';
  var MINI = 'web/mini/';
  var PREV = HERE + 'prev/';
  var VOLUMEN = 0.5;
  var ALPHA = { 'design/cov-9r-afiche.png': 1, 'design/koizone-grilla-2.png': 1, 'design/koizone-tapas.png': 1 };
  function mini(p) { return MINI + p.replace(/\//g, '__').replace(/\.[^.]+$/, ALPHA[p] ? '.png' : '.jpg'); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function grp(g, base, list) { return list.map(function (x) { return { g: g, src: base + x[0], l: x[1] }; }); }

  /* ---------- contenido (orden pedido: tesis → web → 9R → motion → koizone → resto → 3D) ---------- */
  var T = 'design/tesis/';
  var N = HERE + 'nuevos/'; /* U.Dent, cactus y Tallo Verde (copias livianas de sus carpetas) */
  var PROJECTS = [
    {
      id: 'tesis', t: 'Museo del Agua', tipo: 'Identidad · Tesis de grado', y: '2025',
      d: 'Tesis de grado: identidad y sistema gráfico para el Museo del Agua de AySA, adentro del edificio y en la calle.',
      card: { img: T + 'exterior/banners-gigantes.jpg', ar: 720 / 404, h: 1 },
      slides: [].concat(
        grp('Identidad', T, [['00-caratula-logo.jpg', 'Carátula']]),
        grp('Sistema A', T + 'sis-a/', [['afiches.jpg', 'Afiches'], ['banners.jpg', 'Banners'], ['folleto.jpg', 'Folleto 01'], ['folleto-2.jpg', 'Folleto 02'], ['postales.jpg', 'Postales'], ['posteos-1.jpg', 'Posteos 01'], ['posteos-2.jpg', 'Posteos 02']]),
        grp('Sistema B', T + 'sis-b/', [['folleto.jpg', 'Folleto'], ['afiche.jpg', 'Afiche'], ['banner.jpg', 'Banner'], ['flyer.jpg', 'Flyer'], ['postales.jpg', 'Postales'], ['entradas.jpg', 'Entradas'], ['gafetes.jpg', 'Gafetes'], ['grilla.jpg', 'Grilla de actividades']]),
        grp('Sistema C', T + 'sis-c/', [['billboard.jpg', 'Billboard'], ['afiche-calle.jpg', 'Afiche de calle'], ['banners.jpg', 'Banners'], ['folleto.jpg', 'Folleto'], ['triptico.jpg', 'Tríptico'], ['infografia.jpg', 'Infografía'], ['magneto.jpg', 'Magneto']]),
        grp('Interior', T + 'interior/', [['nomenclador.jpg', 'Nomenclador'], ['banner-entrada.jpg', 'Banner de entrada'], ['ploteo-entrada.jpg', 'Ploteo de entrada'], ['locacion-piso.jpg', 'Locación de piso'], ['sala-1.jpg', 'Sala 01'], ['sala-31.jpg', 'Sala 31'], ['salas-2-3-4.jpg', 'Salas 02, 03 y 04'], ['ascensores.jpg', 'Ascensores'], ['banos.jpg', 'Baños'], ['phoibidos.jpg', 'Phoibidos']]),
        grp('Exterior', T + 'exterior/', [['banners-gigantes.jpg', 'Banners en el Palacio'], ['afiche-calle-1.jpg', 'Afiche de calle 01'], ['afiche-calle-2.jpg', 'Afiche de calle 02'], ['afiche-calle-3.jpg', 'Afiche de calle 03'], ['afiches-subte.jpg', 'Afiches de subte'], ['reverse-grafiti.jpg', 'Reverse grafiti']])
      )
    },
    {
      id: 'cactus', t: 'cactus®', tipo: 'Identidad · Estudio propio', y: '2026',
      web: ['cactusestudio.com', 'https://cactusestudio.com'],
      d: 'Identidad de cactus®, el estudio de diseño que tengo con Cami: logotipo, reducciones, colores, tipografías, trama, campaña, video de marca y piezas para redes.',
      card: { img: N + 'cactus/manual-01.jpg', ar: 1.4151, h: .8 },
      slides: [
        { g: 'Video de marca', video: N + 'cactus/video-marca.mp4', poster: 'cactus-marca', l: 'Video de marca', ar: 16 / 9 },
        { g: 'Campaña', src: N + 'cactus/afiche.jpg', l: '¿Nos llaman? Ah sí. Afiche', ar: 1318 / 1649 },
        { g: 'Campaña', src: N + 'cactus/historia.jpg', l: 'Historia', ar: 927 / 1649 },
        { g: 'Manual', src: N + 'cactus/manual-01.jpg', l: 'Manual de marca', ar: 1.4151, book: ['Leer el manual', 'cactus'] },
        { g: 'Manual', src: N + 'cactus/manual-04.jpg', l: 'La firma', ar: 1.4151 },
        { g: 'Manual', src: N + 'cactus/manual-05.jpg', l: 'Grilla de construcción', ar: 1.4151 },
        { g: 'Manual', src: N + 'cactus/manual-06.jpg', l: 'Reducciones', ar: 1.4151 },
        { g: 'Manual', src: N + 'cactus/manual-08.jpg', l: 'Colores', ar: 1.4151 },
        { g: 'Manual', src: N + 'cactus/manual-12.jpg', l: 'Tipografía secundaria', ar: 1.4151 },
        { g: 'Manual', src: N + 'cactus/manual-14.jpg', l: 'Trama', ar: 1.4151 },
        { g: 'Redes', video: N + 'cactus/reel-web.mp4', poster: 'cactus-reel', l: 'Reel de la web', ar: 1080 / 1920 },
        { g: 'Redes', video: N + 'cactus/publicidad.mp4', poster: 'cactus-ad', l: 'Publicidad para Instagram', ar: 1 }
      ]
    },
    {
      id: 'udent', t: 'U.Dent', tipo: 'Identidad · Web', y: '2026',
      web: ['ulfedentista.com', 'https://ulfedentista.com'],
      d: 'Identidad para un consultorio odontológico en Recoleta: nombre, logotipo, la U de 16 puntos, colores, tramas, video de marca y sitio web. Hecho en cactus®.',
      card: { img: N + 'udent/babero.jpg', ar: 2250 / 4000, h: .9 },
      slides: [
        { g: 'Video de marca', video: N + 'udent/video-marca.mp4', poster: 'udent-marca', l: 'Video de marca', ar: 16 / 9 },
        { g: 'Aplicaciones', src: N + 'udent/babero.jpg', l: 'Babero', ar: 2250 / 4000 },
        { g: 'Aplicaciones', src: N + 'udent/recepcion.jpg', l: 'Recepción', ar: 2250 / 4000 },
        /* variado: una sola página crema con el logotipo; el resto aqua, marrón y tramas */
        { g: 'Manual', src: N + 'udent/manual-06.jpg', l: 'El punto', ar: 2000 / 1413 },
        { g: 'Manual', src: N + 'udent/manual-05.jpg', l: 'Isotipo', ar: 1.4154 },
        { g: 'Manual', src: N + 'udent/manual-04.jpg', l: 'Logotipo', ar: 1.4154 },
        { g: 'Manual', src: N + 'udent/manual-16.jpg', l: 'Trama', ar: 2000 / 1413 },
        { g: 'Manual', src: N + 'udent/manual-09.jpg', l: 'Colores', ar: 1.4154 },
        { g: 'Manual', src: N + 'udent/manual-11.jpg', l: 'Tramas', ar: 2000 / 1413 },
        { g: 'Web', video: N + 'udent/web.mp4', poster: 'udent-web', l: 'Recorrido del sitio', ar: 16 / 9 },
        { g: 'Web', video: N + 'udent/reel-web.mp4', poster: 'udent-reel', l: 'Reel del sitio', ar: 1080 / 1920 }
      ]
    },
    {
      id: 'talloverde', t: 'Tallo Verde', tipo: 'Web · Redes', y: '2026',
      web: ['talloverde.com', 'https://talloverde.com'],
      d: 'Tienda online de frutas y verduras orgánicas: sitio web, posteos e historias, newsletters y un anuncio para Google Ads. Hecho en cactus®.',
      card: { img: N + 'talloverde/grilla.jpg', ar: 1622 / 2000, h: .85 },
      slides: [
        /* ordenado: la web, después redes, después newsletters (sin repetidos) */
        { g: 'Web', video: N + 'talloverde/caso.mp4', poster: 'tv-caso', l: 'Web, redes y newsletter', ar: 16 / 9 },
        { g: 'Web', src: N + 'talloverde/celular.jpg', l: 'El sitio en el celular', ar: 1420 / 1978 },
        { g: 'Redes', src: N + 'talloverde/grilla.jpg', l: 'Grilla de Instagram', ar: 1622 / 2000 },
        { g: 'Redes', src: N + 'talloverde/historias.jpg', l: 'Historias', ar: 1920 / 680 },
        { g: 'Newsletters', src: N + 'talloverde/newsletters-2.jpg', l: 'Newsletters', ar: 1207 / 1941 },
        { g: 'Anuncio', video: N + 'talloverde/anuncio.mp4', poster: 'tv-anuncio', l: 'Anuncio para Google Ads', ar: 1080 / 1920 }
      ]
    },
    {
      id: 'dashi', t: 'Dashi', tipo: 'Web · Rediseño propio', y: '2026',
      d: 'Rediseño del sitio de Dashi, sushi nikkei en Buenos Aires. Lo hice por mi cuenta: no fue un encargo ni es el sitio oficial.',
      card: { video: 'dashi', ar: 2560 / 1248, h: .62 },
      slides: [{ video: 'videos/web-dashi.mp4', poster: 'dashi', l: 'Recorrido del sitio', ar: 2560 / 1248 }]
    },
    {
      id: 'jays', t: 'Jay’s American', tipo: 'Web · Rediseño propio', y: '2026',
      d: 'Rediseño del sitio de Jay’s American, desayunos en Estados Unidos. Lo hice por mi cuenta: no fue un encargo ni es el sitio oficial.',
      card: { video: 'jays', ar: 16 / 9, h: .8 },
      slides: [{ video: 'videos/web-jays.mp4', poster: 'jays', l: 'Recorrido del sitio', ar: 16 / 9 }]
    },
    {
      id: 'nueve-reinas', t: 'Nueve Reinas', tipo: 'Editorial · Packaging', y: '2025',
      d: 'Baraja de truco basada en la película Nueve Reinas: tres pressbooks, afiche, caja, cartas y entradas.',
      card: { img: 'design/9r-afiche-cover.jpg', ar: 720 / 1018, h: .86 },
      slides: [
        { g: 'Afiche', src: 'design/9r-afiche-cover.jpg', l: 'Afiche A3', pdf: [['Afiche completo', 'pdfs/9r-afiche-final.pdf']] },
        { g: 'Pressbooks', src: 'design/9r-pressbook-portada.png', l: 'Tapas', pdf: [['01', 'pdfs/9r-pressbook-1.pdf'], ['02', 'pdfs/9r-pressbook-2.pdf'], ['03', 'pdfs/9r-pressbook-3.pdf']] },
        { g: 'Cartas', src: 'design/9r-cartas-portada.png', l: 'Carta' },
        { g: 'Cartas', src: 'design/9r-caja-cartas.png', l: 'Caja y cartas', pdf: [['Dorso completo', 'pdfs/9reinas-cartas-dorso.pdf']] },
        { g: 'Caja', src: 'design/9r-caja-portada.png', l: 'Caja troquelada', pdf: [['Troquel', 'pdfs/9reinas-caja.pdf']] },
        { g: 'Entradas', src: 'design/9r-dni-exterior.png', l: 'DNI, entrada (frente)' },
        { g: 'Entradas', src: 'design/9r-dni-interior.png', l: 'DNI, souvenir (dorso)', pdf: [['Doble faz', 'pdfs/9reinas-dni-entradas.pdf']] },
        { g: 'Concepto', src: 'design/9r-concepto-portada.jpg', l: 'Documento de concepto', pdf: [['Concepto', 'pdfs/9r-concepto.pdf']] }
      ]
    },
    {
      id: 'motion', t: 'Motion', tipo: 'Animación · After Effects', y: '2024–2026',
      d: 'Stop motion, rotoscopia, animación cuadro a cuadro y edits.',
      card: { video: 'sp', ar: 16 / 9, h: .64 },
      slides: [
        { video: HERE + 'videos/scott-pilgrim.mp4', poster: 'sp', l: 'Scott Pilgrim', sound: 1, ar: 16 / 9 },
        { video: HERE + 'videos/julian-alvarez.mp4', poster: 'julian', l: 'Julián Álvarez', sound: 1, ar: 16 / 9 },
        { video: HERE + 'videos/spiderman.mp4', poster: 'spiderman', l: 'Spider-Man', sound: 1, ar: 16 / 9 },
        { video: HERE + 'videos/clayface.mp4', poster: 'clayface', l: 'Clayface', sound: 1, ar: 16 / 9 },
        { video: HERE + 'videos/dirty-harry.mp4', poster: 'dirtyharry', l: 'Dirty Harry', sound: 1, ar: 1080 / 1350 },
        { video: HERE + 'videos/lanterns.mp4', poster: 'lanterns', l: 'Green Lantern', sound: 1, ar: 4 / 3 },
        { video: 'videos/atuskmi-puertas-barcelona.mp4', poster: 'puertas', l: 'Puertas de Barcelona', sound: 1, ar: 608 / 1080 },
        { video: 'videos/animacion-guitarra.mp4', poster: 'guitarra', l: 'Guitarra', ar: 16 / 9 },
        { video: 'videos/pelea-atus-gero.mp4', poster: 'pelea', l: 'Pelea Atus / Gero', ar: 848 / 478 },
        { video: 'videos/reyes-animacion-full.mp4', poster: 'reyes', l: 'Reyes', ar: 1.125 },
        { video: 'videos/stopmotion-1.mp4', poster: 'stop1', l: 'Stop motion 01', ar: 480 / 848 },
        { video: 'videos/stopmotion-2.mp4', poster: 'stop2', l: 'Stop motion 02', ar: 16 / 9 },
        { video: 'videos/stopmotion-3.mp4', poster: 'stop3', l: 'Stop motion 03', ar: 16 / 9 }
      ]
    },
    {
      id: 'koizone', t: 'Koizone', tipo: 'Editorial · Revista', y: '2025',
      d: 'Revista experimental: tapas en serie, grillas y la revista completa.',
      card: { img: 'design/koizone-cover.jpg', ar: 720 / 1004, h: .92 },
      slides: [
        { g: 'Revista', src: 'design/koizone-cover.jpg', l: 'Tapa', book: ['Leer la revista', 'koizone'] },
        { g: 'Mockups', src: 'design/koizone-caratula-seccion.jpg', l: 'Portada' },
        { g: 'Mockups', src: 'design/koizone-mockup-2.jpg', l: 'Portada, serie 02' },
        { g: 'Mockups', src: 'design/koizone-tapas.png', l: 'Tapas en serie' },
        { g: 'Grillas', src: 'design/koizone-grilla-1.jpg', l: 'Grilla 01' },
        { g: 'Grillas', src: 'design/koizone-grilla-2.png', l: 'Grilla 02' }
      ]
    },
    {
      id: 'spider-arq', t: 'Spider-Man Arquitectura', tipo: 'Editorial · Libro', y: '2025',
      d: 'Libro sobre Spider-Man y la arquitectura de sus escenarios.',
      card: { img: 'design/spider-portada.jpg', ar: 720 / 460, h: .6 },
      slides: [{ src: 'design/spider-portada.jpg', l: 'Tapa', book: ['Leer el libro', 'spiderman'] }]
    },
    {
      id: 'posters', t: 'Pósters', tipo: 'Afiche', y: '2024–2026',
      d: 'Afiches personales y por encargo.',
      card: { img: 'design/posters/poster-fosforos-oscuro.jpg', ar: 720 / 1018, h: .74 },
      slides: [
        { src: 'design/posters/poster-mic-caratula.jpeg', l: 'Made in China, carátula' },
        { src: 'design/posters/poster-fosforos-azul.jpg', l: 'Fósforos, afiche oficial' },
        { src: 'design/posters/poster-fosforos-oscuro.jpg', l: 'Fósforos, alternativo' },
        { src: 'design/posters/poster-torty.jpg', l: 'I Love Torty' },
        { src: 'design/posters/poster-noche-19.png', l: 'Noche 19' },
        { src: 'design/posters/poster-atuskmi.jpeg', l: 'Atus × KMI' },
        { src: 'design/posters/poster-ba-intervenido.jpeg', l: 'Buenos Aires intervenido' },
        { src: 'design/posters/poster-lodementa.jpeg', l: 'Lo de Menta' },
        { src: 'design/posters/poster-mic.jpg', l: 'Made in China' }
      ]
    },
    {
      id: 'auto', t: 'Auto Retrofuturista', tipo: '3D · Blender', y: '2025',
      d: 'Un auto y una estación de servicio, modelados y animados en Blender.',
      card: { video: 'auto1', ar: 16 / 9, h: .82 },
      slides: [
        { g: 'Renders', src: 'design/3d/auto-portada.jpeg', l: 'Render principal' },
        { g: 'Renders', src: 'design/3d/auto-01.jpeg', l: 'Vista 01' },
        { g: 'Renders', src: 'design/3d/auto-02.jpeg', l: 'Vista 02' },
        { g: 'Renders', src: 'design/3d/auto-estacion.jpeg', l: 'Estación de servicio' },
        { g: 'Animaciones', video: 'videos/auto-retro.mp4', poster: 'auto1', l: 'Animación 01', ar: 16 / 9 },
        { g: 'Animaciones', video: 'videos/auto-retro-2.mp4', poster: 'auto2', l: 'Animación 02', ar: 16 / 9 }
      ]
    },
    {
      id: 'room', t: 'Spider-Man Room', tipo: '3D · Blender', y: '2025',
      d: 'La habitación de Spider-Man en Blender, en versión high-poly y low-poly.',
      card: { img: 'design/3d/sm-hp-portada.jpg', ar: 720 / 406, h: .7 },
      slides: [].concat(
        grp('High-poly', 'design/3d/', [['sm-hp-portada.jpg', 'Render principal'], ['sm-hp-final1.jpg', 'Composición 01'], ['sm-hp-final2.jpg', 'Composición 02'], ['sm-hp-comp.jpg', 'Vista completa'], ['sm-hp-obj1.jpg', 'Objeto 01'], ['sm-hp-obj2.jpg', 'Objeto 02'], ['sm-hp-obj3.jpg', 'Objeto 03']]),
        grp('Low-poly', 'design/3d/', [['sm-lp-portada.jpg', 'Vista principal'], ['sm-lp-02.jpg', 'Render 02'], ['sm-lp-03.jpg', 'Render 03'], ['sm-lp-04.jpg', 'Render 04'], ['sm-lp-05.jpg', 'Render 05'], ['sm-lp-06.jpg', 'Render 06'], ['sm-lp-07.jpg', 'Render 07']])
      )
    }
  ];
  var MOTION = PROJECTS.map(function (p) { return p.id; }).indexOf('motion');
  /* loops de motion en dos filas justificadas: [preview, slide del proyecto Motion, duración] */
  var REEL = [
    [['sp', 0, '0:23'], ['puertas', 3, '0:06'], ['julian', 1, '0:13']],
    [['spiderman', 2, '0:39'], ['stop1', 7, '0:03'], ['guitarra', 4, '0:05']]
  ];

  /* ---------- videos que solo corren cuando se ven ---------- */
  var vio = 'IntersectionObserver' in window ? new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      var v = en.target;
      /* solo corren los que se ven bien (35 % o más): menos videos a la vez, scroll más fluido */
      if (en.isIntersecting && !v.getAttribute('src')) v.src = v.dataset.src;
      if (en.intersectionRatio >= .35) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else if (!v.paused) v.pause();
    });
  }, { rootMargin: '60px 0px', threshold: [0, .35] }) : null;
  function loopVideo(name) {
    var v = el('video');
    v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.setAttribute('aria-hidden', 'true');
    v.preload = 'none'; v.poster = PREV + name + '.jpg'; v.dataset.src = PREV + name + '.mp4';
    if (vio) vio.observe(v); else v.src = v.dataset.src;
    return v;
  }
  document.addEventListener('touchstart', function kick() {
    $$('.dg video[data-src]').forEach(function (v) { if (v.getAttribute('src') && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
    document.removeEventListener('touchstart', kick);
  }, { passive: true });

  /* ---------- bloques: cada proyecto con sus piezas a la vista ----------
     Como la página de Ilustración: título grande y las piezas enteras,
     en filas parejas (cada fila tiene una sola altura y las piezas
     conservan su proporción: nada se recorta). Los proyectos largos
     muestran dos filas y "Ver todas" abre el resto en el lugar.        */
  var AR = window.DG_AR || {};
  function arOf(s) {
    if (s.ar) return s.ar;
    var k = s.src.replace(/\.[^.]+$/, '');
    return AR[k] || 1.4;
  }
  function P(id) { for (var i = 0; i < PROJECTS.length; i++) if (PROJECTS[i].id === id) return i; return -1; }
  function piecesOf(id, names) {
    var pi = P(id);
    return PROJECTS[pi].slides.map(function (s, k) { return { pi: pi, k: k, s: s, cap: names ? s.l : '' }; });
  }
  var BLOCKS = [
    { id: 'tesis', t: 'Museo del Agua', items: piecesOf('tesis'), rows: 2 },
    { id: 'cactus', t: 'cactus®', items: piecesOf('cactus'), rows: 2, book: ['Leer el manual', 'cactus'], web: 1 },
    { id: 'udent', t: 'U.Dent', items: piecesOf('udent'), rows: 2, web: 1 },
    { id: 'talloverde', t: 'Tallo Verde', items: piecesOf('talloverde'), rows: 2, web: 1 },
    { id: 'web', t: 'Rediseños web', items: [
        { pi: P('dashi'), k: 0, s: PROJECTS[P('dashi')].slides[0], cap: 'Dashi' },
        { pi: P('jays'), k: 0, s: PROJECTS[P('jays')].slides[0], cap: 'Jay’s American' }
      ], big: 1, note: 'Los hice por mi cuenta: no fueron encargos ni son los sitios oficiales.' },
    { id: 'nueve-reinas', t: 'Nueve Reinas', items: piecesOf('nueve-reinas'), rows: 2 },
    { id: 'motion', t: 'Motion', items: piecesOf('motion', true), big: 1 },
    { id: 'koizone', t: 'Koizone', items: piecesOf('koizone'), rows: 2, book: ['Leer la revista', 'koizone'] },
    { id: 'spider-arq', t: 'Spider-Man Arquitectura', items: piecesOf('spider-arq'), book: ['Leer el libro', 'spiderman'] },
    { id: 'posters', t: 'Pósters', items: piecesOf('posters'), rows: 2 },
    { id: 'auto', t: 'Auto Retrofuturista', items: piecesOf('auto'), rows: 2 },
    { id: 'room', t: 'Spider-Man Room', items: piecesOf('room'), rows: 2 }
  ];

  var root = el('div', 'dg');
  var head = el('div', 'dg-head', '<h2 class="dg-title">Diseño Gráfico.</h2>');
  var chips = el('nav', 'dg-chips'); chips.setAttribute('aria-label', 'Proyectos');
  head.appendChild(chips);
  root.appendChild(head);

  function irA(node) {
    var y = node.getBoundingClientRect().top + window.pageYOffset - 130;
    if (window.__plLenis) window.__plLenis.scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  }

  var bloques = [];
  BLOCKS.forEach(function (b) {
    var sec = el('section', 'dg-block' + (b.big ? ' dg-block--big' : ''));
    sec.id = 'dg-' + b.id;
    var h = el('div', 'dg-block__head', '<div class="dg-block__tt"><h3 class="dg-block__t">' + b.t + '</h3>' + (b.note ? '<p class="dg-block__note">' + b.note + '</p>' : '') + '</div>');
    var acc = el('div', 'dg-block__acc');
    if (b.book) {
      /* el libro se lee acá adentro, no en un PDF aparte */
      var bk = el('button', 'dg-block__pdf dg-block__book', b.book[0] + ' <span aria-hidden="true">→</span>'); bk.type = 'button';
      bk.addEventListener('click', (function (id) { return function () { if (window.AtusLibro) window.AtusLibro.abrir(id); }; })(b.book[1]));
      acc.appendChild(bk);
    }
    if (b.web) {
      var pw = PROJECTS[P(b.id)].web;
      var aw = el('a', 'dg-block__pdf dg-block__web', pw[0] + ' ↗'); aw.href = pw[1]; aw.target = '_blank'; aw.rel = 'noopener';
      acc.appendChild(aw);
    }
    if (acc.children.length) h.appendChild(acc);
    sec.appendChild(h);
    var rowsEl = el('div', 'dg-rows');
    sec.appendChild(rowsEl);
    var more = el('button', 'dg-more'); more.type = 'button'; more.hidden = true;
    sec.appendChild(more);
    root.appendChild(sec);

    var nodes = b.items.map(function (it) {
      var ar = arOf(it.s);
      var n = el('button', 'dg-piece'); n.type = 'button';
      n.style.setProperty('--ar', ar.toFixed(4));
      n.setAttribute('aria-label', it.s.l);
      var box = el('span', 'dg-piece__box');
      if (it.s.video) box.appendChild(loopVideo(it.s.poster));
      else { var im = el('img'); im.src = mini(it.s.src); im.alt = it.s.l; im.loading = 'lazy'; im.decoding = 'async'; im.draggable = false; box.appendChild(im); }
      n.appendChild(box);
      if (it.cap) n.appendChild(el('span', 'dg-piece__cap', it.cap));
      n.addEventListener('click', function () { openProject(it.pi, it.k); });
      return { n: n, ar: ar };
    });
    var st = { b: b, sec: sec, rowsEl: rowsEl, more: more, nodes: nodes, open: false, w: 0 };
    more.addEventListener('click', function () {
      /* abierto: el mismo botón lo vuelve a cerrar y te deja arriba del proyecto */
      if (st.open) {
        st.open = false; layout(st, true); setTimeout(observarFilas, 0);
        if (sec.getBoundingClientRect().top < 0) irA(sec);
      } else { st.open = true; layout(st, true); setTimeout(observarFilas, 0); }
    });
    bloques.push(st);

    var c = el('button', 'dg-chip', b.t); c.type = 'button';
    c.addEventListener('click', function () { irA(sec); });
    chips.appendChild(c);
  });

  var jump = el('button', 'dg-jump', '<span>Siguiente</span><b><i class="dg-jump__t">Ilustración</i> →</b>'); jump.type = 'button';
  /* el efecto de letras de Ilustración (el de Atus) en el botón que lleva ahí */
  var jumpT = $('.dg-jump__t', jump);
  function jumpFx() { if (window.__atusScramble) window.__atusScramble(jumpT); }
  if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
    jump.addEventListener('touchstart', jumpFx, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) jumpFx(); });
    }, { threshold: 0.6 }).observe(jump);
  } else jump.addEventListener('mouseenter', jumpFx);
  jump.addEventListener('click', function () {
    var a = $$('.nav a').filter(function (x) { return x.textContent.trim() === 'Ilustración'; })[0];
    if (a) a.click();
  });
  root.appendChild(jump);

  /* filas parejas: se llenan hasta el ancho con una altura objetivo */
  function target(st) {
    var w = window.innerWidth;
    /* en el celular, filas más altas: menos piezas por fila y más grandes */
    if (st.b.big) return w <= 760 ? 250 : w <= 1100 ? 300 : 400;
    return w <= 760 ? 205 : w <= 1100 ? 230 : 300;
  }
  function layout(st, force) {
    var W = st.rowsEl.clientWidth;
    if (!W || (!force && W === st.w)) return;
    st.w = W;
    var gap = parseFloat(getComputedStyle(st.rowsEl).rowGap) || 12, H = target(st);
    var rows = [], cur = [], sum = 0;
    st.nodes.forEach(function (x) {
      /* antes de sumar una pieza: si la fila ya queda con buena altura y sumarla
         la achicaría más de lo que se pasa ahora, se cierra acá (evita filas
         de 5 piezas chiquitas cuando entra una pieza muy apaisada) */
      if (cur.length) {
        var h0 = (W - gap * (cur.length - 1)) / sum, h1 = (W - gap * cur.length) / (sum + x.ar);
        if (h0 <= H * 1.35 && Math.abs(h0 - H) <= Math.abs(h1 - H)) { rows.push({ items: cur, full: true }); cur = []; sum = 0; }
      }
      cur.push(x); sum += x.ar;
      if (sum * H + gap * (cur.length - 1) >= W) { rows.push({ items: cur, full: true }); cur = []; sum = 0; }
    });
    /* la última fila se estira si le falta poco para llenar el ancho */
    if (cur.length) {
      var prev = rows[rows.length - 1];
      var sp = prev ? prev.items.reduce(function (a, x) { return a + x.ar; }, 0) : 0;
      var hJunta = prev ? (W - gap * prev.items.length) / (sp + sum) : 0;
      /* una pieza sola al final queda huérfana: mejor sumarla a la fila de arriba */
      if (cur.length === 1 && prev && sum * H + gap * (cur.length - 1) < W * 0.8 && hJunta >= H * 0.62) prev.items.push(cur[0]);
      else rows.push({ items: cur, full: sum * H + gap * (cur.length - 1) >= W * 0.8 });
    }
    var max = st.open || !st.b.rows ? rows.length : st.b.rows;
    /* si sobra una sola fila incompleta, se muestra entera en vez del botón */
    if (rows.length - max === 1 && !rows[rows.length - 1].full) max = rows.length;
    st.rowsEl.innerHTML = '';
    var shown = 0;
    rows.forEach(function (r, i) {
      if (i >= max) return;
      var row = el('div', 'dg-row' + (r.full ? '' : ' is-last'));
      row.style.setProperty('--h', H + 'px');
      r.items.forEach(function (x, j) { x.n.style.setProperty('--i', j); row.appendChild(x.n); shown++; });
      st.rowsEl.appendChild(row);
    });
    var cerrar = st.open && !!st.b.rows;
    st.more.hidden = !cerrar && st.nodes.length - shown <= 0;
    st.more.classList.toggle('is-cerrar', cerrar);
    st.more.textContent = cerrar ? 'Cerrar ↑' : 'Ver ' + (st.b.id === 'posters' ? 'todos' : 'todas') + ' (' + st.nodes.length + ')';
  }
  function layoutAll(force) { bloques.forEach(function (st) { layout(st, force); }); }
  var rz = 0;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { layoutAll(false); observarFilas(); }, 150); });

  /* las filas entran suaves al bajar */
  var rio = 'IntersectionObserver' in window ? new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); rio.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 }) : null;
  function observarFilas() {
    if (!rio) { $$('.dg-row, .dg-block__head', root).forEach(function (r) { r.classList.add('is-in'); }); return; }
    $$('.dg-row:not(.is-in), .dg-block__head:not(.is-in)', root).forEach(function (r) { rio.observe(r); });
  }

  /* ---------- visor ---------- */
  var pv = el('div', 'dgv');
  pv.setAttribute('role', 'dialog'); pv.setAttribute('aria-modal', 'true'); pv.setAttribute('aria-label', 'Proyecto');
  pv.setAttribute('data-lenis-prevent', ''); pv.hidden = true;
  pv.innerHTML =
    '<div class="dgv__stage" data-stage>' +
      '<div class="dgv__slides" data-slides></div>' +
      '<button class="dgv__nav dgv__nav--prev" type="button" data-prev aria-label="Anterior">←</button>' +
      '<button class="dgv__nav dgv__nav--next" type="button" data-next aria-label="Siguiente">→</button>' +
      '<span class="dgv__loading" aria-hidden="true">cargando…</span>' +
    '</div>' +
    '<aside class="dgv__panel">' +
      '<div class="dgv__top"><span data-count>01/01</span><button class="dgv__close" type="button" data-close aria-label="Cerrar">Cerrar ✕</button></div>' +
      '<div class="dgv__text">' +
        '<p class="dgv__kicker" data-kicker></p>' +
        '<h2 class="dgv__title" data-title></h2>' +
        '<p class="dgv__desc" data-desc></p>' +
        '<div class="dgv__groups" data-groups></div>' +
        '<p class="dgv__cap" data-cap></p>' +
        '<p class="dgv__pdfs" data-pdfs></p>' +
      '</div>' +
      '<button class="dgv__nextp" type="button" data-nextp></button>' +
    '</aside>';
  document.body.appendChild(pv);

  var slidesEl = $('[data-slides]', pv), cur = null, curI = -1, idx = 0, built = [], lastFocus = null;
  function buildSlide(s) {
    var w = el('div', 'dgv__slide');
    if (s.video) {
      var v = el('video');
      v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'metadata';
      v.poster = PREV + s.poster + '.jpg';
      if (s.sound) v.controls = true; else { v.muted = true; v.setAttribute('muted', ''); v.loop = true; }
      v.dataset.src = s.video;
      w.appendChild(v);
    } else {
      var im = el('img'); im.alt = s.l; im.decoding = 'async'; im.draggable = false;
      im.src = mini(s.src);
      var hi = new Image(); hi.decoding = 'async';
      hi.onload = function () { im.src = hi.src; };
      hi.src = s.src;
      w.appendChild(im);
    }
    return w;
  }
  function render() {
    var list = cur.slides, n = list.length;
    for (var k = 0; k < n; k++) {
      var near = Math.abs(k - idx) <= 1 || (idx === 0 && k === n - 1) || (idx === n - 1 && k === 0);
      if (near && !built[k]) { built[k] = buildSlide(list[k]); slidesEl.appendChild(built[k]); }
      if (!built[k]) continue;
      built[k].classList.toggle('is-on', k === idx);
      var v = $('video', built[k]);
      if (!v) continue;
      if (k === idx) {
        if (!v.getAttribute('src')) v.src = v.dataset.src;
        if (list[k].sound) { v.muted = false; v.volume = VOLUMEN; }
        var pr = v.play();
        if (pr && pr.catch) pr.catch(function () { v.muted = true; var q = v.play(); if (q && q.catch) q.catch(function () {}); });
      } else {
        v.pause();
        if (!near && v.getAttribute('src')) { v.removeAttribute('src'); v.load(); }
      }
    }
    var s = list[idx];
    $('[data-count]', pv).textContent = pad(idx + 1) + '/' + pad(n);
    $('[data-cap]', pv).textContent = s.l;
    $$('[data-groups] button', pv).forEach(function (b) { b.classList.toggle('is-on', b.dataset.g === s.g); });
    var pdfs = $('[data-pdfs]', pv), links = [];
    if (s.book) links.push('<button type="button" class="dgv__book" data-book="' + s.book[1] + '">' + s.book[0] + ' →</button>');
    if (s.pdf && s.pdf.length) {
      links.push('Leer ' + s.pdf.map(function (x, k) {
        var t = s.pdf.length > 1 ? (k === 0 ? 'pressbook ' : '') + x[0] : x[0].toLowerCase();
        return '<a target="_blank" rel="noopener" href="' + x[1] + '">' + t + ' ↗</a>';
      }).join(' '));
    }
    if (cur.web) links.push('<a target="_blank" rel="noopener" href="' + cur.web[1] + '">' + cur.web[0] + ' ↗</a>');
    pdfs.hidden = !links.length;
    pdfs.innerHTML = links.join('<br>');
  }
  /* "Leer la revista / el libro / el manual" abre el lector de acá adentro */
  $('[data-pdfs]', pv).addEventListener('click', function (e) {
    var b = e.target.closest('[data-book]');
    if (b && window.AtusLibro) window.AtusLibro.abrir(b.dataset.book);
  });
  function reset() { slidesEl.innerHTML = ''; built = []; }
  function openProject(i, start) {
    curI = i; cur = PROJECTS[i]; idx = start || 0; reset();
    $('[data-kicker]', pv).textContent = cur.tipo + ' · ' + cur.y;
    $('[data-title]', pv).textContent = cur.t;
    $('[data-desc]', pv).textContent = cur.d;
    var gb = $('[data-groups]', pv); gb.innerHTML = '';
    var seen = [];
    cur.slides.forEach(function (s, k) {
      if (!s.g || seen.indexOf(s.g) >= 0) return; seen.push(s.g);
      var b = el('button', '', s.g); b.type = 'button'; b.dataset.g = s.g;
      b.addEventListener('click', function () { idx = k; render(); });
      gb.appendChild(b);
    });
    if (seen.length < 2) gb.innerHTML = '';
    var nx = (i + 1) % PROJECTS.length, np = $('[data-nextp]', pv);
    np.innerHTML = 'Siguiente proyecto<b>' + PROJECTS[nx].t + ' →</b>';
    np.onclick = function () { openProject(nx, 0); };
    if (pv.hidden) {
      pv.hidden = false; pv.classList.remove('is-open'); void pv.offsetWidth; pv.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      lastFocus = document.activeElement;
      setTimeout(function () { $('[data-close]', pv).focus({ preventScroll: true }); }, 30);
    }
    render();
  }
  function step(d) { if (!cur) return; var n = cur.slides.length; idx = (idx + d + n) % n; render(); }
  function close() {
    $$('video', slidesEl).forEach(function (v) { v.pause(); });
    reset(); pv.hidden = true; cur = null;
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $('[data-prev]', pv).addEventListener('click', function () { step(-1); });
  $('[data-next]', pv).addEventListener('click', function () { step(1); });
  $('[data-close]', pv).addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (pv.hidden || document.documentElement.classList.contains('lb-abierto')) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  }, true);
  (function swipe() {
    var st = $('[data-stage]', pv), x0 = 0, y0 = 0, on = false;
    st.addEventListener('touchstart', function (e) { var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; on = true; }, { passive: true });
    st.addEventListener('touchend', function (e) {
      if (!on) return; on = false;
      var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) step(dx < 0 ? 1 : -1);
    }, { passive: true });
    /* clic en la mitad izquierda / derecha de la imagen también pasa */
    st.addEventListener('click', function (e) {
      if (e.target.closest('button') || e.target.tagName === 'VIDEO') return;
      var r = st.getBoundingClientRect();
      step(e.clientX - r.left < r.width / 2 ? -1 : 1);
    });
  })();

  /* ---------- meterlo en la vista Diseño Gráfico cada vez que aparece ---------- */
  function montar() {
    var sec = document.getElementById('design');
    if (!sec) { if (!pv.hidden) close(); return; }
    if (root.parentNode === sec) return;
    sec.insertBefore(root, sec.firstChild);
    requestAnimationFrame(function () { layoutAll(true); observarFilas(); });
    setTimeout(function () { layoutAll(true); observarFilas(); }, 120);
  }
  var pend = false;
  function cola() { if (pend) return; pend = true; setTimeout(function () { pend = false; montar(); }, 0); }
  var app = document.getElementById('app');
  if (app) new MutationObserver(cola).observe(app, { childList: true, subtree: true });
  if (document.readyState !== 'loading') montar(); else document.addEventListener('DOMContentLoaded', montar);
})();
