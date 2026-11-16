/* Rising Light of Madagascar: draft site script.
   The island centerpiece is a pure function of one number, T (0..1), from scroll position. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  // ---------- projection ----------
  function px(lon) { return (lon - 42.9) * 40; }
  function py(lat) { return (-lat - 11.6) * 41.2; }

  // Approximate coastline of Madagascar (lat, lon), clockwise from the northern tip.
  var COAST = [
    [-11.95,49.26],[-12.3,49.6],[-13.0,49.9],[-13.9,50.05],[-14.8,50.25],[-15.45,50.48],[-15.9,50.2],
    [-16.6,49.85],[-17.2,49.45],[-18.1,49.4],[-19.0,48.95],[-20.0,48.6],[-21.0,48.3],[-22.0,47.95],
    [-23.0,47.6],[-24.0,47.3],[-25.03,46.99],[-25.4,46.3],[-25.6,45.15],[-25.1,44.3],[-24.3,43.75],
    [-23.4,43.6],[-22.4,43.3],[-21.3,43.55],[-20.3,44.2],[-19.4,44.35],[-18.4,44.05],[-17.4,43.95],
    [-16.6,44.4],[-16.0,45.2],[-15.7,46.3],[-15.2,47.1],[-14.4,47.6],[-13.6,48.2],[-13.3,48.5],
    [-12.7,48.9],[-12.2,49.1]
  ];

  // Places the mission has served, in the order the light reaches them.
  var PLACES = [
    ["Antananarivo",-18.91,47.52],["Ivato Centre",-20.62,47.22],["Ambositra",-20.53,47.24],
    ["Fianarantsoa",-21.45,47.09],["Miarina",-20.85,47.05],["Ranomafana",-21.26,47.42],
    ["Moramanga",-18.95,48.23],["Andoharanovelona",-18.85,48.05],["Ankazobe",-18.32,47.12],
    ["Anjozorobe",-18.40,47.87],["Toamasina",-18.15,49.40],["Fenerive-Est",-17.38,49.41],
    ["Mananjary",-21.23,48.34],["Maevatanana",-16.95,46.83],["Bemokotra",-16.80,46.95],
    ["Boriziny",-15.58,47.62],["Bealanana",-14.55,48.74],["Morondava",-20.28,44.28],
    ["Bemanonga",-20.30,44.40],["Mahabo",-20.38,44.67],["Ihosy",-22.40,46.12],
    ["Mahasoa",-22.20,46.20],["Analalava",-22.70,45.90],["Bezaha",-23.48,44.53],
    ["Belamoty",-23.55,44.85],["Benenitra",-23.45,45.08],["Betioky",-23.72,44.38],
    ["Ejeda",-24.35,44.50],["Ampanihy",-24.69,44.75],["Fotadrevo",-24.03,45.03],
    ["Maroviro",-23.90,45.29],["Andromivonga",-23.98,45.45],["Toliara",-23.35,43.67]
  ];

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function mix(c1, c2, t) {
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    var r = Math.round(lerp(a >> 16, b >> 16, t)), g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
    return "rgb(" + r + "," + g + "," + bl + ")";
  }

  var svg = document.getElementById("island");
  var stage = null;
  if (svg) {
    var defs = el("defs", {}, svg);
    var sunGrad = el("radialGradient", { id: "sunGrad" }, defs);
    el("stop", { offset: "0%", "stop-color": "#FBF6A0" }, sunGrad);
    el("stop", { offset: "45%", "stop-color": "#F9C80E" }, sunGrad);
    el("stop", { offset: "100%", "stop-color": "#F9C80E", "stop-opacity": "0" }, sunGrad);
    var glow = el("filter", { id: "glow", x: "-200%", y: "-200%", width: "500%", height: "500%" }, defs);
    el("feGaussianBlur", { stdDeviation: "3", result: "b" }, glow);
    var fm = el("feMerge", {}, glow); el("feMergeNode", { in: "b" }, fm); el("feMergeNode", { in: "SourceGraphic" }, fm);

    var sunG = el("g", {}, svg);
    var rays = el("g", {}, sunG);
    for (var i = 0; i < 18; i++) {
      var a = (i / 18) * Math.PI * 2;
      el("path", {
        d: "M0 0 L" + (Math.cos(a - 0.07) * 420).toFixed(1) + " " + (Math.sin(a - 0.07) * 420).toFixed(1) +
           " L" + (Math.cos(a + 0.07) * 420).toFixed(1) + " " + (Math.sin(a + 0.07) * 420).toFixed(1) + "Z",
        fill: i % 2 ? "#F9C80E" : "#FCE40C", opacity: ".22"
      }, rays);
    }
    if (!reduce) el("animateTransform", { attributeName: "transform", type: "rotate", from: "0", to: "360", dur: "90s", repeatCount: "indefinite" }, rays);
    var sun = el("circle", { r: "120", fill: "url(#sunGrad)" }, sunG);

    var d = COAST.map(function (p, k) { return (k ? "L" : "M") + px(p[1]).toFixed(1) + " " + py(p[0]).toFixed(1); }).join(" ") + "Z";
    var land = el("path", { d: d, stroke: "#FBF6A0", "stroke-width": "2.5", "stroke-linejoin": "round" }, svg);

    var dotsG = el("g", {}, svg);
    var dots = PLACES.map(function (p) {
      var g = el("g", { transform: "translate(" + px(p[2]).toFixed(1) + " " + py(p[1]).toFixed(1) + ")" }, dotsG);
      var halo = el("circle", { r: "9", fill: "#FBF6A0", opacity: "0" }, g);
      var core = el("circle", { r: "3", fill: "#3b4614" }, g);
      return { g: g, halo: halo, core: core, name: p[0], x: px(p[2]), y: py(p[1]) };
    });
    var label = el("text", { class: "place-label", opacity: "0" }, svg);
    var placeName = document.getElementById("placeName");
    var beats = Array.prototype.slice.call(document.querySelectorAll(".beat"));
    var lastBeat = -1, lastPlace = "";

    stage = function draw(T) {
      // sun climbs from below the island to behind its heart
      // the sun rises out of the Indian Ocean, east of the island, so its disc stays visible
      var e = 1 - Math.pow(1 - T, 2);
      var sy = lerp(700, 440, e), sx = lerp(300, 290, e);
      sunG.setAttribute("transform", "translate(" + sx.toFixed(1) + " " + sy.toFixed(1) + ")");
      sun.setAttribute("r", lerp(50, 95, T).toFixed(1));
      rays.setAttribute("opacity", lerp(0.2, 1, T).toFixed(2));
      land.setAttribute("fill", mix("#26300C", "#6C8A1A", clamp(T * 1.3)));
      var lit = Math.round(T * 1.08 * dots.length);
      var current = dots[0].name, cur = null;
      dots.forEach(function (dt, k) {
        if (k === lit - 1) cur = dt;
        var on = k < lit;
        dt.core.setAttribute("fill", on ? "#FFFFFF" : "#3b4614");
        dt.core.setAttribute("r", on ? "3.6" : "2.6");
        dt.halo.setAttribute("opacity", on ? (k === lit - 1 ? ".95" : ".45") : "0");
        dt.halo.setAttribute("r", on ? (k === lit - 1 ? "12" : "7") : "0");
        dt.core.setAttribute("filter", on ? "url(#glow)" : "");
        if (on) current = dt.name;
      });
      if (current !== lastPlace) {
        if (placeName) placeName.textContent = current;
        lastPlace = current;
        if (cur) {
          var left = cur.x > 200; // labels near the east coast sit to the left of their dot
          label.textContent = cur.name;
          label.setAttribute("x", (cur.x + (left ? -14 : 14)).toFixed(1));
          label.setAttribute("y", (cur.y + 4).toFixed(1));
          label.setAttribute("text-anchor", left ? "end" : "start");
        }
      }
      label.setAttribute("opacity", cur && T < 0.995 ? "1" : "0");
      var b = Math.min(beats.length - 1, Math.floor(T * beats.length * 0.999));
      if (b !== lastBeat) { beats.forEach(function (x, k) { x.classList.toggle("on", k === b); }); lastBeat = b; }
    };
  }

  var track = document.querySelector(".journey-track");
  function onScroll() {
    if (!stage || !track) return;
    var r = track.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    stage(span > 0 ? clamp(-r.top / span) : 1);
  }
  if (stage) {
    if (reduce) { stage(1); document.querySelectorAll(".beat").forEach(function (b) { b.classList.add("on"); }); }
    else {
      var ticking = false;
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; requestAnimationFrame(function () { onScroll(); ticking = false; }); }
      }, { passive: true });
      window.addEventListener("resize", onScroll);
      onScroll();
    }
  }

  // ---------- count-up on the impact strip ----------
  var counted = false;
  var strip = document.querySelector(".strip");
  if (strip && "IntersectionObserver" in window && !reduce) {
    new IntersectionObserver(function (ents, obs) {
      if (!ents[0].isIntersecting || counted) return;
      counted = true; obs.disconnect();
      strip.querySelectorAll("[data-count]").forEach(function (n) {
        var end = +n.dataset.count, suf = n.dataset.suffix || "", t0 = performance.now();
        (function tick(t) {
          var p = Math.min(1, (t - t0) / 1400), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
          n.textContent = v.toLocaleString("en-US") + (p === 1 ? suf : "");
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.5 }).observe(strip);
  }

  // ---------- budget / gift builder (2026 budget, deck sent 2026-10-17) ----------
  var BUDGET = [
    ["School", "07", "Birth certificate for an unschooled child", 10, 500],
    ["School", "08", "School enrollment and kit for one child", 25, 200],
    ["School", "10", "Furniture: one desk or board", 50, 200],
    ["School", "09", "One teacher’s stipend for a year", 300, 50],
    ["School", "11", "Repair one school building", 4000, 8],
    ["Church", "05", "Leadership conference materials, per leader", 2, 1000],
    ["Church", "03", "A bike for a pastor", 170, 30],
    ["Church", "04", "A month of meals for 40 orphans", 200, 12],
    ["Church", "06", "A year of support for an evangelist", 1000, 2],
    ["Seminary", "13", "Course materials for one student", 5, 300],
    ["Seminary", "12", "Seminary library development", 140, 1],
    ["Mission", "02", "A month of communication, mail and phone", 30, 12],
    ["Mission", "01", "Inland mission travel (one leg)", 1500, 6],
    ["Mission", "01", "A month of mission travel, food and lodging", 3500, 3]
  ];
  var picks = {};
  var itemsEl = document.getElementById("items");
  function money(n) { return "$" + n.toLocaleString("en-US"); }
  if (itemsEl) {
    var group = "";
    BUDGET.forEach(function (row, idx) {
      if (row[0] !== group) {
        group = row[0];
        var h = document.createElement("p"); h.className = "item-group"; h.textContent = group; itemsEl.appendChild(h);
      }
      var div = document.createElement("div");
      div.className = "item"; div.dataset.idx = idx;
      div.innerHTML =
        '<span class="item-num">#' + row[1] + '</span>' +
        '<div><div class="item-name">' + row[2] + '</div>' +
        '<div class="item-meta">' + money(row[3]) + ' each · ' + row[4].toLocaleString("en-US") + ' needed in 2026 · ' + money(row[3] * row[4]) + ' total</div>' +
        '<div class="item-need"><i style="width:' + Math.max(4, Math.min(100, (row[3] * row[4]) / 320)) + '%"></i></div></div>' +
        '<div class="stepper"><button type="button" class="sub" aria-label="Remove one: ' + row[2] + '">−</button><output>0</output><button type="button" class="add" aria-label="Add one: ' + row[2] + '">+</button></div>';
      itemsEl.appendChild(div);
    });
    itemsEl.addEventListener("click", function (e) {
      var btn = e.target.closest("button"); if (!btn) return;
      var item = btn.closest(".item"), idx = +item.dataset.idx, row = BUDGET[idx];
      var q = picks[idx] || 0;
      q = btn.classList.contains("add") ? Math.min(row[4], q + 1) : Math.max(0, q - 1);
      if (q) picks[idx] = q; else delete picks[idx];
      item.querySelector("output").textContent = q;
      item.classList.toggle("picked", q > 0);
      renderTally();
    });
  }
  function renderTally() {
    var total = 0, lines = [], nums = [];
    Object.keys(picks).forEach(function (k) {
      var row = BUDGET[k], q = picks[k];
      total += row[3] * q;
      lines.push("<li>" + q + " × " + row[2] + " <b style=\"float:right\">" + money(row[3] * q) + "</b></li>");
      if (nums.indexOf(row[1]) < 0) nums.push(row[1]);
    });
    document.getElementById("tallyTotal").textContent = money(total);
    document.getElementById("tallyLines").innerHTML = lines.length ? lines.join("") : '<li class="muted">Tap + on any item to add it.</li>';
    document.getElementById("tallyMemo").textContent = "Madagascar Mission" + (nums.length ? " · item " + nums.sort().join(", ") : "");
  }

  // mobile: the tally is a bottom bar, shown only while the needs section is on screen, opened by tap
  var tally = document.getElementById("tally"), head = document.getElementById("tallyHead"), needs = document.getElementById("needs");
  if (head && tally) head.addEventListener("click", function () {
    var open = tally.classList.toggle("open"); head.setAttribute("aria-expanded", open ? "true" : "false");
  });
  if (needs && "IntersectionObserver" in window) {
    new IntersectionObserver(function (ents) { document.body.classList.toggle("needs-live", ents[0].isIntersecting); }, { threshold: 0.05 }).observe(needs);
  }

  // ---------- copy buttons ----------
  var toast = document.getElementById("toast");
  function say(msg) { if (!toast) return; toast.textContent = msg; toast.classList.add("show"); setTimeout(function () { toast.classList.remove("show"); }, 1800); }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { say("Copied"); }, function () { say(text); });
    else say(text);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]"); if (b) copy(b.dataset.copy);
    if (e.target.id === "copyMemo") copy(document.getElementById("tallyMemo").textContent);
  });

  // ---------- photos: filled by slot, lazily, at the size the screen needs ----------
  // The published build inlines photos.json as window.RLOM_PHOTOS (no extra request); the source
  // folder falls back to fetching it. Each photo has WebP copies in assets/photos/opt/ at
  // <name>-800 and -1600 (the hero also -1200 and -2000), made by tools/optimize-images.py.
  // A slot names files first (exact), then slot prefixes from photos.json.
  var SLOT_MAP = {
    hero: ["hero-mothers-certificates.jpg", "hero"], "birth-certificates": ["hero-certificate-day.jpg", "birth-certificates"],
    "school-rebuilt": ["school-metal-classroom.jpg", "school-before-after"], classroom: ["andromivonga-teacher.jpg", "classroom"],
    bikes: ["pastors-bikes-church.jpg", "pastor-bikes"], edmond: ["edmond-community.jpg", "edmond"], arlette: ["arlette"], nomena: ["nomena"], sarah: ["board-sarah.jpg"]
  };
  var GALLERY = ["nomena-sahambavy-women.jpg", "landscape-terraces.jpg", "children-parade.jpg", "conference-congregation.jpg", "pastors-bikes.jpg",
    "women-community.jpg", "river-crossing.jpg", "birth-certificates-moms.jpg", "hero-gathering.jpg", "vbs-parachute.jpg", "hero-procession.jpg"];
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  function opt(file, w) { return "assets/photos/opt/" + file.replace(/\.[a-z]+$/i, "") + "-" + w + ".webp"; }
  function sizeFor(node) { return (node.clientWidth || window.innerWidth) * DPR > 820 ? 1600 : 800; }
  var lazy = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var t = e.target; lazy.unobserve(t);
      t.style.backgroundImage = "url('" + opt(t.dataset.photo, sizeFor(t)) + "')";
    });
  }, { rootMargin: "600px 0px" }) : null;

  function usePhotos(list) {
    if (!Array.isArray(list)) return;
    function find(names) {
      for (var j = 0; j < names.length; j++) {
        for (var i = 0; i < list.length; i++) {
          var s = String(list[i].slot || "").toLowerCase();
          if (list[i].file === names[j] || s.indexOf(names[j]) === 0) return list[i];
        }
      }
      return null;
    }
    var gal = document.getElementById("gallery");
    if (gal) GALLERY.forEach(function (f) {
      var p = list.filter(function (x) { return x.file === f; })[0]; if (!p) return;
      var fig = document.createElement("figure");
      fig.className = "gal" + (p.height > p.width ? " tall" : "");
      var alt = String(p.caption || "").replace(/"/g, "&quot;");
      fig.innerHTML = '<img loading="lazy" decoding="async" width="' + p.width + '" height="' + p.height + '" src="' + opt(p.file, 800) +
        '" srcset="' + opt(p.file, 800) + ' 800w, ' + opt(p.file, 1600) + ' 1600w" sizes="(max-width:600px) 78vw, 420px" alt="' + alt + '"><figcaption>' + (p.caption || "") + "</figcaption>";
      gal.appendChild(fig);
    });
    document.querySelectorAll("[data-slot]").forEach(function (node) {
      var p = find(SLOT_MAP[node.dataset.slot] || [node.dataset.slot]); if (!p) return;
      var isHero = node.classList.contains("hero");
      var target = isHero ? node : node.querySelector(".story-img, .founder-img");
      if (!target) return;
      if (p.caption) target.setAttribute("title", p.caption);
      if (isHero) { node.classList.add("has-photo"); return; } // hero photo is set in CSS and preloaded in <head>
      target.dataset.photo = p.file;
      if (lazy) lazy.observe(target); else target.style.backgroundImage = "url('" + opt(p.file, sizeFor(target)) + "')";
    });
  }
  if (window.RLOM_PHOTOS) usePhotos(window.RLOM_PHOTOS);
  else fetch("assets/photos/photos.json").then(function (r) { return r.ok ? r.json() : []; }).then(usePhotos).catch(function () {});
})();
