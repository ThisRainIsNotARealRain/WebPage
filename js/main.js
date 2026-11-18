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

    window.addEventListener("pointermove", function (e) {
      state.mxTarget = e.clientX / Math.max(1, window.innerWidth);
      state.myTarget = 1.0 - e.clientY / Math.max(1, window.innerHeight);
    }, { passive: true });

    window.addEventListener("pointerdown", function (e) {
      state.rx = e.clientX / Math.max(1, window.innerWidth);
      state.ry = 1.0 - e.clientY / Math.max(1, window.innerHeight);
      state.rippleT = performance.now() * 0.001;
    }, { passive: true });

    function updateScrollTarget() {
      var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      state.scrollTarget = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    }
    window.addEventListener("scroll", updateScrollTarget, { passive: true });
    updateScrollTarget();

    var gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" }) ||
             canvas.getContext("experimental-webgl", { alpha: false, antialias: false });

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
        "  float a = 0.5;",
        "  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);",
        "  for (int i = 0; i < 4; i++) {",
        "    v += a * noise(p);",
        "    p = rot * p * 2.02;",
        "    a *= 0.5;",
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
        "  float ribbon = smoothstep(0.42, 0.78, f);",
        "  float filament = pow(smoothstep(0.56, 0.88, f), 2.2);",
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
          var scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;
          canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
          canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
          gl.viewport(0, 0, canvas.width, canvas.height);
        };
        window.addEventListener("resize", resizeGL, { passive: true });
        resizeGL();

        var startT = performance.now();
        var drawGL = function () {
          var nowSec = performance.now() * 0.001;
          state.scroll += (state.scrollTarget - state.scroll) * 0.14;
          state.mx += (state.mxTarget - state.mx) * 0.14;
          state.my += (state.myTarget - state.my) * 0.14;

          gl.uniform2f(uRes, canvas.width, canvas.height);
          gl.uniform1f(uTime, reducedMotion ? 1.5 : (performance.now() - startT) * 0.001);
          gl.uniform2f(uMouse, state.mx, state.my);
          gl.uniform1f(uScroll, state.scroll);
          gl.uniform2f(uRipple, state.rx, state.ry);
          gl.uniform1f(uRippleAge, state.rippleT > 0 ? nowSec - state.rippleT : -1.0);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

          if (!reducedMotion) {
            requestAnimationFrame(drawGL);
          }
        };
        drawGL();
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
    var lastPX = 0;
    var lastPY = 0;

    canvas.addEventListener("pointerdown", function (e) {
      dragging = true;
      lastPX = e.clientX;
      lastPY = e.clientY;
      velX = 0;
      velY = 0;
      pulse = 1.0;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });

    window.addEventListener("pointermove", function (e) {
      if (dragging) {
        var dx = e.clientX - lastPX;
        var dy = e.clientY - lastPY;
        targetY += dx * 0.009;
        targetX += dy * 0.009;
        velY = dx * 0.0045;
        velX = dy * 0.0035;
        lastPX = e.clientX;
        lastPY = e.clientY;
      } else if (visible && e.pointerType !== "touch") {
        var r = canvas.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var orbCX = r.left + r.width * 0.5;
        var orbCY = r.top + r.height * 0.5;
        var spanX = Math.max(260, window.innerWidth * 0.52);
        var spanY = Math.max(220, window.innerHeight * 0.48);
        gazeX = Math.max(-1, Math.min(1, (e.clientX - orbCX) / spanX));
        gazeY = Math.max(-1, Math.min(1, (e.clientY - orbCY) / spanY));
        // Front hemisphere has nz > 0; x1 = nx*cosY + nz*sinY, y2 = ny*cosX - z1*sinX
        // So targetY = +gazeX turns the front dome horizontally toward the cursor,
        // and targetX = -gazeY tilts it vertically toward the cursor!
        targetY = gazeX * 0.68;
        targetX = -gazeY * 0.56;
        velX *= 0.2;
        velY *= 0.2;
      }
    }, { passive: true });

    window.addEventListener("pointerup", function () {
      dragging = false;
    });
    window.addEventListener("pointercancel", function () {
      dragging = false;
    });

    var w = 0;
    var h = 0;
    var dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth || 320;
      h = canvas.clientHeight || 320;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();

    var visible = true;
    var rafId = 0;
    var hero = document.getElementById("top");
    if (hero && typeof IntersectionObserver === "function") {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !reducedMotion && !rafId) render();
      }, { threshold: 0.05 }).observe(hero);
    }

    function render() {
      rafId = 0;
      ctx.clearRect(0, 0, w, h);

      if (!dragging) {
        targetY += velY;
        targetX += velX;
        velY *= 0.92;
        velX *= 0.92;
      }

      rotX += (targetX - rotX) * 0.18;
      rotY += (targetY - rotY) * 0.18;
      pulse *= 0.92;

      canvas.dataset.rotX = rotX.toFixed(3);
      canvas.dataset.rotY = rotY.toFixed(3);

      var t = reducedMotion ? 0 : performance.now() * 0.0018;
      var radius = Math.min(w, h) * 0.38;
      var cx = w * 0.5;
      var cy = h * 0.5;

      var cosY = Math.cos(rotY);
      var sinY = Math.sin(rotY);
      var cosX = Math.cos(rotX);
      var sinX = Math.sin(rotX);

      var halo = ctx.createRadialGradient(
        cx + gazeX * radius * 0.26,
        cy + gazeY * radius * 0.26,
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

      var projected = [];
      for (var i = 0; i < points.length; i++) {
        var pt = points[i];
        var wave = Math.sin(pt.dist * 6.4 - t) * 0.12 + Math.sin(pt.dist * 10 - t * 1.8) * pulse * 0.18;
        var nz = Math.sqrt(Math.max(0.0, 1.0 - pt.dist * pt.dist * 0.65)) * 0.42 + wave;

        var x1 = pt.nx * cosY + nz * sinY;
        var z1 = -pt.nx * sinY + nz * cosY;
        var y2 = pt.ny * cosX - z1 * sinX;
        var z2 = pt.ny * sinX + z1 * cosX;

        var persp = 2.6 / (2.6 - z2);
        var cursorLit = Math.max(0, (x1 * gazeX + y2 * gazeY) * 0.28);
        projected.push({
          sx: cx + x1 * radius * persp,
          sy: cy + y2 * radius * persp,
          r: Math.max(0.7, pt.baseR * (radius * 0.032) * persp),
          z: z2,
          lit: cursorLit,
          alpha: Math.min(0.96, Math.max(0.16, (0.45 + z2 * 0.55) * pt.baseR + pulse * 0.2 + cursorLit * 0.28))
        });
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

      if (visible && !reducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    }

    render();
  }

  /* =========================================================
     3A. Chapter 02: Kinetic Architectural Triptych (#whatTriptych)
     ========================================================= */
  function initWhatTriptych() {
    var deck = document.getElementById("whatTriptych");
    if (!deck) return;
    var panels = Array.prototype.slice.call(deck.querySelectorAll("[data-what-card]"));
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-what-tab]"));
    if (!panels.length) return;

    function setActive(idx, scrollMobile) {
      for (var i = 0; i < panels.length; i++) {
        panels[i].classList.toggle("is-expanded", i === idx);
      }
      for (var t = 0; t < tabs.length; t++) {
        var match = t === idx;
        tabs[t].classList.toggle("is-active", match);
        tabs[t].setAttribute("aria-selected", match ? "true" : "false");
      }
      if (scrollMobile && window.innerWidth <= 960 && panels[idx]) {
        deck.scrollTo({ left: panels[idx].offsetLeft, behavior: "smooth" });
      }
    }

    for (var i = 0; i < panels.length; i++) {
      (function (idx, el) {
        el.addEventListener("pointerenter", function () {
          if (window.innerWidth > 960) setActive(idx, false);
        });
        el.addEventListener("focus", function () {
          setActive(idx, false);
        });
        el.addEventListener("click", function () {
          setActive(idx, false);
        });
      })(i, panels[i]);
    }

    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener("click", function () {
        setActive(parseInt(this.getAttribute("data-what-tab"), 10), true);
      });
    }

    var raf = 0;
    deck.addEventListener("scroll", function () {
      if (window.innerWidth > 960 || raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var w = Math.max(1, deck.clientWidth);
        var idx = Math.max(0, Math.min(panels.length - 1, Math.round(deck.scrollLeft / w)));
        setActive(idx, false);
      });
    }, { passive: true });
  }

  /* =========================================================
     3B. Chapter 03: Click-First 360° 3D Turntable (#stageViewport)
         Critical exponential damping = zero overshoot / zero wobble
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
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-stage-tab]"));
    var total = cards.length;
    if (!total) return;

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var current = 0;
    var target = 0;
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

    function layoutRing() {
      var stageW = stage.clientWidth || window.innerWidth;
      var isMobile = window.innerWidth <= 960;
      var rx = isMobile ? Math.round(stageW * 0.44) : Math.min(418, Math.round(stageW * 0.375));
      var rz = isMobile ? 110 : 140;
      var maxTilt = isMobile ? 13 : 15;
      var stepAngle = (Math.PI * 2) / total;

      for (var i = 0; i < total; i++) {
        var delta = shortestSignedDelta(i, current, total);
        var theta = delta * stepAngle;
        var cosT = Math.cos(theta);
        var sinT = Math.sin(theta);

        var isFlankHover = hoveredIdx === i && Math.abs(delta) > 0.25 && cosT >= -0.35;
        var x = sinT * rx;
        // Center card sits at +rz, flanking cards sit at z = 0 (never behind z=0 plane),
        // keeping 3D hit-testing unambiguous on every exposed flanking card!
        var z = cosT * rz;
        var rotY = -sinT * maxTilt;
        var scale = 0.72 + 0.185 * ((cosT + 1) * 0.5) + (isFlankHover ? 0.024 : 0);

        var dist = Math.abs(delta);
        var opacity = cosT < -0.25
          ? 0.08
          : isFlankHover
            ? 0.90
            : Math.max(0.18, 1.0 - dist * (isMobile ? 0.58 : 0.30));
        var bright = isFlankHover ? 0.95 : (0.80 + 0.20 * Math.max(0, cosT));
        var zIdx = Math.round((cosT + 2) * 20);

        var el = cards[i];
        el.style.transform =
          "translate3d(calc(-50% + " + x.toFixed(1) + "px), -50%, " + z.toFixed(1) + "px) " +
          "rotateY(" + rotY.toFixed(2) + "deg) scale(" + scale.toFixed(3) + ")";
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(zIdx);
        el.style.filter = "brightness(" + bright.toFixed(2) + ")";
        el.style.pointerEvents = cosT < -0.35 ? "none" : "auto";
      }

      syncTabs(Math.round(current));
    }

    function stepPhysics(now) {
      rafId = 0;
      if (reducedMotion && !dragging) {
        current = target;
        layoutRing();
        return;
      }
      if (!dragging) {
        var dt = lastTime ? Math.min(0.05, Math.max(0.004, (now - lastTime) * 0.001)) : 0.016;
        lastTime = now;
        // Fast monotonic exponential critical damping: glides cleanly in ~200ms with 0% overshoot
        var alpha = 1 - Math.exp(-20 * dt);
        current += (target - current) * alpha;
        layoutRing();
        if (Math.abs(target - current) > 0.0012) {
          rafId = requestAnimationFrame(stepPhysics);
        } else {
          current = target;
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

    // Hover lift + direct click on any visible background card rotates straight to it
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
      downTime = performance.now();
      downCardIdx = cardEl ? parseInt(cardEl.getAttribute("data-ring-card"), 10) : null;
      dragVel = 0;
      dragStartIdx = target;
    });

    stage.addEventListener("pointermove", function (e) {
      if (!pointerActive || pointerId !== e.pointerId) return;
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
      dragVel = (e.clientX - lastX) / dragScale;
      lastX = e.clientX;
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
      var projected = dragStartIdx - dx / dragScale - dragVel * 0.55;
      var snapped = Math.round(projected);
      if (Math.abs(dx) > 32 && snapped === Math.round(dragStartIdx)) {
        snapped = Math.round(dragStartIdx) + (dx < 0 ? 1 : -1);
      }

      target = snapped;
      syncTabs(snapped);
      lastTime = performance.now();
      if (!rafId) rafId = requestAnimationFrame(stepPhysics);
      setTimeout(function () { didDrag = false; }, 60);
    }

    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    // Left / Right keyboard navigation when Chapter 03 is active
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
        if (now - wheelLock > 180) {
          wheelLock = now;
          spinTo(activeIdx + (e.deltaX > 0 ? 1 : -1));
        }
      }
    }, { passive: false });

    window.addEventListener("resize", layoutRing, { passive: true });
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
     4. Chapter Snap Sync & Draggable Dots Rail
     ========================================================= */
  function initChapterRail() {
    var rail = document.getElementById("chapterDots");
    var track = document.getElementById("dotsTrack");
    var indicator = document.getElementById("dotsIndicator");
    var stops = rail ? Array.prototype.slice.call(rail.querySelectorAll("[data-dot-index]")) : [];
    var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-chapter-link]"));
    var acts = Array.prototype.slice.call(document.querySelectorAll(".act[data-chapter]"));
    if (!acts.length) return;

    var current = 0;
    var scrubbing = false;

    function sync(idx) {
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
      if (track && indicator && !scrubbing) {
        var travel = Math.max(0, track.clientHeight - indicator.offsetHeight - 8);
        var ratio = acts.length > 1 ? current / (acts.length - 1) : 0;
        indicator.style.transform = "translate(-50%, " + (ratio * travel).toFixed(1) + "px)";
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
      window.scrollTo({
        top: acts[safe].offsetTop,
        behavior: instant ? "instant" : "smooth"
      });
      sync(safe);
    }

    var raf = 0;
    window.addEventListener("scroll", function () {
      if (scrubbing) return;
      if (!raf) {
        raf = requestAnimationFrame(function () {
          raf = 0;
          detectCenter();
        });
      }
    }, { passive: true });

    window.addEventListener("resize", detectCenter, { passive: true });

    for (var s = 0; s < stops.length; s++) {
      stops[s].addEventListener("click", function () {
        scrollToChapter(parseInt(this.getAttribute("data-dot-index"), 10), false);
      });
    }

    if (rail && track && indicator) {
      var dragPending = false;
      var dragStartY = 0;

      function scrubY(clientY) {
        var rect = track.getBoundingClientRect();
        var ratio = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)));
        var travel = Math.max(0, track.clientHeight - indicator.offsetHeight - 8);
        indicator.style.transform = "translate(-50%, " + (ratio * travel).toFixed(1) + "px)";
        var target = Math.round(ratio * (acts.length - 1));
        if (target !== current) scrollToChapter(target, true);
      }

      track.addEventListener("pointerdown", function (e) {
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
        if (dragPending && Math.abs(e.clientY - dragStartY) > 6) {
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
        try { track.releasePointerCapture(e.pointerId); } catch (err) {}
        sync(current);
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

    detectCenter();
  }

  /* =========================================================
     5. Cursor Proximity Glow (Zero Wobble)
     ========================================================= */
  function initGlassEffects() {
    var finePointer = window.matchMedia("(pointer: fine)").matches;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduced) return;

    var surfaces = document.querySelectorAll(".spotlight, .proximity-rim");
    for (var i = 0; i < surfaces.length; i++) {
      (function (el) {
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          el.style.setProperty("--mx", (e.clientX - r.left).toFixed(1) + "px");
          el.style.setProperty("--my", (e.clientY - r.top).toFixed(1) + "px");
        });
      })(surfaces[i]);
    }
  }

  /* =========================================================
     6. Mobile Drawer & Language Memory
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
  initGlassEffects();
  initMobileDrawer();
  initLanguageChoice();
})();
