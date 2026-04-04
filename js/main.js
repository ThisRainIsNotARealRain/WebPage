(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  var header = document.querySelector(".header");
  var scrim = document.getElementById("nav-scrim");

  if (toggle && nav) {
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
      document.documentElement.classList.toggle("nav-menu-open", open);
      if (scrim) {
        scrim.classList.toggle("is-active", open);
        scrim.setAttribute("aria-hidden", open ? "false" : "true");
      }
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    if (scrim) {
      scrim.addEventListener("click", function () {
        setOpen(false);
      });
    }

    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setOpen(false);
      });
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width: 900px)").matches) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) setOpen(false);
    });
  }

  if (header) {
    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* 章节滚动进入动效（尊重减少动态；先标记首屏内区块再开 js-reveal，减轻闪烁） */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
    var revealSections = document.querySelectorAll("main > section.section");
    if (revealSections.length) {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      revealSections.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > vh * 0.06) el.classList.add("is-inview");
      });
      document.documentElement.classList.add("js-reveal");
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) entry.target.classList.add("is-inview");
          });
        },
        { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
      );
      revealSections.forEach(function (el) {
        io.observe(el);
      });
    }
  }
})();
