/* ============================================================
   OPCIÓN A — EL PERSONAJE DE LA INTRO, FIJO EN "SOBRE MÍ"
   Asoma abajo del texto, en el espacio vacío. Se le puede pegar
   (click o toque): queda en blanco mientras apretás, pone la cara
   de golpeado, tiembla y te putea. No se cae: se queda ahí y al
   rato vuelve a la cara de siempre.
   ============================================================ */
(function () {
  'use strict';
  var NORMAL = 'intro/easteregg-es.svg', GOLPE = 'intro/easteregg-golpe.svg';
  /* graciosas pero sin malas palabras: las de Atus y los clásicos */
  var FRASES = [
    '¡Ouch!',
    '¡Paraaa!',
    '¡Ojo, wachín!',
    'Ya te voy a agarrar.',
    'Tengo tu IP, eh.',
    '¡Auch, mi cabeza!',
    'Eh, eh, eh. Tranqui.',
    '¡Uy! Me despeinaste.',
    'Así no te hago el logo.',
    'Me voy a quejar con Atus.',
    '¿Esto es por el presupuesto?',
    'Otra más y te cobro.',
    'Te vi, eh.',
    'Pará que llamo a mi abogado.'
  ];
  /* las frases salen mezcladas, sin repetir hasta usarlas todas */
  var mazo = [];
  function frase() {
    if (!mazo.length) { mazo = FRASES.slice(); for (var i = mazo.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = mazo[i]; mazo[i] = mazo[j]; mazo[j] = t; } }
    return mazo.pop();
  }

  var pj = document.createElement('div');
  pj.className = 'apj';
  pj.innerHTML =
    '<p class="apj-txt" aria-live="polite"></p>' +
    '<button class="apj-btn" type="button" aria-label="Pegarle al personaje"><img class="apj-img" src="' + NORMAL + '" alt="" draggable="false"></button>';
  var btn = pj.querySelector('.apj-btn'), img = pj.querySelector('.apj-img'), txt = pj.querySelector('.apj-txt');
  new Image().src = GOLPE;
  /* los ojos siguen al mouse (ojos.js mete el SVG en la página) */
  if (window.AtusOjos) window.AtusOjos.montar(img);

  var tCara = 0, tTxt = 0, golpes = 0;
  function pegar(e) {
    if (e && e.cancelable && e.type === 'touchstart') e.preventDefault();
    golpes++;
    clearTimeout(tCara); clearTimeout(tTxt);
    img.src = GOLPE;
    pj.classList.add('flash');
    pj.classList.remove('tiembla'); void pj.offsetWidth; pj.classList.add('tiembla');
    txt.textContent = golpes > 9 && golpes % 5 === 0 ? 'Listo, te bloqueo.' : frase();
    txt.classList.remove('is-on'); void txt.offsetWidth; txt.classList.add('is-on');
    document.addEventListener('mouseup', soltar);
    document.addEventListener('touchend', soltar);
    document.addEventListener('touchcancel', soltar);
  }
  function soltar() {
    document.removeEventListener('mouseup', soltar);
    document.removeEventListener('touchend', soltar);
    document.removeEventListener('touchcancel', soltar);
    pj.classList.remove('flash');
    tCara = setTimeout(function () { img.src = NORMAL; }, 1800);
    tTxt = setTimeout(function () { txt.classList.remove('is-on'); }, 2800);
  }
  btn.addEventListener('mousedown', pegar);
  btn.addEventListener('touchstart', pegar, { passive: false });
  /* con teclado: Enter o espacio también le pegan */
  btn.addEventListener('click', function (e) { if (e.detail === 0) { pegar(); setTimeout(soltar, 120); } });

  /* compu: abajo del texto. Celular: el mismo lugar, pero asomado por
     arriba de la foto (la foto sube y el personaje queda encima) */
  function montar() {
    var col = document.querySelector('#about .about-l');
    if (!col || col.contains(pj)) return;
    col.classList.add('apj-col');
    col.appendChild(pj);
  }
  var cola = false;
  function pedir() { if (cola) return; cola = true; requestAnimationFrame(function () { cola = false; montar(); }); }
  var app = document.getElementById('app');
  /* sólo cuando entran o salen elementos (los cambios de texto lo disparaban sin parar) */
  if (app) new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) { var a = ms[i].addedNodes, r = ms[i].removedNodes, j; for (j = 0; j < a.length; j++) if (a[j].nodeType === 1) return pedir(); for (j = 0; j < r.length; j++) if (r[j].nodeType === 1) return pedir(); } }).observe(app, { childList: true, subtree: true });
  if (document.readyState !== 'loading') montar(); else document.addEventListener('DOMContentLoaded', montar);
  setTimeout(montar, 400);
})();
