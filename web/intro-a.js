/* ============================================================
   INTRO — agarrás el aerosol, pintás la pantalla con trazo de
   graffiti y se revela el botón "Conocer a Atus".
   Al completar el botón, el resto del papel se abre solo
   (como si hubieses pintado todo). Corre en cada carga.
   ============================================================ */
(function(){
  'use strict';

  var PAPEL = '#ffffff'; /* el mismo blanco que el fondo de Diseño Gráfico */
  /* easter egg: el personaje pregunta si vas a pintar — siempre en
     español (pedido de Nacho). El texto va en HTML con la mono del
     sistema (en el SVG venía vectorizado con otra letra) */
  var eggSrc = 'intro/easteregg-es.svg';
  var eggTxt = '¿Yyy vas a pintar o no?';

  var intro = document.createElement('div');
  intro.id = 'atus-intro';
  intro.innerHTML =
    '<div class="intro-fondo">' +
      '<img src="img/logo-atus.png" alt="ATUS">' +
      '<button class="intro-btn" type="button">Conocer a Atus ⟶</button>' +
    '</div>' +
    '<canvas id="intro-canvas"></canvas>' +
    '<span class="intro-hint">Agarrá el aerosol y pintá la página</span>' +
    '<div class="intro-egg">' +
      '<span class="intro-egg-txt">' + eggTxt + '</span>' +
      '<img src="' + eggSrc + '" alt="">' +
    '</div>' +
    '<img id="intro-aerosol" src="intro/aerosol.svg" alt="">' +
    '<button class="intro-saltar" type="button">Saltar intro ⟶</button>';
  document.body.appendChild(intro);
  document.body.style.overflow = 'hidden';

  var canvas = document.getElementById('intro-canvas');
  var ctx = canvas.getContext('2d');
  var aerosol = document.getElementById('intro-aerosol');
  var boton = intro.querySelector('.intro-btn');
  var agarrado = false;
  var revelada = false;
  var prev = null;

  /* el personaje asoma cuando estás 8 s sin tocar nada (sin mover el mouse,
     clickear, tocar ni usar el teclado). Cualquier movimiento reinicia la
     cuenta. Agarrar el aerosol lo cancela para siempre. */
  var eggEl = intro.querySelector('.intro-egg');
  var EGG_QUIETO = 8000, eggTimer = 0;
  function eggCuenta(){
    if (agarrado || eggEl.classList.contains('asoma')) return;
    clearTimeout(eggTimer);
    eggTimer = setTimeout(function(){ if (!agarrado) eggEl.classList.add('asoma'); }, EGG_QUIETO);
  }
  ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function(ev){
    window.addEventListener(ev, eggCuenta, { passive: true });
  });
  eggCuenta();

  /* segundo easter egg: le pegás → mientras mantenés el click el
     personaje queda EN BLANCO (hit-flash); al soltar aparece la cara
     de golpeado y enseguida se cae de la pantalla */
  var eggImg = eggEl.querySelector('img');
  /* los ojos siguen al mouse (ojos.js mete el SVG en la página) */
  if (window.AtusOjos) window.AtusOjos.montar(eggImg);
  function eggSoltar(){
    document.removeEventListener('mouseup', eggSoltar);
    document.removeEventListener('touchend', eggSoltar);
    eggEl.classList.remove('flash');
    setTimeout(function(){ eggEl.classList.add('cae'); }, 250);
    /* terminada la caída, el personaje se va PARA SIEMPRE: si no,
       al agarrar el aerosol la regla que frena animaciones lo
       hacía reaparecer lastimado */
    setTimeout(function(){ eggEl.style.display = 'none'; }, 1500);
  }
  function eggGolpe(e){
    if (eggEl.classList.contains('golpeado') || !eggEl.classList.contains('asoma')) return;
    eggEl.classList.add('golpeado');
    eggEl.classList.add('flash');
    eggImg.src = 'intro/easteregg-golpe.svg';
    var txt = eggEl.querySelector('.intro-egg-txt');
    if (txt) txt.style.opacity = '0';
    document.addEventListener('mouseup', eggSoltar);
    document.addEventListener('touchend', eggSoltar);
    if (e && e.preventDefault) e.preventDefault();
  }
  eggImg.addEventListener('mousedown', eggGolpe);
  eggImg.addEventListener('touchstart', eggGolpe, {passive:false});

  function pintarPapel(){
    /* si el viewport todavía no tiene medida (carga muy temprana), reintentar */
    if (!window.innerWidth || !window.innerHeight){
      requestAnimationFrame(pintarPapel);
      return;
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.globalCompositeOperation = 'source-over';
    /* papel LISO, sin textura: así el blanco de la lata (el mismo
       #EDECEA) es idéntico al del fondo */
    ctx.fillStyle = PAPEL;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  pintarPapel();
  window.addEventListener('resize', function(){ if (!revelada) pintarPapel(); });

  function moverAerosol(x, y){
    aerosol.style.left = x + 'px';
    aerosol.style.top  = y + 'px';
  }

  /* ---------- el spray (2026-10-30: el anterior se veía falso) ----------
     Como un aerosol de verdad: la lata tira una nube de gotitas (densa en el
     centro, una niebla fina alrededor y alguna gota más gruesa que se escapa)
     y la pintura se acumula con el TIEMPO, no con la distancia: pasar rápido
     deja un trazo liviano y granulado, pasar despacio lo carga hasta quedar
     lleno, y donde se carga de más chorrea (la gota baja de a poco). */
  var presion = 1;
  function gauss(){ var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  var SIG = window.innerWidth <= 760 ? 22 : 28, SPR = Math.round(SIG * 11.5), nubes = [];
  function armarNubes(){
    for (var n = 0; n < 6; n++){
      var c = document.createElement('canvas'); c.width = c.height = SPR;
      var g = c.getContext('2d'), m = SPR / 2, i, x, y, r;
      /* el centro del chorro carga fuerte: con una pasada ya queda lleno */
      var vel = g.createRadialGradient(m, m, 0, m, m, SIG * 1.4);
      vel.addColorStop(0, 'rgba(0,0,0,.9)'); vel.addColorStop(.5, 'rgba(0,0,0,.6)'); vel.addColorStop(.8, 'rgba(0,0,0,.2)'); vel.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = vel; g.fillRect(0, 0, SPR, SPR);
      g.fillStyle = '#000';
      /* el centro: miles de gotitas finas, bien juntas */
      for (i = 0; i < 3600; i++){
        x = m + gauss() * SIG * .85; y = m + gauss() * SIG * .85; r = .4 + Math.random() * .9;
        g.globalAlpha = .6 + Math.random() * .4;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      /* la niebla de alrededor, más fina y más rala */
      for (i = 0; i < 650; i++){
        x = m + gauss() * SIG * 1.7; y = m + gauss() * SIG * 1.7; r = .3 + Math.random() * .5;
        g.globalAlpha = .1 + Math.random() * .35;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      /* alguna gota más gruesa que se escapa del chorro */
      for (i = 0; i < 6; i++){
        var ang = Math.random() * 6.283, d = SIG * (1.5 + Math.random() * 2.6);
        r = .6 + Math.random() * 1.4;
        g.globalAlpha = .45 + Math.random() * .45;
        g.beginPath(); g.arc(m + Math.cos(ang) * d, m + Math.sin(ang) * d, r, 0, 6.283); g.fill();
      }
      nubes.push(c);
    }
  }
  armarNubes();
  function soplo(x, y, k){
    var c = nubes[(Math.random() * nubes.length) | 0], s = SPR * k;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(Math.random() * 6.283);
    ctx.globalAlpha = .55;
    ctx.drawImage(c, -s / 2, -s / 2, s, s);
    ctx.restore();
  }
  /* la boquilla rocía mientras la movés (y un ratito después de frenar);
     cuanto más tiempo sobre el mismo lugar, más pintura */
  var boq = null, boqAnt = null, ultMov = 0, tAnt = 0, rafS = 0, carga = {}, chorreadas = [];
  function apuntar(x, y){
    boq = { x: x, y: y }; ultMov = performance.now();
    if (!rafS) rafS = requestAnimationFrame(rociar);
  }
  function cortar(){ boqAnt = null; ultMov = 0; }
  function rociar(t){
    rafS = 0;
    var dt = tAnt ? Math.min(40, t - tAnt) : 16; tAnt = t;
    var activo = boq && agarrado && !revelada && (t - ultMov < 90);
    if (activo){
      presion += (Math.random() - .5) * .05;
      presion = Math.max(.82, Math.min(1.28, presion));
      var a = boqAnt || boq, n = Math.max(1, Math.round(dt / 3.2));
      for (var i = 0; i < n; i++){
        var u = (i + Math.random()) / n;
        var x = a.x + (boq.x - a.x) * u + gauss() * 1.5, y = a.y + (boq.y - a.y) * u + gauss() * 1.5;
        soplo(x, y, presion);
        cargar(x, y);
      }
      boqAnt = { x: boq.x, y: boq.y };
      chequearBoton();
    } else boqAnt = null;
    gotear(dt);
    if (activo || chorreadas.length) rafS = requestAnimationFrame(rociar);
    else tAnt = 0;
  }
  /* cuánta pintura junta cada zona: cuando se pasa, chorrea */
  var CEL = 26;
  function cargar(x, y){
    var key = ((x / CEL) | 0) + ',' + ((y / CEL) | 0);
    var c = carga[key] = (carga[key] || 0) + .3 * presion;
    if (c > 13 && !carga[key + 'g'] && chorreadas.length < 7 && Math.random() < .1){
      carga[key + 'g'] = 1;
      chorreadas.push({
        x: x + gauss() * SIG * .35, y: y + SIG * (.35 + Math.random() * .45),
        w: 3 + Math.random() * 3.6, largo: 45 + Math.random() * 180,
        hecho: 0, v: 70 + Math.random() * 90, fase: Math.random() * 6.283,
        espera: 150 + Math.random() * 450
      });
    }
  }
  /* la gota baja frenándose, cada vez más finita, y termina en una gotita */
  function gotear(dt){
    if (!chorreadas.length) return;
    ctx.save();
    ctx.fillStyle = ctx.strokeStyle = '#000'; ctx.lineCap = 'round'; ctx.globalAlpha = .96;
    for (var i = chorreadas.length - 1; i >= 0; i--){
      var g = chorreadas[i];
      if (g.espera > 0){ g.espera -= dt; continue; }
      var h = Math.min(g.v * dt / 1000, g.largo - g.hecho);
      g.v *= Math.pow(.5, dt / 1000);
      /* sale ancha de la mancha y se afina al bajar */
      var w = g.w * (.6 + .4 * (1 - g.hecho / g.largo) + .5 * Math.max(0, 1 - g.hecho / 14));
      var y0 = g.y + g.hecho;
      var x0 = g.x + Math.sin(g.fase + g.hecho * .05) * .9, x1 = g.x + Math.sin(g.fase + (g.hecho + h) * .05) * .9;
      ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0 + h); ctx.stroke();
      g.hecho += h;
      if (g.hecho >= g.largo - .5 || g.v < 7){
        ctx.beginPath(); ctx.ellipse(x1, y0 + h + w * .35, w * .95, w * 1.2, 0, 0, 6.283); ctx.fill();
        chorreadas.splice(i, 1);
      }
    }
    ctx.restore();
  }

  /* el resto del papel se abre solo (imagen completa + botón activo y latiendo)
     cuando pintaste el botón entero O casi todo el logo (85 % de sus trazos) */
  var ultChequeo = 0, mascaraLogo = null;
  window.addEventListener('resize', function(){ mascaraLogo = null; });
  /* dónde están los trazos del logo (en una grilla de 6 px) */
  function armarMascara(){
    var li = intro.querySelector('.intro-fondo img');
    if (!li || !li.complete || !li.naturalWidth) return null;
    var r = li.getBoundingClientRect(), esc = 6;
    var w = Math.max(2, Math.round(r.width / esc)), h = Math.max(2, Math.round(r.height / esc));
    var off = document.createElement('canvas'); off.width = w; off.height = h;
    var o = off.getContext('2d'); o.drawImage(li, 0, 0, w, h);
    var d = o.getImageData(0, 0, w, h).data, idx = [];
    for (var i = 0; i < w * h; i++) if (d[i * 4 + 3] > 140) idx.push(i);
    return { x: r.left, y: r.top, w: r.width, h: r.height, sw: w, sh: h, idx: idx };
  }
  function logoPintado(){
    if (!mascaraLogo) mascaraLogo = armarMascara();
    var m = mascaraLogo;
    if (!m || !m.idx.length) return false;
    var off = document.createElement('canvas'); off.width = m.sw; off.height = m.sh;
    var o = off.getContext('2d'); o.drawImage(canvas, m.x, m.y, m.w, m.h, 0, 0, m.sw, m.sh);
    var d = o.getImageData(0, 0, m.sw, m.sh).data, ok = 0;
    for (var k = 0; k < m.idx.length; k++) if (d[m.idx[k] * 4 + 3] < 70) ok++;
    return ok / m.idx.length > 0.85;
  }
  function chequearBoton(){
    if (revelada) return;
    var ahora = performance.now();
    if (ahora - ultChequeo < 120) return;       /* unas 8 veces por segundo */
    ultChequeo = ahora;
    try{
      if (logoPintado()){ expandir(); return; }
      var bb = boton.getBoundingClientRect();
      /* la zona a completar es el botón + un margen alrededor:
         hay que pintarlo entero de verdad, no rozarlo */
      var M = 40;
      var zx = Math.max(0, bb.left - M), zy = Math.max(0, bb.top - M);
      var zw = Math.min(canvas.width - zx, bb.width + M * 2);
      var zh = Math.min(canvas.height - zy, bb.height + M * 2);
      var esc = 6;
      var sw = Math.max(2, Math.round(zw / esc));
      var sh = Math.max(2, Math.round(zh / esc));
      var off = document.createElement('canvas');
      off.width = sw; off.height = sh;
      var octx = off.getContext('2d');
      octx.drawImage(canvas, zx, zy, zw, zh, 0, 0, sw, sh);
      var data = octx.getImageData(0, 0, sw, sh).data;
      var pintados = 0;
      /* solo cuenta la pintura BIEN cargada (alpha casi 0): tocarlo
         por encima no alcanza, hay que pintarlo entero de verdad */
      /* el spray es granulado: cuenta lo bien cargado, sin pedir cada puntito */
      for (var i = 3; i < data.length; i += 4){ if (data[i] < 45) pintados++; }
      if (pintados / (sw * sh) > 0.96) expandir();
    }catch(e){}
  }

  /* botón completo → el papel restante se desvanece y queda la
     imagen entera, como si hubieses pintado toda la pantalla */
  function expandir(){
    if (revelada) return;
    revelada = true;
    intro.classList.add('lista');
    canvas.style.transition = 'opacity .9s ease';
    canvas.style.opacity = '0';
  }

  /* salida: el logo de la intro viaja hasta el lugar exacto del logo del
     inicio (misma posición y tamaño) y ahí se lo pasa. Así no quedan dos
     logos que no coinciden ni el barrido de pintura encima */
  function salir(){
    if (intro.classList.contains('saliendo') || intro.classList.contains('traspaso')) return;
    if (window.scrollY) window.scrollTo(0, 0); /* el logo va al del inicio, arriba de todo */
    var li = intro.querySelector('.intro-fondo img');
    var lh = document.querySelector('.hero-landing .hero-logo');
    var a = li && li.getBoundingClientRect(), b = lh && lh.getBoundingClientRect();
    if (!a || !b || !a.width || !b.width || !li.animate) { irse(false); return; }
    var dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    var dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    var s = b.width / a.width;
    document.documentElement.classList.add('intro-traspaso');
    intro.classList.add('traspaso');
    /* el scroll queda trabado hasta que el logo aterriza (irse lo destraba): si no,
       al bajar rápido la página se movía y el logo grande quedaba flotando encima */
    var vuelo = li.animate(
      [{ transform: 'translate(0px,0px) scale(1)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }],
      { duration: 850, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' }
    );
    vuelo.onfinish = function(){
      document.documentElement.classList.add('pl-sin-wipe');
      document.documentElement.classList.remove('intro-traspaso');
      irse(true);
    };
  }
  function irse(rapido){
    if (rapido) intro.style.transition = 'opacity .18s ease';
    intro.classList.add('saliendo');
    document.body.style.overflow = '';
    setTimeout(function(){ if (intro.parentNode) intro.parentNode.removeChild(intro); }, rapido ? 220 : 650);
  }

  /* agarrar el aerosol */
  function agarrar(x, y){
    if (agarrado) return;
    agarrado = true;
    if (eggTimer) clearTimeout(eggTimer);
    intro.classList.add('agarrado');
    moverAerosol(x, y);
  }
  aerosol.addEventListener('click', function(e){ agarrar(e.clientX, e.clientY); });

  /* el chorro sale a la izquierda de la boquilla, apenas arriba:
     la pintura pasa por detrás de la lata y se nota que la lata
     queda por encima */
  var CHORRO_DX = -34, CHORRO_DY = -4;

  /* mouse: pintás libre hasta completar el botón */
  intro.addEventListener('mousemove', function(e){
    if (!agarrado || revelada) return;
    moverAerosol(e.clientX, e.clientY);
    apuntar(e.clientX + CHORRO_DX, e.clientY + CHORRO_DY);
  });
  intro.addEventListener('mouseleave', cortar);

  /* touch: agarra SOLO si tocás la lata (con margen generoso).
     Antes cualquier toque en la pantalla la agarraba y cancelaba
     el timer del personaje: en mobile no aparecía nunca */
  intro.addEventListener('touchstart', function(e){
    if (agarrado) return;
    var t = e.touches[0];
    var r = aerosol.getBoundingClientRect();
    var M = 34;
    if (t.clientX > r.left - M && t.clientX < r.right + M &&
        t.clientY > r.top - M && t.clientY < r.bottom + M){
      agarrar(t.clientX, t.clientY);
      cortar();
    }
  }, {passive:true});
  intro.addEventListener('touchmove', function(e){
    if (!agarrado || revelada) return;
    var t = e.touches[0];
    moverAerosol(t.clientX, t.clientY);
    apuntar(t.clientX + CHORRO_DX, t.clientY + CHORRO_DY);
    e.preventDefault();
  }, {passive:false});
  intro.addEventListener('touchend', cortar);

  /* botones */
  boton.addEventListener('click', salir);
  intro.querySelector('.intro-saltar').addEventListener('click', salir);
})();
