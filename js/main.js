(function () {
  "use strict";

  document.documentElement.classList.add("js-ready");

  /* =========================================================
     1. WebGL Volumetric Liquid Aurora & Caustic Ripple Shader
        (with seamless 2D Canvas atmospheric fallback)
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
        "  // Caustic ribbon highlight",
        "  float ribbon = smoothstep(0.42, 0.78, f);",
        "  float filament = pow(smoothstep(0.55, 0.88, f), 2.2);",
        "",
        "  // Interactive shockwave ripple",
        "  vec2 rp = (uv - uRipple) * vec2(aspect, 1.0);",
        "  float rd = length(rp);",
        "  float wave = 0.0;",
        "  if (uRippleAge >= 0.0 && uRippleAge < 2.2) {",
        "    float radius = uRippleAge * 0.55;",
        "    wave = exp(-abs(rd - radius) * 28.0) * exp(-uRippleAge * 1.4) * 0.35;",
        "  }",
        "",
        "  vec3 baseObsidian = vec3(0.016, 0.024, 0.022);",
        "  vec3 deepCeladon = vec3(0.085, 0.160, 0.145);",
        "  vec3 silkMist = vec3(0.34, 0.48, 0.44);",
        "",
        "  vec3 col = mix(baseObsidian, deepCeladon, ribbon * 0.94);",
        "  col += silkMist * (filament * 0.28 + wave);",
        "  col += vec3(0.20, 0.29, 0.27) * exp(-md * 2.8) * 0.24;",
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
          state.scroll += (state.scrollTarget - state.scroll) * 0.08;
          state.mx += (state.mxTarget - state.mx) * 0.08;
          state.my += (state.myTarget - state.my) * 0.08;

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

    // Fallback 2D atmospheric canvas if WebGL is unavailable
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
      ctx.fillStyle = "#040606";
      ctx.fillRect(0, 0, w, h);
      var g = ctx.createRadialGradient(w * state.mxTarget, h * (1 - state.myTarget), 20, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
      g.addColorStop(0, "rgba(112, 143, 136, 0.22)");
      g.addColorStop(0.55, "rgba(42, 68, 63, 0.08)");
      g.addColorStop(1, "rgba(4, 6, 6, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      if (!reducedMotion) requestAnimationFrame(draw2D);
    }
    draw2D();
  }

  /* =========================================================
     2. Interactive 3D RealRain Parametric Dot-Wave Sculpture (#orbCanvas)
        Derived from RealRain's 19x19 Concentric Logo Matrix
     ========================================================= */
  function initOrbSculpture() {
    var canvas = document.getElementById("orbCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 19x19 circular brand dot grid
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

    var rotX = 0.22;
    var rotY = -0.28;
    var targetX = 0.22;
    var targetY = -0.28;
    var pulse = 0;
    var dragging = false;
    var lastPX = 0;
    var lastPY = 0;

    canvas.addEventListener("pointerdown", function (e) {
      dragging = true;
      lastPX = e.clientX;
      lastPY = e.clientY;
      pulse = 1.0;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });

    canvas.addEventListener("pointermove", function (e) {
      if (dragging) {
        targetY += (e.clientX - lastPX) * 0.008;
        targetX += (e.clientY - lastPY) * 0.008;
        lastPX = e.clientX;
        lastPY = e.clientY;
      } else {
        var r = canvas.getBoundingClientRect();
        var lx = (e.clientX - r.left) / Math.max(1, r.width) - 0.5;
        var ly = (e.clientY - r.top) / Math.max(1, r.height) - 0.5;
        targetY = -0.28 + lx * 0.55;
        targetX = 0.22 + ly * 0.45;
      }
    });

    window.addEventListener("pointerup", function () {
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

      rotX += (targetX - rotX) * 0.07;
      rotY += (targetY - rotY) * 0.07;
      pulse *= 0.93;

      var t = reducedMotion ? 0 : performance.now() * 0.0018;
      var radius = Math.min(w, h) * 0.38;
      var cx = w * 0.5;
      var cy = h * 0.5;

      var cosY = Math.cos(rotY);
      var sinY = Math.sin(rotY);
      var cosX = Math.cos(rotX);
      var sinX = Math.sin(rotX);

      // Ambient halo behind sculpture
      var halo = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * 1.25);
      halo.addColorStop(0, "rgba(164, 200, 191, 0.20)");
      halo.addColorStop(0.6, "rgba(112, 143, 136, 0.06)");
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

        // Rotate Y then X
        var x1 = pt.nx * cosY + nz * sinY;
        var z1 = -pt.nx * sinY + nz * cosY;
        var y2 = pt.ny * cosX - z1 * sinX;
        var z2 = pt.ny * sinX + z1 * cosX;

        var persp = 2.6 / (2.6 - z2);
        projected.push({
          sx: cx + x1 * radius * persp,
          sy: cy + y2 * radius * persp,
          r: Math.max(0.7, pt.baseR * (radius * 0.032) * persp),
          z: z2,
          alpha: Math.min(0.96, Math.max(0.16, (0.45 + z2 * 0.55) * pt.baseR + pulse * 0.2))
        });
      }

      projected.sort(function (a, b) { return a.z - b.z; });

      for (var j = 0; j < projected.length; j++) {
        var p = projected[j];
        var mixLight = Math.max(0, Math.min(1, p.z + 0.4));
        var rCol = Math.round(112 + mixLight * 110);
        var gCol = Math.round(143 + mixLight * 98);
        var bCol = Math.round(136 + mixLight * 96);
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
     3. 3D Coverflow Stage in Chapter 03 (#stageDeck)
     ========================================================= */
  function initStageDeck() {
    var viewport = document.getElementById("stageViewport");
    var deck = document.getElementById("stageDeck");
    var cards = deck ? Array.prototype.slice.call(deck.querySelectorAll(".stage-card")) : [];
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-stage-tab]"));
    if (!viewport || !cards.length) return;

    var total = cards.length;
    var active = 0;

    function applyPositions(idx) {
      active = ((idx % total) + total) % total;
      var leftIdx = (active - 1 + total) % total;
      var rightIdx = (active + 1) % total;

      for (var i = 0; i < cards.length; i++) {
        var pos = i === active ? "center" : (i === rightIdx ? "right" : "left");
        cards[i].setAttribute("data-pos", pos);
      }

      for (var t = 0; t < tabs.length; t++) {
        var isMatch = parseInt(tabs[t].getAttribute("data-stage-tab"), 10) === active;
        tabs[t].classList.toggle("is-active", isMatch);
        tabs[t].setAttribute("aria-selected", isMatch ? "true" : "false");
      }
    }

    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-stage-idx"), 10);
        if (idx !== active) applyPositions(idx);
      });
    }

    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener("click", function () {
        applyPositions(parseInt(this.getAttribute("data-stage-tab"), 10));
      });
    }

    // Horizontal swipe/drag gesture to rotate 3D deck
    var pointerId = null;
    var startX = 0;
    var dragged = false;

    deck.addEventListener("pointerdown", function (e) {
      pointerId = e.pointerId;
      startX = e.clientX;
      dragged = false;
      deck.classList.add("is-dragging");
      try { deck.setPointerCapture(e.pointerId); } catch (err) {}
    });

    deck.addEventListener("pointermove", function (e) {
      if (pointerId !== e.pointerId) return;
      if (Math.abs(e.clientX - startX) > 28) dragged = true;
    });

    function onEnd(e) {
      if (pointerId !== e.pointerId) return;
      var dx = e.clientX - startX;
      pointerId = null;
      deck.classList.remove("is-dragging");
      try { deck.releasePointerCapture(e.pointerId); } catch (err) {}

      if (Math.abs(dx) > 36) {
        applyPositions(dx < 0 ? active + 1 : active - 1);
      }
    }

    deck.addEventListener("pointerup", onEnd);
    deck.addEventListener("pointercancel", onEnd);
    deck.addEventListener("click", function (e) {
      if (dragged) {
        e.stopPropagation();
        dragged = false;
      }
    }, true);

    applyPositions(0);
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
     5. Cursor Spotlight + 3D Perspective Tilt + Magnetic CTAs
     ========================================================= */
  function initGlassEffects() {
    var finePointer = window.matchMedia("(pointer: fine)").matches;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduced) return;

    var spotlights = document.querySelectorAll(".spotlight");
    for (var i = 0; i < spotlights.length; i++) {
      (function (el) {
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          var x = e.clientX - r.left;
          var y = e.clientY - r.top;
          el.style.setProperty("--mx", x.toFixed(1) + "px");
          el.style.setProperty("--my", y.toFixed(1) + "px");

          if (el.classList.contains("tilt-card")) {
            var rx = ((y / r.height) - 0.5) * -7;
            var ry = ((x / r.width) - 0.5) * 8;
            el.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-2px)";
          }
        });
        el.addEventListener("pointerleave", function () {
          if (el.classList.contains("tilt-card")) {
            el.style.transform = "";
          }
        });
      })(spotlights[i]);
    }

    var magnetics = document.querySelectorAll(".magnetic");
    for (var m = 0; m < magnetics.length; m++) {
      (function (el) {
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left - r.width * 0.5) * 0.16;
          var y = (e.clientY - r.top - r.height * 0.5) * 0.16;
          el.style.transform = "translate3d(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px, 0)";
        });
        el.addEventListener("pointerleave", function () {
          el.style.transform = "";
        });
      })(magnetics[m]);
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
  initStageDeck();
  initChapterRail();
  initGlassEffects();
  initMobileDrawer();
  initLanguageChoice();
})();
