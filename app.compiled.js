const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;
const DESIGN = JSON.parse(document.getElementById('design-data').textContent);
const WORKS = JSON.parse(document.getElementById('works-data').textContent);
const COMIC = JSON.parse(document.getElementById('comic-data').textContent);
const I18N = JSON.parse(document.getElementById('i18n').textContent);
const getLang = () => {
  const s = localStorage.getItem('atus_lang');
  return s && I18N[s] ? s : 'es';
};

// Tiny module-level cache so we don't re-render the same PDF cover twice
const __pdfThumbCache = {};

// Lightweight PDF first-page thumbnail (renders to canvas, replaces static cov-*.png)
function PdfThumb({
  src,
  fallback,
  className,
  alt
}) {
  const [dataUrl, setDataUrl] = useState(__pdfThumbCache[src] || null);
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    if (__pdfThumbCache[src]) {
      setDataUrl(__pdfThumbCache[src]);
      return;
    }
    // Si hay portada estática, la usamos directamente y NO abrimos el PDF para la
    // miniatura. Las portadas correctas (afiche, tapa de Koizone, etc.) ya están
    // generadas como imagen, así que rasterizar el PDF sería lento, pesado (Koizone
    // son 16MB con imágenes de 17 megapíxeles) y en iOS reventaba la memoria.
    if (fallback) {
      return;
    }
    // En file:// (zip descargado, abierto local) pdf.js no puede fetchar los PDFs.
    // Usamos directamente la imagen de portada estática.
    if (window.__IS_FILE_PROTOCOL) {
      setErrored(true);
      return;
    }
    if (!window.pdfjsLib) {
      setErrored(true);
      return;
    }
    let cancelled = false;
    pdfjsLib.getDocument(src).promise.then(async pdf => {
      const page = await pdf.getPage(1);
      const v1 = page.getViewport({
        scale: 1
      });
      const scale = 600 / v1.width;
      const vp = page.getViewport({
        scale
      });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({
        canvasContext: ctx,
        viewport: vp
      }).promise;
      const url = canvas.toDataURL('image/jpeg', 0.82);
      __pdfThumbCache[src] = url;
      if (!cancelled) setDataUrl(url);
    }).catch(() => {
      if (!cancelled) setErrored(true);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);
  if (dataUrl) return /*#__PURE__*/React.createElement("img", {
    src: dataUrl,
    alt: alt || '',
    className: className,
    loading: "lazy"
  });
  if (errored && fallback) return /*#__PURE__*/React.createElement("img", {
    src: fallback,
    alt: alt || '',
    className: className,
    loading: "lazy"
  });
  // While loading: show fallback (cover) immediately so the user never sees empty box
  if (fallback) return /*#__PURE__*/React.createElement("img", {
    src: fallback,
    alt: alt || '',
    className: className,
    loading: "lazy"
  });
  // En file:// sin fallback: mostramos un placeholder con el nombre del PDF
  if (window.__IS_FILE_PROTOCOL && errored) {
    const name = (src || '').split('/').pop().replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    return /*#__PURE__*/React.createElement("div", {
      className: className,
      style: {
        background: '#1a1a1a',
        color: '#f4f2ec',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 24,
        textAlign: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 9,
        letterSpacing: '.22em',
        textTransform: 'uppercase',
        opacity: .5
      }
    }, "Documento PDF"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'Poppins',sans-serif",
        fontSize: 14,
        fontWeight: 500,
        opacity: .92,
        textTransform: 'capitalize'
      }
    }, name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 9,
        letterSpacing: '.2em',
        textTransform: 'uppercase',
        opacity: .4,
        marginTop: 6
      }
    }, "Abrir proyecto \u2192"));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: {
      background: '#f4f2ec'
    }
  });
}

// Renders ALL pages of a PDF as a clickable grid (Gero-comic style)
// Each thumb is rendered once and cached, then displayed at small size.
const __pdfPagesCache = {};
function PdfPagesGrid({
  src,
  cols = 4,
  max = 24,
  onClickPage
}) {
  const [pages, setPages] = useState(__pdfPagesCache[src] || []);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // En file:// no podemos rasterizar las páginas. Mostramos un solo card que
  // abre el PDF en el visor nativo del navegador (en pestaña nueva).
  if (window.__IS_FILE_PROTOCOL) {
    return /*#__PURE__*/React.createElement("div", {
      className: "pdf-pages-grid pdf-pages-grid-local",
      style: {
        gridTemplateColumns: `repeat(${cols},1fr)`
      }
    }, /*#__PURE__*/React.createElement("a", {
      className: "pdf-page-card pdf-page-card-open",
      href: src,
      target: "_blank",
      rel: "noopener"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pdf-page-card-img",
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f4f2ec',
        color: '#111',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        letterSpacing: '.18em',
        textTransform: 'uppercase',
        textAlign: 'center',
        padding: 18,
        lineHeight: 1.5
      }
    }, "Abrir PDF", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      style: {
        opacity: .55,
        fontSize: 9
      }
    }, "en pesta\xF1a nueva")), /*#__PURE__*/React.createElement("span", {
      className: "pdf-page-card-n"
    }, src.split('/').pop())));
  }
  useEffect(() => {
    if (__pdfPagesCache[src] && __pdfPagesCache[src].length > 0) {
      setPages(__pdfPagesCache[src]);
      setLoading(false);
      return;
    }
    if (!window.pdfjsLib) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPages([]);
    pdfjsLib.getDocument(src).promise.then(async pdf => {
      if (cancelled) return;
      setTotal(pdf.numPages);
      const limit = Math.min(max, pdf.numPages);
      const out = [];
      for (let i = 1; i <= limit; i++) {
        if (cancelled) return;
        try {
          const p = await pdf.getPage(i);
          const v1 = p.getViewport({
            scale: 1
          });
          const scale = 320 / v1.width;
          const vp = p.getViewport({
            scale
          });
          const c = document.createElement('canvas');
          c.width = vp.width;
          c.height = vp.height;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, c.width, c.height);
          await p.render({
            canvasContext: ctx,
            viewport: vp
          }).promise;
          const url = c.toDataURL('image/jpeg', 0.78);
          out.push({
            n: i,
            url
          });
          if (!cancelled) setPages([...out]);
        } catch (e) {}
      }
      __pdfPagesCache[src] = out;
      if (!cancelled) setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);
  return /*#__PURE__*/React.createElement("div", {
    className: "pdf-pages-grid",
    style: {
      gridTemplateColumns: `repeat(${cols},1fr)`
    }
  }, pages.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.n,
    className: "pdf-page-card",
    onClick: () => onClickPage && onClickPage(p.n)
  }, /*#__PURE__*/React.createElement("div", {
    className: "pdf-page-card-img"
  }, /*#__PURE__*/React.createElement("img", {
    src: p.url,
    alt: `Página ${p.n}`
  })), /*#__PURE__*/React.createElement("span", {
    className: "pdf-page-card-n"
  }, "P\xE1gina ", String(p.n).padStart(2, '0')))), loading && Array.from({
    length: Math.max(0, 8 - pages.length)
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: 'sk' + i,
    className: "pdf-page-card pdf-page-card-skel"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pdf-page-card-img"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pdf-page-card-n"
  }, "\xB7\xB7\xB7"))));
}

