(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mobileNav = window.matchMedia("(max-width: 860px)");
  var animeApi = window.anime || null;

  root.classList.add("motion-ready");

  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  function initNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav]");
    var scrim = document.querySelector("[data-nav-scrim]");
    var firstLink = nav ? nav.querySelector("a") : null;
    var lastFocused = null;

    if (!toggle || !nav) return;

    function updateMobileState(open) {
      if (!mobileNav.matches) {
        nav.removeAttribute("aria-hidden");
        if ("inert" in nav) nav.inert = false;
        return;
      }

      nav.setAttribute("aria-hidden", String(!open));
      if ("inert" in nav) nav.inert = !open;
    }

    function setOpen(open, returnFocus) {
      var shouldOpen = Boolean(open && mobileNav.matches);

      nav.classList.toggle("is-open", shouldOpen);
      body.classList.toggle("nav-open", shouldOpen);
      toggle.setAttribute("aria-expanded", String(shouldOpen));
      toggle.setAttribute(
        "aria-label",
        shouldOpen
          ? root.lang === "zh-Hans"
            ? "关闭导航"
            : "Close navigation"
          : root.lang === "zh-Hans"
            ? "打开导航"
            : "Open navigation"
      );

      if (scrim) {
        scrim.classList.toggle("is-active", shouldOpen);
        scrim.setAttribute("aria-hidden", String(!shouldOpen));
      }

      updateMobileState(shouldOpen);

      if (shouldOpen) {
        lastFocused = document.activeElement;
        window.setTimeout(function () {
          if (firstLink) firstLink.focus();
        }, reducedMotion ? 0 : 180);
      } else if (returnFocus && lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"), true);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false, false);
      });
    });

    if (scrim) {
      scrim.addEventListener("click", function () {
        setOpen(false, true);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false, true);
      }

      if (event.key !== "Tab" || !nav.classList.contains("is-open")) return;

      var focusable = Array.prototype.slice.call(
        nav.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        toggle.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        toggle.focus();
      }
    });

    function handleBreakpointChange() {
      setOpen(false, false);
      updateMobileState(false);
    }

    if (typeof mobileNav.addEventListener === "function") {
      mobileNav.addEventListener("change", handleBreakpointChange);
    } else if (typeof mobileNav.addListener === "function") {
      mobileNav.addListener(handleBreakpointChange);
    }

    updateMobileState(false);
  }

  function initScrollState() {
    var header = document.querySelector("[data-header]");
    var progress = document.querySelector(".page-progress span");
    var queued = false;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var scrollRange = document.documentElement.scrollHeight - window.innerHeight;

      if (header) header.classList.toggle("is-scrolled", scrollTop > 28);
      if (progress) {
        var amount = scrollRange > 0 ? Math.min(scrollTop / scrollRange, 1) : 0;
        progress.style.transform = "scaleX(" + amount + ")";
      }
      queued = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    update();
  }

  function initActiveNavigation() {
    if (!("IntersectionObserver" in window)) return;

    var links = Array.prototype.slice.call(
      document.querySelectorAll('.site-nav > a[href^="#"]')
    );
    if (!links.length) return;

    var sections = links
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.toggle(
              "is-active",
              link.getAttribute("href") === "#" + entry.target.id
            );
          });
        });
      },
      { rootMargin: "-35% 0px -58% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  // The headline itself rises line by line (see splitHeadingLines); anime.js
  // brings in the news chip first and the summary once the headline has landed.
  function initHeroMotion() {
    var items = document.querySelectorAll("[data-hero-item]");

    if (!items.length) return;
    if (reducedMotion) {
      items.forEach(function (item) {
        item.style.opacity = "1";
      });
      return;
    }

    if (animeApi && typeof animeApi.animate === "function") {
      animeApi.animate("[data-hero-item]", {
        opacity: [0, 1],
        y: [28, 0],
        delay: function (target, index) {
          return index === 0 ? 60 : 460 + (index - 1) * 105;
        },
        duration: 1000,
        ease: "outExpo"
      });
      return;
    }

    items.forEach(function (item, index) {
      window.setTimeout(function () {
        item.style.opacity = "1";
        item.style.transform = "none";
      }, index === 0 ? 60 : 460 + (index - 1) * 100);
    });
  }

  // Headings rise out of a mask one line at a time. The lines are the breaks
  // already written in the markup (<br>, or a block child such as <small>),
  // so the phrase-level line breaking is untouched.
  function splitHeadingLines() {
    if (reducedMotion) return;

    document.querySelectorAll(".display.reveal, .hero h1.reveal, .close h2.reveal").forEach(function (heading) {
      var groups = [[]];

      Array.prototype.slice.call(heading.childNodes).forEach(function (node) {
        if (node.nodeName === "BR") {
          groups.push([]);
        } else if (node.nodeType === 1 && window.getComputedStyle(node).display === "block") {
          groups.push([node], []);
        } else {
          groups[groups.length - 1].push(node);
        }
      });

      groups = groups.filter(function (nodes) {
        return nodes.some(function (node) {
          return node.nodeType === 1 || node.textContent.trim();
        });
      });

      heading.textContent = "";
      groups.forEach(function (nodes, index) {
        var line = document.createElement("span");
        var inner = document.createElement("span");
        line.className = "line";
        inner.className = "line__inner";
        inner.style.setProperty("--line", index);
        nodes.forEach(function (node) {
          inner.appendChild(node);
        });
        line.appendChild(inner);
        heading.appendChild(line);
      });
      heading.classList.add("has-lines");
    });
  }

  // On desktop every section is one screen and the page snaps between them, so
  // a screen composes itself as it arrives: its items come in reading order,
  // timed from the snap rather than from each item crossing the fold. Phones
  // scroll freely, so there items still appear one by one as they enter.
  function initChoreography() {
    var sections = Array.prototype.slice.call(document.querySelectorAll("main > section[id]"));
    var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    var oneScreen = window.matchMedia("(min-width: 861px) and (min-height: 621px)");

    function show(item) {
      item.classList.add("is-visible");
    }

    if (reducedMotion || !("IntersectionObserver" in window)) {
      sections.forEach(function (section) {
        section.classList.add("is-in");
      });
      revealItems.forEach(show);
      return;
    }

    sections.forEach(function (section) {
      section.querySelectorAll(".reveal").forEach(function (item, index) {
        item.style.setProperty("--i", index);
      });
    });

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          if (oneScreen.matches) entry.target.querySelectorAll(".reveal").forEach(show);
          sectionObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -14% 0px", threshold: 0 }
    );

    var itemObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          show(entry.target);
          itemObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.1 }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
    revealItems.forEach(function (item) {
      itemObserver.observe(item);
    });
  }

  // A quiet index on the right edge: one mark per screen, the current one
  // drawn longer. It mirrors the header navigation, so it stays out of the
  // tab order and the accessibility tree.
  function initSectionIndex() {
    if (!("IntersectionObserver" in window)) return;

    var sections = Array.prototype.slice.call(document.querySelectorAll("main > section[id]"));
    if (sections.length < 2) return;

    var index = document.createElement("nav");
    index.className = "section-index";
    index.setAttribute("aria-hidden", "true");

    var marks = sections.map(function (section, i) {
      var navLink = document.querySelector('.site-nav > a[href="#' + section.id + '"]');
      var label = navLink ? navLink.lastChild.textContent.trim() : root.lang === "zh-Hans" ? "首页" : "Top";
      var mark = document.createElement("a");
      var text = document.createElement("span");

      mark.href = "#" + section.id;
      mark.tabIndex = -1;
      text.className = "section-index__label";
      text.textContent = ("0" + (i + 1)).slice(-2) + "\u2002" + label;
      mark.appendChild(text);
      mark.appendChild(document.createElement("i"));
      index.appendChild(mark);
      return mark;
    });

    document.body.appendChild(index);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var position = sections.indexOf(entry.target);
          marks.forEach(function (mark, i) {
            mark.classList.toggle("is-active", i === position);
          });
        });
      },
      { rootMargin: "-45% 0px -54% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initParallax() {
    if (reducedMotion || window.innerWidth < 700) return;

    var scenes = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    if (!scenes.length) return;

    var queued = false;

    function update() {
      scenes.forEach(function (scene) {
        var image = scene.querySelector("img");
        if (!image) return;

        var rect = scene.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        var strength = Number(scene.dataset.parallax || 0.04);
        var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * strength;
        image.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0) scale(1.035)";
      });
      queued = false;
    }

    function requestUpdate() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    requestUpdate();
  }

  // Rain over the first screen: sparse, slow hairlines in Rain Celadon. It
  // pauses when the hero is off screen or the tab is hidden, and stays off
  // under reduced motion.
  function initRain() {
    var canvas = document.querySelector("[data-rain]");
    if (!canvas || reducedMotion || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var slant = 0.16;
    var width = 0;
    var height = 0;
    var color = "#426359";
    var drops = [];
    var frame = 0;
    var last = 0;
    var running = false;
    var inView = true;

    function spawn(anywhere) {
      var length = 24 + Math.random() * 90;
      return {
        x: Math.random() * (width + height * slant),
        y: anywhere ? Math.random() * height : -length - Math.random() * height * 0.4,
        length: length,
        speed: 0.05 + Math.random() * 0.12,
        alpha: 0.05 + Math.random() * 0.17
      };
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      drops.forEach(function (drop) {
        ctx.globalAlpha = drop.alpha;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.length * slant, drop.y + drop.length);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    function size() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      color = window.getComputedStyle(canvas).color;
      drops = [];
      for (var i = Math.round((width * height) / 14000); i > 0; i--) drops.push(spawn(true));
      draw();
    }

    function tick(time) {
      var step = last ? Math.min(time - last, 50) : 16;
      last = time;
      drops.forEach(function (drop) {
        drop.y += drop.speed * step;
        drop.x -= drop.speed * step * slant;
        if (drop.y > height) {
          var fresh = spawn(false);
          drop.x = fresh.x;
          drop.y = fresh.y;
          drop.length = fresh.length;
          drop.speed = fresh.speed;
          drop.alpha = fresh.alpha;
        }
      });
      draw();
      frame = window.requestAnimationFrame(tick);
    }

    function start() {
      if (running || !inView || document.hidden) return;
      running = true;
      last = 0;
      frame = window.requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      window.cancelAnimationFrame(frame);
    }

    size();
    start();

    var resizeTimer = 0;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(size, 150);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start();
        else stop();
      }).observe(canvas);
    }
  }

  function initPointerDetails() {
    if (!finePointer || reducedMotion) return;

    document.querySelectorAll("[data-tilt]").forEach(function (element) {
      element.addEventListener("mousemove", function (event) {
        var rect = element.getBoundingClientRect();
        var rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 2.6;
        var rotateX = (0.5 - (event.clientY - rect.top) / rect.height) * 2.6;
        element.style.transform =
          "perspective(1200px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg)";
      });

      element.addEventListener("mouseleave", function () {
        element.style.transform = "";
      });
    });
  }

  // A clicked language link becomes the saved choice read by the entry script in <head>.
  function initLanguageChoice() {
    var domain = /(^|\.)realrain\.co$/.test(location.hostname) ? "; Domain=realrain.co" : "";
    var secure = location.protocol === "https:" ? "; Secure" : "";

    document.querySelectorAll("a[hreflang]").forEach(function (link) {
      link.addEventListener("click", function () {
        var choice = link.getAttribute("hreflang") === "en" ? "en" : "zh";
        document.cookie = "rr_lang=" + choice + "; Max-Age=31536000; Path=/; SameSite=Lax" + domain + secure;
      });
    });
  }

  initNavigation();
  initScrollState();
  initActiveNavigation();
  splitHeadingLines();
  initHeroMotion();
  initChoreography();
  initSectionIndex();
  initParallax();
  initRain();
  initPointerDetails();
  initLanguageChoice();
})();
