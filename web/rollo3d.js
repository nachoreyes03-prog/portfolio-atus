/* ============================================================
   OPCIÓN A — EL RECIBO ENROLLADO EN 3D (WebGL, sin librerías)
   El papel es una tira con la imagen del recibo (tk/rollo-*.webp,
   capturada del recibo real). La parte de arriba queda plana y el
   resto se enrolla en espiral sobre el papel, como un ticket real:
   la cara impresa queda adentro y por afuera se trasluce la tinta.
   Mientras está enrollado se ve en ángulo (como un objeto sobre la
   mesa); al desenrollarse se endereza hasta quedar de frente, igual
   píxel a píxel al recibo de la página, y ahí se pasa al real.
   ============================================================ */
(function () {
  'use strict';

  var VS = [
    'attribute vec2 aP;',                 // x: 0..1 a lo ancho, y: distancia desde arriba (px)
    'uniform float uW, uL, uF, uR0, uK;',
    'uniform mat4 uModel, uVP;',
    'varying vec2 vUV; varying vec3 vN; varying vec3 vPos; varying float vPhi; varying float vV;',
    'void main(){',
    '  float v = aP.y, x = aP.x * uW;',
    '  vec3 p; vec3 n; float phi = 0.0;',
    '  if (v <= uF || uR0 <= 0.0) { p = vec3(x, -v, 0.0); n = vec3(0.0, 0.0, 1.0); }',
    '  else {',
    '    float s = v - uF;',
    '    float d = max(uR0 * uR0 - 2.0 * uK * s, 0.0);',
    '    phi = (uR0 - sqrt(d)) / uK;',
    '    float r = max(uR0 - uK * phi, 0.0);',
    '    p = vec3(x, -uF - r * sin(phi), uR0 - r * cos(phi));',
    '    n = vec3(0.0, sin(phi), cos(phi));',
    '  }',
    '  vec4 w = uModel * vec4(p, 1.0);',
    '  vPos = w.xyz; vN = normalize((uModel * vec4(n, 0.0)).xyz); vUV = vec2(aP.x, v / uL); vPhi = phi; vV = v;',
    '  gl_Position = uVP * w;',
    '}'
  ].join('\n');

  var FS = [
    'precision highp float;',
    'uniform sampler2D uTex; uniform vec3 uEye, uLuz; uniform float uF, uR0, uL, uRecto;',
    'varying vec2 vUV; varying vec3 vN; varying vec3 vPos; varying float vPhi; varying float vV;',
    'void main(){',
    /* de frente, el papel plano lo pone el recibo real de la página: acá sólo va
       la sombra que el rollo tira sobre él (y el rollo) */
    '  if (uRecto > 0.5 && vV <= uF) {',
    '    float sh = uR0 > 0.0 ? 0.30 * (1.0 - smoothstep(0.0, uR0 * 1.7, uF - vV)) : 0.0;',
    '    if (sh < 0.004) discard;',
    '    gl_FragColor = vec4(0.0, 0.0, 0.0, sh); return;',
    '  }',
    '  vec4 t = texture2D(uTex, vUV);',
    '  if (t.a < 0.5) discard;',
    '  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;',
    '  vec3 papel = vec3(0.981);',
    '  vec3 base;',
    '  if (gl_FrontFacing) base = t.rgb;',
    /* del otro lado se trasluce la tinta, apenas */
    '  else { float tinta = 1.0 - dot(t.rgb, vec3(0.333)); base = papel - vec3(0.20 * tinta); }',
    '  float dif = max(dot(n, uLuz), 0.0);',
    '  vec3 V = normalize(uEye - vPos);',
    '  float brillo = pow(max(dot(reflect(-uLuz, n), V), 0.0), 18.0) * 0.05;',
    /* el papel plano de frente queda con luz 1: igual al recibo real que va encima */
    '  float luz = (0.58 + 0.42 * dif) / (0.58 + 0.42 * uLuz.z);',
    /* las vueltas de adentro reciben menos luz */
    '  luz *= 1.0 - 0.09 * min(vPhi / 6.2832, 4.0);',
    /* sombra del rollo sobre el papel plano, justo antes de donde se enrolla */
    '  if (vV <= uF && uR0 > 0.0) { float dd = uF - vV; luz *= 1.0 - 0.30 * (1.0 - smoothstep(0.0, uR0 * 1.7, dd)); }',
    '  gl_FragColor = vec4(base * luz + brillo, 1.0);',
    '}'
  ].join('\n');

  function compilar(gl, tipo, src) {
    var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  /* matrices (columna mayor, como WebGL) */
  function mul(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
      o[i * 4 + j] = s;
    }
    return o;
  }
  function trasl(x, y, z) { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]); }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }
  function frustum(l, r, b, t, n, f) {
    return new Float32Array([2*n/(r-l),0,0,0, 0,2*n/(t-b),0,0, (r+l)/(r-l),(t+b)/(t-b),-(f+n)/(f-n),-1, 0,0,-2*f*n/(f-n),0]);
  }

  /* opts: { textura: canvas o imagen, W, L (medidas del recibo en px), canvas } */
  function crear(opts) {
    var cv = opts.canvas;
    var gl = cv.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: false });
    var gl2 = !!gl;
    if (!gl) gl = cv.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, compilar(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compilar(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    /* la tira: dos columnas y muchas filas (cada ~1,5 px) para que la curva sea suave */
    var W = opts.W, L = opts.L, filas = Math.ceil(L / 1.5);
    var datos = new Float32Array((filas + 1) * 4);
    for (var i = 0; i <= filas; i++) {
      var v = L * i / filas;
      datos[i * 4] = 0; datos[i * 4 + 1] = v; datos[i * 4 + 2] = 1; datos[i * 4 + 3] = v;
    }
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, datos, gl.STATIC_DRAW);
    var aP = gl.getAttribLocation(prog, 'aP');
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, opts.textura);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (gl2) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    var an = gl.getExtension('EXT_texture_filter_anisotropic');
    if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

    var U = {};
    ['uW','uL','uF','uR0','uK','uModel','uVP','uTex','uEye','uLuz','uRecto'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1f(U.uW, W); gl.uniform1f(U.uL, L); gl.uniform1i(U.uTex, 0);
    gl.enable(gl.DEPTH_TEST);
    /* la sombra es semitransparente (sobre el recibo de la página) */
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.CULL_FACE);
    gl.frontFace(gl.CW); /* así la cara impresa es la de "adelante" */

    /* espiral: cuanto más papel queda, más vueltas y más gordo el rollo */
    var GAP = opts.gap || 10, RMIN = opts.rmin || 9, K = GAP / (2 * Math.PI);

    /* estado: F = cuánto papel salió (px), e = cuánto se enderezó (0 = en ángulo, 1 = de frente)
       vista: { ojoX, ojoY (centro de la pantalla en coordenadas del recibo), D (distancia del ojo),
                izq, der, arr, aba (bordes del canvas en coordenadas del recibo), pxW, pxH } */
    function radio(F) { var resto = Math.max(0, L - F); return resto > 1 ? Math.sqrt(2 * K * resto + RMIN * RMIN) : 0; }
    /* matrices: modelo (inclinación) y cámara (el ojo frente a la pantalla, sin deformar
       el plano de la página: de frente, 1 px del recibo = 1 px de pantalla) */
    function matrices(F, e, vista) {
      var q = 1 - e, tilt = -(opts.tilt || 0.62) * q, yaw = -(opts.yaw == null ? 0.2 : opts.yaw) * q;
      /* el giro es cerca del rollo: esa zona queda a tamaño normal y lo de arriba se aleja */
      var py = -Math.max(0, F - (opts.pivote || 170));
      /* gira alrededor de un punto de la cabecera; mientras está en ángulo se aleja un
         poco y se corre a la derecha, así queda centrado con el rollo a la vista */
      var M = mul(trasl(W / 2 + W * (opts.corrida == null ? 0.05 : opts.corrida) * q, py, -(opts.atras || 90) * q), mul(rotY(yaw), mul(rotX(tilt), trasl(-W / 2, -py, 0))));
      var n = 20, f = vista.D * 4, k = n / vista.D;
      var P = frustum((vista.izq - vista.ojoX) * k, (vista.der - vista.ojoX) * k, (vista.aba - vista.ojoY) * k, (vista.arr - vista.ojoY) * k, n, f);
      return { M: M, VP: mul(P, trasl(-vista.ojoX, -vista.ojoY, -vista.D)) };
    }
    /* dónde cae en el canvas (0 arriba, 1 abajo) el punto donde el papel entra al rollo */
    function alturaRollo(F, e, vista) {
      var m = matrices(F, e, vista), p = [W / 2, -F, 0, 1];
      var w = [0, 0, 0, 0], c = [0, 0, 0, 0], i, j;
      for (i = 0; i < 4; i++) { var s = 0; for (j = 0; j < 4; j++) s += m.M[j * 4 + i] * p[j]; w[i] = s; }
      for (i = 0; i < 4; i++) { var s2 = 0; for (j = 0; j < 4; j++) s2 += m.VP[j * 4 + i] * w[j]; c[i] = s2; }
      return (1 - c[1] / c[3]) / 2;
    }
    function dibujar(F, e, vista) {
      var R0 = radio(F);
      gl.uniform1f(U.uF, F); gl.uniform1f(U.uR0, R0); gl.uniform1f(U.uK, K);
      gl.uniform1f(U.uRecto, e >= 1 ? 1 : 0);
      var m = matrices(F, e, vista);
      gl.uniformMatrix4fv(U.uModel, false, m.M);
      gl.uniformMatrix4fv(U.uVP, false, m.VP);
      gl.uniform3f(U.uEye, vista.ojoX, vista.ojoY, vista.D);
      var lx = -0.35, ly = 0.55, lz = 0.76, ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
      gl.uniform3f(U.uLuz, lx / ll, ly / ll, lz / ll);
      /* el tamaño real del lienzo (el navegador puede achicarlo si es muy grande) */
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, (filas + 1) * 2);
    }
    function destruir() {
      try { gl.deleteTexture(tex); gl.deleteBuffer(buf); gl.deleteProgram(prog); var x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (er) {}
    }
    return { dibujar: dibujar, destruir: destruir, alturaRollo: alturaRollo, radio: radio };
  }

  window.AtusRollo3D = { crear: crear };
})();
