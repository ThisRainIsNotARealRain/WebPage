(function () {
  "use strict";

  document.documentElement.classList.add("js-ready");

  function initRainCanvas() {
    var canvas = document.getElementById("rainCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var visible = true;
    var rafId = 0;

    var windTarget = -0.14;
    var windCurrent = -0.14;
    var dragging = false;
    var lastRippleAt = 0;

    var drops = [];
    var ripples = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth || window.innerWidth;
      height = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = width < 640 ? 44 : 74;
      if (drops.length !== count) {
        drops = [];
        for (var i = 0; i < count; i++) {
          drops.push({
            x: Math.random() * width,
            y: Math.random() * height,
            len: 32 + Math.random() * 64,
            speed: 3.4 + Math.random() * 5.2,
            alpha: 0.14 + Math.random() * 0.24
          });
        }
      }
    }

    function spawnRipple(x, y, strength) {
      ripples.push({
        x: x,
        y: Math.max(height * 0.42, y),
        r: 4,
        maxR: 60 + strength * 70,
        alpha: 0.34,
        speed: 1.4 + strength * 0.9
      });
      if (ripples.length > 18) {
        ripples.shift();
      }
    }

    var hero = document.getElementById("top");
    if (hero) {
      hero.addEventListener("pointermove", function (e) {
        var nx = (e.clientX / Math.max(1, width)) - 0.5;
        windTarget = -0.14 + nx * 0.42;
        if (dragging) {
          var now = performance.now();
          if (now - lastRippleAt > 65) {
            spawnRipple(e.clientX, e.clientY, 1);
            lastRippleAt = now;
          }
        }
      }, { passive: true });

      hero.addEventListener("pointerdown", function (e) {
        if (e.target.closest("a, button")) return;
        if (window.getSelection) {
          var sel = window.getSelection();
          if (sel && sel.removeAllRanges) sel.removeAllRanges();
        }
        dragging = true;
        spawnRipple(e.clientX, e.clientY, 1.3);
        lastRippleAt = performance.now();
      });

      window.addEventListener("pointerup", function () {
        dragging = false;
      });
    }

    function drawFrame() {
      ctx.clearRect(0, 0, width, height);
      windCurrent += (windTarget - windCurrent) * 0.06;

      // Ambient horizon water plane
      var horizonY = height * 0.72;
      var grad = ctx.createRadialGradient(
        width * 0.52,
        horizonY,
        20,
        width * 0.52,
        horizonY,
        Math.max(width, height) * 0.65
      );
      grad.addColorStop(0, "rgba(112, 143, 136, 0.14)");
      grad.addColorStop(0.55, "rgba(112, 143, 136, 0.04)");
      grad.addColorStop(1, "rgba(9, 11, 10, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Diagonal silver-celadon rain threads
      ctx.lineWidth = 1;
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        var dx = d.len * windCurrent;
        ctx.strokeStyle = "rgba(182, 206, 200, " + d.alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + dx, d.y + d.len);
        ctx.stroke();

        if (!reducedMotion) {
          d.x += d.speed * windCurrent * 0.7;
          d.y += d.speed;
          if (d.y > height + 40 || d.x < -80 || d.x > width + 80) {
            d.y = -d.len - Math.random() * 60;
            d.x = Math.random() * (width + 120) - 60;
            if (Math.random() < 0.08 && ripples.length < 10) {
              spawnRipple(d.x, horizonY + Math.random() * (height - horizonY - 24), 0.35);
            }
          }
        }
      }

      // Elliptical ripples along horizon plane
      for (var j = ripples.length - 1; j >= 0; j--) {
        var rp = ripples[j];
        ctx.strokeStyle = "rgba(162, 190, 183, " + rp.alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.24, 0, 0, Math.PI * 2);
        ctx.stroke();

        rp.r += rp.speed;
        rp.alpha *= 0.965;
        if (rp.r >= rp.maxR || rp.alpha < 0.015) {
          ripples.splice(j, 1);
        }
      }
    }

    function loop() {
      if (visible && !reducedMotion) {
        drawFrame();
        rafId = window.requestAnimationFrame(loop);
      }
    }

    if (typeof IntersectionObserver === "function" && hero) {
      var obs = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !reducedMotion && !rafId) {
          loop();
        } else if (!visible && rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
      }, { threshold: 0.05 });
      obs.observe(hero);
    }

    window.addEventListener("resize", function () {
      resize();
      if (reducedMotion) drawFrame();
    }, { passive: true });

    resize();
    drawFrame();
    if (!reducedMotion) {
      loop();
    }
  }

  function initChapterSnapAndRail() {
    var header = document.getElementById("siteHeader");
    var rail = document.getElementById("chapterRail");
    var railTrack = document.getElementById("railTrack");
    var railThumb = document.getElementById("railThumb");
    var railReadout = document.getElementById("railReadout");
    var railTooltip = document.getElementById("railTooltip");
    var stops = rail ? Array.prototype.slice.call(rail.querySelectorAll("[data-rail-index]")) : [];
    var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-chapter-link]"));
    var acts = Array.prototype.slice.call(document.querySelectorAll(".act[data-chapter]"));
    if (!acts.length) return;

    var currentIdx = 0;
    var scrubbing = false;

    function updateChrome(idx) {
      currentIdx = Math.max(0, Math.min(acts.length - 1, idx));
      var activeAct = acts[currentIdx];
      var isDark = activeAct.getAttribute("data-theme") === "dark";

      for (var i = 0; i < acts.length; i++) {
        acts[i].classList.toggle("is-active", i === currentIdx);
      }

      if (header) {
        header.classList.toggle("is-dark", isDark);
        header.classList.toggle("is-light", !isDark);
      }

      for (var k = 0; k < navLinks.length; k++) {
        var target = parseInt(navLinks[k].getAttribute("data-chapter-link"), 10);
        navLinks[k].classList.toggle("is-current", target === currentIdx);
      }

      if (rail) {
        rail.classList.toggle("is-dark", isDark);
        rail.classList.toggle("is-light", !isDark);
        if (railReadout) {
          railReadout.textContent = "0" + (currentIdx + 1);
        }
        if (railTooltip) {
          railTooltip.textContent = activeAct.getAttribute("data-label") || "";
        }
        for (var s = 0; s < stops.length; s++) {
          stops[s].classList.toggle("is-active", s === currentIdx);
        }
        if (railTrack && railThumb && !scrubbing) {
          var travel = Math.max(0, railTrack.clientHeight - railThumb.offsetHeight - 8);
          var ratio = acts.length > 1 ? currentIdx / (acts.length - 1) : 0;
          railThumb.style.transform = "translate(-50%, " + (ratio * travel).toFixed(1) + "px)";
        }
      }
    }

    function detectActiveByCenter() {
      var mid = window.innerHeight * 0.48;
      var best = 0;
      var bestDist = Infinity;
      for (var i = 0; i < acts.length; i++) {
        var r = acts[i].getBoundingClientRect();
        var center = (r.top + r.bottom) * 0.5;
        var dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      updateChrome(best);
    }

    function scrollToChapter(idx, instant) {
      var safeIdx = Math.max(0, Math.min(acts.length - 1, idx));
      var targetTop = acts[safeIdx].offsetTop;
      window.scrollTo({
        top: targetTop,
        behavior: instant ? "instant" : "smooth"
      });
      updateChrome(safeIdx);
    }

    var scrollTimer = 0;
    window.addEventListener("scroll", function () {
      if (scrubbing) return;
      if (!scrollTimer) {
        scrollTimer = window.requestAnimationFrame(function () {
          scrollTimer = 0;
          detectActiveByCenter();
        });
      }
    }, { passive: true });

    window.addEventListener("resize", function () {
      detectActiveByCenter();
    }, { passive: true });

    for (var s = 0; s < stops.length; s++) {
      stops[s].addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-rail-index"), 10);
        scrollToChapter(idx, false);
      });
    }

    // Interactive vertical pointer-drag scrubbing on railTrack
    if (rail && railTrack && railThumb) {
      function scrubFromPointer(clientY) {
        var rect = railTrack.getBoundingClientRect();
        var ratio = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)));
        var travel = Math.max(0, railTrack.clientHeight - railThumb.offsetHeight - 8);
        railThumb.style.transform = "translate(-50%, " + (ratio * travel).toFixed(1) + "px)";

        var targetIdx = Math.round(ratio * (acts.length - 1));
        if (targetIdx !== currentIdx) {
          scrollToChapter(targetIdx, true);
        }
      }

      railTrack.addEventListener("pointerdown", function (e) {
        scrubbing = true;
        rail.classList.add("is-dragging");
        try {
          railTrack.setPointerCapture(e.pointerId);
        } catch (err) {}
        scrubFromPointer(e.clientY);
      });

      railTrack.addEventListener("pointermove", function (e) {
        if (!scrubbing) return;
        scrubFromPointer(e.clientY);
      });

      function endScrub(e) {
        if (!scrubbing) return;
        scrubbing = false;
        rail.classList.remove("is-dragging");
        try {
          railTrack.releasePointerCapture(e.pointerId);
        } catch (err) {}
        updateChrome(currentIdx);
      }

      railTrack.addEventListener("pointerup", endScrub);
      railTrack.addEventListener("pointercancel", endScrub);
    }

    // Keyboard page/arrow navigation between snapped chapters
    document.addEventListener("keydown", function (e) {
      var activeTag = (document.activeElement && document.activeElement.tagName) || "";
      if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(activeTag)) return;
      var drawer = document.getElementById("mobileDrawer");
      if (drawer && !drawer.hidden) return;
      if (e.key === "PageDown" || (e.key === "ArrowDown" && !e.altKey)) {
        if (currentIdx < acts.length - 1) {
          e.preventDefault();
          scrollToChapter(currentIdx + 1, false);
        }
      } else if (e.key === "PageUp" || (e.key === "ArrowUp" && !e.altKey)) {
        if (currentIdx > 0) {
          e.preventDefault();
          scrollToChapter(currentIdx - 1, false);
        }
      }
    });

    detectActiveByCenter();
  }

  function initFreeDragTrack() {
    var viewport = document.getElementById("publishViewport");
    var track = document.getElementById("publishTrack");
    var progress = document.getElementById("publishProgress");
    if (!viewport || !track) return;

    var offset = 0;
    var minOffset = 0;
    var pointerId = null;
    var startX = 0;
    var startOffset = 0;
    var lastX = 0;
    var lastTime = 0;
    var velocity = 0;
    var dragged = false;
    var rafId = 0;

    function computeBounds() {
      minOffset = Math.min(0, viewport.clientWidth - track.scrollWidth);
      offset = Math.max(minOffset, Math.min(0, offset));
      render();
    }

    function render() {
      track.style.transform = "translate3d(" + offset.toFixed(2) + "px, 0, 0)";
      if (progress) {
        var span = Math.abs(minOffset);
        var ratio = span > 2 ? Math.max(0, Math.min(1, Math.abs(offset) / span)) : 0;
        var trackWidth = progress.parentElement ? progress.parentElement.clientWidth : 200;
        var fillW = Math.max(48, Math.round(trackWidth * 0.28));
        progress.style.width = fillW + "px";
        progress.style.transform = "translate3d(" + (ratio * (trackWidth - fillW)).toFixed(1) + "px, 0, 0)";
      }
    }

    function stopAnim() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function glide() {
      velocity *= 0.92;
      offset += velocity;

      // Rubber-band clamp at edges
      if (offset > 0) {
        offset *= 0.72;
        velocity *= 0.5;
      } else if (offset < minOffset) {
        offset = minOffset + (offset - minOffset) * 0.72;
        velocity *= 0.5;
      }

      render();
      if (Math.abs(velocity) > 0.25 || offset > 0.5 || offset < minOffset - 0.5) {
        if (Math.abs(velocity) <= 0.25) {
          if (offset > 0) offset *= 0.8;
          else if (offset < minOffset) offset = minOffset + (offset - minOffset) * 0.8;
        }
        rafId = requestAnimationFrame(glide);
      } else {
        offset = Math.max(minOffset, Math.min(0, offset));
        render();
        rafId = 0;
      }
    }

    track.addEventListener("pointerdown", function (e) {
      if (minOffset >= 0) return;
      stopAnim();
      pointerId = e.pointerId;
      startX = e.clientX;
      startOffset = offset;
      lastX = e.clientX;
      lastTime = performance.now();
      velocity = 0;
      dragged = false;
      track.classList.add("is-dragging");
      try {
        track.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    track.addEventListener("pointermove", function (e) {
      if (pointerId !== e.pointerId) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 6) dragged = true;

      var raw = startOffset + dx;
      // Soft resistance outside bounds
      if (raw > 0) raw = raw * 0.35;
      else if (raw < minOffset) raw = minOffset + (raw - minOffset) * 0.35;
      offset = raw;

      var now = performance.now();
      var dt = Math.max(8, now - lastTime);
      velocity = (e.clientX - lastX) / dt * 16;
      lastX = e.clientX;
      lastTime = now;
      render();
    });

    function onUp(e) {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      track.classList.remove("is-dragging");
      try {
        track.releasePointerCapture(e.pointerId);
      } catch (err) {}
      if (Math.abs(velocity) > 0.4 || offset > 0 || offset < minOffset) {
        rafId = requestAnimationFrame(glide);
      }
    }

    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);
    track.addEventListener("click", function (e) {
      if (dragged) {
        e.preventDefault();
        dragged = false;
      }
    }, true);

    window.addEventListener("resize", computeBounds, { passive: true });
    computeBounds();
  }

  function initSpecimenDeck() {
    var viewport = document.getElementById("specimenViewport");
    var deck = document.getElementById("specimenDeck");
    var pills = Array.prototype.slice.call(document.querySelectorAll("[data-slide]"));
    var slides = deck ? Array.prototype.slice.call(deck.querySelectorAll(".specimen-slide")) : [];
    if (!viewport || !deck || !slides.length) return;

    var activeIdx = 0;
    var offset = 0;
    var pointerId = null;
    var startX = 0;
    var startOffset = 0;
    var lastX = 0;
    var lastTime = 0;
    var velocity = 0;
    var rafId = 0;

    function slideWidth() {
      return Math.max(1, viewport.clientWidth);
    }

    function updatePills(idx) {
      for (var i = 0; i < pills.length; i++) {
        var match = i === idx;
        pills[i].classList.toggle("is-active", match);
        pills[i].setAttribute("aria-selected", match ? "true" : "false");
      }
    }

    function render() {
      deck.style.transform = "translate3d(" + offset.toFixed(2) + "px, 0, 0)";
    }

    function snapTo(idx, immediate) {
      activeIdx = Math.max(0, Math.min(slides.length - 1, idx));
      updatePills(activeIdx);
      var target = -activeIdx * slideWidth();
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (immediate) {
        offset = target;
        render();
        return;
      }
      function step() {
        var diff = target - offset;
        offset += diff * 0.22;
        render();
        if (Math.abs(diff) > 0.6) {
          rafId = requestAnimationFrame(step);
        } else {
          offset = target;
          render();
          rafId = 0;
        }
      }
      rafId = requestAnimationFrame(step);
    }

    deck.addEventListener("pointerdown", function (e) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      pointerId = e.pointerId;
      startX = e.clientX;
      startOffset = offset;
      lastX = e.clientX;
      lastTime = performance.now();
      velocity = 0;
      deck.classList.add("is-dragging");
      try {
        deck.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    deck.addEventListener("pointermove", function (e) {
      if (pointerId !== e.pointerId) return;
      var w = slideWidth();
      var minOff = -(slides.length - 1) * w;
      var raw = startOffset + (e.clientX - startX);
      if (raw > 0) raw *= 0.32;
      else if (raw < minOff) raw = minOff + (raw - minOff) * 0.32;
      offset = raw;

      var now = performance.now();
      var dt = Math.max(8, now - lastTime);
      velocity = (e.clientX - lastX) / dt;
      lastX = e.clientX;
      lastTime = now;
      render();
    });

    function endDrag(e) {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      deck.classList.remove("is-dragging");
      try {
        deck.releasePointerCapture(e.pointerId);
      } catch (err) {}

      var w = slideWidth();
      var delta = offset - startOffset;
      var target = activeIdx;
      if (delta < -w * 0.18 || velocity < -0.28) {
        target = Math.min(slides.length - 1, activeIdx + 1);
      } else if (delta > w * 0.18 || velocity > 0.28) {
        target = Math.max(0, activeIdx - 1);
      } else {
        target = Math.round(-offset / w);
      }
      snapTo(target, false);
    }

    deck.addEventListener("pointerup", endDrag);
    deck.addEventListener("pointercancel", endDrag);

    for (var i = 0; i < pills.length; i++) {
      pills[i].addEventListener("click", function () {
        snapTo(parseInt(this.getAttribute("data-slide"), 10), false);
      });
    }

    window.addEventListener("resize", function () {
      snapTo(activeIdx, true);
    }, { passive: true });

    snapTo(0, true);
  }

  function initMagneticButtons() {
    if (!window.matchMedia("(pointer: fine)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    var targets = document.querySelectorAll(".magnetic");
    for (var i = 0; i < targets.length; i++) {
      (function (el) {
        el.addEventListener("pointermove", function (e) {
          var rect = el.getBoundingClientRect();
          var x = (e.clientX - rect.left - rect.width * 0.5) * 0.16;
          var y = (e.clientY - rect.top - rect.height * 0.5) * 0.16;
          el.style.transform = "translate3d(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px, 0)";
        });
        el.addEventListener("pointerleave", function () {
          el.style.transform = "";
        });
      })(targets[i]);
    }
  }

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
      if (open && closeBtn) {
        closeBtn.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        setOpen(false);
        toggle.focus();
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

  initRainCanvas();
  initChapterSnapAndRail();
  initFreeDragTrack();
  initSpecimenDeck();
  initMagneticButtons();
  initMobileDrawer();
  initLanguageChoice();
})();
