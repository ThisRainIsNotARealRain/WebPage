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
        delay: typeof animeApi.stagger === "function" ? animeApi.stagger(105, { start: 120 }) : 120,
        duration: 1000,
        ease: "outExpo"
      });
      return;
    }

    items.forEach(function (item, index) {
      window.setTimeout(function () {
        item.style.opacity = "1";
        item.style.transform = "none";
      }, 100 + index * 100);
    });
  }

  function initReveals() {
    var revealItems = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!revealItems.length) return;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.1 }
    );

    revealItems.forEach(function (item) {
      observer.observe(item);
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

  initNavigation();
  initScrollState();
  initActiveNavigation();
  initHeroMotion();
  initReveals();
  initParallax();
  initPointerDetails();
})();
