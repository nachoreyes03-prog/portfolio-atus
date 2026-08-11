/* ============================================================
   INTRO — agarrás el aerosol, pintás la pantalla con trazo de
   graffiti y se revela el botón "Conocer a Atus".
   Al completar el botón, el resto del papel se abre solo
   (como si hubieses pintado todo). Corre en cada carga.
   ============================================================ */
(function(){
  'use strict';

  var PAPEL = '#edecea';
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
      '<span class="intro-sub">Ignacio Reyes — diseño + ilustración</span>' +
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

  /* el personaje es un easter egg: asoma a los 12s de cargada la
     página (mover el mouse no lo frena). Solo agarrar el aerosol lo
     cancela — y una vez agarrado, no aparece más */
  var eggEl = intro.querySelector('.intro-egg');
  var eggTimer = setTimeout(function(){
    if (!agarrado) eggEl.classList.add('asoma');
  }, 5000);

  /* segundo easter egg: le pegás → mientras mantenés el click el
     personaje queda EN BLANCO (hit-flash); al soltar aparece la cara
     de golpeado y enseguida se cae de la pantalla */
  var eggImg = eggEl.querySelector('img');
  function eggSoltar(){
    document.removeEventListener('mouseup', eggSoltar);
    document.removeEventListener('touchend', eggSoltar);
    eggEl.classList.remove('flash');
    setTimeout(function(){ eggEl.classList.add('cae'); }, 300);
    /* terminada la caída, el personaje se va PARA SIEMPRE: si no,
       al agarrar el aerosol la regla que frena animaciones lo
       hacía reaparecer lastimado */
    setTimeout(function(){ eggEl.style.display = 'none'; }, 900);
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

  /* una estampa de spray: mancha con borde difuso (gradiente radial)
     + salpicaduras irregulares + chorreadas ocasionales. Se estampa a
     lo largo del recorrido interpolando, sin pegotes ni rectas.
     La "presión" del dedo deriva de a poco: el ancho del chorro va
     variando solo mientras pintás */
  var presion = 1;
  function estampa(x, y){
    /* el pulso nunca es perfecto: el centro tiembla un poco */
    x += (Math.random() - .5) * 12;
    y += (Math.random() - .5) * 12;
    presion += (Math.random() - .5) * .14;
    if (presion < .55) presion = .55;
    if (presion > 1.8) presion = 1.8;
    var R = (58 + Math.random() * 22) * presion;   /* chorro bien ancho, varía mucho */
    var g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0,   'rgba(0,0,0,.95)');
    g.addColorStop(.5,  'rgba(0,0,0,.8)');
    g.addColorStop(.78, 'rgba(0,0,0,.3)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fill();
    /* segundo blob corrido: rompe el círculo perfecto del chorro */
    var ox = x + (Math.random() - .5) * R * .5;
    var oy = y + (Math.random() - .5) * R * .5;
    var R2 = R * (.55 + Math.random() * .3);
    var g2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, R2);
    g2.addColorStop(0,  'rgba(0,0,0,.6)');
    g2.addColorStop(.7, 'rgba(0,0,0,.25)');
    g2.addColorStop(1,  'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(ox, oy, R2, 0, Math.PI * 2);
    ctx.fill();

    /* banda intermedia: grano pegado al borde del chorro (el paso
       entre la mancha y las gotitas lejanas, para que no quede
       ese margen vacío tan vectorial) */
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    var nGrano = 10 + Math.floor(Math.random() * 6);
    for (var k = 0; k < nGrano; k++){
      var angG = Math.random() * Math.PI * 2;
      var distG = R * (.62 + Math.random() * .5);
      var rG = 1 + Math.random() * 5.5;
      ctx.globalAlpha = .2 + Math.random() * .5;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angG) * distG, y + Math.sin(angG) * distG, rG, 0, Math.PI * 2);
      ctx.fill();
    }

    /* salpicaduras lejanas: manchas irregulares (2-3 círculos superpuestos) */
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    var nSalp = 5 + (Math.random() < .3 ? 5 : 0);
    for (var i = 0; i < nSalp; i++){
      var ang = Math.random() * Math.PI * 2;
      var dist = R * (1.05 + Math.random() * 1.6);
      var sx = x + Math.cos(ang) * dist;
      var sy = y + Math.sin(ang) * dist;
      var r = .6 + Math.random() * 4.5;
      ctx.globalAlpha = .15 + Math.random() * .55;
      /* mancha irregular: 2-3 gotas pegadas */
      var blobs = 1 + Math.floor(Math.random() * 3);
      for (var b = 0; b < blobs; b++){
        ctx.beginPath();
        ctx.arc(sx + (Math.random() - .5) * r * 2.2,
                sy + (Math.random() - .5) * r * 2.2,
                r * (.4 + Math.random() * .8), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* chorreada: cada tanto la pintura gotea para abajo */
    if (Math.random() < .045){
      var dx2 = x + (Math.random() - .5) * R;
      var largo = 24 + Math.random() * 70;
      var ancho = 2.5 + Math.random() * 3;
      var dg = ctx.createLinearGradient(dx2, y, dx2, y + largo);
      dg.addColorStop(0, 'rgba(0,0,0,.85)');
      dg.addColorStop(.7, 'rgba(0,0,0,.5)');
      dg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.ellipse ? ctx.ellipse(dx2, y + largo / 2, ancho, largo / 2, 0, 0, Math.PI * 2)
                  : ctx.rect(dx2 - ancho, y, ancho * 2, largo);
      ctx.fill();
      /* gota al final de la chorreada */
      ctx.fillStyle = 'rgba(0,0,0,.7)';
      ctx.beginPath();
      ctx.arc(dx2, y + largo * (.75 + Math.random() * .2), ancho * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function pintar(x, y){
    if (!prev){ estampa(x, y); prev = {x: x, y: y}; return; }
    /* interpolar el tramo para un chorro continuo y parejo */
    var dx = x - prev.x, dy = y - prev.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var pasos = Math.max(1, Math.floor(d / 10));
    for (var i = 1; i <= pasos; i++){
      estampa(prev.x + dx * i / pasos, prev.y + dy * i / pasos);
    }
    prev = {x: x, y: y};
  }

  /* recién cuando el botón está pintado AL 100% el resto del papel
     se abre solo: imagen completa + botón activo y latiendo */
  var chequeos = 0;
  function chequearBoton(){
    if (revelada) return;
    if (++chequeos % 4 !== 0) return;           /* no en cada movimiento */
    try{
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
      for (var i = 3; i < data.length; i += 4){ if (data[i] < 25) pintados++; }
      if (pintados / (sw * sh) > 0.98) expandir();
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

  /* salida: fade simple hacia la página */
  function salir(){
    intro.classList.add('saliendo');
    document.body.style.overflow = '';
    setTimeout(function(){ if (intro.parentNode) intro.parentNode.removeChild(intro); }, 650);
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
    pintar(e.clientX + CHORRO_DX, e.clientY + CHORRO_DY);
    chequearBoton();
  });
  intro.addEventListener('mouseleave', function(){ prev = null; });

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
      prev = null;
    }
  }, {passive:true});
  intro.addEventListener('touchmove', function(e){
    if (!agarrado || revelada) return;
    var t = e.touches[0];
    moverAerosol(t.clientX, t.clientY);
    pintar(t.clientX + CHORRO_DX, t.clientY + CHORRO_DY);
    chequearBoton();
    e.preventDefault();
  }, {passive:false});
  intro.addEventListener('touchend', function(){ prev = null; });

  /* botones */
  boton.addEventListener('click', salir);
  intro.querySelector('.intro-saltar').addEventListener('click', salir);
})();
