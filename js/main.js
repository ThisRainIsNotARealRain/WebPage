(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var animeApi = window.anime || null;

  root.classList.add("motion-ready");

  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  function initNavigation() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav]");
    var scrim = document.querySelector("[data-nav-scrim]");

    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute(
        "aria-label",
        open
          ? root.lang === "zh-Hans"
            ? "关闭导航"
            : "Close navigation"
          : root.lang === "zh-Hans"
            ? "打开导航"
            : "Open navigation"
      );
      if (scrim) {
        scrim.classList.toggle("is-active", open);
        scrim.setAttribute("aria-hidden", String(!open));
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    if (scrim) {
      scrim.addEventListener("click", function () {
        setOpen(false);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900) setOpen(false);
    });
  }

  function initScrollState() {
    var header = document.querySelector("[data-header]");
    var progress = document.querySelector(".page-progress span");
    var queued = false;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var scrollRange = document.documentElement.scrollHeight - window.innerHeight;
      if (header) header.classList.toggle("is-scrolled", scrollTop > 24);
      if (progress) {
        var amount = scrollRange > 0 ? Math.min(scrollTop / scrollRange, 1) : 0;
        progress.style.transform = "scaleX(" + amount + ")";
      }
      queued = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!queued) {
          queued = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    update();
  }

  function initSmoothScroll() {
    if (reducedMotion || window.innerWidth < 900 || typeof window.Lenis !== "function") return;

    try {
      var lenis = new window.Lenis({
        autoRaf: true,
        anchors: { offset: -72 },
        duration: 1.05,
        smoothWheel: true,
        syncTouch: false
      });

      window.addEventListener("pagehide", function () {
        lenis.destroy();
      });
    } catch (error) {
      root.classList.add("lenis-fallback");
    }
  }

  function initHeroMotion() {
    var items = document.querySelectorAll("[data-hero-item]");

    if (reducedMotion || !items.length) {
      items.forEach(function (item) {
        item.style.opacity = "1";
      });
      return;
    }

    if (animeApi && typeof animeApi.animate === "function") {
      var stagger = typeof animeApi.stagger === "function" ? animeApi.stagger(115) : 0;

      animeApi.animate("[data-hero-item]", {
        opacity: [0, 1],
        y: [34, 0],
        delay: stagger,
        duration: 1050,
        ease: "outExpo"
      });

      animeApi.animate(".hero__orbit span", {
        scale: [0.8, 1],
        opacity: [0, 1],
        delay: typeof animeApi.stagger === "function" ? animeApi.stagger(100, { start: 360 }) : 360,
        duration: 1400,
        ease: "outQuart"
      });
      return;
    }

    items.forEach(function (item, index) {
      window.setTimeout(function () {
        item.classList.add("is-visible");
      }, index * 110);
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
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initWorkGallery() {
    var gallery = document.querySelector("[data-work-swiper]");
    if (!gallery) return;

    var current = document.querySelector("[data-work-current]");

    if (typeof window.Swiper !== "function") {
      gallery.classList.add("swiper-fallback");
      return;
    }

    var swiper = new window.Swiper(gallery, {
      slidesPerView: "auto",
      spaceBetween: 16,
      speed: reducedMotion ? 0 : 850,
      grabCursor: finePointer,
      keyboard: { enabled: true },
      navigation: {
        nextEl: ".work-next",
        prevEl: ".work-prev"
      },
      breakpoints: {
        760: { spaceBetween: 24 },
        1180: { spaceBetween: 32 }
      },
      on: {
        init: function (instance) {
          if (current) current.textContent = String(instance.realIndex + 1).padStart(2, "0");
        },
        slideChange: function (instance) {
          if (current) current.textContent = String(instance.realIndex + 1).padStart(2, "0");
        }
      }
    });

    gallery.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") swiper.slideNext();
      if (event.key === "ArrowLeft") swiper.slidePrev();
    });
  }

  function initProductTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-product-tab]"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-product-panel]"));
    if (!tabs.length || !panels.length) return;

    function activate(name, focusTab) {
      tabs.forEach(function (tab) {
        var active = tab.dataset.productTab === name;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focusTab) tab.focus();
      });

      panels.forEach(function (panel) {
        var active = panel.dataset.productPanel === name;
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);

        if (
          active &&
          !reducedMotion &&
          animeApi &&
          typeof animeApi.animate === "function"
        ) {
          animeApi.animate(panel.querySelectorAll(".product-panel__copy > *, .browser-frame"), {
            opacity: [0, 1],
            y: [22, 0],
            delay:
              typeof animeApi.stagger === "function"
                ? animeApi.stagger(70)
                : 0,
            duration: 720,
            ease: "outExpo"
          });
        }
      });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activate(tab.dataset.productTab, false);
      });

      tab.addEventListener("keydown", function (event) {
        var nextIndex = index;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        else return;

        event.preventDefault();
        activate(tabs[nextIndex].dataset.productTab, true);
      });
    });
  }

  function initParallax() {
    if (reducedMotion) return;

    var scenes = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    if (!scenes.length) return;
    var queued = false;

    function update() {
      scenes.forEach(function (scene) {
        var image = scene.querySelector("img");
        if (!image) return;
        var rect = scene.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        var strength = Number(scene.dataset.parallax || 0.05);
        var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * strength;
        image.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0) scale(1.055)";
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

    var cursor = document.querySelector(".cursor");
    if (cursor) {
      var cursorLabel = cursor.querySelector("span");
      var targetX = -100;
      var targetY = -100;
      var currentX = targetX;
      var currentY = targetY;

      document.addEventListener("mousemove", function (event) {
        targetX = event.clientX;
        targetY = event.clientY;
      });

      document.addEventListener("mouseleave", function () {
        cursor.classList.remove("is-visible");
      });

      document.querySelectorAll("[data-cursor-label]").forEach(function (target) {
        target.addEventListener("mouseenter", function () {
          if (cursorLabel) cursorLabel.textContent = target.dataset.cursorLabel || "VIEW";
          cursor.classList.add("is-visible");
          cursor.classList.toggle("is-drag", target.dataset.cursorLabel === "DRAG");
        });
        target.addEventListener("mouseleave", function () {
          cursor.classList.remove("is-visible", "is-drag");
        });
      });

      function renderCursor() {
        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;
        cursor.style.left = currentX + "px";
        cursor.style.top = currentY + "px";
        window.requestAnimationFrame(renderCursor);
      }
      renderCursor();
    }

    document.querySelectorAll("[data-magnetic]").forEach(function (element) {
      element.addEventListener("mousemove", function (event) {
        var rect = element.getBoundingClientRect();
        var x = (event.clientX - rect.left - rect.width / 2) * 0.12;
        var y = (event.clientY - rect.top - rect.height / 2) * 0.12;
        element.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      });
      element.addEventListener("mouseleave", function () {
        element.style.transform = "";
      });
    });

    document.querySelectorAll("[data-tilt]").forEach(function (element) {
      element.addEventListener("mousemove", function (event) {
        var rect = element.getBoundingClientRect();
        var rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 4;
        var rotateX = (0.5 - (event.clientY - rect.top) / rect.height) * 4;
        element.style.transform =
          "perspective(1000px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg)";
      });
      element.addEventListener("mouseleave", function () {
        element.style.transform = "";
      });
    });
  }

  initNavigation();
  initScrollState();
  initSmoothScroll();
  initHeroMotion();
  initReveals();
  initWorkGallery();
  initProductTabs();
  initParallax();
  initPointerDetails();
})();