// Real PDF reader — uses PDF.js to render pages as canvases (no browser PDF chrome)
function PdfReader({
  src,
  cover,
  altVersion,
  onToggleVersion,
  hasAlt,
  skipPages,
  coverAlone
}) {
  // Fallback para file:// — el visor nativo del navegador SÍ funciona en local.
  if (window.__IS_FILE_PROTOCOL) {
    return /*#__PURE__*/React.createElement("div", {
      className: "pdf-reader"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pdf-stage",
      style: {
        padding: 0,
        cursor: 'default'
      }
    }, /*#__PURE__*/React.createElement("iframe", {
      src: src,
      style: {
        width: '100%',
        height: '100%',
        border: 'none',
        background: '#1a1a1a'
      },
      title: "PDF"
    })), /*#__PURE__*/React.createElement("div", {
      className: "pdf-controls"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pdf-info",
      style: {
        opacity: .7
      }
    }, "Visor local \xB7 ", src.split('/').pop()), /*#__PURE__*/React.createElement("a", {
      href: src,
      target: "_blank",
      rel: "noopener",
      style: {
        background: 'transparent',
        color: 'var(--paper)',
        border: '1px solid rgba(244,242,236,.55)',
        padding: '9px 16px',
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 11,
        letterSpacing: '.2em',
        textTransform: 'uppercase',
        textDecoration: 'none'
      }
    }, "Abrir en pesta\xF1a \u2197")));
  }
  const skip = React.useMemo(() => new Set(skipPages || []), [skipPages]);
  const skipNext = (p, total) => {
    let n = p;
    while (n <= total && skip.has(n)) n++;
    return n;
  };
  const skipPrev = p => {
    let n = p;
    while (n >= 1 && skip.has(n)) n--;
    return n;
  };
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState('single'); // 'single' | 'spread' — single page por defecto, opt-in al spread
  const [zoomed, setZoomed] = useState(false);
  const [err, setErr] = useState(false);
  const canvasRefs = useRef({
    left: null,
    right: null
  });
  const wrapRef = useRef(null);
  const prevPageRef = useRef(1);

  // Page-turn: al cambiar de página, reinicia la animación de giro (bisagra de
  // libro) en la dirección correcta. useLayoutEffect → aplica antes del paint.
  React.useLayoutEffect(() => {
    const w = wrapRef.current;
    const prev = prevPageRef.current;
    if (w && page !== prev) {
      const dir = page > prev ? 'next' : 'prev';
      const canvas = canvasRefs.current.left;
      // PAGE-FLIP real en modo Página: capturamos la página actual y la giramos
      // sobre el lomo, revelando la nueva (que se pinta debajo). Modo Libro: crossfade.
      if (mode === 'single' && canvas && canvas.width > 0) {
        try {
          const cr = canvas.getBoundingClientRect();
          const wr = w.getBoundingClientRect();
          const img = document.createElement('img');
          img.src = canvas.toDataURL('image/jpeg', 0.86);
          img.style.cssText = 'position:absolute;z-index:6;pointer-events:none;' + 'left:' + (cr.left - wr.left) + 'px;top:' + (cr.top - wr.top) + 'px;' + 'width:' + cr.width + 'px;height:' + cr.height + 'px;' + 'transform-origin:' + (dir === 'next' ? 'left' : 'right') + ' center;';
          w.style.position = 'relative';
          w.style.perspective = '2200px';
          // animación CSS (compositor) → no depende de rAF, corre siempre
          img.className = 'pdf-flip-page flip-' + dir;
          w.appendChild(img);
          const kill = function () {
            if (img.parentNode) img.parentNode.removeChild(img);
          };
          img.addEventListener('animationend', kill);
          setTimeout(kill, 950);
        } catch (e) {
          w.classList.remove('turn-next', 'turn-prev');
          void w.offsetWidth;
          w.classList.add('turn-' + dir);
        }
      } else {
        w.classList.remove('turn-next', 'turn-prev');
        void w.offsetWidth;
        w.classList.add('turn-' + dir);
      }
    }
    prevPageRef.current = page;
  }, [page]);
  useEffect(() => {
    let cancelled = false;
    setPdf(null);
    setPage(1);
    setErr(false);
    if (!window.pdfjsLib) {
      setErr(true);
      return;
    }
    pdfjsLib.getDocument(src).promise.then(d => {
      if (!cancelled) setPdf(d);
    }).catch(() => {
      if (!cancelled) setErr(true);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Spread mode. Si coverAlone, la página 1 es la tapa sola y después se emparejan
  // (2-3),(4-5)… como un libro/revista real. Si no, pares directos (1-2),(3-4)…
  const showRight = mode === 'spread' && pdf && !(coverAlone && page === 1) && page + 1 <= pdf.numPages;
  const totalPages = pdf ? pdf.numPages : 0;
  const stepNext = p => {
    let n;
    if (mode === 'spread') {
      if (coverAlone && p === 1) n = 2;else n = Math.min(totalPages, p + 2);
    } else n = Math.min(totalPages, p + 1);
    while (n <= totalPages && skip.has(n)) n++;
    if (n > totalPages) n = p;
    return n;
  };
  const stepPrev = p => {
    let n;
    if (mode === 'spread') {
      if (coverAlone && p === 2) n = 1;else n = Math.max(1, p - 2);
    } else n = Math.max(1, p - 1);
    while (n >= 2 && skip.has(n)) n--;
    if (n === 1 && skip.has(1)) {
      let x = 1;
      while (x <= totalPages && skip.has(x)) x++;
      n = x;
    }
    return n;
  };

  // Render current page(s)
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    const tasks = [];
    const renderPage = async (pageNum, canvas) => {
      if (!canvas || pageNum < 1 || pageNum > pdf.numPages) return;
      const p = await pdf.getPage(pageNum);
      if (cancelled) return;
      const v1 = p.getViewport({
        scale: 1
      });
      // En mobile bajamos la resolución para no agotar la memoria del canvas (PDFs grandes
      // como los pressbooks de 9 Reinas / Koizone hacían fallar el render en celulares).
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 980;
      const target = isMobile ? 820 : 1400;
      const scale = target / v1.width;
      const vp = p.getViewport({
        scale
      });
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const task = p.render({
        canvasContext: ctx,
        viewport: vp
      });
      tasks.push(task);
      await task.promise;
      // Liberar los recursos decodificados de la página (las imágenes de imprenta de
      // 9–17 megapíxeles) apenas se pintó, para no acumular memoria al pasar páginas.
      // Clave en iOS Safari, donde si no se agota la memoria y cierra la pestaña.
      try {
        p.cleanup();
      } catch (e) {}
    };
    (async () => {
      try {
        await renderPage(page, canvasRefs.current.left);
        if (showRight) await renderPage(page + 1, canvasRefs.current.right);
      } catch (e) {
        // Errores de render (cancelaciones, carreras al navegar rápido o al entrar a
        // modo Libro) son transitorios — NO disparan el fallback. El fallback al visor
        // nativo solo ocurre si falla la CARGA del documento (ver getDocument abajo).
      }
    })();
    return () => {
      cancelled = true;
      // Cancelar renders en curso para que no choquen con el siguiente
      tasks.forEach(t => {
        try {
          t.cancel();
        } catch (e) {}
      });
    };
  }, [pdf, page, mode, showRight]);

  // Keyboard nav
  useEffect(() => {
    if (!pdf) return;
    const fn = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPage(p => stepPrev(p));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPage(p => stepNext(p));
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [pdf, mode, skip, coverAlone]);
  if (err) {
    // pdf.js no pudo cargar/renderizar (común en mobile con PDFs grandes o si el worker
    // del CDN no carga). Fallback al visor nativo del navegador, que es mucho más liviano.
    return /*#__PURE__*/React.createElement("div", {
      className: "pdf-reader"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pdf-stage",
      style: {
        padding: 0,
        cursor: 'default'
      }
    }, /*#__PURE__*/React.createElement("iframe", {
      src: src,
      style: {
        width: '100%',
        height: '100%',
        border: 'none',
        background: '#1a1a1a'
      },
      title: "PDF"
    })), /*#__PURE__*/React.createElement("div", {
      className: "pdf-controls"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pdf-info",
      style: {
        opacity: .7
      }
    }, src.split('/').pop()), /*#__PURE__*/React.createElement("a", {
      href: src,
      target: "_blank",
      rel: "noopener",
      style: {
        background: 'transparent',
        color: 'var(--paper)',
        border: '1px solid rgba(244,242,236,.55)',
        padding: '9px 16px',
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 11,
        letterSpacing: '.2em',
        textTransform: 'uppercase',
        textDecoration: 'none'
      }
    }, "Abrir en pesta\xF1a \u2197")));
  }
  if (!pdf) {
    return /*#__PURE__*/React.createElement("div", {
      className: "pdf-reader"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pdf-stage"
    }, cover && /*#__PURE__*/React.createElement("img", {
      src: cover,
      alt: "",
      style: {
        maxHeight: 'calc(92vh - 110px)',
        maxWidth: '100%',
        objectFit: 'contain',
        opacity: .55
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "pdf-loading"
    }, "Cargando documento")));
  }
  const total = pdf.numPages;
  // Visible counts (excluding skipped pages)
  const visibleTotal = total - Array.from(skip).filter(n => n >= 1 && n <= total).length;
  // Visible index for current page
  let visibleIdx = 0;
  for (let i = 1; i <= page; i++) if (!skip.has(i)) visibleIdx++;
  const label = showRight ? `${visibleIdx}–${visibleIdx + 1}` : `${visibleIdx}`;
  const goPrev = () => setPage(p => stepPrev(p));
  const goNext = () => setPage(p => stepNext(p));
  const atStart = page === 1 || visibleIdx === 1;
  const atEnd = visibleIdx >= visibleTotal;
  return /*#__PURE__*/React.createElement("div", {
    className: `pdf-reader ${zoomed ? 'zoomed' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "pdf-stage",
    onClick: e => {
      if (zoomed) return; // when zoomed, allow scrolling instead of paging
      // Click left half → prev, right half → next
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 2) {
        if (!atStart) goPrev();
      } else {
        if (!atEnd) goNext();
      }
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: `pdf-page-wrap ${showRight ? 'is-spread' : ''}`,
    onAnimationEnd: e => {
      if (e.target === wrapRef.current) e.target.classList.remove('turn-next', 'turn-prev');
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: el => canvasRefs.current.left = el,
    className: `pdf-canvas ${altVersion ? 'alt-yellow' : ''}`,
    onClick: e => {
      e.stopPropagation();
      if (zoomed) return;
      if (showRight) {
        // spread mode — clicking left canvas = previous spread
        if (!atStart) goPrev();
      } else {
        // single page — split the canvas in half
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 2) {
          if (!atStart) goPrev();
        } else {
          if (!atEnd) goNext();
        }
      }
    }
  }), showRight && /*#__PURE__*/React.createElement("canvas", {
    ref: el => canvasRefs.current.right = el,
    className: `pdf-canvas ${altVersion ? 'alt-yellow' : ''}`,
    onClick: e => {
      e.stopPropagation();
      if (zoomed) return;
      if (!atEnd) goNext();
    }
  })), !zoomed && /*#__PURE__*/React.createElement("button", {
    className: "pdf-edge pdf-edge-l",
    onClick: e => {
      e.stopPropagation();
      goPrev();
    },
    disabled: atStart,
    "aria-label": "Anterior"
  }, "\u2039"), !zoomed && /*#__PURE__*/React.createElement("button", {
    className: "pdf-edge pdf-edge-r",
    onClick: e => {
      e.stopPropagation();
      goNext();
    },
    disabled: atEnd,
    "aria-label": "Siguiente"
  }, "\u203A")), /*#__PURE__*/React.createElement("div", {
    className: "pdf-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pdf-nav"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: atStart,
    onClick: goPrev
  }, "\u2190 Anterior"), /*#__PURE__*/React.createElement("button", {
    disabled: atEnd,
    onClick: goNext
  }, "Siguiente \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "pdf-info"
  }, label, " / ", visibleTotal), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, hasAlt && /*#__PURE__*/React.createElement("div", {
    className: "pdf-version-toggle"
  }, /*#__PURE__*/React.createElement("button", {
    className: !altVersion ? 'on' : '',
    onClick: () => onToggleVersion && onToggleVersion(false)
  }, "Normal"), /*#__PURE__*/React.createElement("button", {
    className: altVersion ? 'on' : '',
    onClick: () => onToggleVersion && onToggleVersion(true)
  }, "Alt")), /*#__PURE__*/React.createElement("button", {
    className: `pdf-zoom-btn ${zoomed ? 'on' : ''}`,
    onClick: () => setZoomed(z => !z)
  }, zoomed ? '− Zoom' : '+ Zoom'), total > 1 && /*#__PURE__*/React.createElement("div", {
    className: "pdf-mode"
  }, /*#__PURE__*/React.createElement("button", {
    className: mode === 'single' ? 'on' : '',
    onClick: () => {
      setMode('single');
    }
  }, "P\xE1gina"), /*#__PURE__*/React.createElement("button", {
    className: mode === 'spread' ? 'on' : '',
    onClick: () => {
      setMode('spread');
      setPage(coverAlone ? 2 : 1);
    }
  }, "Libro")))));
}

// Asset viewer for modal main column
function AssetView({
  asset,
  onEnded,
  altVersion,
  onToggleVersion,
  hasAlt,
  onImgClick
}) {
  const [muted, setMuted] = React.useState(true);
  const [volume, setVolume] = React.useState(1);
  const videoRef = React.useRef(null);
  React.useEffect(() => {
    setMuted(true);
  }, [asset && asset.src]);
  if (!asset) return null;
  if (asset.type === 'img') return /*#__PURE__*/React.createElement("img", {
    src: asset.src,
    alt: asset.label,
    onClick: onImgClick,
    style: onImgClick ? {
      cursor: 'zoom-in'
    } : null
  });
  if (asset.type === 'pdf') return /*#__PURE__*/React.createElement(PdfReader, {
    key: asset.src,
    src: asset.src,
    cover: asset.cover,
    altVersion: altVersion,
    onToggleVersion: onToggleVersion,
    hasAlt: hasAlt,
    skipPages: asset.skipPages,
    coverAlone: asset.coverAlone
  });
  if (asset.type === 'video') {
    return /*#__PURE__*/React.createElement("div", {
      className: "av-video"
    }, /*#__PURE__*/React.createElement("video", {
      ref: videoRef,
      key: asset.src,
      src: asset.src,
      controls: true,
      autoPlay: true,
      muted: muted,
      playsInline: true,
      preload: "metadata",
      onEnded: onEnded
    }), asset.hasSound && /*#__PURE__*/React.createElement("div", {
      className: "av-vol",
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("button", {
      className: "av-vol-btn",
      onClick: () => {
        const next = !muted;
        setMuted(next);
        if (videoRef.current) videoRef.current.muted = next;
      },
      "aria-label": muted ? 'Activar sonido' : 'Silenciar'
    }, muted || volume === 0 ? '🔇' : '🔊'), /*#__PURE__*/React.createElement("input", {
      className: "av-vol-slider",
      type: "range",
      min: "0",
      max: "1",
      step: "0.02",
      value: muted ? 0 : volume,
      onChange: e => {
        const v = parseFloat(e.target.value);
        const m = v === 0;
        setMuted(m);
        if (v > 0) setVolume(v);
        if (videoRef.current) {
          videoRef.current.volume = v > 0 ? v : volume;
          videoRef.current.muted = m;
        }
      },
      "aria-label": "Volumen"
    })));
  }
  return null;
}
function Nav({
  active,
  onJump,
  lang,
  setLang,
  view,
  setView
}) {
  const [menu, setMenu] = useState(false);
  const t = I18N[lang].nav;
  const items = [{
    id: 'hero',
    label: t.home
  }, {
    id: 'design',
    label: t.design
  }, {
    id: 'illu',
    label: t.illu
  }, {
    id: 'about',
    label: t.about
  }, {
    id: 'contact',
    label: t.contact
  }];
  return /*#__PURE__*/React.createElement("nav", {
    className: `nav ${menu ? 'menu-open' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "nav-mark",
    onClick: () => onJump('hero')
  }, /*#__PURE__*/React.createElement("img", {
    src: "img/logo-atus.png",
    alt: "Atus",
    className: "nav-logo"
  })), /*#__PURE__*/React.createElement("ul", {
    className: "nav-mid"
  }, items.map(it => /*#__PURE__*/React.createElement("li", {
    key: it.id
  }, /*#__PURE__*/React.createElement("a", {
    className: active === it.id ? 'active' : '',
    onClick: () => {
      onJump(it.id);
      setMenu(false);
    }
  }, it.label)))), /*#__PURE__*/React.createElement("div", {
    className: "nav-right"
  }, ['es', 'en', 'pt'].map(l => /*#__PURE__*/React.createElement("button", {
    key: l,
    className: `lang-btn ${lang === l ? 'on' : ''}`,
    onClick: () => setLang(l)
  }, l)), /*#__PURE__*/React.createElement("button", {
    className: "nav-burger",
    onClick: () => setMenu(m => !m)
  }, /*#__PURE__*/React.createElement("span", null))));
}
function Hero({
  lang,
  onJump,
  onEnter
}) {
  const t = I18N[lang].hero;
  return /*#__PURE__*/React.createElement("section", {
    id: "hero",
    className: "hero hero-landing"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-top"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), t.status), /*#__PURE__*/React.createElement("span", null, t.loc))), /*#__PURE__*/React.createElement("div", {
    className: "wrap hero-main"
  }, /*#__PURE__*/React.createElement("img", {
    className: "hero-logo",
    src: "img/logo-atus.png",
    alt: "Atus"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero-sub"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-name"
  }, t.name), /*#__PURE__*/React.createElement("span", null, " \u2014 dise\xF1o + ilustraci\xF3n")), /*#__PURE__*/React.createElement("p", {
    className: "hero-tagline"
  }, t.tagline), /*#__PURE__*/React.createElement("div", {
    className: "hero-mini-ctas"
  }, /*#__PURE__*/React.createElement("a", {
    className: "mini-cta",
    onClick: () => onJump('about')
  }, t.about_link, /*#__PURE__*/React.createElement("span", null, " \u2192")), /*#__PURE__*/React.createElement("a", {
    className: "mini-cta",
    onClick: () => onJump('contact')
  }, t.contact_link, /*#__PURE__*/React.createElement("span", null, " \u2192")))), /*#__PURE__*/React.createElement("div", {
    className: "hero-section-cards"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hero-card hero-card-design",
    onClick: () => onEnter('design'),
    "aria-label": t.cta1
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-card-k"
  }, "01 / ", I18N[lang].design.num.split('/')[1]?.trim() || 'Sección'), /*#__PURE__*/React.createElement("span", {
    className: "hero-card-title"
  }, t.cta1), /*#__PURE__*/React.createElement("span", {
    className: "hero-card-meta"
  }, I18N[lang].design.meta, " ", /*#__PURE__*/React.createElement("span", {
    className: "hero-card-arr"
  }, "\u2192"))), /*#__PURE__*/React.createElement("button", {
    className: "hero-card hero-card-illu",
    onClick: () => onEnter('illu'),
    "aria-label": t.cta2
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-card-k"
  }, "02 / ", I18N[lang].illu.num.split('/')[1]?.trim() || 'Sección'), /*#__PURE__*/React.createElement("span", {
    className: "hero-card-title"
  }, t.cta2), /*#__PURE__*/React.createElement("span", {
    className: "hero-card-meta"
  }, I18N[lang].illu.meta, " ", /*#__PURE__*/React.createElement("span", {
    className: "hero-card-arr"
  }, "\u2192")))));
}

// AnimatedCover — cycles through a list of videos automatically, with optional unmute toggle
function AnimatedCover({
  assets,
  projectName,
  onOpen
}) {
  const [bad, setBad] = React.useState(new Set());
  // Filter out broken videos
  const goodAssets = React.useMemo(() => assets.filter(a => !bad.has(a.src)), [assets, bad]);
  const [i, setI] = React.useState(0);
  const [muted, setMuted] = React.useState(true);
  const vRef = React.useRef(null);
  const a = goodAssets[i % Math.max(1, goodAssets.length)];
  const total = goodAssets.length;
  React.useEffect(() => {
    // Always force muted on switch unless user toggled
    if (vRef.current) {
      vRef.current.muted = muted;
      const p = vRef.current.play();
      if (p && p.catch) p.catch(() => {});
    }
  }, [i, a && a.src]);
  if (!a) return /*#__PURE__*/React.createElement("div", {
    className: "anim-cover",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#666',
      fontFamily: 'JetBrains Mono,monospace',
      fontSize: 11,
      letterSpacing: '.2em',
      textTransform: 'uppercase'
    }
  }, "Sin video disponible");
  return /*#__PURE__*/React.createElement("div", {
    className: "anim-cover",
    onClick: e => {
      if (onOpen) {
        e.stopPropagation();
        onOpen(a);
      }
    }
  }, /*#__PURE__*/React.createElement("video", {
    ref: vRef,
    key: a.src,
    src: a.src,
    muted: muted,
    autoPlay: true,
    playsInline: true,
    preload: "metadata",
    onEnded: () => setI(x => (x + 1) % Math.max(1, total)),
    onError: () => {
      setBad(s => {
        const n = new Set(s);
        n.add(a.src);
        return n;
      });
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "anim-cover-overlay"
  }, /*#__PURE__*/React.createElement("span", {
    className: "anim-cover-i"
  }, String(i % total + 1).padStart(2, '0'), " / ", String(total).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
    className: "anim-cover-t"
  }, a.label)), a.hasSound && /*#__PURE__*/React.createElement("button", {
    className: `av-mute anim-cover-mute ${muted ? 'is-muted' : 'is-on'}`,
    onClick: e => {
      e.stopPropagation();
      const next = !muted;
      setMuted(next);
      if (vRef.current) vRef.current.muted = next;
    },
    "aria-label": muted ? 'Activar sonido' : 'Silenciar'
  }, muted ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "av-mute-ico"
  }, "\uD83D\uDD07"), /*#__PURE__*/React.createElement("span", {
    className: "av-mute-l"
  }, "Activar sonido")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "av-mute-ico"
  }, "\uD83D\uDD0A"), /*#__PURE__*/React.createElement("span", {
    className: "av-mute-l"
  }, "Silenciar"))));
}

