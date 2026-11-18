(function () {
  "use strict";

  document.documentElement.classList.add("js-ready");

  /* =========================================================
     1. WebGL Volumetric Smoked Mineral Aurora & Ripple Shader
        (with seamless 2D Canvas fallback)
     ========================================================= */
  function initVolumetricBackdrop() {
    var canvas = document.getElementById("glCanvas");
    if (!canvas) return;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var state = {
      scroll: 0,
      scrollTarget: 0,
      mx: 0.5,
      my: 0.5,
      mxTarget: 0.5,
      myTarget: 0.5,
      rx: 0.5,
      ry: 0.5,
      rippleT: -10
    };
    var lastInteraction = performance.now();

    function markInteraction() {
      lastInteraction = performance.now();
    }

    window.addEventListener("pointermove", function (e) {
      state.mxTarget = e.clientX / Math.max(1, window.innerWidth);
      state.myTarget = 1.0 - e.clientY / Math.max(1, window.innerHeight);
      markInteraction();
    }, { passive: true });

    window.addEventListener("pointerdown", function (e) {
      state.rx = e.clientX / Math.max(1, window.innerWidth);
      state.ry = 1.0 - e.clientY / Math.max(1, window.innerHeight);
      state.rippleT = performance.now() * 0.001;
      markInteraction();
    }, { passive: true });

    function updateScrollTarget() {
      var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      state.scrollTarget = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      markInteraction();
    }
    window.addEventListener("scroll", updateScrollTarget, { passive: true });
    updateScrollTarget();

    var gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false }) ||
             canvas.getContext("experimental-webgl", { alpha: false, antialias: false, depth: false, stencil: false });

    if (gl) {
      var vsSrc = [
        "attribute vec2 aPos;",
        "void main() { gl_Position = vec4(aPos, 0.0, 1.0); }"
      ].join("\n");

      var fsSrc = [
        "precision mediump float;",
        "uniform vec2 uRes;",
        "uniform float uTime;",
        "uniform vec2 uMouse;",
        "uniform float uScroll;",
        "uniform vec2 uRipple;",
        "uniform float uRippleAge;",
        "",
        "float hash(vec2 p) {",
        "  p = fract(p * vec2(123.34, 456.21));",
        "  p += dot(p, p + 45.32);",
        "  return fract(p.x * p.y);",
        "}",
        "",
        "float noise(vec2 p) {",
        "  vec2 i = floor(p);",
        "  vec2 f = fract(p);",
        "  vec2 u = f * f * (3.0 - 2.0 * f);",
        "  return mix(",
        "    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),",
        "    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),",
        "    u.y",
        "  );",
        "}",
        "",
        "float fbm(vec2 p) {",
        "  float v = 0.0;",
        "  float a = 0.56;",
        "  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);",
        "  for (int i = 0; i < 2; i++) {",
        "    v += a * noise(p);",
        "    p = rot * p * 2.04;",
        "    a *= 0.44;",
        "  }",
        "  return v;",
        "}",
        "",
        "void main() {",
        "  vec2 uv = gl_FragCoord.xy / uRes;",
        "  float aspect = uRes.x / max(1.0, uRes.y);",
        "  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);",
        "",
        "  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);",
        "  float md = length(p - m);",
        "  p += normalize(p - m + 0.001) * exp(-md * 2.4) * 0.05;",
        "",
        "  float t = uTime * 0.14;",
        "  vec2 q = vec2(fbm(p * 1.4 + t + uScroll * 1.1), fbm(p * 1.4 + vec2(4.2, 1.7) - t * 0.8));",
        "  float f = fbm(p * 1.9 + q * 1.65 + vec2(uScroll * 0.8, -uScroll * 0.5));",
        "",
        "  float ribbon = smoothstep(0.38, 0.74, f);",
        "  float filament = pow(smoothstep(0.52, 0.84, f), 2.1);",
        "",
        "  vec2 rp = (uv - uRipple) * vec2(aspect, 1.0);",
        "  float rd = length(rp);",
        "  float wave = 0.0;",
        "  if (uRippleAge >= 0.0 && uRippleAge < 2.2) {",
        "    float radius = uRippleAge * 0.55;",
        "    wave = exp(-abs(rd - radius) * 28.0) * exp(-uRippleAge * 1.4) * 0.30;",
        "  }",
        "",
        "  vec3 baseObsidian = vec3(0.018, 0.020, 0.020);",
        "  vec3 mineralStone = vec3(0.062, 0.088, 0.084);",
        "  vec3 silverMist = vec3(0.30, 0.34, 0.33);",
        "",
        "  vec3 col = mix(baseObsidian, mineralStone, ribbon * 0.92);",
        "  col += silverMist * (filament * 0.25 + wave);",
        "  col += vec3(0.18, 0.20, 0.19) * exp(-md * 2.8) * 0.22;",
        "  col *= 1.0 - smoothstep(0.32, 1.05, length(p * vec2(0.78, 0.95))) * 0.62;",
        "  col += (hash(gl_FragCoord.xy) - 0.5) * 0.012;",
        "",
        "  gl_FragColor = vec4(col, 1.0);",
        "}"
      ].join("\n");

      function compile(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          gl.deleteShader(s);
          return null;
        }
        return s;
      }

      var vs = compile(gl.VERTEX_SHADER, vsSrc);
      var fs = compile(gl.FRAGMENT_SHADER, fsSrc);
      var prog = vs && fs ? gl.createProgram() : null;
      if (prog) {
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
      }

      if (prog && gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, "aPos");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        var uRes = gl.getUniformLocation(prog, "uRes");
        var uTime = gl.getUniformLocation(prog, "uTime");
        var uMouse = gl.getUniformLocation(prog, "uMouse");
        var uScroll = gl.getUniformLocation(prog, "uScroll");
        var uRipple = gl.getUniformLocation(prog, "uRipple");
        var uRippleAge = gl.getUniformLocation(prog, "uRippleAge");

        var resizeGL = function () {
          var scale = Math.min(0.45, 640 / Math.max(1, window.innerWidth));
          canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
          canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
          gl.viewport(0, 0, canvas.width, canvas.height);
          markInteraction();
        };
        window.addEventListener("resize", resizeGL, { passive: true });
        resizeGL();

        var startT = performance.now();
        var lastDraw = 0;
        var glRafId = 0;

        var drawGL = function (now) {
          glRafId = 0;
          if (document.hidden) return;
          var tMs = typeof now === "number" ? now : performance.now();
          var nowSec = tMs * 0.001;
          var rippleAge = state.rippleT > 0 ? nowSec - state.rippleT : -1.0;
          var rippleActive = rippleAge >= 0.0 && rippleAge < 2.2;
          var idle = (tMs - lastInteraction) > 650 && !rippleActive;

          if (!reducedMotion && idle && (tMs - lastDraw) < 32) {
            glRafId = requestAnimationFrame(drawGL);
            return;
          }
          lastDraw = tMs;

          state.scroll += (state.scrollTarget - state.scroll) * 0.14;
          state.mx += (state.mxTarget - state.mx) * 0.14;
          state.my += (state.myTarget - state.my) * 0.14;

          gl.uniform2f(uRes, canvas.width, canvas.height);
          gl.uniform1f(uTime, reducedMotion ? 1.5 : (tMs - startT) * 0.001);
          gl.uniform2f(uMouse, state.mx, state.my);
          gl.uniform1f(uScroll, state.scroll);
          gl.uniform2f(uRipple, state.rx, state.ry);
          gl.uniform1f(uRippleAge, rippleAge);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

          if (!reducedMotion) {
            glRafId = requestAnimationFrame(drawGL);
          }
        };

        document.addEventListener("visibilitychange", function () {
          if (!document.hidden && !reducedMotion && !glRafId) {
            lastDraw = 0;
            glRafId = requestAnimationFrame(drawGL);
          }
        });

        drawGL(startT);
        return;
      }
    }

    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    function resize2D() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize2D, { passive: true });
    resize2D();
    function draw2D() {
      var w = canvas.width;
      var h = canvas.height;
      ctx.fillStyle = "#050606";
      ctx.fillRect(0, 0, w, h);
      var g = ctx.createRadialGradient(w * state.mxTarget, h * (1 - state.myTarget), 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      g.addColorStop(0, "rgba(140, 162, 155, 0.16)");
      g.addColorStop(0.55, "rgba(38, 46, 44, 0.07)");
      g.addColorStop(1, "rgba(5, 6, 6, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      if (!reducedMotion) requestAnimationFrame(draw2D);
    }
    draw2D();
  }

  /* =========================================================
     2. Interactive 3D RealRain Dot-Wave Sculpture (#orbCanvas)
        with Inertial Spin Physics
     ========================================================= */
  function initOrbSculpture() {
    var canvas = document.getElementById("orbCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var points = [];
    var projected = [];
    for (var row = 0; row < 19; row++) {
      for (var col = 0; col < 19; col++) {
        var nx = (col - 9) / 9;
        var ny = (row - 9) / 9;
        var dist = Math.sqrt(nx * nx + ny * ny);
        if (dist <= 1.02) {
          points.push({
            nx: nx,
            ny: ny,
            dist: dist,
            baseR: Math.max(0.18, 1.0 - dist * 0.72)
          });
          projected.push({ sx: 0, sy: 0, r: 1, z: 0, lit: 0, alpha: 0.5 });
        }
      }
    }

    var rotX = 0.14;
    var rotY = -0.18;
    var targetX = 0.14;
    var targetY = -0.18;
    var gazeX = 0;
    var gazeY = 0;
    var velX = 0;
    var velY = 0;
    var pulse = 0;
    var dragging = false;
    var activePointerId = null;
    var hasDesktopGaze = false;
    var lastPX = 0;
    var lastPY = 0;
    var lastDragMoveTime = 0;
    var orbCX = 0;
    var orbCY = 0;
    var lastOrbInteraction = performance.now();
    var lastOrbDraw = 0;
    var lastRenderTime = 0;

    function updateOrbMetrics() {
      var r = canvas.getBoundingClientRect();
      orbCX = r.left + r.width * 0.5;
      orbCY = r.top + r.height * 0.5;
    }

    canvas.addEventListener("touchmove", function (e) {
      if (dragging) e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("pointerdown", function (e) {
      dragging = true;
      activePointerId = e.pointerId;
      lastPX = e.clientX;
      lastPY = e.clientY;
      velX = 0;
      velY = 0;
      pulse = 1.0;
      lastDragMoveTime = performance.now();
      lastOrbInteraction = lastDragMoveTime;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
      if (visible && !document.hidden && !reducedMotion && !rafId) {
        lastOrbDraw = 0;
        rafId = requestAnimationFrame(render);
      }
    });

    window.addEventListener("pointermove", function (e) {
      if (dragging && e.pointerId === activePointerId) {
        var dx = e.clientX - lastPX;
        var dy = e.clientY - lastPY;
        var sens = e.pointerType === "touch" ? 0.0115 : 0.0085;
        targetY += dx * sens;
        targetX = Math.max(-1.22, Math.min(1.22, targetX - dy * sens));
        velY = velY * 0.42 + (dx * sens) * 0.58;
        velX = velX * 0.42 + (-dy * sens) * 0.58;
        lastPX = e.clientX;
        lastPY = e.clientY;
        lastDragMoveTime = performance.now();
        lastOrbInteraction = lastDragMoveTime;
      } else if (!dragging && visible && e.pointerType !== "touch") {
        if (!orbCX && !orbCY) updateOrbMetrics();
        var spanX = Math.max(260, window.innerWidth * 0.52);
        var spanY = Math.max(220, window.innerHeight * 0.48);
        gazeX = Math.max(-1, Math.min(1, (e.clientX - orbCX) / spanX));
        gazeY = Math.max(-1, Math.min(1, (e.clientY - orbCY) / spanY));
        hasDesktopGaze = true;
        targetY = gazeX * 0.68;
        targetX = -gazeY * 0.56;
        velX *= 0.2;
        velY *= 0.2;
        lastOrbInteraction = performance.now();
      }
    }, { passive: true });

    function finishOrbDrag(e) {
      if (!dragging) return;
      if (e && activePointerId !== null && e.pointerId !== activePointerId) return;
      dragging = false;
      activePointerId = null;
      if ((performance.now() - lastDragMoveTime) > 80) {
        velX = 0;
        velY = 0;
      }
    }

    window.addEventListener("pointerup", finishOrbDrag);
    window.addEventListener("pointercancel", finishOrbDrag);

    var w = 0;
    var h = 0;
    var dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth || 320;
      h = canvas.clientHeight || 320;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      updateOrbMetrics();
      lastOrbInteraction = performance.now();
    }
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", updateOrbMetrics, { passive: true });
    resize();

    var visible = true;
    var rafId = 0;
    var hero = document.getElementById("top");
    if (hero && typeof IntersectionObserver === "function") {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden && !reducedMotion && !rafId) {
          lastOrbDraw = 0;
          rafId = requestAnimationFrame(render);
        }
      }, { threshold: 0.05 }).observe(hero);
    }

    document.addEventListener("visibilitychange", function () {
      if (visible && !document.hidden && !reducedMotion && !rafId) {
        lastOrbDraw = 0;
        rafId = requestAnimationFrame(render);
      }
    });

    function render(now) {
      rafId = 0;
      if (!visible || document.hidden) return;
      var tMs = typeof now === "number" ? now : performance.now();
      var settled = !dragging &&
        Math.abs(velX) < 0.0005 &&
        Math.abs(velY) < 0.0005 &&
        Math.abs(targetX - rotX) < 0.002 &&
        Math.abs(targetY - rotY) < 0.002 &&
        pulse < 0.01;
      if (!reducedMotion && settled && (tMs - lastOrbInteraction) > 800 && (tMs - lastOrbDraw) < 32) {
        rafId = requestAnimationFrame(render);
        return;
      }
      lastOrbDraw = tMs;
      var dt60 = lastRenderTime ? Math.min(2.5, Math.max(0.25, (tMs - lastRenderTime) / 16.667)) : 1;
      lastRenderTime = tMs;

      ctx.clearRect(0, 0, w, h);

      if (!dragging) {
        targetY += velY * dt60;
        targetX = Math.max(-1.22, Math.min(1.22, targetX + velX * dt60));
        var decay = Math.pow(0.94, dt60);
        velY *= decay;
        velX *= decay;
      }

      var follow = dragging ? 0.58 : (1 - Math.pow(1 - 0.18, dt60));
      rotX += (targetX - rotX) * follow;
      rotY += (targetY - rotY) * follow;
      pulse *= Math.pow(0.92, dt60);

      canvas.__rotX = rotX;
      canvas.__rotY = rotY;

      var t = reducedMotion ? 0 : tMs * 0.0018;
      var radius = Math.min(w, h) * (w <= 260 ? 0.43 : 0.38);
      var cx = w * 0.5;
      var cy = h * 0.5;
      var litX = hasDesktopGaze ? gazeX : -0.34;
      var litY = hasDesktopGaze ? gazeY : -0.38;

      var cosY = Math.cos(rotY);
      var sinY = Math.sin(rotY);
      var cosX = Math.cos(rotX);
      var sinX = Math.sin(rotX);

      var halo = ctx.createRadialGradient(
        cx + litX * radius * 0.26,
        cy + litY * radius * 0.26,
        radius * 0.1,
        cx,
        cy,
        radius * 1.25
      );
      halo.addColorStop(0, "rgba(218, 220, 215, 0.14)");
      halo.addColorStop(0.6, "rgba(140, 162, 155, 0.045)");
      halo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      for (var i = 0; i < points.length; i++) {
        var pt = points[i];
        var wave = Math.sin(pt.dist * 6.4 - t) * 0.12 + Math.sin(pt.dist * 10 - t * 1.8) * pulse * 0.18;
        var nz = Math.sqrt(Math.max(0.0, 1.0 - pt.dist * pt.dist * 0.65)) * 0.42 + wave;

        var x1 = pt.nx * cosY + nz * sinY;
        var z1 = -pt.nx * sinY + nz * cosY;
        var y2 = pt.ny * cosX - z1 * sinX;
        var z2 = pt.ny * sinX + z1 * cosX;

        var persp = 2.6 / (2.6 - z2);
        var cursorLit = Math.max(0, (x1 * litX + y2 * litY) * 0.28);
        var slot = projected[i];
        slot.sx = cx + x1 * radius * persp;
        slot.sy = cy + y2 * radius * persp;
        slot.r = Math.max(0.7, pt.baseR * (radius * 0.032) * persp);
        slot.z = z2;
        slot.lit = cursorLit;
        slot.alpha = Math.min(0.96, Math.max(0.16, (0.45 + z2 * 0.55) * pt.baseR + pulse * 0.2 + cursorLit * 0.28));
      }

      projected.sort(function (a, b) { return a.z - b.z; });

      for (var j = 0; j < projected.length; j++) {
        var p = projected[j];
        var mixLight = Math.max(0, Math.min(1, p.z + 0.4 + p.lit * 0.7));
        var rCol = Math.round(142 + mixLight * 98);
        var gCol = Math.round(146 + mixLight * 95);
        var bCol = Math.round(142 + mixLight * 92);
        ctx.fillStyle = "rgba(" + rCol + "," + gCol + "," + bCol + "," + p.alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (visible && !document.hidden && !reducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    }

    render(performance.now());
  }

  /* =========================================================
     3A. Chapter 02: De-Boxed Architectural Triptych (#whatTriptych)
         Fixed equal-width grid = zero downward title shift ever
     ========================================================= */
  function initWhatTriptych() {
    var deck = document.getElementById("whatTriptych");
    if (!deck) return;
    var panels = Array.prototype.slice.call(deck.querySelectorAll("[data-what-card]"));
    var beam = document.getElementById("whatBeam");
    if (!panels.length) return;

    function setActive(idx) {
      for (var i = 0; i < panels.length; i++) {
        panels[i].classList.toggle("is-expanded", i === idx);
      }
      if (beam) {
        beam.style.setProperty("--active-what", String(idx));
      }
    }

    for (var i = 0; i < panels.length; i++) {
      (function (idx, el) {
        el.addEventListener("pointerenter", function () {
          if (window.innerWidth > 960) setActive(idx);
        });
        el.addEventListener("click", function () {
          setActive(idx);
        });
      })(i, panels[i]);
    }
  }

  /* =========================================================
     3B. Chapter 03: Frameless 5-Plate Ecosystem Stage (#stageViewport)
         Exact 2nd-order critically damped oscillator (zeta=1, omega=15.5)
         Pure GPU transform + opacity (zero blur / filter reflow)
     ========================================================= */
  function shortestSignedDelta(idx, center, total) {
    var raw = ((idx - center) % total + total) % total;
    if (raw > total * 0.5) raw -= total;
    return raw;
  }

  function initTurntableStage() {
    var stage = document.getElementById("stageViewport");
    var ring = document.getElementById("stageDeck");
    var platform = document.getElementById("platform");
    if (!stage || !ring) return;

    var cards = Array.prototype.slice.call(ring.querySelectorAll("[data-ring-card]"));
    var metas = cards.map(function (c) { return c.querySelector(".plate-meta"); });
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-stage-tab]"));
    var total = cards.length;
    if (!total) return;

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var current = 0;
    var target = 0;
    var velocity = 0;
    var activeIdx = 0;
    var hoveredIdx = -1;
    var rafId = 0;
    var lastTime = 0;

    var pointerActive = false;
    var dragging = false;
    var didDrag = false;
    var pointerId = null;
    var startX = 0;
    var startY = 0;
    var lastX = 0;
    var lastMoveTime = 0;
    var downTime = 0;
    var downCardIdx = null;
    var dragVel = 0;
    var dragStartIdx = 0;

    function syncTabs(idx) {
      var mod = ((idx % total) + total) % total;
      activeIdx = mod;
      for (var t = 0; t < tabs.length; t++) {
        var tabIdx = parseInt(tabs[t].getAttribute("data-stage-tab"), 10);
        var match = tabIdx === mod;
        tabs[t].classList.toggle("is-active", match);
        tabs[t].setAttribute("aria-selected", match ? "true" : "false");
      }
      for (var c = 0; c < cards.length; c++) {
        cards[c].classList.toggle("is-center", c === mod);
      }
    }

    var cachedStageW = window.innerWidth;
    var cachedIsMobile = window.innerWidth <= 960;

    function measureStage() {
      cachedStageW = stage.clientWidth || window.innerWidth;
      cachedIsMobile = window.innerWidth <= 960;
    }

    function layoutRing() {
      var stageW = cachedStageW;
      var isMobile = cachedIsMobile;
      var rx = isMobile ? Math.round(stageW * 0.44) : Math.min(430, Math.round(stageW * 0.39));
      var stepAngle = (Math.PI * 2) / total;

      for (var i = 0; i < total; i++) {
        var delta = shortestSignedDelta(i, current, total);
        var theta = delta * stepAngle;
        var cosT = Math.cos(theta);
        var sinT = Math.sin(theta);
        var normFront = (cosT + 1) * 0.5;

        var isFlankHover = hoveredIdx === i && Math.abs(delta) > 0.25;
        var x = sinT * rx;
        // Center sits crisp at z = 0, scale = 1 (1:1 native UI rendering); flanking cards recede in depth
        var z = (normFront - 1) * (isMobile ? 120 : 175);
        var y = (1 - normFront) * (isMobile ? -8 : -12);
        var rotY = -sinT * (isMobile ? 11 : 14);
        var scale = (0.71 + 0.29 * normFront) + (isFlankHover ? 0.032 : 0);

        var dist = Math.abs(delta);
        var baseOpacity = dist < 0.05
          ? 1.0
          : Math.max(isMobile ? 0.16 : 0.46, (isMobile ? 0.52 : 0.78) - dist * (isMobile ? 0.30 : 0.26));
        var opacity = isFlankHover ? Math.min(0.95, baseOpacity + 0.22) : baseOpacity;
        var zIdx = Math.round((cosT + 2) * 20);

        var el = cards[i];
        el.style.transform =
          "translate3d(calc(-50% + " + x.toFixed(1) + "px), calc(-50% + " + y.toFixed(1) + "px), " + z.toFixed(1) + "px) " +
          "rotateY(" + rotY.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(zIdx);
        el.style.pointerEvents = cosT < -0.92 ? "none" : "auto";

        var meta = metas[i];
        if (meta) {
          meta.style.opacity = Math.max(0, Math.min(1, 1 - dist * 1.45)).toFixed(3);
        }
      }

      syncTabs(Math.round(current));
    }

    function stepPhysics(now) {
      rafId = 0;
      if (reducedMotion && !dragging) {
        current = target;
        velocity = 0;
        layoutRing();
        return;
      }
      if (!dragging) {
        var dt = lastTime ? Math.min(0.05, Math.max(0.004, (now - lastTime) * 0.001)) : 0.016;
        lastTime = now;
        // Analytical 2nd-order critically damped harmonic oscillator (zeta = 1, omega = 21)
        var omega = 21.0;
        var d0 = current - target;
        var expTerm = Math.exp(-omega * dt);
        var nextD = (d0 + (velocity + omega * d0) * dt) * expTerm;
        velocity = (velocity - omega * (velocity + omega * d0) * dt) * expTerm;
        current = target + nextD;
        layoutRing();
        if (Math.abs(nextD) > 0.0008 || Math.abs(velocity) > 0.004) {
          rafId = requestAnimationFrame(stepPhysics);
        } else {
          current = target;
          velocity = 0;
          lastTime = 0;
          layoutRing();
        }
      } else {
        layoutRing();
      }
    }

    function spinTo(idx) {
      var mod = ((idx % total) + total) % total;
      var delta = shortestSignedDelta(mod, Math.round(target), total);
      target = Math.round(target) + delta;
      syncTabs(mod);
      if (!rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(stepPhysics);
      }
    }

    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener("click", function () {
        spinTo(parseInt(this.getAttribute("data-stage-tab"), 10));
      });
    }

    for (var c = 0; c < cards.length; c++) {
      (function (idx, el) {
        el.addEventListener("pointerenter", function () {
          if (window.innerWidth <= 960) return;
          hoveredIdx = idx;
          if (!rafId && !dragging) layoutRing();
        });
        el.addEventListener("pointerleave", function () {
          if (hoveredIdx === idx) {
            hoveredIdx = -1;
            if (!rafId && !dragging) layoutRing();
          }
        });
        el.addEventListener("click", function (e) {
          if (didDrag) return;
          if (e.target && e.target.closest && e.target.closest("a, button")) return;
          if (idx !== activeIdx) {
            spinTo(idx);
          }
        });
      })(c, cards[c]);
    }

    stage.addEventListener("pointerdown", function (e) {
      if (e.target && e.target.closest && e.target.closest("a, button")) return;
      var cardEl = e.target && e.target.closest ? e.target.closest("[data-ring-card]") : null;
      pointerActive = true;
      dragging = false;
      didDrag = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastMoveTime = performance.now();
      downTime = lastMoveTime;
      downCardIdx = cardEl ? parseInt(cardEl.getAttribute("data-ring-card"), 10) : null;
      dragVel = 0;
      dragStartIdx = target;
      velocity = 0;
    });

    stage.addEventListener("pointermove", function (e) {
      if (!pointerActive || pointerId !== e.pointerId) return;
      var now = performance.now();
      var dx = e.clientX - startX;
      var dragThreshold = e.pointerType === "mouse" ? 18 : 8;
      if (!dragging && Math.abs(dx) > dragThreshold) {
        dragging = true;
        didDrag = true;
        stage.classList.add("is-dragging");
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      }
      if (!dragging) return;

      var dragScale = Math.max(220, (stage.clientWidth || 360) * 0.44);
      var moveDt = Math.max(0.008, (now - lastMoveTime) * 0.001);
      dragVel = ((e.clientX - lastX) / dragScale) / moveDt;
      lastX = e.clientX;
      lastMoveTime = now;
      current = dragStartIdx - dx / dragScale;
      target = current;
      layoutRing();
    });

    function endDrag(e) {
      if (!pointerActive || pointerId !== e.pointerId) return;
      pointerActive = false;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      var dist = Math.hypot(dx, dy);
      var elapsed = performance.now() - downTime;

      if (!dragging) {
        pointerId = null;
        return;
      }

      dragging = false;
      pointerId = null;
      stage.classList.remove("is-dragging");
      try { stage.releasePointerCapture(e.pointerId); } catch (err) {}

      if (dist < 26 && elapsed < 340 && downCardIdx !== null && downCardIdx !== activeIdx) {
        spinTo(downCardIdx);
        setTimeout(function () { didDrag = false; }, 60);
        return;
      }

      var dragScale = Math.max(220, (stage.clientWidth || 360) * 0.44);
      var projected = dragStartIdx - dx / dragScale - dragVel * 0.09;
      var snapped = Math.round(projected);
      if (Math.abs(dx) > 32 && snapped === Math.round(dragStartIdx)) {
        snapped = Math.round(dragStartIdx) + (dx < 0 ? 1 : -1);
      }

      target = snapped;
      velocity = Math.max(-18, Math.min(18, -dragVel));
      syncTabs(snapped);
      lastTime = performance.now();
      if (!rafId) rafId = requestAnimationFrame(stepPhysics);
      setTimeout(function () { didDrag = false; }, 60);
    }

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    document.addEventListener("keydown", function (e) {
      if (!platform || !platform.classList.contains("is-active")) return;
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        spinTo(activeIdx + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        spinTo(activeIdx - 1);
      }
    });

    var wheelLock = 0;
    stage.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 && Math.abs(e.deltaX) > 20) {
        e.preventDefault();
        var now = performance.now();
        if (now - wheelLock > 170) {
          wheelLock = now;
          spinTo(activeIdx + (e.deltaX > 0 ? 1 : -1));
        }
      }
    }, { passive: false });

    window.addEventListener("resize", function () {
      measureStage();
      layoutRing();
    }, { passive: true });
    measureStage();
    layoutRing();
  }

  /* =========================================================
     3C. Chapter 04: Mobile Founding Team Deck (#teamTrack)
     ========================================================= */
  function initTeamDeck() {
    var track = document.getElementById("teamTrack");
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-team-tab]"));
    var cards = track ? Array.prototype.slice.call(track.querySelectorAll("[data-team-card]")) : [];
    if (!track || !tabs.length || !cards.length) return;

    function syncTab(idx) {
      for (var t = 0; t < tabs.length; t++) {
        var match = t === idx;
        tabs[t].classList.toggle("is-active", match);
        tabs[t].setAttribute("aria-selected", match ? "true" : "false");
      }
    }

    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-team-tab"), 10);
        if (!cards[idx]) return;
        track.scrollTo({ left: cards[idx].offsetLeft, behavior: "smooth" });
        syncTab(idx);
      });
    }

    var raf = 0;
    track.addEventListener("scroll", function () {
      if (window.innerWidth > 960 || raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var w = Math.max(1, track.clientWidth);
        var idx = Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / w)));
        syncTab(idx);
      });
    }, { passive: true });
  }

  /* =========================================================
     4. Chapter Snap Sync & Liquid Rain Thread Rail (#rainRailCanvas)
     ========================================================= */
  function initChapterRail() {
    var rail = document.getElementById("chapterDots");
    var track = document.getElementById("dotsTrack");
    var rainCanvas = document.getElementById("rainRailCanvas");
    var stops = rail ? Array.prototype.slice.call(rail.querySelectorAll("[data-dot-index]")) : [];
    var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-chapter-link]"));
    var jumpLinks = Array.prototype.slice.call(document.querySelectorAll("[data-chapter-jump]"));
    var acts = Array.prototype.slice.call(document.querySelectorAll(".act[data-chapter]"));
    if (!acts.length) return;

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var current = 0;
    var scrubbing = false;
    var scrollAnimId = 0;

    // Continuous Raindrop Rail State
    var dropRatio = 0;
    var targetRatio = 0;
    var dropVel = 0;
    var ripples = [];
    var streaks = [
      { phase: 0.14, speed: 0.34, len: 0.14 },
      { phase: 0.49, speed: 0.27, len: 0.11 },
      { phase: 0.82, speed: 0.41, len: 0.16 }
    ];
    var ctx = rainCanvas ? rainCanvas.getContext("2d") : null;
    var cw = 0;
    var ch = 0;
    var dpr = 1;
    var lastFrame = 0;
    var lastRailDraw = 0;
    var railRafId = 0;
    var cachedPadTop = 18;
    var cachedRailSpan = 120;
    var cachedFirstTop = 0;
    var cachedActSpan = 1;
    var cachedLineGrad = null;
    var latestScrollY = window.scrollY;

    function measureRail() {
      if (track && stops.length) {
        var firstY = stops[0].offsetTop + stops[0].offsetHeight * 0.5;
        var lastY = stops[stops.length - 1].offsetTop + stops[stops.length - 1].offsetHeight * 0.5;
        cachedPadTop = firstY;
        cachedRailSpan = Math.max(20, lastY - firstY);
      }
      cachedFirstTop = acts[0].offsetTop;
      var lastTop = acts[acts.length - 1].offsetTop;
      cachedActSpan = Math.max(1, lastTop - cachedFirstTop);
      if (ctx && ch > 8) {
        var g = ctx.createLinearGradient(0, 4, 0, ch - 4);
        g.addColorStop(0, "rgba(140, 162, 155, 0)");
        g.addColorStop(0.16, "rgba(140, 162, 155, 0.22)");
        g.addColorStop(0.5, "rgba(244, 243, 239, 0.24)");
        g.addColorStop(0.84, "rgba(140, 162, 155, 0.22)");
        g.addColorStop(1, "rgba(140, 162, 155, 0)");
        cachedLineGrad = g;
      }
    }

    function computeScrollRatio() {
      return Math.max(0, Math.min(1, (latestScrollY - cachedFirstTop) / cachedActSpan));
    }

    function spawnRipple(ratio) {
      if (reducedMotion) return;
      ripples.push({ ratio: ratio, age: 0 });
      if (ripples.length > 4) ripples.shift();
    }

    function resizeRailCanvas() {
      if (!rainCanvas || !track) return;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cw = track.clientWidth || 28;
      ch = track.clientHeight || 180;
      rainCanvas.width = Math.round(cw * dpr);
      rainCanvas.height = Math.round(ch * dpr);
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measureRail();
    }

    function renderRail(now) {
      railRafId = 0;
      if (document.hidden) return;
      if (!ctx || !cw || !ch) {
        railRafId = requestAnimationFrame(renderRail);
        return;
      }

      if (!scrubbing) {
        targetRatio = computeScrollRatio();
      }

      var settled = Math.abs(dropRatio - targetRatio) < 0.001 && ripples.length === 0 && !scrubbing;
      if (!reducedMotion && settled && lastRailDraw && (now - lastRailDraw) < 32) {
        railRafId = requestAnimationFrame(renderRail);
        return;
      }
      lastRailDraw = now;

      var dt = lastFrame ? Math.min(0.05, Math.max(0.004, (now - lastFrame) * 0.001)) : 0.016;
      lastFrame = now;

      if (reducedMotion) {
        dropRatio = targetRatio;
        dropVel = 0;
      } else {
        var omega = 24;
        var d = dropRatio - targetRatio;
        var e = Math.exp(-omega * dt);
        dropRatio = targetRatio + (d + (dropVel + omega * d) * dt) * e;
        dropVel = (dropVel - omega * (dropVel + omega * d) * dt) * e;
      }

      var padTop = cachedPadTop;
      var span = cachedRailSpan;
      var cx = cw * 0.5;
      var dropY = padTop + dropRatio * span;

      rainCanvas.__dropY = dropY;
      ctx.clearRect(0, 0, cw, ch);

      // 1. Hairline tapered silver rain thread
      if (cachedLineGrad) {
        ctx.strokeStyle = cachedLineGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, 4);
        ctx.lineTo(cx, ch - 4);
        ctx.stroke();
      }

      // 2. Ambient descending micro-rain filaments
      if (!reducedMotion) {
        for (var s = 0; s < streaks.length; s++) {
          var st = streaks[s];
          st.phase = (st.phase + st.speed * dt) % 1;
          var yHead = 8 + st.phase * (ch - 16);
          var segLen = st.len * ch;
          var yTail = Math.max(4, yHead - segLen);
          var sg = ctx.createLinearGradient(0, yTail, 0, yHead);
          sg.addColorStop(0, "rgba(140, 162, 155, 0)");
          sg.addColorStop(0.75, "rgba(244, 243, 239, 0.34)");
          sg.addColorStop(1, "rgba(244, 243, 239, 0)");
          ctx.strokeStyle = sg;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(cx, yTail);
          ctx.lineTo(cx, yHead);
          ctx.stroke();
        }
      }

      // 3. Concentric water ripples at arrived chapter stops
      for (var r = ripples.length - 1; r >= 0; r--) {
        var rp = ripples[r];
        rp.age += dt;
        if (rp.age >= 0.72) {
          ripples.splice(r, 1);
          continue;
        }
        var t = rp.age / 0.72;
        var ry = padTop + rp.ratio * span;
        var rad = 3.5 + t * 10.5;
        ctx.strokeStyle = "rgba(244, 243, 239, " + ((1 - t) * 0.42).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, ry, rad, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Organic teardrop bead with velocity-responsive elongation
      var absVel = Math.min(4.5, Math.abs(dropVel));
      var signV = dropVel >= 0 ? 1 : -1;
      var rxDrop = Math.max(2.3, 3.2 - absVel * 0.16);
      var tailOffset = (4.6 + absVel * 4.4) * (-signV);
      var tipY = dropY + tailOffset * 1.45;
      var bellyY = dropY + signV * (1.2 + absVel * 0.45);

      var glow = ctx.createRadialGradient(cx, dropY, 1, cx, dropY, 11);
      glow.addColorStop(0, "rgba(244, 243, 239, 0.28)");
      glow.addColorStop(0.55, "rgba(140, 162, 155, 0.10)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, dropY, 11, 0, Math.PI * 2);
      ctx.fill();

      var dropGrad = ctx.createLinearGradient(cx, Math.min(tipY, bellyY - 3), cx, Math.max(tipY, bellyY + 4));
      dropGrad.addColorStop(0, "#FFFFFF");
      dropGrad.addColorStop(0.55, "#ECEBE6");
      dropGrad.addColorStop(1, "#8CA29B");
      ctx.fillStyle = dropGrad;
      ctx.beginPath();
      ctx.moveTo(cx, tipY);
      ctx.bezierCurveTo(
        cx + rxDrop * 0.65,
        dropY + tailOffset * 0.28,
        cx + rxDrop,
        bellyY - signV * rxDrop * 0.4,
        cx,
        bellyY + signV * rxDrop
      );
      ctx.bezierCurveTo(
        cx - rxDrop,
        bellyY - signV * rxDrop * 0.4,
        cx - rxDrop * 0.65,
        dropY + tailOffset * 0.28,
        cx,
        tipY
      );
      ctx.closePath();
      ctx.fill();

      railRafId = requestAnimationFrame(renderRail);
    }

    function cancelProgrammaticScroll() {
      if (scrollAnimId) {
        cancelAnimationFrame(scrollAnimId);
        scrollAnimId = 0;
        document.documentElement.classList.remove("is-programmatic-scroll");
      }
    }

    function smoothScrollToY(targetY, durationMs) {
      cancelProgrammaticScroll();
      if (reducedMotion || durationMs <= 0) {
        window.scrollTo({ top: targetY, behavior: "instant" });
        return;
      }
      var startY = window.scrollY;
      var deltaY = targetY - startY;
      if (Math.abs(deltaY) < 2) {
        window.scrollTo({ top: targetY, behavior: "instant" });
        return;
      }
      var tStart = performance.now();
      document.documentElement.classList.add("is-programmatic-scroll");

      function tick(now) {
        var elapsed = now - tStart;
        var p = Math.min(1, elapsed / durationMs);
        var eased = 1 - Math.pow(1 - p, 4);
        window.scrollTo(0, Math.round(startY + deltaY * eased));
        if (p < 1) {
          scrollAnimId = requestAnimationFrame(tick);
        } else {
          scrollAnimId = 0;
          window.scrollTo({ top: targetY, behavior: "instant" });
          document.documentElement.classList.remove("is-programmatic-scroll");
        }
      }
      scrollAnimId = requestAnimationFrame(tick);
    }

    window.addEventListener("wheel", cancelProgrammaticScroll, { passive: true });
    window.addEventListener("touchstart", cancelProgrammaticScroll, { passive: true });

    function sync(idx) {
      var prev = current;
      current = Math.max(0, Math.min(acts.length - 1, idx));
      for (var i = 0; i < acts.length; i++) {
        acts[i].classList.toggle("is-active", i === current);
      }
      for (var k = 0; k < navLinks.length; k++) {
        var target = parseInt(navLinks[k].getAttribute("data-chapter-link"), 10);
        navLinks[k].classList.toggle("is-current", target === current);
      }
      for (var s = 0; s < stops.length; s++) {
        stops[s].classList.toggle("is-active", s === current);
      }
      if (prev !== current && acts.length > 1) {
        spawnRipple(current / (acts.length - 1));
      }
    }

    function detectCenter() {
      var mid = window.innerHeight * 0.48;
      var best = 0;
      var bestDist = Infinity;
      for (var i = 0; i < acts.length; i++) {
        var r = acts[i].getBoundingClientRect();
        var dist = Math.abs((r.top + r.bottom) * 0.5 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      sync(best);
    }

    function scrollToChapter(idx, instant) {
      var safe = Math.max(0, Math.min(acts.length - 1, idx));
      var destTop = acts[safe].offsetTop;
      sync(safe);
      if (instant) {
        cancelProgrammaticScroll();
        window.scrollTo({ top: destTop, behavior: "instant" });
      } else {
        smoothScrollToY(destTop, 360);
      }
    }

    var raf = 0;
    window.addEventListener("scroll", function () {
      latestScrollY = window.scrollY;
      if (scrubbing) return;
      if (!raf) {
        raf = requestAnimationFrame(function () {
          raf = 0;
          detectCenter();
        });
      }
    }, { passive: true });

    window.addEventListener("resize", function () {
      latestScrollY = window.scrollY;
      detectCenter();
      resizeRailCanvas();
    }, { passive: true });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        measureRail();
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && rainCanvas && !railRafId) {
        lastFrame = 0;
        lastRailDraw = 0;
        railRafId = requestAnimationFrame(renderRail);
      }
    });

    for (var s = 0; s < stops.length; s++) {
      stops[s].addEventListener("click", function () {
        scrollToChapter(parseInt(this.getAttribute("data-dot-index"), 10), false);
      });
    }

    for (var k = 0; k < navLinks.length; k++) {
      navLinks[k].addEventListener("click", function (e) {
        var idx = parseInt(this.getAttribute("data-chapter-link"), 10);
        if (!isNaN(idx)) {
          e.preventDefault();
          scrollToChapter(idx, false);
        }
      });
    }

    for (var j = 0; j < jumpLinks.length; j++) {
      jumpLinks[j].addEventListener("click", function (e) {
        var idx = parseInt(this.getAttribute("data-chapter-jump"), 10);
        if (!isNaN(idx)) {
          e.preventDefault();
          scrollToChapter(idx, false);
        }
      });
    }

    if (rail && track) {
      var dragPending = false;
      var dragStartY = 0;

      function scrubY(clientY) {
        var rect = track.getBoundingClientRect();
        var relY = clientY - rect.top - cachedPadTop;
        var ratio = Math.max(0, Math.min(1, relY / cachedRailSpan));
        targetRatio = ratio;
        var scrollYTarget = Math.round(cachedFirstTop + ratio * cachedActSpan);
        latestScrollY = scrollYTarget;
        document.documentElement.classList.add("is-programmatic-scroll");
        window.scrollTo({ top: scrollYTarget, behavior: "instant" });
        sync(Math.round(ratio * (acts.length - 1)));
      }

      track.addEventListener("pointerdown", function (e) {
        cancelProgrammaticScroll();
        var onStop = e.target && e.target.closest && e.target.closest(".dot-stop");
        dragStartY = e.clientY;
        if (onStop) {
          dragPending = true;
          return;
        }
        scrubbing = true;
        rail.classList.add("is-dragging");
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
        scrubY(e.clientY);
      });

      track.addEventListener("pointermove", function (e) {
        if (dragPending && Math.abs(e.clientY - dragStartY) > 5) {
          dragPending = false;
          scrubbing = true;
          rail.classList.add("is-dragging");
          try { track.setPointerCapture(e.pointerId); } catch (err) {}
        }
        if (!scrubbing) return;
        scrubY(e.clientY);
      });

      function endScrub(e) {
        dragPending = false;
        if (!scrubbing) return;
        scrubbing = false;
        rail.classList.remove("is-dragging");
        document.documentElement.classList.remove("is-programmatic-scroll");
        try { track.releasePointerCapture(e.pointerId); } catch (err) {}
        var snappedIdx = Math.round(targetRatio * (acts.length - 1));
        scrollToChapter(snappedIdx, false);
      }

      track.addEventListener("pointerup", endScrub);
      track.addEventListener("pointercancel", endScrub);
    }

    document.addEventListener("keydown", function (e) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(tag)) return;
      var drawer = document.getElementById("mobileDrawer");
      if (drawer && !drawer.hidden) return;
      if (e.key === "PageDown" || (e.key === "ArrowDown" && !e.altKey)) {
        if (current < acts.length - 1) {
          e.preventDefault();
          scrollToChapter(current + 1, false);
        }
      } else if (e.key === "PageUp" || (e.key === "ArrowUp" && !e.altKey)) {
        if (current > 0) {
          e.preventDefault();
          scrollToChapter(current - 1, false);
        }
      }
    });

    resizeRailCanvas();
    detectCenter();
    latestScrollY = window.scrollY;
    dropRatio = computeScrollRatio();
    targetRatio = dropRatio;
    if (rainCanvas) {
      railRafId = requestAnimationFrame(renderRail);
    }
  }

  /* =========================================================
     5. Mobile Drawer & Language Memory
     ========================================================= */
  function initMobileDrawer() {
    var toggle = document.getElementById("navToggle");
    var drawer = document.getElementById("mobileDrawer");
    var closeBtn = document.getElementById("drawerClose");
    if (!toggle || !drawer) return;

    var links = drawer.querySelectorAll("a[href]");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      drawer.setAttribute("aria-hidden", open ? "false" : "true");
      drawer.hidden = !open;
      document.documentElement.style.overflow = open ? "hidden" : "";
      if (open && closeBtn) closeBtn.focus();
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        setOpen(false);
        if (e.detail === 0) toggle.focus();
      });
    }

    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        setOpen(false);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !drawer.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 960 && !drawer.hidden) {
        setOpen(false);
      }
    }, { passive: true });
  }

  function initLanguageChoice() {
    var links = document.querySelectorAll("a[hreflang]");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function () {
        var lang = String(this.getAttribute("hreflang") || "").toLowerCase();
        var choice = lang.indexOf("zh") === 0 ? "zh" : "en";
        var domain =
          location.hostname === "realrain.co" || location.hostname.slice(-12) === ".realrain.co"
            ? "; Domain=.realrain.co"
            : "";
        var secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie =
          "rr_lang=" + choice + "; Max-Age=31536000; Path=/; SameSite=Lax" + domain + secure;
      });
    }
  }

  initVolumetricBackdrop();
  initOrbSculpture();
  initWhatTriptych();
  initTurntableStage();
  initTeamDeck();
  initChapterRail();
  initMobileDrawer();
  initLanguageChoice();
})();
