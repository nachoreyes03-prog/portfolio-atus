/* ============================================================
   SIMPLIFICADO — recortes de texto sobre el sitio publicado.
   React re-renderiza al cambiar de vista, así que re-aplicamos
   con un MutationObserver (mismo patrón que usa el propio sitio).
   ============================================================ */
(function(){
  'use strict';

  var BIO_CORTA = 'Doble licenciado en Diseño Gráfico y en Diseño Multimedia e Interacción. Identidad, editorial e ilustración con concepto, personalidad y sistema.';
  /* frase completa y corta: sin clamp a mitad de oración ni viudas */
  var TESIS_CORTA = 'Sistema de identidad y comunicación para el Museo del Agua de AySA: tres sistemas editoriales y propuestas de aplicación interior y exterior.';

  /* Gorillaz queda oculto (overrides.css) y el listado se reordena
     (tesis → web → 9R → Motion → Koizone → resto → 3D), así que los
     números originales "XX / 10" se remapean al orden visual nuevo.
     Se recorren NODOS DE TEXTO (algunos números conviven con más
     texto en el mismo elemento). */
  var MAPA_NUM = {1:1, 2:3, 4:4, 5:5, 6:2, 7:6, 8:7, 9:8};   /* orig → nuevo (3 = Gorillaz, fuera) */
  var TOTAL_NUEVO = '09';

  function esContadorDeVideos(nodo){
    var p = nodo.parentElement;
    return p && p.closest && p.closest('.anim-cover');
  }

  function renumerarTextos(){
    var app = document.getElementById('app');
    if (!app) return;
    var walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT, null, false);
    var nodo;
    var enteros = [];                            /* patrón completo en un nodo */
    var barras = [];                             /* React parte "01" + " / " + "10" */
    while ((nodo = walker.nextNode())){
      var t = nodo.nodeValue || '';
      if (/\d{2}\s*\/\s*10/.test(t)){ enteros.push(nodo); continue; }
      if (/\/\s*$/.test(t)) barras.push(nodo);
    }
    /* caso 1: "01 / 10 — 2025" en un solo nodo */
    enteros.forEach(function(n){
      if (esContadorDeVideos(n)) return;
      n.nodeValue = n.nodeValue.replace(/(\d{2})(\s*\/\s*)10/g, function(todo, num, sep){
        var nuevo = MAPA_NUM[parseInt(num, 10)];
        return nuevo ? ('0' + nuevo).slice(-2) + sep + TOTAL_NUEVO : todo;
      });
    });
    /* caso 2: React parte el número en nodos hermanos. Puede ser
       "01" + " / " + "10"  o  "Tesis · 01/" + "10" */
    barras.forEach(function(b){
      if (esContadorDeVideos(b)) return;
      var nextN = b.nextSibling;
      if (!nextN || nextN.nodeType !== 3 || !/^\s*10\s*$/.test(nextN.nodeValue || '')) return;
      var numNode = null, m = (b.nodeValue || '').match(/(\d{2})\s*\/\s*$/);
      if (m){
        numNode = b;                             /* "…01/" + "10" */
      } else if (/^\s*\/\s*$/.test(b.nodeValue || '')){
        var prevN = b.previousSibling;           /* "01" + " / " + "10" */
        if (prevN && prevN.nodeType === 3){
          var mp = (prevN.nodeValue || '').match(/(\d{2})\s*$/);
          if (mp){ numNode = prevN; m = mp; }
        }
      }
      if (!numNode || !m) return;
      var nuevo = MAPA_NUM[parseInt(m[1], 10)];
      if (!nuevo) return;
      numNode.nodeValue = numNode.nodeValue.replace(/(\d{2})([\s\/]*)$/, ('0' + nuevo).slice(-2) + '$2');
      nextN.nodeValue = nextN.nodeValue.replace('10', TOTAL_NUEVO);
    });
  }

  function apply(){
    try{
      var ps = document.querySelectorAll('#app p');
      for (var i = 0; i < ps.length; i++){
        var p = ps[i];
        if (p.dataset.simp) continue;
        var t = p.textContent || '';
        /* bio: versión corta */
        if (t.indexOf('Soy Ignacio Reyes, doble licenciado') === 0){
          p.textContent = BIO_CORTA;
          p.dataset.simp = '1';
        }
        /* segundo párrafo de la bio: fuera */
        if (t.indexOf('Me interesa desarrollar proyectos') === 0){
          p.style.display = 'none';
          p.dataset.simp = '1';
        }
        /* concepto de la tesis: frase corta completa (sin clamp raro) */
        if (t.indexOf('Tesis de grado: sistema de identidad') === 0){
          p.textContent = TESIS_CORTA;
          p.style.webkitLineClamp = 'unset';
          p.dataset.simp = '1';
        }
      }
      /* ficha: sacamos la edad (dato que no suma para un encargo) */
      var stats = document.querySelectorAll('.about-stat');
      for (var j = 0; j < stats.length; j++){
        var s = stats[j];
        if (s.dataset.simp) continue;
        if (/^\s*Edad/i.test(s.textContent || '')){
          s.style.display = 'none';
          s.dataset.simp = '1';
        }
      }
      /* renumerar proyectos según el orden visual nuevo */
      renumerarTextos();
      /* chips de filtro: contadores sin Gorillaz (era Editorial).
         Solo tocamos el span del número, no el botón (React) */
      var chips = document.querySelectorAll('.illu-bar .chip');
      for (var c = 0; c < chips.length; c++){
        var ch = chips[c];
        var nEl = ch.querySelector('.n');
        if (!nEl || nEl.dataset.simp) continue;
        var label = ch.textContent || '';
        if (/^\s*Todos/.test(label)){ nEl.textContent = '(9)'; nEl.dataset.simp = '1'; }
        else if (/^\s*Editorial/.test(label)){ nEl.textContent = '(3)'; nEl.dataset.simp = '1'; }
      }
      var cnt = document.querySelector('.illu-count');
      if (cnt && !cnt.dataset.simp && /^\s*10 proyectos/.test(cnt.textContent || '')){
        cnt.textContent = (cnt.textContent || '').replace('10', '9');
        cnt.dataset.simp = '1';
      }
      /* reordenado por estilos inline: el CSS usa :has(), que Safari
         viejo (iPhone) no soporta — esto funciona en todos lados */
      /* (se re-aplica en cada render: el observer solo mira childList,
         así que setear estilos acá no genera loops) */
      var wrapOrden = document.querySelector('.sec .wrap');
      if (wrapOrden && wrapOrden.querySelector('.tesis-featured')){
        wrapOrden.style.display = 'flex';
        wrapOrden.style.flexDirection = 'column';
        var sh = wrapOrden.querySelector('.sec-head'); if (sh) sh.style.order = '-3';
        var ib = wrapOrden.querySelector('.illu-bar'); if (ib){ ib.style.order = '-2'; ib.style.marginBottom = '34px'; }
        var pl = wrapOrden.querySelector('.projects-list');
        if (pl){
          pl.style.display = 'flex';
          pl.style.flexDirection = 'column';
          var ORDEN = {'pj-9r':'1', 'pj-koizone':'3', 'pj-spider-simple':'4', 'pj-posters':'5'};
          for (var h = 0; h < pl.children.length; h++){
            var hijo = pl.children[h];
            var cl = String(hijo.className);
            if (/\bpj\b/.test(cl) && /\bflip\b/.test(cl)){ hijo.style.order = '2'; continue; }
            var puesto = '6';
            for (var key in ORDEN){ if (cl.indexOf(key) !== -1){ puesto = ORDEN[key]; break; } }
            hijo.style.order = puesto;
          }
        }
      }
      /* sección DISEÑO WEB: demos propios de Jay's American y Dashi.
         Va JUSTO DESPUÉS de la tesis. Los videos solo se reproducen
         cuando están en pantalla, para no comerse los FPS */
      var wrap = document.querySelector('.sec .wrap');
      if (wrap && wrap.querySelector('.tesis-featured') && !wrap.querySelector('.simp-web')){
        var web = document.createElement('div');
        web.className = 'simp-web';
        web.innerHTML =
          '<div class="simp-web-head">' +
            '<span class="simp-web-num">Extra / Diseño web · UX/UI</span>' +
            '<h3>Rediseños web.</h3>' +
            '<p class="simp-web-note">Agarro sitios reales y los rediseño completos por iniciativa propia. Conceptos no oficiales — sin vínculo comercial con las marcas.</p>' +
          '</div>' +
          '<div class="simp-web-grid">' +
            '<div class="simp-web-item">' +
              '<div class="simp-web-item-head">' +
                '<div>' +
                  '<span class="simp-web-tag">W1 / Restaurante · Buenos Aires</span>' +
                  '<b class="simp-web-title">Dashi — Sushi Nikkei.</b>' +
                  '<span class="simp-web-sub">Rediseño completo del sitio real: navegación, carta y reservas repensadas de cero.</span>' +
                '</div>' +
                '<span class="simp-web-badge">Rediseño no oficial</span>' +
              '</div>' +
              '<video src="videos/web-dashi.mp4" muted loop playsinline preload="metadata"></video>' +
            '</div>' +
            '<div class="simp-web-item">' +
              '<div class="simp-web-item-head">' +
                '<div>' +
                  '<span class="simp-web-tag">W2 / Restaurante de desayunos &middot; EE. UU.</span>' +
                  '<b class="simp-web-title">Jay&rsquo;s American.</b>' +
                  '<span class="simp-web-sub">Rediseño del sitio real: menú, pedidos y locales con una identidad más rica.</span>' +
                '</div>' +
                '<span class="simp-web-badge">Rediseño no oficial</span>' +
              '</div>' +
              '<video src="videos/web-jays.mp4" muted loop playsinline preload="metadata"></video>' +
            '</div>' +
          '</div>';
        var lista = wrap.querySelector('.projects-list');
        if (lista) wrap.insertBefore(web, lista);
        else wrap.appendChild(web);
        /* play/pausa según visibilidad (FPS) */
        try{
          var vids = web.querySelectorAll('video');
          var vio = new IntersectionObserver(function(entradas){
            entradas.forEach(function(en){
              if (en.isIntersecting) en.target.play()['catch'](function(){});
              else en.target.pause();
            });
          }, {threshold:.15});
          for (var v = 0; v < vids.length; v++) vio.observe(vids[v]);
        }catch(eV){
          var vids2 = web.querySelectorAll('video');
          for (var v2 = 0; v2 < vids2.length; v2++){ vids2[v2].autoplay = true; }
        }
      }
    }catch(e){ /* nunca romper el sitio por una simplificación */ }
  }

  var queued = false;
  function queue(){
    if (queued) return;
    queued = true;
    setTimeout(function(){ queued = false; apply(); }, 60);
  }

  var app = document.getElementById('app');
  if (app){
    new MutationObserver(queue).observe(app, { childList:true, subtree:true });
  }
  if (document.readyState !== 'loading') apply();
  else document.addEventListener('DOMContentLoaded', apply);
  setTimeout(apply, 600);
})();