// ── Accordion modular para Tesis — render sólo la sección abierta ──
function TesisAccordion({
  sections,
  idToLabel,
  counts,
  project,
  onOpenProject
}) {
  const [openIdx, setOpenIdx] = React.useState(-1); // todas cerradas por defecto
  const isPropuesta = s => s.kind === 'propuesta';
  return /*#__PURE__*/React.createElement("div", {
    className: "pj-tesis-acc"
  }, sections.map((s, i) => {
    const lbl = idToLabel[s.id] || s.label;
    const startIdx = project.assets.findIndex(a => a.section === lbl);
    const pieces = project.assets.filter(a => a.section === lbl);
    const open = openIdx === i;
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      className: `pj-tesis-acc-item ${open ? 'open' : ''}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-tesis-acc-head",
      onClick: () => setOpenIdx(open ? -1 : i)
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-tesis-acc-num"
    }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
      className: "pj-tesis-acc-title"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-tesis-acc-h"
    }, s.label), /*#__PURE__*/React.createElement("span", {
      className: "pj-tesis-acc-s"
    }, isPropuesta(s) ? 'Propuesta de aplicación' : 'Iteración del sistema', " \xB7 ", s.sub)), /*#__PURE__*/React.createElement("span", {
      className: "pj-tesis-acc-n"
    }, pieces.length, " piezas"), /*#__PURE__*/React.createElement("span", {
      className: "pj-tesis-acc-arr"
    }, "+")), open && /*#__PURE__*/React.createElement("div", {
      className: "pj-tesis-acc-body"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-tesis-acc-pieces"
    }, pieces.slice(0, 8).map((a, idx) => {
      const origIdx = project.assets.indexOf(a);
      return /*#__PURE__*/React.createElement("div", {
        key: idx,
        className: "pj-tesis-piece",
        onClick: e => {
          e.stopPropagation();
          onOpenProject(project, origIdx);
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "pj-tesis-piece-img"
      }, a.type === 'pdf' ? /*#__PURE__*/React.createElement(PdfThumb, {
        src: a.src,
        fallback: a.cover || s.cover,
        alt: a.label
      }) : /*#__PURE__*/React.createElement("img", {
        src: a.src,
        alt: a.label,
        loading: "lazy"
      })), /*#__PURE__*/React.createElement("div", {
        className: "pj-tesis-piece-cap"
      }, /*#__PURE__*/React.createElement("span", null, String(idx + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", null, a.label.replace(/^[^—]*—\s*/, ''))));
    })), /*#__PURE__*/React.createElement("div", {
      className: "pj-tesis-acc-foot"
    }, /*#__PURE__*/React.createElement("span", null, pieces.length, " piezas en ", s.label), /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        onOpenProject(project, Math.max(0, startIdx));
      }
    }, "Abrir en lector \u2192"))));
  }));
}

// ── Destacado de Tesis: card que, en hover (desktop) / touch (mobile), se blurea
//    y muestra una card de info; al abrir, se transforma IN-PLACE en un panel con
//    la info de la tesis + el acordeón de subsecciones (sin scroll ni modal). ──
function TesisFeatured({
  f,
  lang,
  onOpenProject
}) {
  const [open, setOpen] = React.useState(false);
  const [peek, setPeek] = React.useState(false);
  const isTouch = React.useMemo(() => !!(window.matchMedia && window.matchMedia('(hover: none)').matches), []);
  const fcover = f.cover && !f.cover.startsWith('PDF:') && !f.cover.endsWith('.mp4') ? f.cover : f.assets && f.assets[0] && f.assets[0].cover || '';
  const desc = f.desc && f.desc[lang] || '';
  const sections = f.tesisSections || [];
  const counts = {};
  (f.assets || []).forEach(a => {
    const k = a.section || '';
    counts[k] = (counts[k] || 0) + 1;
  });
  const idToLabel = {
    'sis-a': 'Sistema A',
    'sis-b': 'Sistema B',
    'sis-c': 'Sistema C',
    'interior': 'Propuesta Interior',
    'exterior': 'Propuesta Exterior'
  };
  const all = [...sections.filter(s => s.kind === 'system'), ...sections.filter(s => s.kind === 'propuesta')];
  const openPanel = e => {
    if (e) e.stopPropagation();
    setPeek(false);
    setOpen(true);
  };
  if (open) {
    return /*#__PURE__*/React.createElement("section", {
      className: "tesis-panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "tesis-panel-bar"
    }, /*#__PURE__*/React.createElement("span", {
      className: "tesis-panel-eye"
    }, "\u2605 Proyecto destacado \xB7 ", f.year), /*#__PURE__*/React.createElement("button", {
      className: "tesis-panel-close",
      onClick: () => setOpen(false),
      "aria-label": "Cerrar panel"
    }, "Cerrar \u2715")), /*#__PURE__*/React.createElement("div", {
      className: "tesis-panel-top"
    }, /*#__PURE__*/React.createElement("div", {
      className: "tesis-panel-media"
    }, fcover ? /*#__PURE__*/React.createElement("img", {
      src: fcover,
      alt: f.name,
      loading: "lazy"
    }) : /*#__PURE__*/React.createElement("div", {
      className: "dg-featured-ph"
    })), /*#__PURE__*/React.createElement("div", {
      className: "tesis-panel-info"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "tesis-panel-name"
    }, f.name), /*#__PURE__*/React.createElement("p", {
      className: "tesis-panel-desc"
    }, desc), /*#__PURE__*/React.createElement("div", {
      className: "tesis-panel-meta"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "lab"
    }, "Categor\xEDa"), /*#__PURE__*/React.createElement("span", {
      className: "val"
    }, f.cat)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "lab"
    }, "A\xF1o"), /*#__PURE__*/React.createElement("span", {
      className: "val"
    }, f.year)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "lab"
    }, "Rol"), /*#__PURE__*/React.createElement("span", {
      className: "val"
    }, f.role))))), /*#__PURE__*/React.createElement("div", {
      className: "tesis-panel-subhead"
    }, /*#__PURE__*/React.createElement("span", null, "\u21B3 Subsecciones"), /*#__PURE__*/React.createElement("span", {
      className: "tesis-panel-subhead-n"
    }, all.length, " bloques \xB7 despleg\xE1 para ver las piezas")), /*#__PURE__*/React.createElement(TesisAccordion, {
      sections: all,
      idToLabel: idToLabel,
      counts: counts,
      project: f,
      onOpenProject: onOpenProject
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: `dg-featured tesis-featured ${peek ? 'peek' : ''}`,
    role: "button",
    tabIndex: 0,
    onMouseEnter: isTouch ? undefined : () => setPeek(true),
    onMouseLeave: isTouch ? undefined : () => setPeek(false),
    onClick: () => openPanel(),
    onKeyDown: e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPanel();
      }
    },
    "aria-label": `Ver ${f.name}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-featured-media"
  }, fcover ? /*#__PURE__*/React.createElement("img", {
    src: fcover,
    alt: f.name
  }) : /*#__PURE__*/React.createElement("div", {
    className: "dg-featured-ph"
  }), /*#__PURE__*/React.createElement("span", {
    className: "dg-featured-badge"
  }, "\u2605 Destacado"), /*#__PURE__*/React.createElement("div", {
    className: "tesis-peek",
    "aria-hidden": !peek
  }, /*#__PURE__*/React.createElement("div", {
    className: "tesis-peek-inner"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tesis-peek-eye"
  }, "Tesis de grado \xB7 ", f.year), /*#__PURE__*/React.createElement("p", {
    className: "tesis-peek-desc"
  }, desc), /*#__PURE__*/React.createElement("button", {
    className: "tesis-peek-btn",
    onClick: openPanel
  }, "Explorar subsecciones ", /*#__PURE__*/React.createElement("span", {
    className: "arr"
  }, "\u2192"))))), /*#__PURE__*/React.createElement("div", {
    className: "dg-featured-info"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dg-featured-eye"
  }, "Proyecto destacado \xB7 ", f.year), /*#__PURE__*/React.createElement("h3", {
    className: "dg-featured-name"
  }, f.name), /*#__PURE__*/React.createElement("p", {
    className: "dg-featured-cat"
  }, f.cat), /*#__PURE__*/React.createElement("span", {
    className: "dg-featured-cta"
  }, "Ver subsecciones ", /*#__PURE__*/React.createElement("span", {
    className: "arr"
  }, "\u2192")), /*#__PURE__*/React.createElement("div", {
    className: "tesis-hover-logo",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("img", {
    src: "design/tesis/museo-logo-white.png",
    alt: "",
    loading: "lazy"
  }))));
}
function GorillazSimple({
  p,
  num,
  totalStr,
  lang,
  onOpen,
  onOpenAt
}) {
  const [v, setV] = React.useState(0); // 0 = Original, 1 = Alternativa
  const tapas = ['design/gorillaz-tapa-original.png', 'design/gorillaz-tapa-alt.png'];
  const interiores = ['design/gorillaz-interior-original.png', 'design/gorillaz-interior-alt.png'];
  return /*#__PURE__*/React.createElement("article", {
    className: "pj-gorillaz-simple"
  }, /*#__PURE__*/React.createElement("header", {
    className: "pj-gorillaz-simple-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pj-gorillaz-simple-meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pj-num"
  }, num, " / ", totalStr, " \u2014 ", p.year), /*#__PURE__*/React.createElement("span", {
    className: "pj-gorillaz-simple-tag"
  }, "Editorial \xB7 Folleto")), /*#__PURE__*/React.createElement("h3", {
    className: "pj-gorillaz-simple-name"
  }, p.name), /*#__PURE__*/React.createElement("p", {
    className: "pj-gorillaz-simple-desc"
  }, p.desc[lang]), /*#__PURE__*/React.createElement("div", {
    className: "pj-gorillaz-simple-toggle pj-gorillaz-simple-toggle-h"
  }, ['Original', 'Alternativa'].map((label, i) => /*#__PURE__*/React.createElement("button", {
    key: label,
    type: "button",
    className: i === v ? 'on' : '',
    onClick: e => {
      e.stopPropagation();
      setV(i);
    }
  }, /*#__PURE__*/React.createElement("span", null, label))), /*#__PURE__*/React.createElement("span", {
    className: "pj-gorillaz-simple-toggle-h-tag"
  }, "Versi\xF3n activa: ", /*#__PURE__*/React.createElement("b", null, String(v + 1).padStart(2, '0'), " / 02")))), /*#__PURE__*/React.createElement("div", {
    className: "pj-gorillaz-pair"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pj-gorillaz-pair-item",
    onClick: () => onOpenAt(v === 0 ? 'Tapa + contratapa — Original' : 'Tapa + contratapa — Alternativa')
  }, /*#__PURE__*/React.createElement("div", {
    className: "pj-gorillaz-pair-eyebrow"
  }, /*#__PURE__*/React.createElement("span", null, "01 \xB7 Tapa + contratapa"), /*#__PURE__*/React.createElement("span", {
    className: "open"
  }, "Abrir \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "pj-gorillaz-pair-img"
  }, /*#__PURE__*/React.createElement("img", {
    src: tapas[v],
    alt: "Tapa Gorillaz",
    loading: "lazy"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "pj-gorillaz-pair-item",
    onClick: () => onOpenAt(v === 0 ? 'Interior — Original' : 'Interior — Alternativa')
  }, /*#__PURE__*/React.createElement("div", {
    className: "pj-gorillaz-pair-eyebrow"
  }, /*#__PURE__*/React.createElement("span", null, "02 \xB7 Interior"), /*#__PURE__*/React.createElement("span", {
    className: "open"
  }, "Abrir \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "pj-gorillaz-pair-img"
  }, /*#__PURE__*/React.createElement("img", {
    src: interiores[v],
    alt: "Interior Gorillaz",
    loading: "lazy"
  })))));
}

// Sección Pósters interactiva: click en una mini → se promueve al destacado
// (swap con fade). Botón "Ver todos" → grilla con todos. Estado propio.
function PostersCard({
  p,
  num,
  totalStr,
  lang,
  t,
  onOpenProject
}) {
  const imgAssets = p.assets.filter(a => a.type === 'img');
  const [featIdx, setFeatIdx] = useState(0);
  const hero = imgAssets[featIdx];
  const heroOrigIdx = p.assets.indexOf(hero);
  const head = /*#__PURE__*/React.createElement("div", {
    className: "pj-posters-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "pj-posters-num"
  }, num, " / ", totalStr), /*#__PURE__*/React.createElement("span", {
    className: "pj-posters-tag"
  }, "Posters \xB7 ", p.year), /*#__PURE__*/React.createElement("span", {
    className: "pj-posters-count"
  }, imgAssets.length, " piezas")), /*#__PURE__*/React.createElement("h3", {
    className: "pj-posters-name"
  }, p.name), /*#__PURE__*/React.createElement("p", {
    className: "pj-posters-desc"
  }, p.desc[lang]));
  return /*#__PURE__*/React.createElement("article", {
    key: p.id,
    className: "pj-posters"
  }, head, /*#__PURE__*/React.createElement("div", {
    className: "pj-posters-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pj-posters-hero",
    onClick: () => onOpenProject(p, heroOrigIdx),
    title: "Abrir en grande"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pj-posters-hero-img"
  }, /*#__PURE__*/React.createElement("img", {
    key: featIdx,
    src: hero.src,
    alt: hero.label,
    loading: "lazy",
    className: "poster-fade"
  })), /*#__PURE__*/React.createElement("div", {
    className: "pj-posters-hero-cap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pj-posters-hero-i"
  }, String(featIdx + 1).padStart(2, '0'), " \u2014 Pieza destacada"), /*#__PURE__*/React.createElement("span", {
    className: "pj-posters-hero-l"
  }, hero.label))), /*#__PURE__*/React.createElement("div", {
    className: "pj-posters-side"
  }, imgAssets.map((a, i) => i === featIdx ? null : /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "pj-poster-mini",
    onClick: () => setFeatIdx(i),
    title: "Hacer destacado"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pj-poster-mini-img"
  }, /*#__PURE__*/React.createElement("img", {
    src: a.src,
    alt: a.label,
    loading: "lazy"
  })), /*#__PURE__*/React.createElement("span", {
    className: "pj-poster-mini-l"
  }, String(i + 1).padStart(2, '0'), " \xB7 ", a.label))))));
}

