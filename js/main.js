(function () {
  "use strict";

  function initHeaderPolarity() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    var darkBands = Array.prototype.slice.call(
      document.querySelectorAll('[data-theme="dark"]')
    );
    if (!darkBands.length) return;

    var ticking = false;
    function updateHeader() {
      ticking = false;
      var probeY = Math.max(20, Math.round(header.offsetHeight * 0.5));
      var overDark = false;
      for (var i = 0; i < darkBands.length; i++) {
        var rect = darkBands[i].getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom > probeY) {
          overDark = true;
          break;
        }
      }
      header.classList.toggle("is-dark", overDark);
      header.classList.toggle("is-light", !overDark);
    }

    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateHeader);
      }
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    updateHeader();
  }

  function initEditionTabs() {
    var tabs = Array.prototype.slice.call(
      document.querySelectorAll("[data-edition-tab]")
    );
    var panels = Array.prototype.slice.call(
      document.querySelectorAll("[data-edition-panel]")
    );
    if (!tabs.length || !panels.length) return;

    function activate(targetId) {
      for (var i = 0; i < tabs.length; i++) {
        var btn = tabs[i];
        var isMatch = btn.getAttribute("data-edition-tab") === targetId;
        btn.classList.toggle("is-active", isMatch);
        btn.setAttribute("aria-selected", isMatch ? "true" : "false");
      }
      for (var j = 0; j < panels.length; j++) {
        var panel = panels[j];
        var active = panel.getAttribute("data-edition-panel") === targetId;
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);
      }
    }

    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", function () {
        activate(this.getAttribute("data-edition-tab"));
      });
      tabs[i].addEventListener("keydown", function (event) {
        var idx = tabs.indexOf(this);
        if (idx === -1) return;
        var next = -1;
        if (event.key === "ArrowRight") next = (idx + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (idx - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        if (next >= 0) {
          event.preventDefault();
          activate(tabs[next].getAttribute("data-edition-tab"));
          tabs[next].focus();
        }
      });
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
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!expanded);
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

    window.addEventListener(
      "resize",
      function () {
        if (window.innerWidth > 960 && !drawer.hidden) {
          setOpen(false);
        }
      },
      { passive: true }
    );
  }

  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver !== "function"
    ) {
      for (var i = 0; i < items.length; i++) {
        items[i].classList.add("is-visible");
      }
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            entries[i].target.classList.add("is-visible");
            observer.unobserve(entries[i].target);
          }
        }
      },
      { threshold: 0.04, rootMargin: "0px 0px -24px 0px" }
    );

    for (var j = 0; j < items.length; j++) {
      observer.observe(items[j]);
    }
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

  initHeaderPolarity();
  initEditionTabs();
  initMobileDrawer();
  initReveal();
  initLanguageChoice();
})();
