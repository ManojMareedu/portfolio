/* Manoj Mareedu — portfolio interactions.
   Vanilla JS, no dependencies. Every effect degrades to plain content. */

(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- theme ---------- */
  document.getElementById("theme-toggle").addEventListener("click", function () {
    var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = next === "dark" ? "#0b0f1c" : "#f7f7fb";
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  /* Last-updated stamp, taken from the file itself so it can never go stale. */
  var stamped = new Date(document.lastModified);
  if (!isNaN(stamped)) {
    document.getElementById("updated").textContent = " Updated " +
      stamped.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) + ".";
  }

  /* ---------- mobile section menu ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var navLinks = document.getElementById("nav-links");

  function closeNav() {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeNav();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  /* ---------- scroll: progress bar, sticky header, timeline draw ---------- */
  var progress = document.getElementById("progress");
  var header = document.getElementById("header");
  var timeline = document.getElementById("timeline");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty("--p", max > 0 ? y / max : 0);
    header.classList.toggle("stuck", y > 12);

    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var drawn = (window.innerHeight * 0.7 - r.top) / r.height;
      timeline.style.setProperty("--draw", Math.min(1, Math.max(0, drawn)).toFixed(3));
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- reveal on scroll + counters ---------- */
  function formatNum(v, decimals) {
    return decimals > 0
      ? v.toFixed(decimals)
      : Math.round(v).toLocaleString("en-US");
  }

  function runCounter(el) {
    var to = parseFloat(el.dataset.countTo);
    var from = el.dataset.countFrom !== undefined ? parseFloat(el.dataset.countFrom) : 0;
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var prefix = el.dataset.prefix || "";
    var suffix = el.dataset.suffix || "";

    if (reduce) { el.textContent = prefix + formatNum(to, decimals) + suffix; return; }

    var start = performance.now();
    var dur = 1400;
    (function step(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + formatNum(from + (to - from) * eased, decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  var revealables = document.querySelectorAll(".reveal, .mask, .job");

  if (!("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("in-view"); });
    document.querySelectorAll("[data-count-to]").forEach(runCounter);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        entry.target.querySelectorAll("[data-count-to]").forEach(function (n) {
          if (!n.dataset.done) { n.dataset.done = "1"; runCounter(n); }
        });
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.15 });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero rotator ---------- */
  var slot = document.getElementById("rotator");
  if (slot && !reduce) {
    var phrases = [
      "production systems, not notebooks.",
      "agent graphs that know when to loop back.",
      "the number that survives the audit.",
      "rebuilds that find the bug everyone shipped past."
    ];
    var i = 0;
    setInterval(function () {
      var out = slot.querySelector("b");
      var next = document.createElement("b");
      i = (i + 1) % phrases.length;
      next.textContent = phrases[i];
      next.className = "in";
      out.className = "out";
      slot.appendChild(next);
      setTimeout(function () { out.remove(); }, 500);
      // Drop the class once it has played, so the resting state is plain CSS,
      // never an animation's start frame.
      setTimeout(function () { next.className = ""; }, 650);
    }, 3800);
  }

  /* ---------- pointer spotlight + card tilt ---------- */
  if (fine && !reduce) {
    document.querySelectorAll(".card").forEach(function (card) {
      var tilt = card.hasAttribute("data-tilt");
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        if (tilt) {
          card.style.setProperty("--ry", ((x - 0.5) * 5).toFixed(2) + "deg");
          card.style.setProperty("--rx", ((0.5 - y) * 4).toFixed(2) + "deg");
        }
      });
      card.addEventListener("pointerleave", function () {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });

    /* aurora follows the cursor, gently */
    var blobs = document.querySelectorAll(".blob");
    var px = 0, py = 0, moving = false;
    window.addEventListener("pointermove", function (e) {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
      if (!moving) {
        moving = true;
        requestAnimationFrame(function () {
          blobs.forEach(function (b, n) {
            var depth = (n + 1) * 14;
            b.style.translate = (px * depth).toFixed(1) + "px " + (py * depth).toFixed(1) + "px";
          });
          moving = false;
        });
      }
    }, { passive: true });
  }

  /* ---------- active nav link ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll("#nav-links a"));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navIo.observe(s); });
  }

  /* ---------- accordion: one skill group open at a time on small screens ---------- */
  var skills = document.querySelectorAll(".skill");
  skills.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open || window.innerWidth >= 860) return;
      skills.forEach(function (other) { if (other !== d) other.open = false; });
    });
  });
})();