// Slideshow de un cuarto 3D: las imágenes van cambiando solas con fade (auto-avance),
// como el cover de Animación. Un carrusel por proyecto (low-poly / high-poly).
function RoomSlideshow({
  imgs,
  name
}) {
  const list = imgs || [];
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (list.length < 2) return;
    const id = setInterval(() => setIdx(i => (i + 1) % list.length), 2800);
    return () => clearInterval(id);
  }, [list.length]);
  if (!list.length) return /*#__PURE__*/React.createElement("div", {
    className: "pj-3d-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dg-featured-ph"
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "pj-3d-slideshow",
    "aria-label": name
  }, list.map((a, i) => /*#__PURE__*/React.createElement("img", {
    key: i,
    src: a.src,
    alt: "",
    loading: "lazy",
    className: `pj-3d-slide ${i === idx ? 'on' : ''}`
  })), /*#__PURE__*/React.createElement("div", {
    className: "pj-3d-slide-dots",
    "aria-hidden": "true"
  }, list.map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: i === idx ? 'on' : ''
  }))));
}
function DesignSection({
  lang,
  onOpenProject,
  onSwitchView
}) {
  const t = I18N[lang].design;
  const ti = I18N[lang].illu;
  const [filter, setFilter] = useState('all');
  const cats = useMemo(() => [{
    id: 'all',
    label: t.all,
    n: DESIGN.length
  }, {
    id: 'editorial',
    label: t.editorial,
    n: DESIGN.filter(p => p.tag === 'editorial').length
  }, {
    id: 'branding',
    label: t.branding,
    n: DESIGN.filter(p => p.tag === 'branding').length
  }, {
    id: 'posters',
    label: t.posters,
    n: DESIGN.filter(p => p.tag === 'posters').length
  }, {
    id: '3d',
    label: t['3d'],
    n: DESIGN.filter(p => p.tag === '3d').length
  }, {
    id: 'animacion',
    label: t.animacion,
    n: DESIGN.filter(p => p.tag === 'animacion').length
  }], [t]);
  const filtered = filter === 'all' ? DESIGN : DESIGN.filter(p => p.tag === filter);

  // ── TESIS — Museo del Agua (modular, acordeón editorial) ──
  const renderTesisCard = (p, num, totalStr) => {
    const sections = p.tesisSections || [];
    const counts = {};
    (p.assets || []).forEach(a => {
      const k = a.section || '';
      counts[k] = (counts[k] || 0) + 1;
    });
    const idToLabel = {
      'sis-a': 'Sistema A',
      'sis-b': 'Sistema B',
      'sis-c': 'Sistema C',
      'interior': 'Propuesta Interior',
      'exterior': 'Propuesta Exterior'
    };
    const systems = sections.filter(s => s.kind === 'system');
    const propuestas = sections.filter(s => s.kind === 'propuesta');
    const all = [...systems, ...propuestas];
    return /*#__PURE__*/React.createElement("article", {
      key: p.id,
      className: "pj-tesis"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-tesis-section pj-tesis-index-wrap"
    }, /*#__PURE__*/React.createElement("header", {
      className: "pj-tesis-index-head"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "pj-tesis-index-h1"
    }, "\xCDndice del proyecto"), /*#__PURE__*/React.createElement("span", {
      className: "pj-tesis-index-r"
    }, /*#__PURE__*/React.createElement("b", null, "5 bloques"), " \xB7 3 sistemas + 2 propuestas")), /*#__PURE__*/React.createElement(TesisAccordion, {
      sections: all,
      idToLabel: idToLabel,
      counts: counts,
      project: p,
      onOpenProject: onOpenProject
    })));
  };

  // ── Special card: Posters — hero + grid; each tile opens its own asset ──
  const renderPostersCard = (p, num, totalStr) => {
    const imgAssets = p.assets.filter(a => a.type === 'img');
    // Hero is the first asset (we put Made in China — Carátula first in the data)
    const hero = imgAssets[0];
    const heroOrigIdx = p.assets.indexOf(hero);
    const rest = imgAssets.slice(1);
    return /*#__PURE__*/React.createElement("article", {
      key: p.id,
      className: "pj-posters"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-posters-head"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "pj-posters-num"
    }, num, " / ", totalStr), /*#__PURE__*/React.createElement("span", {
      className: "pj-posters-tag"
    }, "Posters \xB7 ", p.year), /*#__PURE__*/React.createElement("span", {
      className: "pj-posters-count"
    }, imgAssets.length, " piezas")), /*#__PURE__*/React.createElement("h3", {
      className: "pj-posters-name"
    }, p.name), /*#__PURE__*/React.createElement("p", {
      className: "pj-posters-desc"
    }, p.desc[lang])), /*#__PURE__*/React.createElement("div", {
      className: "pj-posters-stage"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-posters-hero",
      onClick: e => {
        e.stopPropagation();
        onOpenProject(p, heroOrigIdx);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-posters-hero-img"
    }, /*#__PURE__*/React.createElement("img", {
      src: hero.src,
      alt: hero.label,
      loading: "lazy"
    })), /*#__PURE__*/React.createElement("div", {
      className: "pj-posters-hero-cap"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-posters-hero-i"
    }, "01 \u2014 Pieza destacada"), /*#__PURE__*/React.createElement("span", {
      className: "pj-posters-hero-l"
    }, hero.label))), /*#__PURE__*/React.createElement("div", {
      className: "pj-posters-side"
    }, rest.map((a, i) => {
      const origIdx = p.assets.indexOf(a);
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        className: "pj-poster-mini",
        onClick: e => {
          e.stopPropagation();
          onOpenProject(p, origIdx);
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "pj-poster-mini-img"
      }, /*#__PURE__*/React.createElement("img", {
        src: a.src,
        alt: a.label,
        loading: "lazy"
      })), /*#__PURE__*/React.createElement("span", {
        className: "pj-poster-mini-l"
      }, String(i + 2).padStart(2, '0'), " \xB7 ", a.label));
    }))), /*#__PURE__*/React.createElement("div", {
      className: "pj-posters-foot"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-link",
      onClick: () => onOpenProject(p, 0)
    }, t.viewProject, " \u2192"), /*#__PURE__*/React.createElement("span", {
      className: "pj-posters-meta-r"
    }, p.role)));
  };

  // ── Special card: Spider-Man Libro — single mockup, open directly to reader ──
  const renderSpiderCard = (p, num, totalStr) => {
    const pdf = p.assets.find(a => a.type === 'pdf');
    const pdfIdx = pdf ? p.assets.indexOf(pdf) : 0;
    return /*#__PURE__*/React.createElement("article", {
      key: p.id,
      className: "pj-spider-simple"
    }, /*#__PURE__*/React.createElement("header", {
      className: "pj-spider-simple-head"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-spider-simple-meta"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-num"
    }, num, " / ", totalStr, " \u2014 ", p.year), /*#__PURE__*/React.createElement("span", {
      className: "pj-spider-simple-tag"
    }, "Editorial \xB7 Libro")), /*#__PURE__*/React.createElement("h3", {
      className: "pj-spider-simple-name"
    }, p.name), /*#__PURE__*/React.createElement("p", {
      className: "pj-spider-simple-desc"
    }, p.desc[lang])), /*#__PURE__*/React.createElement("div", {
      className: "pj-spider-simple-cover",
      onClick: e => {
        e.stopPropagation();
        onOpenProject(p, pdfIdx);
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: p.cover,
      alt: p.name,
      loading: "lazy"
    }), /*#__PURE__*/React.createElement("div", {
      className: "pj-spider-simple-cta"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-spider-simple-cta-eyebrow"
    }, "\u21B3 Toc\xE1 la portada"), /*#__PURE__*/React.createElement("span", {
      className: "pj-spider-simple-cta-l"
    }, "Abrir lector editorial"), /*#__PURE__*/React.createElement("span", {
      className: "pj-spider-simple-cta-arr"
    }, "\u2192"))));
  };

  // ── Special card: Gorillaz — Original / Alternativa toggle (4 assets reales) ──
  const renderGorillazCard = (p, num, totalStr) => {
    const openAt = label => {
      const idx = p.assets.findIndex(a => a.label === label);
      onOpenProject(p, Math.max(0, idx));
    };
    return /*#__PURE__*/React.createElement(GorillazSimple, {
      key: p.id,
      p: p,
      num: num,
      totalStr: totalStr,
      lang: lang,
      onOpen: () => onOpenProject(p, 0),
      onOpenAt: openAt
    });
  };

  // ── Special card: Koizone — flipbook button + mockup grid ──
  const renderKoizoneCard = (p, num, totalStr) => {
    const pdf = p.assets.find(a => a.type === 'pdf');
    const pdfIdx = pdf ? p.assets.indexOf(pdf) : 0;
    // Group remaining assets by section
    const mockups = p.assets.filter(a => a.section === 'Mockups');
    const sistema = p.assets.filter(a => a.section === 'Sistema editorial');
    return /*#__PURE__*/React.createElement("article", {
      key: p.id,
      className: "pj-koizone"
    }, /*#__PURE__*/React.createElement("header", {
      className: "pj-koizone-head"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-koizone-head-l"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-koizone-meta"
    }, num, " / ", totalStr, " \xB7 ", /*#__PURE__*/React.createElement("b", null, "Editorial \xB7 Revista"), " \xB7 ", p.year), /*#__PURE__*/React.createElement("h3", {
      className: "pj-koizone-name"
    }, p.name), /*#__PURE__*/React.createElement("p", {
      className: "pj-koizone-desc"
    }, p.desc[lang]))), /*#__PURE__*/React.createElement("div", {
      className: "pj-koizone-stage"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "pj-koizone-flip",
      onClick: e => {
        e.stopPropagation();
        onOpenProject(p, pdfIdx);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-koizone-flip-cover"
    }, pdf && /*#__PURE__*/React.createElement(PdfThumb, {
      src: pdf.src,
      fallback: "design/koizone-cover.jpg",
      alt: "Koizone"
    })), /*#__PURE__*/React.createElement("div", {
      className: "pj-koizone-flip-cta"
    }, /*#__PURE__*/React.createElement("span", {
      className: "eye"
    }, "01 / Revista"), /*#__PURE__*/React.createElement("span", {
      className: "l"
    }, "Abrir revista (flipbook)"), /*#__PURE__*/React.createElement("span", {
      className: "arr"
    }, "\u2192"))), /*#__PURE__*/React.createElement("aside", {
      className: "pj-koizone-side"
    }, /*#__PURE__*/React.createElement("header", {
      className: "pj-koizone-side-h"
    }, /*#__PURE__*/React.createElement("span", {
      className: "n"
    }, "02"), /*#__PURE__*/React.createElement("h4", null, "Mockups + serie")), /*#__PURE__*/React.createElement("div", {
      className: "pj-koizone-grid"
    }, mockups.map(a => {
      const idx = p.assets.indexOf(a);
      return /*#__PURE__*/React.createElement("button", {
        key: a.src,
        type: "button",
        className: "pj-koizone-tile",
        onClick: e => {
          e.stopPropagation();
          onOpenProject(p, idx);
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "pj-koizone-tile-img"
      }, /*#__PURE__*/React.createElement("img", {
        src: a.src,
        alt: a.label,
        loading: "lazy"
      })), /*#__PURE__*/React.createElement("span", {
        className: "pj-koizone-tile-l"
      }, a.label));
    })), /*#__PURE__*/React.createElement("header", {
      className: "pj-koizone-side-h"
    }, /*#__PURE__*/React.createElement("span", {
      className: "n"
    }, "03"), /*#__PURE__*/React.createElement("h4", null, "Sistema editorial")), /*#__PURE__*/React.createElement("div", {
      className: "pj-koizone-grid"
    }, sistema.map(a => {
      const idx = p.assets.indexOf(a);
      return /*#__PURE__*/React.createElement("button", {
        key: a.src,
        type: "button",
        className: "pj-koizone-tile",
        onClick: e => {
          e.stopPropagation();
          onOpenProject(p, idx);
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "pj-koizone-tile-img"
      }, /*#__PURE__*/React.createElement("img", {
        src: a.src,
        alt: a.label,
        loading: "lazy"
      })), /*#__PURE__*/React.createElement("span", {
        className: "pj-koizone-tile-l"
      }, a.label));
    })))));
  };

  // ── Special card: Nueve Reinas — afiche grande + vertical list con covers (Tesis-style) ──
  const render9RCard = (p, num, totalStr) => {
    const sectionMap = [{
      name: 'Concepto',
      cover: 'design/9r-concepto-portada.jpg',
      sub: 'Documento de concepto del sistema'
    }, {
      name: 'Pressbook',
      cover: 'design/9r-pressbook-portada.png',
      sub: '3 ediciones editoriales · 36 págs c/u'
    }, {
      name: 'Cartas',
      cover: 'design/9r-cartas-portada.png',
      sub: 'Baraja completa · dorso · mockups'
    }, {
      name: 'Caja de truco',
      cover: 'design/9r-caja-portada.png',
      sub: 'Packaging troquelado · escena'
    }, {
      name: 'Entradas / DNI',
      cover: 'design/9r-dni-exterior.png',
      sub: 'Pieza inmersiva · ticket de cine + souvenir doble cara'
    }];
    const counts = {};
    p.assets.forEach(a => {
      const k = a.section || '';
      counts[k] = (counts[k] || 0) + 1;
    });
    const sectionFirstIdx = sec => p.assets.findIndex(a => a.section === sec);
    const afichePdf = (p.heroAfiche || '').startsWith('PDF:') ? p.heroAfiche.slice(4) : null;
    // Pressbook sub-items (3 PDFs)
    const pressbooks = p.assets.filter(a => a.section === 'Pressbook');
    return /*#__PURE__*/React.createElement("article", {
      key: p.id,
      className: "pj-9r"
    }, /*#__PURE__*/React.createElement("header", {
      className: "pj-9r-head"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-9r-head-l"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-9r-meta"
    }, num, " / ", totalStr, " \xB7 ", /*#__PURE__*/React.createElement("b", null, "Editorial \xB7 Pressbooks + packaging"), " \xB7 ", p.year), /*#__PURE__*/React.createElement("h3", {
      className: "pj-9r-name"
    }, p.name), /*#__PURE__*/React.createElement("p", {
      className: "pj-9r-desc"
    }, p.desc[lang]))), /*#__PURE__*/React.createElement("div", {
      className: "pj-9r-stage"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-9r-afiche",
      onClick: e => {
        e.stopPropagation();
        onOpenProject(p, Math.max(0, sectionFirstIdx('Afiches')));
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-9r-afiche-tag"
    }, "Afiche principal"), afichePdf ? /*#__PURE__*/React.createElement(PdfThumb, {
      src: afichePdf,
      fallback: "design/9r-afiche-cover.jpg",
      alt: "Afiche"
    }) : /*#__PURE__*/React.createElement("img", {
      src: "design/9r-afiche-cover.jpg",
      alt: "Afiche"
    })), /*#__PURE__*/React.createElement("div", {
      className: "pj-9r-list"
    }, (() => {
      const conceptoIdx = sectionFirstIdx('Concepto');
      if (conceptoIdx < 0) return null;
      const concepto = sectionMap[0];
      return /*#__PURE__*/React.createElement("div", {
        className: "pj-9r-list-group"
      }, /*#__PURE__*/React.createElement("header", {
        className: "pj-9r-list-group-h"
      }, /*#__PURE__*/React.createElement("span", {
        className: "pj-9r-list-group-num"
      }, "A"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, "Concepto"), " \xB7 documento del sistema")), /*#__PURE__*/React.createElement("button", {
        type: "button",
        className: "pj-9r-row",
        onClick: e => {
          e.stopPropagation();
          onOpenProject(p, conceptoIdx);
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "pj-9r-row-img"
      }, /*#__PURE__*/React.createElement("img", {
        src: concepto.cover,
        alt: concepto.name,
        loading: "lazy"
      })), /*#__PURE__*/React.createElement("div", {
        className: "pj-9r-row-body"
      }, /*#__PURE__*/React.createElement("span", {
        className: "pj-9r-row-num"
      }, "A \xB7 01"), /*#__PURE__*/React.createElement("h4", {
        className: "pj-9r-row-h"
      }, concepto.name), /*#__PURE__*/React.createElement("span", {
        className: "pj-9r-row-sub"
      }, concepto.sub)), /*#__PURE__*/React.createElement("span", {
        className: "pj-9r-row-arr"
      }, "\u2192")));
    })(), pressbooks.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "pj-9r-list-group"
    }, /*#__PURE__*/React.createElement("header", {
      className: "pj-9r-list-group-h"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-9r-list-group-num"
    }, "B"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, "Pressbook"), " \xB7 ", pressbooks.length, " ediciones")), pressbooks.map((pb, i) => {
      const idx = p.assets.indexOf(pb);
      return /*#__PURE__*/React.createElement("button", {
        key: pb.src,
        type: "button",
        className: "pj-9r-row",
        onClick: e => {
          e.stopPropagation();
          onOpenProject(p, idx);
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "pj-9r-row-img"
      }, /*#__PURE__*/React.createElement("img", {
        src: pb.cover || 'design/9r-pressbook-portada.png',
        alt: pb.label,
        loading: "lazy"
      })), /*#__PURE__*/React.createElement("div", {
        className: "pj-9r-row-body"
      }, /*#__PURE__*/React.createElement("span", {
        className: "pj-9r-row-num"
      }, "B \xB7 ", String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("h4", {
        className: "pj-9r-row-h"
      }, "Pressbook ", String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
        className: "pj-9r-row-sub"
      }, "Mini-revista editorial")), /*#__PURE__*/React.createElement("span", {
        className: "pj-9r-row-arr"
      }, "\u2192"));
    })), /*#__PURE__*/React.createElement("div", {
      className: "pj-9r-list-group"
    }, /*#__PURE__*/React.createElement("header", {
      className: "pj-9r-list-group-h"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-9r-list-group-num"
    }, "C"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, "Sistema material"), " \xB7 packaging + cartas + entradas")), sectionMap.slice(2).map((sm, i) => {
      const startIdx = sectionFirstIdx(sm.name);
      if (startIdx < 0) return null;
      return /*#__PURE__*/React.createElement("button", {
        key: sm.name,
        type: "button",
        className: "pj-9r-row",
        onClick: e => {
          e.stopPropagation();
          onOpenProject(p, startIdx);
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "pj-9r-row-img"
      }, /*#__PURE__*/React.createElement("img", {
        src: sm.cover,
        alt: sm.name,
        loading: "lazy"
      })), /*#__PURE__*/React.createElement("div", {
        className: "pj-9r-row-body"
      }, /*#__PURE__*/React.createElement("span", {
        className: "pj-9r-row-num"
      }, "C \xB7 ", String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("h4", {
        className: "pj-9r-row-h"
      }, sm.name), /*#__PURE__*/React.createElement("span", {
        className: "pj-9r-row-sub"
      }, sm.sub)), /*#__PURE__*/React.createElement("span", {
        className: "pj-9r-row-arr"
      }, "\u2192"));
    })))));
  };

  // ── Special card: 3D feature (Auto Retrofuturista — own hero card) ──
  const render3DCard = (p, num, totalStr) => {
    const heroImg = p.assets.find(a => a.type === 'img');
    const videos = p.assets.filter(a => a.type === 'video');
    return /*#__PURE__*/React.createElement("article", {
      key: p.id,
      className: "pj-3d",
      onClick: () => onOpenProject(p)
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-3d-head"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-num"
    }, num, " / ", totalStr, " \u2014 ", p.year), /*#__PURE__*/React.createElement("h3", {
      className: "pj-3d-section-h"
    }, "3D \xB7 Auto Retrofuturista"), /*#__PURE__*/React.createElement("span", {
      className: "pj-posters-tag"
    }, "Pieza destacada")), /*#__PURE__*/React.createElement("div", {
      className: "pj-3d-hero"
    }, heroImg && /*#__PURE__*/React.createElement("img", {
      src: heroImg.src,
      alt: heroImg.label,
      loading: "lazy"
    }), /*#__PURE__*/React.createElement("div", {
      className: "pj-3d-hero-label"
    }, /*#__PURE__*/React.createElement("span", {
      className: "se-eyebrow",
      style: {
        color: 'rgba(244,242,236,.7)'
      }
    }, "Pieza principal \xB7 3D / Modelado"), /*#__PURE__*/React.createElement("h3", {
      className: "pj-3d-main-h"
    }, p.name), /*#__PURE__*/React.createElement("span", {
      className: "pj-3d-main-meta"
    }, p.role)), videos.length > 0 && /*#__PURE__*/React.createElement("span", {
      className: "pj-3d-anim-pill"
    }, "\u25B6 ", videos.length, " animaciones")), /*#__PURE__*/React.createElement("div", {
      className: "pj-3d-foot"
    }, /*#__PURE__*/React.createElement("p", {
      className: "pj-3d-desc"
    }, p.desc[lang]), /*#__PURE__*/React.createElement("div", {
      className: "pj-3d-meta"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, "Blender")), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, p.assets.length), " piezas"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, p.year), /*#__PURE__*/React.createElement("span", {
      className: "pj-link",
      style: {
        marginLeft: 'auto'
      }
    }, t.viewProject, " \u2192"))));
  };

  // Cuartos 3D de Spider-Man: las fotos van cambiando solas (slideshow con fade),
  // como el cover de Animación. 1 carrusel por proyecto (low-poly / high-poly).
  const render3DRoomCard = (p, num, totalStr) => {
    const imgs = p.assets.filter(a => a.type === 'img');
    const poly = /hp|high/i.test(p.id + p.cat) ? 'High-poly' : 'Low-poly';
    return /*#__PURE__*/React.createElement("article", {
      key: p.id,
      className: "pj-3d pj-3d-room",
      onClick: () => onOpenProject(p)
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-3d-head"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-num"
    }, num, " / ", totalStr, " \u2014 ", p.year), /*#__PURE__*/React.createElement("h3", {
      className: "pj-3d-section-h"
    }, p.name), /*#__PURE__*/React.createElement("span", {
      className: "pj-posters-tag"
    }, poly, " \xB7 3D")), /*#__PURE__*/React.createElement(RoomSlideshow, {
      imgs: imgs,
      name: p.name
    }), /*#__PURE__*/React.createElement("div", {
      className: "pj-3d-foot"
    }, /*#__PURE__*/React.createElement("p", {
      className: "pj-3d-desc"
    }, p.desc[lang]), /*#__PURE__*/React.createElement("div", {
      className: "pj-3d-meta"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, "Blender")), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, imgs.length), " renders"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, p.year), /*#__PURE__*/React.createElement("span", {
      className: "pj-link",
      style: {
        marginLeft: 'auto'
      }
    }, t.viewProject, " \u2192"))));
  };
  return /*#__PURE__*/React.createElement("section", {
    id: "design",
    className: "sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-num"
  }, t.num), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, t.title, "."), /*#__PURE__*/React.createElement("p", {
    className: "sec-meta"
  }, t.meta))), filter === 'all' && (() => {
    const tp = DESIGN[0];
    return /*#__PURE__*/React.createElement("header", {
      className: "pj-tesis-section pj-tesis-slug",
      style: {
        marginBottom: '18px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-tesis-slug-l"
    }, /*#__PURE__*/React.createElement("span", {
      className: "pj-tesis-pill"
    }, "Tesis \xB7 01/", String(DESIGN.length).padStart(2, '0')), /*#__PURE__*/React.createElement("span", null, tp.cat)), /*#__PURE__*/React.createElement("div", {
      className: "pj-tesis-slug-c"
    }, "Concepto y propuesta de redise\xF1o de identidad y comunicaci\xF3n para el ", /*#__PURE__*/React.createElement("b", null, "Palacio del Agua"), " (Palacio Hist\xF3rico Sanitario de AySA, Riobamba 750, CABA) como Museo del Agua."), /*#__PURE__*/React.createElement("div", {
      className: "pj-tesis-slug-r"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, tp.assets.length), " piezas"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, "5"), " bloques"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, tp.year))));
  })(), filter === 'all' && /*#__PURE__*/React.createElement(TesisFeatured, {
    f: DESIGN[0],
    lang: lang,
    onOpenProject: onOpenProject
  }), /*#__PURE__*/React.createElement("div", {
    className: "illu-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, cats.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    className: `chip ${filter === c.id ? 'on' : ''}`,
    onClick: () => setFilter(c.id)
  }, c.label, " ", /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "(", c.n, ")")))), /*#__PURE__*/React.createElement("div", {
    className: "illu-count"
  }, filtered.length, " ", filtered.length === 1 ? 'proyecto' : 'proyectos')), /*#__PURE__*/React.createElement("div", {
    className: "projects-list"
  }, (filter === 'all' ? filtered.filter(p => p.id !== DESIGN[0].id) : filtered).map((p, idx) => {
    const isVid = p.cover && p.cover.endsWith('.mp4');
    const isPdfCover = p.cover && p.cover.startsWith('PDF:');
    const flip = idx % 2 === 1;
    const num = String(idx + 1).padStart(2, '0');
    const totalStr = String(filtered.length).padStart(2, '0');
    const prev = idx > 0 ? filtered[idx - 1] : null;
    const newGroup = p.tag === '3d' && (!prev || prev.tag !== '3d');
    const banner = newGroup ? /*#__PURE__*/React.createElement("header", {
      className: "pj-group-banner pj-group-3d"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-group-eyebrow"
    }, "\u21B3 Secci\xF3n"), /*#__PURE__*/React.createElement("h3", {
      className: "pj-group-title"
    }, "3D / Modelado"), /*#__PURE__*/React.createElement("p", {
      className: "pj-group-sub"
    }, "Blender \xB7 3D Modeling \u2014 Auto retrofuturista + Spider-Man Room (High & Low Poly)"), /*#__PURE__*/React.createElement("span", {
      className: "pj-group-meta"
    }, filtered.filter(x => x.tag === '3d').length, " proyectos")) : null;

    // Special renders
    if (p.featureTesis) return /*#__PURE__*/React.createElement(React.Fragment, {
      key: p.id
    }, renderTesisCard(p, num, totalStr));
    if (p.featureSpider) return renderSpiderCard(p, num, totalStr);
    if (p.featureGorillaz) return renderGorillazCard(p, num, totalStr);
    if (p.feature9R) return render9RCard(p, num, totalStr);
    if (p.featureKoizone) return renderKoizoneCard(p, num, totalStr);
    if (p.tag === 'posters') return /*#__PURE__*/React.createElement(PostersCard, {
      key: p.id,
      p: p,
      num: num,
      totalStr: totalStr,
      lang: lang,
      t: t,
      onOpenProject: onOpenProject
    });
    if (p.feature3d) return /*#__PURE__*/React.createElement(React.Fragment, {
      key: p.id
    }, banner, render3DCard(p, num, totalStr));
    if (p.id === '3d-spider-hp' || p.id === '3d-spider-lp') return /*#__PURE__*/React.createElement(React.Fragment, {
      key: p.id
    }, banner, render3DRoomCard(p, num, totalStr));
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: p.id
    }, banner, /*#__PURE__*/React.createElement("article", {
      className: `pj ${flip ? 'flip' : ''}`,
      onClick: () => onOpenProject(p)
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-img"
    }, p.autoRotate && p.assets && p.assets.some(a => a.type === 'video') ? /*#__PURE__*/React.createElement(AnimatedCover, {
      assets: p.assets.filter(a => a.type === 'video'),
      projectName: p.name,
      onOpen: a => onOpenProject(p, p.assets.indexOf(a))
    }) : isVid ? /*#__PURE__*/React.createElement("video", {
      src: p.cover,
      muted: true,
      loop: true,
      autoPlay: true,
      playsInline: true,
      preload: "metadata"
    }) : isPdfCover ? /*#__PURE__*/React.createElement(PdfThumb, {
      src: p.cover.slice(4),
      fallback: "",
      alt: p.name
    }) : /*#__PURE__*/React.createElement("img", {
      src: p.cover,
      alt: p.name,
      loading: "lazy"
    })), /*#__PURE__*/React.createElement("div", {
      className: "pj-info"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-num"
    }, num, " / ", totalStr, " \u2014 ", p.year), /*#__PURE__*/React.createElement("h3", {
      className: "pj-name"
    }, p.name), /*#__PURE__*/React.createElement("div", {
      className: "pj-meta"
    }, /*#__PURE__*/React.createElement("div", {
      className: "pj-meta-row"
    }, /*#__PURE__*/React.createElement("span", null, t.cat), /*#__PURE__*/React.createElement("b", null, p.cat)), /*#__PURE__*/React.createElement("div", {
      className: "pj-meta-row"
    }, /*#__PURE__*/React.createElement("span", null, t.role), /*#__PURE__*/React.createElement("b", {
      style: {
        textTransform: 'none',
        letterSpacing: '.02em',
        fontFamily: 'Poppins,sans-serif',
        fontSize: 13
      }
    }, p.role)), p.assets && p.assets.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "pj-meta-row"
    }, /*#__PURE__*/React.createElement("span", null, t.pieces), /*#__PURE__*/React.createElement("b", null, p.assets.length))), /*#__PURE__*/React.createElement("span", {
      className: "pj-link"
    }, t.viewProject, " \u2192"))));
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "section-jump section-jump-illu",
    onClick: () => onSwitchView && onSwitchView('illu')
  }, /*#__PURE__*/React.createElement("span", {
    className: "section-jump-k"
  }, "02 / Secci\xF3n \xB7 Siguiente"), /*#__PURE__*/React.createElement("span", {
    className: "section-jump-title"
  }, "Ilustraci\xF3n"), /*#__PURE__*/React.createElement("span", {
    className: "section-jump-meta"
  }, ti.meta, " ", /*#__PURE__*/React.createElement("span", {
    className: "section-jump-arr"
  }, "\u2192")))));
}
function IlluSection({
  lang,
  onOpenWork,
  onReadComic,
  onSwitchView
}) {
  const t = I18N[lang].illu;
  const td = I18N[lang].design;
  const tc = I18N[lang].comic;
  const bySeries = React.useMemo(() => {
    const map = {};
    WORKS.forEach(w => {
      const s = w.series || 'singles';
      if (!map[s]) map[s] = [];
      map[s].push(w);
    });
    return map;
  }, []);
  const idxOf = w => WORKS.findIndex(x => x.id === w.id);
  const SERIES = [{
    id: 'fashion',
    title: 'Fashion Atus',
    sub: 'Moda · Outfits',
    count: (bySeries.fashion || []).length
  }, {
    id: 'huh',
    title: 'HUH',
    sub: 'B/N · Pincel',
    count: (bySeries.huh || []).length
  }, {
    id: 'comic',
    title: 'GERO',
    sub: 'Cómic',
    count: COMIC.length
  }, {
    id: 'singles',
    title: 'Atus en escena',
    sub: 'Piezas sueltas',
    count: (bySeries.singles || []).length
  }, {
    id: 'movement',
    title: 'Atus Go',
    sub: 'Movimiento',
    count: (bySeries.movement || []).length
  }, {
    id: 'hero-mix',
    title: 'Héroes & Anime',
    sub: 'Spider · Marvel · Manga',
    count: (bySeries.spider || []).length + (bySeries.heroes || []).length + (bySeries.anime || []).length
  }, {
    id: 'rock',
    title: 'Atus Rock',
    sub: 'Música',
    count: (bySeries.rock || []).length
  }, {
    id: 'shorts',
    title: 'Series cortas',
    sub: 'Rivalry · Nueve Reinas · Guts · Old',
    count: (bySeries.rivalry || []).length + (bySeries.guts || []).length + (bySeries.old || []).length + (bySeries.nuevereinas || []).length
  }];
  const scrollToSeries = id => {
    const el = document.getElementById(`s-${id}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    }
  };
  const Card = ({
    w,
    big
  }) => /*#__PURE__*/React.createElement("div", {
    className: `gcard ${big ? 'gcard-big' : ''}`,
    onClick: () => onOpenWork(idxOf(w))
  }, /*#__PURE__*/React.createElement("div", {
    className: `gcard-img ${w.tone === 'bw' ? 'bw' : ''}`
  }, /*#__PURE__*/React.createElement("img", {
    src: w.src,
    alt: w.title,
    loading: "lazy"
  })), /*#__PURE__*/React.createElement("div", {
    className: "gcard-cap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "t"
  }, w.title), /*#__PURE__*/React.createElement("span", {
    className: "y"
  }, "'", w.year.slice(2))));
  const SeriesHead = ({
    sid,
    num,
    title,
    sub,
    count
  }) => /*#__PURE__*/React.createElement("header", {
    className: "se-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "se-head-l"
  }, /*#__PURE__*/React.createElement("span", {
    className: "se-sid"
  }, num, " / ", sid), /*#__PURE__*/React.createElement("h3", {
    className: "se-title"
  }, title), sub && /*#__PURE__*/React.createElement("span", {
    className: "se-sub"
  }, sub)), /*#__PURE__*/React.createElement("span", {
    className: "se-count"
  }, count, " ", count === 1 ? 'pieza' : 'piezas'));
  const spider = bySeries.spider || [];
  const heroes = bySeries.heroes || [];
  const anime = bySeries.anime || [];
  const rivalry = bySeries.rivalry || [];
  const guts = bySeries.guts || [];
  const old = bySeries.old || [];
  const nueveReinas = (bySeries.nuevereinas || [])[0];

  // Atus Rock — group by sub
  const rockBy = {
    Sound: [],
    Rock: [],
    Punk: []
  };
  (bySeries.rock || []).forEach(w => {
    (rockBy[w.sub] || rockBy.Sound).push(w);
  });
  return /*#__PURE__*/React.createElement("section", {
    id: "illu",
    className: "sec sec-dark"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-num"
  }, t.num), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, t.title, "."), /*#__PURE__*/React.createElement("p", {
    className: "sec-meta"
  }, t.meta))), /*#__PURE__*/React.createElement("nav", {
    className: "illu-anchors"
  }, SERIES.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.id,
    className: "anchor-chip",
    onClick: () => scrollToSeries(s.id)
  }, s.title, " ", /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "(", s.count, ")")))), /*#__PURE__*/React.createElement("section", {
    id: "s-fashion",
    className: "se-block"
  }, /*#__PURE__*/React.createElement(SeriesHead, {
    sid: "fashion-atus",
    num: "01",
    title: "Fashion Atus",
    sub: "Moda \xB7 Outfits \xB7 Figura",
    count: (bySeries.fashion || []).length
  }), /*#__PURE__*/React.createElement("div", {
    className: "se-grid se-rack"
  }, (bySeries.fashion || []).map(w => /*#__PURE__*/React.createElement(Card, {
    key: w.id,
    w: w
  })))), /*#__PURE__*/React.createElement("section", {
    id: "s-huh",
    className: "se-block"
  }, /*#__PURE__*/React.createElement(SeriesHead, {
    sid: "huh",
    num: "02",
    title: "HUH",
    sub: "Estudios a pincel \xB7 Blanco y negro",
    count: (bySeries.huh || []).length
  }), /*#__PURE__*/React.createElement("div", {
    className: "se-grid se-huh"
  }, (bySeries.huh || []).map(w => /*#__PURE__*/React.createElement(Card, {
    key: w.id,
    w: w
  })))), /*#__PURE__*/React.createElement("section", {
    id: "s-comic",
    className: "se-block"
  }, /*#__PURE__*/React.createElement(SeriesHead, {
    sid: "comic",
    num: "03",
    title: "GERO",
    sub: `Cómic · ${COMIC.length} páginas`,
    count: COMIC.length
  }), /*#__PURE__*/React.createElement("div", {
    className: "comic-pages"
  }, COMIC.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    className: "cpage",
    onClick: () => onReadComic(i, 'book')
  }, /*#__PURE__*/React.createElement("img", {
    src: p.img,
    alt: `Gero ${p.n}`,
    loading: "lazy"
  }), /*#__PURE__*/React.createElement("span", {
    className: "cpage-num"
  }, tc.page, " ", p.n)))), /*#__PURE__*/React.createElement("div", {
    className: "comic-cta"
  }, /*#__PURE__*/React.createElement("button", {
    className: "cta cta-onDark",
    onClick: () => onReadComic(0, 'book')
  }, tc.readBook, " \u2192"), /*#__PURE__*/React.createElement("button", {
    className: "cta cta-onDark ghost",
    onClick: () => onReadComic(0, 'single')
  }, tc.readPage, " \u2192"))), /*#__PURE__*/React.createElement("section", {
    id: "s-singles",
    className: "se-block"
  }, /*#__PURE__*/React.createElement(SeriesHead, {
    sid: "atus-en-escena",
    num: "04",
    title: "Atus en escena",
    sub: "Piezas sueltas \u2014 desliza \u2192",
    count: (bySeries.singles || []).length
  }), /*#__PURE__*/React.createElement("div", {
    className: "se-scroll",
    role: "region",
    "aria-label": "Atus en escena \u2014 scroll"
  }, (bySeries.singles || []).map(w => /*#__PURE__*/React.createElement("div", {
    key: w.id,
    className: "se-scroll-item",
    onClick: () => onOpenWork(idxOf(w))
  }, /*#__PURE__*/React.createElement("div", {
    className: `gcard-img ${w.tone === 'bw' ? 'bw' : ''}`
  }, /*#__PURE__*/React.createElement("img", {
    src: w.src,
    alt: w.title,
    loading: "lazy"
  })), /*#__PURE__*/React.createElement("div", {
    className: "gcard-cap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "t"
  }, w.title), /*#__PURE__*/React.createElement("span", {
    className: "y"
  }, "'", w.year.slice(2))))), /*#__PURE__*/React.createElement("div", {
    className: "se-scroll-end"
  }, /*#__PURE__*/React.createElement("span", null, "Fin"), /*#__PURE__*/React.createElement("span", {
    className: "se-scroll-end-n"
  }, (bySeries.singles || []).length, " piezas")))), /*#__PURE__*/React.createElement("section", {
    id: "s-movement",
    className: "se-block"
  }, /*#__PURE__*/React.createElement(SeriesHead, {
    sid: "atus-go",
    num: "05",
    title: "Atus Go",
    sub: "Movimiento \xB7 Acci\xF3n \xB7 Velocidad",
    count: (bySeries.movement || []).length
  }), /*#__PURE__*/React.createElement("div", {
    className: "se-grid se-triptych"
  }, (bySeries.movement || []).map(w => /*#__PURE__*/React.createElement(Card, {
    key: w.id,
    w: w
  })))), /*#__PURE__*/React.createElement("section", {
    id: "s-hero-mix",
    className: "se-block se-flagship"
  }, /*#__PURE__*/React.createElement(SeriesHead, {
    sid: "heroes-anime",
    num: "06",
    title: "H\xE9roes & Anime",
    sub: "Reinterpretaciones del personaje en clave heroica",
    count: spider.length + heroes.length + anime.length
  }), /*#__PURE__*/React.createElement("div", {
    className: "se-flagship-sub"
  }, /*#__PURE__*/React.createElement("div", {
    className: "se-flagship-sub-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "se-flagship-sub-h"
  }, "Spider-Man"), /*#__PURE__*/React.createElement("span", {
    className: "se-flagship-sub-n"
  }, spider.length, " piezas \xB7 serie principal")), /*#__PURE__*/React.createElement("div", {
    className: "se-spider-bento"
  }, spider.map(w => /*#__PURE__*/React.createElement(Card, {
    key: w.id,
    w: w
  })))), /*#__PURE__*/React.createElement("div", {
    className: "se-flagship-split"
  }, /*#__PURE__*/React.createElement("div", {
    className: "se-flagship-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "se-flagship-sub-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "se-flagship-sub-h"
  }, "Marvel \xB7 DC \xB7 Image"), /*#__PURE__*/React.createElement("span", {
    className: "se-flagship-sub-n"
  }, heroes.length, " piezas")), /*#__PURE__*/React.createElement("div", {
    className: "se-flagship-grid c3"
  }, heroes.map(w => /*#__PURE__*/React.createElement(Card, {
    key: w.id,
    w: w
  })))), /*#__PURE__*/React.createElement("div", {
    className: "se-flagship-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "se-flagship-sub-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "se-flagship-sub-h"
  }, "Anime \xB7 Samurai"), /*#__PURE__*/React.createElement("span", {
    className: "se-flagship-sub-n"
  }, anime.length, " piezas")), /*#__PURE__*/React.createElement("div", {
    className: "se-flagship-grid c4"
  }, anime.map(w => /*#__PURE__*/React.createElement(Card, {
    key: w.id,
    w: w
  })))))), /*#__PURE__*/React.createElement("section", {
    id: "s-rock",
    className: "se-block se-compact"
  }, /*#__PURE__*/React.createElement(SeriesHead, {
    sid: "atus-rock",
    num: "07",
    title: "Atus Rock",
    sub: "M\xFAsica \xB7 Subculturas \u2014 Sound \xB7 Rock \xB7 Punk",
    count: (bySeries.rock || []).length
  }), /*#__PURE__*/React.createElement("div", {
    className: "se-rock-strip"
  }, ['Rock', 'Punk', 'Sound'].map(sub => rockBy[sub].length > 0 && /*#__PURE__*/React.createElement("div", {
    key: sub,
    className: "se-rock-group"
  }, /*#__PURE__*/React.createElement("span", {
    className: "se-rock-sub"
  }, sub), /*#__PURE__*/React.createElement("div", {
    className: "se-rock-pieces"
  }, rockBy[sub].map(w => /*#__PURE__*/React.createElement("div", {
    key: w.id,
    className: "se-rock-card",
    onClick: () => onOpenWork(idxOf(w))
  }, /*#__PURE__*/React.createElement("div", {
    className: "gcard-img"
  }, /*#__PURE__*/React.createElement("img", {
    src: w.src,
    alt: w.title,
    loading: "lazy"
  })), /*#__PURE__*/React.createElement("span", {
    className: "se-rock-card-t"
  }, w.title)))))))), /*#__PURE__*/React.createElement("section", {
    id: "s-shorts",
    className: "se-block"
  }, /*#__PURE__*/React.createElement(SeriesHead, {
    sid: "series-cortas",
    num: "08",
    title: "Series cortas",
    sub: "Rivalry destacada \xB7 Nueve Reinas \xB7 Guts \xB7 Old Atus",
    count: rivalry.length + guts.length + old.length + (nueveReinas ? 1 : 0)
  }), rivalry.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "se-shorts-rivalry"
  }, /*#__PURE__*/React.createElement("div", {
    className: "se-shorts-rivalry-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "se-shorts-h"
  }, "Rivalry \xB7 destacada"), /*#__PURE__*/React.createElement("span", {
    className: "se-shorts-n"
  }, rivalry.length, " piezas \xB7 serie principal")), /*#__PURE__*/React.createElement("div", {
    className: "se-shorts-rivalry-grid"
  }, rivalry.map(w => /*#__PURE__*/React.createElement(Card, {
    key: w.id,
    w: w
  })))), /*#__PURE__*/React.createElement("div", {
    className: "se-shorts-row"
  }, nueveReinas && /*#__PURE__*/React.createElement("div", {
    className: "se-shorts-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "se-shorts-h"
  }, "Nueve Reinas"), /*#__PURE__*/React.createElement("span", {
    className: "se-shorts-n"
  }, "1 pieza \xB7 l\xE1mina \xFAnica"), /*#__PURE__*/React.createElement(Card, {
    w: nueveReinas
  })), /*#__PURE__*/React.createElement("div", {
    className: "se-shorts-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "se-shorts-h"
  }, "Guts Atus"), /*#__PURE__*/React.createElement("span", {
    className: "se-shorts-n"
  }, guts.length, " piezas"), /*#__PURE__*/React.createElement("div", {
    className: "se-shorts-inner c2"
  }, guts.map(w => /*#__PURE__*/React.createElement(Card, {
    key: w.id,
    w: w
  })))), /*#__PURE__*/React.createElement("div", {
    className: "se-shorts-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "se-shorts-h"
  }, "Old Atus"), /*#__PURE__*/React.createElement("span", {
    className: "se-shorts-n"
  }, old.length, " piezas"), /*#__PURE__*/React.createElement("div", {
    className: "se-shorts-inner c2"
  }, old.map(w => /*#__PURE__*/React.createElement(Card, {
    key: w.id,
    w: w
  })))))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "section-jump section-jump-design",
    onClick: () => onSwitchView && onSwitchView('design')
  }, /*#__PURE__*/React.createElement("span", {
    className: "section-jump-k"
  }, "01 / Secci\xF3n \xB7 Anterior"), /*#__PURE__*/React.createElement("span", {
    className: "section-jump-title"
  }, "Dise\xF1o Gr\xE1fico"), /*#__PURE__*/React.createElement("span", {
    className: "section-jump-meta"
  }, td.meta, " ", /*#__PURE__*/React.createElement("span", {
    className: "section-jump-arr"
  }, "\u2192")))));
}
function About({
  lang
}) {
  const t = I18N[lang].about;
  const stats = [[t.age, t.ageV], [t.base, t.baseV], [t.form1, t.form1V], [t.form2, t.form2V], [t.focus, t.focusV], [t.status, t.statusV]];
  return /*#__PURE__*/React.createElement("section", {
    id: "about",
    className: "sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-num"
  }, t.num), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, t.title, "."), /*#__PURE__*/React.createElement("p", {
    className: "sec-meta"
  }, t.meta))), /*#__PURE__*/React.createElement("div", {
    className: "about-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "about-l"
  }, /*#__PURE__*/React.createElement("p", {
    dangerouslySetInnerHTML: {
      __html: t.p1
    }
  }), /*#__PURE__*/React.createElement("p", null, t.p2), /*#__PURE__*/React.createElement("div", {
    className: "about-stats"
  }, stats.map(([k, v], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "about-stat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, v))))), /*#__PURE__*/React.createElement("div", {
    className: "about-r"
  }, /*#__PURE__*/React.createElement("img", {
    src: "design/about-photo.jpg",
    alt: "Ignacio Reyes",
    loading: "lazy"
  })))));
}
function Services({
  lang
}) {
  const t = I18N[lang].services;
  const [open, setOpen] = useState(false);
  // Panel abierto: Escape cierra y bloqueamos el scroll del fondo (igual que el modal de obras)
  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);
  return /*#__PURE__*/React.createElement("section", {
    id: "services",
    className: "sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("button", {
    className: "svc-banner",
    onClick: () => setOpen(true),
    "aria-haspopup": "dialog",
    "aria-expanded": open
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, t.num), /*#__PURE__*/React.createElement("span", {
    className: "svc-banner-title"
  }, t.title, ".", /*#__PURE__*/React.createElement("span", {
    className: "arr"
  }, "→")), /*#__PURE__*/React.createElement("span", {
    className: "svc-banner-meta"
  }, /*#__PURE__*/React.createElement("span", null, t.meta), /*#__PURE__*/React.createElement("span", null, t.open)))), /*#__PURE__*/React.createElement("div", {
    className: open ? "svcov open" : "svcov",
    onClick: () => setOpen(false),
    role: "dialog",
    "aria-modal": "true"
  }, /*#__PURE__*/React.createElement("div", {
    className: "svcov-inner",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "svcov-head"
  }, /*#__PURE__*/React.createElement("span", null, t.num, " \xB7 Atus"), /*#__PURE__*/React.createElement("button", {
    className: "svcov-close",
    onClick: () => setOpen(false),
    "aria-label": t.close
  }, "✕")), /*#__PURE__*/React.createElement("h2", {
    className: "svcov-title"
  }, t.title, "."), /*#__PURE__*/React.createElement("p", {
    className: "svcov-sub"
  }, t.sub), t.rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "svc-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, r[0]), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, r[1]), /*#__PURE__*/React.createElement("p", {
    className: "d"
  }, r[2])))), /*#__PURE__*/React.createElement("div", {
    className: "svcov-foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "svcov-ctas"
  }, /*#__PURE__*/React.createElement("a", {
    className: "cta",
    href: "https://www.instagram.com/atus_dg/",
    target: "_blank",
    rel: "noreferrer noopener",
    onClick: e => {
      e.preventDefault();
      window.open('https://www.instagram.com/atus_dg/', '_blank', 'noopener');
    }
  }, t.ctaIg, " →"), /*#__PURE__*/React.createElement("a", {
    className: "cta ghost",
    href: "mailto:atus.graphic@gmail.com?subject=Hola%20Nacho%20%E2%80%94%20Atus",
    onClick: e => {
      e.preventDefault();
      window.open('mailto:atus.graphic@gmail.com?subject=Hola%20Nacho%20%E2%80%94%20Atus', '_blank');
    }
  }, t.ctaMail, " →")), /*#__PURE__*/React.createElement("span", {
    className: "note"
  }, t.note)))));
}
function Contact({
  lang
}) {
  const t = I18N[lang].contact;
  return /*#__PURE__*/React.createElement("section", {
    id: "contact",
    className: "contact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-num"
  }, t.num), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, t.title), /*#__PURE__*/React.createElement("p", {
    className: "sec-meta"
  }, "Buenos Aires \xB7 GMT-3 \xB7 Abierto a proyectos freelance, comisiones y colaboraciones."))), /*#__PURE__*/React.createElement("div", {
    className: "contact-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ci"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, t.mail), /*#__PURE__*/React.createElement("a", {
    href: "mailto:atus.graphic@gmail.com?subject=Hola%20Nacho%20%E2%80%94%20Atus",
    onClick: e => {
      e.preventDefault();
      window.open('mailto:atus.graphic@gmail.com?subject=Hola%20Nacho%20%E2%80%94%20Atus', '_blank');
    }
  }, "atus.graphic@gmail.com"), /*#__PURE__*/React.createElement("div", {
    className: "small"
  }, t.mailNote)), /*#__PURE__*/React.createElement("div", {
    className: "ci"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, t.ig), /*#__PURE__*/React.createElement("a", {
    href: "https://www.instagram.com/atus_dg/",
    target: "_blank",
    rel: "noreferrer noopener",
    onClick: e => {
      e.preventDefault();
      window.open('https://www.instagram.com/atus_dg/', '_blank', 'noopener');
    }
  }, "@atus_dg"), /*#__PURE__*/React.createElement("div", {
    className: "small"
  }, t.igNote)), /*#__PURE__*/React.createElement("div", {
    className: "ci"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, t.wpp), /*#__PURE__*/React.createElement("a", {
    href: "https://wa.me/5491159769593?text=Hola%20Nacho%2C%20te%20escribo%20por%20tu%20portfolio.",
    target: "_blank",
    rel: "noreferrer noopener",
    onClick: e => {
      e.preventDefault();
      window.open('https://wa.me/5491159769593?text=Hola%20Nacho%2C%20te%20escribo%20por%20tu%20portfolio.', '_blank', 'noopener');
    }
  }, "+54 9 11 5976 9593"), /*#__PURE__*/React.createElement("div", {
    className: "small"
  }, t.wppNote))), /*#__PURE__*/React.createElement("div", {
    className: "contact-cta"
  }, /*#__PURE__*/React.createElement("a", {
    className: "primary",
    href: "mailto:atus.graphic@gmail.com?subject=Hola%20Nacho%20%E2%80%94%20Atus",
    onClick: e => {
      e.preventDefault();
      window.open('mailto:atus.graphic@gmail.com?subject=Hola%20Nacho%20%E2%80%94%20Atus', '_blank');
    }
  }, t.ctaMail, " \u2192"), /*#__PURE__*/React.createElement("a", {
    href: "https://wa.me/5491159769593?text=Hola%20Nacho%2C%20te%20escribo%20por%20tu%20portfolio.",
    target: "_blank",
    rel: "noreferrer noopener",
    onClick: e => {
      e.preventDefault();
      window.open('https://wa.me/5491159769593?text=Hola%20Nacho%2C%20te%20escribo%20por%20tu%20portfolio.', '_blank', 'noopener');
    }
  }, t.ctaWpp, " \u2192"), /*#__PURE__*/React.createElement("a", {
    href: "https://www.instagram.com/atus_dg/",
    target: "_blank",
    rel: "noreferrer noopener",
    onClick: e => {
      e.preventDefault();
      window.open('https://www.instagram.com/atus_dg/', '_blank', 'noopener');
    }
  }, t.ctaIg, " \u2192"))));
}
function WorkModal({
  idx,
  onClose,
  onPrev,
  onNext,
  lang
}) {
  const t = I18N[lang].modal;
  const [imgFull, setImgFull] = useState(false); // pieza en pantalla completa
  // Cerramos pantalla completa al cerrar el modal, pero NO al pasar de pieza
  // (así se puede navegar grande con las flechas).
  useEffect(() => {
    if (idx === null || idx === undefined) setImgFull(false);
  }, [idx]);
  useEffect(() => {
    // Guard: only listen when modal is actually open
    if (idx === null || idx === undefined) return;
    const fn = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [idx, onClose, onPrev, onNext]);
  const open = idx !== null;
  const w = open ? WORKS[idx] : null;
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  return /*#__PURE__*/React.createElement("div", {
    className: `modal modal-dark ${open ? 'open' : ''}`,
    onClick: e => {
      if (e.target.classList.contains('modal')) onClose();
    }
  }, w && /*#__PURE__*/React.createElement("div", {
    className: "modal-inner"
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-x",
    onClick: onClose,
    "aria-label": "Cerrar"
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    className: `modal-img-col ${w.tone === 'bw' ? 'bw' : ''}`
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-zoom-btn",
    onClick: () => setImgFull(true),
    title: "Ver en pantalla completa",
    "aria-label": "Ampliar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mz-ico"
  }, "\u26F6"), /*#__PURE__*/React.createElement("span", {
    className: "mz-l"
  }, "Ampliar")), /*#__PURE__*/React.createElement("img", {
    src: w.src,
    alt: w.title,
    onClick: () => setImgFull(true),
    style: {
      cursor: 'zoom-in'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-mini"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onPrev
  }, t.prev), /*#__PURE__*/React.createElement("span", {
    className: "counter"
  }, idx + 1, " / ", WORKS.length), /*#__PURE__*/React.createElement("button", {
    onClick: onNext
  }, t.next))), /*#__PURE__*/React.createElement("div", {
    className: "modal-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, /*#__PURE__*/React.createElement("span", null, t.piece, " ", w.id), /*#__PURE__*/React.createElement("span", null, w.year)), /*#__PURE__*/React.createElement("h3", null, w.title), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, t.cat), /*#__PURE__*/React.createElement("div", {
    className: "val"
  }, w.tone === 'bw' ? 'B/N' : 'COLOR')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, t.year), /*#__PURE__*/React.createElement("div", {
    className: "val"
  }, w.year)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, t.medio), /*#__PURE__*/React.createElement("div", {
    className: "val"
  }, w.medio)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, t.support), /*#__PURE__*/React.createElement("div", {
    className: "val"
  }, t.paper))), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "primary",
    onClick: onClose
  }, t.back), /*#__PURE__*/React.createElement("button", {
    onClick: onNext
  }, t.next)))), w && imgFull && /*#__PURE__*/React.createElement("div", {
    className: "img-full",
    onClick: () => setImgFull(false)
  }, /*#__PURE__*/React.createElement("img", {
    src: w.src,
    alt: w.title,
    onClick: e => e.stopPropagation()
  }), /*#__PURE__*/React.createElement("button", {
    className: "img-full-x",
    onClick: e => {
      e.stopPropagation();
      setImgFull(false);
    },
    "aria-label": "Cerrar"
  }, "\xD7"), /*#__PURE__*/React.createElement("button", {
    className: "img-full-nav img-full-prev",
    onClick: e => {
      e.stopPropagation();
      onPrev();
    },
    "aria-label": "Anterior"
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    className: "img-full-nav img-full-next",
    onClick: e => {
      e.stopPropagation();
      onNext();
    },
    "aria-label": "Siguiente"
  }, "\u203A")));
}

// Orientación de una pieza (portrait/landscape). SINCRÓNICO si la imagen ya está en
// caché → el modal abre directo al tamaño correcto, sin el salto "mediano → grande".
function detectAssetOrient(asset) {
  if (!asset) return 'landscape';
  if (asset.type === 'pdf') return 'portrait';
  if (asset.type === 'img') {
    const im = new Image();
    im.src = asset.src;
    if (im.complete && im.naturalWidth) return im.naturalHeight > im.naturalWidth * 1.08 ? 'portrait' : 'landscape';
  }
  return 'landscape';
}
function ProjectModal({
  project,
  startIdx,
  onClose,
  lang
}) {
  const t = I18N[lang].design;
  const tm = I18N[lang].modal;
  const [i, setI] = useState(0);
  const [imgFull, setImgFull] = useState(false); // ver la pieza en pantalla completa
  const [altVersion, setAltVersion] = useState(false);
  const [orient, setOrient] = useState(() => detectAssetOrient(project && project.assets && project.assets[startIdx || 0]));
  const infoRef = React.useRef(null);
  useEffect(() => {
    setI(startIdx || 0);
  }, [project, startIdx]);
  // Reset al cambiar de proyecto (NO al cambiar de pieza, para poder pasar piezas
  // sin salir de pantalla completa).
  useEffect(() => {
    setImgFull(false);
  }, [project]);
  useEffect(() => {
    setAltVersion(false);
  }, [project]);
  useEffect(() => {
    if (!project) return;
    const fn = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setI(x => Math.max(0, x - 1));
      if (e.key === 'ArrowRight') setI(x => Math.min(Math.max(0, (project.assets?.length || 1) - 1), x + 1));
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [project, onClose]);
  useEffect(() => {
    document.body.style.overflow = project ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [project]);
  // Detecta la orientación de la pieza actual (portrait/landscape) para adaptar el
  // ancho del modal → menos variación entre piezas verticales vs horizontales.
  useEffect(() => {
    const asset = project && project.assets && project.assets[i];
    if (!asset) return;
    setOrient(detectAssetOrient(asset)); // inmediato (correcto si está cacheada o es PDF)
    if (asset.type === 'pdf') return;
    let cancelled = false;
    const decide = (w, h) => {
      if (!cancelled && w) setOrient(h > w * 1.08 ? 'portrait' : 'landscape');
    };
    if (asset.type === 'video') {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => decide(v.videoWidth, v.videoHeight);
      v.src = asset.src;
    } else {
      const im = new Image();
      im.onload = () => decide(im.naturalWidth, im.naturalHeight);
      im.src = asset.src;
    }
    return () => {
      cancelled = true;
    };
  }, [project, i]);

  // When startIdx changes (e.g. clicking a section card), scroll the info panel to that section header.
  // Skip when opening from the hero (startIdx === 0) — first section is already at the top.
  useEffect(() => {
    if (!project || !infoRef.current) return;
    if (!startIdx || startIdx <= 0) {
      // Reset to top whenever a project (re)opens at index 0
      infoRef.current.scrollTo({
        top: 0,
        behavior: 'instant'
      });
      return;
    }
    const a = project.assets[startIdx];
    if (!a || !a.section) return;
    // small timeout so the section header is in the DOM
    const id = setTimeout(() => {
      const el = infoRef.current.querySelector(`[data-section-anchor="${CSS.escape(a.section)}"]`);
      if (el && infoRef.current) {
        const top = el.getBoundingClientRect().top - infoRef.current.getBoundingClientRect().top + infoRef.current.scrollTop - 12;
        infoRef.current.scrollTo({
          top,
          behavior: 'smooth'
        });
      }
    }, 80);
    return () => clearTimeout(id);
  }, [project, startIdx]);
  if (!project) return null;
  const total = project.assets.length;
  const a = total > 0 ? project.assets[i] : null;

  // Build section groups for nav + thumbs (preserves order)
  const groups = [];
  const counts = {};
  project.assets.forEach((as, idx) => {
    const key = as.section || '';
    counts[key] = (counts[key] || 0) + 1;
    let g = groups.find(x => x.label === key);
    if (!g) {
      g = {
        label: key,
        firstIdx: idx,
        items: []
      };
      groups.push(g);
    }
    g.items.push({
      as,
      idx
    });
  });
  const hasSections = groups.length > 1 && groups.some(g => g.label);
  const currentSection = a && a.section ? a.section : groups[0] && groups[0].label;
  const jumpToSection = label => {
    const g = groups.find(x => x.label === label);
    if (!g) return;
    setI(g.firstIdx);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal open",
    onClick: e => {
      if (e.target.classList.contains('modal')) onClose();
    }
  }, imgFull && a && a.type === 'img' && /*#__PURE__*/React.createElement("div", {
    className: "img-full",
    onClick: () => setImgFull(false)
  }, /*#__PURE__*/React.createElement("img", {
    src: a.src,
    alt: a.label || project.name,
    style: altVersion && project.alt ? {
      filter: project.alt.filter
    } : null,
    onClick: e => e.stopPropagation()
  }), /*#__PURE__*/React.createElement("button", {
    className: "img-full-x",
    onClick: e => {
      e.stopPropagation();
      setImgFull(false);
    },
    "aria-label": "Cerrar"
  }, "\xD7"), total > 1 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "img-full-nav img-full-prev",
    onClick: e => {
      e.stopPropagation();
      setI(x => (x - 1 + total) % total);
    },
    "aria-label": "Anterior"
  }, "\u2039"), /*#__PURE__*/React.createElement("button", {
    className: "img-full-nav img-full-next",
    onClick: e => {
      e.stopPropagation();
      setI(x => (x + 1) % total);
    },
    "aria-label": "Siguiente"
  }, "\u203A"))), /*#__PURE__*/React.createElement("div", {
    className: `modal-inner mo-${orient} ${a && a.type === 'pdf' ? 'is-pdf' : ''}`
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-x",
    onClick: onClose,
    "aria-label": "Cerrar"
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    className: "modal-img-col",
    style: altVersion && project.alt && a && a.type === 'img' ? {
      filter: project.alt.filter
    } : null
  }, a && a.type === 'img' && /*#__PURE__*/React.createElement("button", {
    className: "modal-zoom-btn",
    onClick: () => setImgFull(true),
    title: "Ver en pantalla completa",
    "aria-label": "Ampliar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mz-ico"
  }, "\u26F6"), /*#__PURE__*/React.createElement("span", {
    className: "mz-l"
  }, "Ampliar")), project.alt && a && a.type === 'img' && /*#__PURE__*/React.createElement("div", {
    className: "modal-version-toggle"
  }, /*#__PURE__*/React.createElement("button", {
    className: !altVersion ? 'on' : '',
    onClick: () => setAltVersion(false)
  }, "Normal"), /*#__PURE__*/React.createElement("button", {
    className: altVersion ? 'on' : '',
    onClick: () => setAltVersion(true)
  }, "Alt")), a ? /*#__PURE__*/React.createElement(AssetView, {
    asset: a,
    onEnded: () => {
      if (project.autoRotate || a.autoRotate) setI(x => (x + 1) % total);
    },
    altVersion: altVersion,
    onToggleVersion: setAltVersion,
    hasAlt: !!project.alt && a.type === 'pdf',
    onImgClick: () => setImgFull(true)
  }) : /*#__PURE__*/React.createElement("img", {
    src: project.cover,
    alt: project.name,
    onClick: () => setImgFull(true),
    style: {
      cursor: 'zoom-in'
    }
  }), total > 1 && a && a.type === 'pdf' && /*#__PURE__*/React.createElement("div", {
    className: "modal-mini modal-mini-pdf"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setI(x => (x - 1 + total) % total),
    "aria-label": "Anterior"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mm-arrow"
  }, "\u2190"), /*#__PURE__*/React.createElement("span", {
    className: "mm-label"
  }, tm.prev.replace(/[←→]/g, '').trim())), /*#__PURE__*/React.createElement("span", {
    className: "counter"
  }, a && a.section ? `${a.section} · ` : '', i + 1, " / ", total), /*#__PURE__*/React.createElement("button", {
    onClick: () => setI(x => (x + 1) % total),
    "aria-label": "Siguiente"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mm-label"
  }, tm.next.replace(/[←→]/g, '').trim()), /*#__PURE__*/React.createElement("span", {
    className: "mm-arrow"
  }, "\u2192")))), /*#__PURE__*/React.createElement("div", {
    className: "modal-info",
    ref: infoRef
  }, hasSections && /*#__PURE__*/React.createElement("nav", {
    className: "modal-sec-nav",
    "aria-label": "Secciones del proyecto"
  }, groups.map(g => /*#__PURE__*/React.createElement("button", {
    key: g.label || '_',
    className: currentSection === g.label ? 'on' : '',
    onClick: () => jumpToSection(g.label)
  }, g.label || '—', " ", /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "(", g.items.length, ")")))), /*#__PURE__*/React.createElement("div", {
    className: "k"
  }, /*#__PURE__*/React.createElement("span", null, project.cat), /*#__PURE__*/React.createElement("span", null, project.year)), /*#__PURE__*/React.createElement("h3", null, project.name), /*#__PURE__*/React.createElement("p", null, project.desc[lang]), project.pendingFig && /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 10,
      padding: '8px 10px',
      background: '#0c0c0c',
      color: '#f4f2ec',
      fontSize: 12,
      fontFamily: 'JetBrains Mono, monospace',
      letterSpacing: '.1em',
      textTransform: 'uppercase'
    }
  }, "\u26A0 ", tm.pendingNote), total > 1 && /*#__PURE__*/React.createElement("div", {
    className: "modal-thumbs"
  }, groups.filter(g => !hasSections || g.label === currentSection).map(g => {
    const gi = groups.indexOf(g);
    return /*#__PURE__*/React.createElement("div", {
      key: g.label || '_',
      className: "thumbs-section",
      "data-section-anchor": g.label || ''
    }, hasSections && g.label && /*#__PURE__*/React.createElement("div", {
      className: "thumbs-section-h"
    }, /*#__PURE__*/React.createElement("span", {
      className: "h-l"
    }, g.label), /*#__PURE__*/React.createElement("span", {
      className: "h-n"
    }, String(gi + 1).padStart(2, '0'), " \xB7 ", g.items.length, " piezas")), /*#__PURE__*/React.createElement("div", {
      className: "thumbs-strip"
    }, g.items.map(({
      as,
      idx
    }) => /*#__PURE__*/React.createElement("div", {
      key: idx,
      className: `thumb ${idx === i ? 'on' : ''}`,
      onClick: () => setI(idx),
      title: as.label
    }, as.type === 'img' ? /*#__PURE__*/React.createElement("img", {
      src: as.src,
      alt: as.label,
      loading: "lazy"
    }) : as.type === 'video' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      className: "pill"
    }, "\u25B6"), /*#__PURE__*/React.createElement("video", {
      src: as.src,
      muted: true,
      preload: "metadata",
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
    })) : /*#__PURE__*/React.createElement(PdfThumb, {
      src: as.src,
      fallback: as.cover || project.cover,
      alt: as.label
    })))));
  })), total > 1 && a && a.type !== 'pdf' && /*#__PURE__*/React.createElement("div", {
    className: "modal-info-nav"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setI(x => (x - 1 + total) % total),
    "aria-label": "Anterior"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mm-arrow"
  }, "\u2190"), " ", tm.prev.replace(/[←→]/g, '').trim()), /*#__PURE__*/React.createElement("span", {
    className: "counter"
  }, i + 1, " / ", total), /*#__PURE__*/React.createElement("button", {
    onClick: () => setI(x => (x + 1) % total),
    "aria-label": "Siguiente"
  }, tm.next.replace(/[←→]/g, '').trim(), " ", /*#__PURE__*/React.createElement("span", {
    className: "mm-arrow"
  }, "\u2192"))), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "primary",
    onClick: onClose
  }, tm.back)))));
}
function ComicReader({
  open,
  start,
  mode: initMode,
  onClose,
  lang
}) {
  const t = I18N[lang].comic;
  const [page, setPage] = useState(start || 0);
  const [mode, setMode] = useState(initMode || 'book');
  useEffect(() => {
    if (open) {
      setPage(start || 0);
      setMode(initMode || 'book');
    }
  }, [open, start, initMode]);
  useEffect(() => {
    if (!open) return;
    const step = mode === 'book' ? 2 : 1;
    const fn = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setPage(p => Math.max(0, p - step));
      if (e.key === 'ArrowRight') setPage(p => Math.min(COMIC.length - 1, p + step));
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, mode, onClose]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  if (!open) return null;
  const total = COMIC.length;
  const left = COMIC[page];
  const right = mode === 'book' && page + 1 < total ? COMIC[page + 1] : null;
  const step = mode === 'book' ? 2 : 1;
  return /*#__PURE__*/React.createElement("div", {
    className: "reader open"
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-x reader-x",
    onClick: onClose,
    "aria-label": "Cerrar"
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    className: "reader-bar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "title"
  }, t.title), /*#__PURE__*/React.createElement("span", null, right ? `${left.n}–${right.n}` : left.n, " / ", total), /*#__PURE__*/React.createElement("span", null)), /*#__PURE__*/React.createElement("div", {
    className: "reader-stage"
  }, /*#__PURE__*/React.createElement("img", {
    src: left.img,
    alt: `P${left.n}`
  }), right && /*#__PURE__*/React.createElement("img", {
    src: right.img,
    alt: `P${right.n}`
  })), /*#__PURE__*/React.createElement("div", {
    className: "reader-controls"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: page === 0,
    onClick: () => setPage(p => Math.max(0, p - step))
  }, t.prev), /*#__PURE__*/React.createElement("div", {
    className: "reader-mode"
  }, /*#__PURE__*/React.createElement("button", {
    className: mode === 'book' ? 'on' : '',
    onClick: () => setMode('book')
  }, t.book), /*#__PURE__*/React.createElement("button", {
    className: mode === 'single' ? 'on' : '',
    onClick: () => setMode('single')
  }, t.page)), /*#__PURE__*/React.createElement("button", {
    disabled: page >= total - 1,
    onClick: () => setPage(p => Math.min(total - 1, p + step))
  }, t.next)));
}
function App() {
  const [lang, setLangState] = useState(getLang());
  const [view, setViewState] = useState('home'); // 'home' | 'design' | 'illu'
  const [active, setActive] = useState('hero');
  const [workIdx, setWorkIdx] = useState(null);
  const [project, setProject] = useState(null);
  const [projectStartIdx, setProjectStartIdx] = useState(0);
  const openProject = (p, idx = 0) => {
    setProjectStartIdx(idx);
    setProject(p);
  };
  const [reader, setReader] = useState({
    open: false,
    start: 0,
    mode: 'book'
  });
  const [brokenVideos, setBrokenVideos] = useState(new Set());
  const setView = v => {
    // Defensive: close any open modal/reader before switching sections
    setWorkIdx(null);
    setProject(null);
    setReader(r => ({
      ...r,
      open: false
    }));
    setViewState(v);
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  };

  // ── (Se ELIMINÓ el prefetch en segundo plano de TODOS los videos + PDFs de
  //     Diseño. Corría 3s después de CADA carga —incluido el home— y descargaba
  //     ~6MB de video (los mp4 sin faststart bajan enteros con preload=metadata)
  //     más PDFs pesados, que el usuario podía no ver nunca → mataba el tiempo de
  //     carga. Ahora los videos cargan al reproducirse y los PDFs al abrir el
  //     lector, todo on-demand.) ──

  // ── Precarga de IMÁGENES de la vista actual, en orden de arriba hacia abajo ──
  // Apenas se monta una sección, vamos cargando sus imágenes (en orden del DOM, o
  // sea de arriba hacia abajo) de a varias a la vez, SIN bloquear el render. Así,
  // cuando el usuario scrollea, las imágenes ya están en caché y aparecen al
  // instante en vez de mostrar bloques negros esperando.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      const seen = new Set();
      // Sólo calentamos las PRIMERAS imágenes (arriba del todo) para que el primer
      // vistazo aparezca al instante; el resto lo maneja loading="lazy" nativo al
      // scrollear → no front-loadeamos toda la vista y la carga es mucho más rápida.
      const urls = Array.from(document.querySelectorAll('#app img')).map(im => im.getAttribute('src')).filter(s => s && !s.startsWith('data:') && !seen.has(s) && seen.add(s)).slice(0, 10);
      let i = 0;
      const CONC = 5; // 5 imágenes a la vez, en orden
      const next = () => {
        if (cancelled || i >= urls.length) return;
        const pre = new Image();
        pre.onload = pre.onerror = () => {
          if (!cancelled) next();
        };
        pre.src = urls[i++];
      };
      for (let k = 0; k < CONC; k++) next();
    }, 350); // 350ms: deja renderizar la sección primero
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [view]);
  const setLang = l => {
    setLangState(l);
    localStorage.setItem('atus_lang', l);
  };
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const jump = id => {
    // From a section view, jumping to hero/about/contact returns home
    if (id === 'design') {
      setView('design');
      return;
    }
    if (id === 'illu') {
      setView('illu');
      return;
    }
    if (id === 'hero') {
      setView('home');
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    // about/contact: must be on home for them to exist
    if (view !== 'home') {
      setViewState('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 50);
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };
  const openWork = i => setWorkIdx(i);
  const closeWork = () => setWorkIdx(null);
  const prevWork = () => setWorkIdx(i => (i - 1 + WORKS.length) % WORKS.length);
  const nextWork = () => setWorkIdx(i => (i + 1) % WORKS.length);
  useEffect(() => {
    if (view !== 'home') return;
    const ids = ['hero', 'about', 'contact'];
    const els = ids.map(id => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) setActive(en.target.id);
      });
    }, {
      rootMargin: '-40% 0px -50% 0px',
      threshold: 0
    });
    els.forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, [view]);

  // When in design/illu views, mark them active
  useEffect(() => {
    if (view === 'design') setActive('design');else if (view === 'illu') setActive('illu');
  }, [view]);
  const sectionBar = kind => /*#__PURE__*/React.createElement("div", {
    className: `section-view-bar ${kind === 'illu' ? 'dark' : ''}`
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setView('home'),
    "aria-label": "Volver a inicio"
  }, /*#__PURE__*/React.createElement("span", null, "\u2190 Volver"), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .6,
      marginLeft: '8px'
    }
  }, "Inicio")));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Nav, {
    active: active,
    onJump: jump,
    lang: lang,
    setLang: setLang,
    view: view,
    setView: setView
  }), view === 'home' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Hero, {
    lang: lang,
    onJump: jump,
    onEnter: setView
  }), /*#__PURE__*/React.createElement(About, {
    lang: lang
  }), /*#__PURE__*/React.createElement(Services, {
    lang: lang
  }), /*#__PURE__*/React.createElement(Contact, {
    lang: lang
  })), view === 'design' && /*#__PURE__*/React.createElement(React.Fragment, null, sectionBar('design'), /*#__PURE__*/React.createElement(DesignSection, {
    lang: lang,
    onOpenProject: openProject,
    onSwitchView: setView
  })), view === 'illu' && /*#__PURE__*/React.createElement(React.Fragment, null, sectionBar('illu'), /*#__PURE__*/React.createElement(IlluSection, {
    lang: lang,
    onOpenWork: openWork,
    onSwitchView: setView,
    onReadComic: (s, m) => setReader({
      open: true,
      start: s,
      mode: m
    })
  })), /*#__PURE__*/React.createElement("footer", {
    className: "footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("span", null, I18N[lang].footer1), /*#__PURE__*/React.createElement("span", null, I18N[lang].footer2), /*#__PURE__*/React.createElement("span", null, I18N[lang].footer3))), /*#__PURE__*/React.createElement(WorkModal, {
    idx: workIdx,
    onClose: closeWork,
    onPrev: prevWork,
    onNext: nextWork,
    lang: lang
  }), /*#__PURE__*/React.createElement(ProjectModal, {
    project: project,
    startIdx: projectStartIdx,
    onClose: () => setProject(null),
    lang: lang
  }), /*#__PURE__*/React.createElement(ComicReader, {
    open: reader.open,
    start: reader.start,
    mode: reader.mode,
    onClose: () => setReader(r => ({
      ...r,
      open: false
    })),
    lang: lang
  }));
}
ReactDOM.createRoot(document.getElementById('app')).render(/*#__PURE__*/React.createElement(App, null));