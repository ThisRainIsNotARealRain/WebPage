(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mobileNav = window.matchMedia("(max-width: 860px)");

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

  function initHeaderState() {
    var header = document.querySelector("[data-header]");
    var progress = document.querySelector(".page-progress span");
    var darkBands = Array.prototype.slice.call(document.querySelectorAll('[data-theme="dark"]'));
    var queued = false;

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var scrollRange = document.documentElement.scrollHeight - window.innerHeight;
      var headerBottom = header ? header.offsetHeight : 64;
      var probeY = Math.min(headerBottom * 0.5, 32);
      var overDark = false;

      for (var i = 0; i < darkBands.length; i++) {
        var rect = darkBands[i].getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom > probeY) {
          overDark = true;
          break;
        }
      }

      if (header) {
        header.classList.toggle("is-scrolled", scrollTop > 20);
        header.classList.toggle("is-dark", overDark);
      }

      if (progress) {
        var amount = scrollRange > 0 ? Math.min(scrollTop / scrollRange, 1) : 0;
        progress.style.transform = "scaleX(" + amount + ")";
      }

      queued = false;
    }

    function requestUpdate() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
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
      { rootMargin: "-32% 0px -60% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initWorkbench() {
    var workbench = document.querySelector("[data-workbench]");
    if (!workbench) return;

    var tabs = Array.prototype.slice.call(workbench.querySelectorAll('[role="tab"]'));
    var panel = workbench.querySelector('[role="tabpanel"]');
    var cadStage = workbench.querySelector("[data-active-carrier]");
    var fields = Array.prototype.slice.call(workbench.querySelectorAll("[data-wb-field]"));

    if (!tabs.length) return;

    function activate(tab, moveFocus) {
      var carrier = tab.getAttribute("data-carrier");

      tabs.forEach(function (item) {
        var selected = item === tab;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
      });

      if (panel && tab.id) {
        panel.setAttribute("aria-labelledby", tab.id);
      }

      if (cadStage && carrier) {
        cadStage.setAttribute("data-active-carrier", carrier);
      }

      fields.forEach(function (node) {
        var key = node.getAttribute("data-wb-field");
        var value = tab.getAttribute("data-" + key);
        if (value !== null) {
          node.textContent = value;
        }
      });

      if (moveFocus) {
        tab.focus();
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activate(tab, false);
      });

      tab.addEventListener("keydown", function (event) {
        var next = -1;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;

        if (next >= 0) {
          event.preventDefault();
          activate(tabs[next], true);
        }
      });
    });
  }

  function initCardGlow() {
    if (!finePointer || reducedMotion) return;

    document.querySelectorAll("[data-glow]").forEach(function (card) {
      card.addEventListener("mousemove", function (event) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (event.clientX - rect.left).toFixed(1) + "px");
        card.style.setProperty("--my", (event.clientY - rect.top).toFixed(1) + "px");
      });
    });
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    function show(item) {
      item.classList.add("is-visible");
    }

    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(show);
      return;
    }

    document.querySelectorAll("main > section").forEach(function (section) {
      section.querySelectorAll(".reveal").forEach(function (item, index) {
        item.style.setProperty("--i", Math.min(index, 5));
      });
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
    );

    items.forEach(function (item) {
      observer.observe(item);
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
  initHeaderState();
  initActiveNavigation();
  initWorkbench();
  initCardGlow();
  initReveal();
  initLanguageChoice();
})();
