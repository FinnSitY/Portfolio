/* ==========================================================
   Portfolio interactions
   ========================================================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Age from birthdate (Dec 8, 2004) ---------- */
(() => {
  const birth = new Date(2004, 11, 8);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  $("#age").dataset.count = age;
})();

/* ---------- Theme toggle (remembers choice) ---------- */
const root = document.documentElement;
try {
  const saved = localStorage.getItem("theme");
  if (saved) root.dataset.theme = saved;
} catch (_) {}

$("#themeBtn").addEventListener("click", () => {
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (_) {}
});

/* ---------- Live clock (Manila time) ---------- */
const clock = $("#clock");
const tick = () => {
  clock.textContent = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Manila", hour12: false }) + " PHT";
};
tick();
setInterval(tick, 1000);

$("#year").textContent = new Date().getFullYear();

/* ---------- Nav: scrolled state, mobile menu, active link ---------- */
const nav = $(".nav");
const depth = $("#depth");

const onScroll = () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 40);
  // "Depth" readout in the hero — scroll position as metres below surface
  depth.textContent = String(Math.round(window.scrollY * 0.8)).padStart(4, "0");
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

$("#burger").addEventListener("click", () => nav.classList.toggle("is-open"));
$$("#navLinks a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("is-open")));

const navLinks = $$("#navLinks a");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
$$("section[id]").forEach((s) => sectionObserver.observe(s));

/* ---------- Scroll reveal ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      if (e.target.hasAttribute("data-scramble")) scramble(e.target);
      revealObserver.unobserve(e.target);
    });
  },
  { threshold: 0.15 }
);
$$(".reveal").forEach((el) => revealObserver.observe(el));

/* ---------- Stat counters ---------- */
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const start = performance.now();
      const dur = 1400;
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(target * eased)).padStart(2, "0");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObserver.unobserve(el);
    });
  },
  { threshold: 0.6 }
);
$$("[data-count]").forEach((el) => countObserver.observe(el));

/* ---------- Project hover preview that trails the cursor ---------- */
const preview = $("#cursorPreview");
let px = 0, py = 0, tx = 0, ty = 0;

$$(".project").forEach((p) => {
  p.addEventListener("mouseenter", () => {
    preview.innerHTML = $(".project__preview", p).innerHTML;
    preview.classList.add("is-on");
  });
  p.addEventListener("mouseleave", () => preview.classList.remove("is-on"));
});

window.addEventListener("mousemove", (e) => { tx = e.clientX + 180; ty = e.clientY; });

(function follow() {
  px += (tx - px) * 0.14;
  py += (ty - py) * 0.14;
  preview.style.left = px + "px";
  preview.style.top = py + "px";
  requestAnimationFrame(follow);
})();

/* ---------- Text scramble (headings decode into place) ---------- */
function scramble(el) {
  if (reduceMotion) return;
  if (el.dataset.busy) return;
  el.dataset.busy = "1";
  const final = (el.dataset.text ||= el.textContent);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_";
  const total = 22;
  let frame = 0;
  const run = () => {
    const progress = frame / total;
    el.textContent = [...final]
      .map((ch, i) => {
        if (ch === " " || i / final.length < progress) return ch;
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join("");
    if (frame++ < total) requestAnimationFrame(run);
    else { el.textContent = final; delete el.dataset.busy; }
  };
  run();
}
// Replay on hover for section titles
$$(".section__title[data-scramble]").forEach((t) => t.addEventListener("mouseenter", () => scramble(t)));

/* ---------- Scroll progress bar ---------- */
const progress = $("#progress");
const updateProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
};
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

/* ---------- Magnetic buttons ---------- */
if (!reduceMotion) {
  $$(".magnetic").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
  });
}

/* ---------- Crosshair cursor ring ---------- */
const ring = $("#cursorRing");
if (window.matchMedia("(hover: hover)").matches) {
  let rx = 0, ry = 0, cx = 0, cy = 0;
  window.addEventListener("mousemove", (e) => {
    cx = e.clientX;
    cy = e.clientY;
    ring.classList.add("is-on");
  });
  document.addEventListener("mouseleave", () => ring.classList.remove("is-on"));
  document.addEventListener("mouseover", (e) => {
    ring.classList.toggle("is-hover", !!e.target.closest("a, button"));
  });
  (function trail() {
    rx += (cx - rx) * 0.22;
    ry += (cy - ry) * 0.22;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(trail);
  })();
}

/* ---------- Copy email ---------- */
const mailBtn = $("#copyMail");
const hint = $("#copyHint");
mailBtn.addEventListener("click", async () => {
  const email = mailBtn.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
    hint.textContent = "Copied to clipboard";
  } catch (_) {
    window.location.href = "mailto:" + email;
    return;
  }
  setTimeout(() => (hint.textContent = "Click to copy"), 2000);
});

/* ==========================================================
   Hero: animated bathymetric contour map
   Value noise → marching squares, redrawn slowly over time.
   ========================================================== */
(() => {
  const canvas = $("#contours");
  const ctx = canvas.getContext("2d");
  const CELL = 16;          // grid resolution in px
  const LEVELS = 11;        // number of contour lines
  let w, h, cols, rows, field, dpr;
  let mx = 0.5, my = 0.5;   // mouse influence

  // Seeded permutation for smooth value noise
  const perm = new Uint8Array(512);
  {
    const p = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  }
  const fade = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const hash = (x, y, z) => perm[(perm[(perm[x & 255] + y) & 255] + z) & 255] / 255;

  function noise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    const n = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
    return lerp(
      lerp(lerp(n(0, 0, 0), n(1, 0, 0), xf), lerp(n(0, 1, 0), n(1, 1, 0), xf), yf),
      lerp(lerp(n(0, 0, 1), n(1, 0, 1), xf), lerp(n(0, 1, 1), n(1, 1, 1), xf), yf),
      zf
    );
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
    field = new Float32Array(cols * rows);
  }

  function sample(t) {
    const s = 0.0028;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * CELL, y = j * CELL;
        let v = noise(x * s, y * s, t) * 0.65 + noise(x * s * 2.1, y * s * 2.1, t * 1.4) * 0.35;
        // gentle "seamount" that leans toward the cursor
        const dx = x / w - mx, dy = y / h - my;
        v += Math.exp(-(dx * dx + dy * dy) * 9) * 0.18;
        field[j * cols + i] = v;
      }
    }
  }

  // Interpolated edge point between two corners
  const interp = (a, b, va, vb, iso) => a + ((iso - va) / (vb - va || 1e-6)) * (b - a);

  function drawLevel(iso, major, rgb) {
    ctx.strokeStyle = `rgba(${rgb}, ${major ? 0.42 : 0.16})`;
    ctx.lineWidth = major ? 1.1 : 0.8;
    ctx.beginPath();
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = field[j * cols + i], b = field[j * cols + i + 1];
        const c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
        const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
        if (idx === 0 || idx === 15) continue;

        const x = i * CELL, y = j * CELL;
        const top = [interp(x, x + CELL, a, b, iso), y];
        const right = [x + CELL, interp(y, y + CELL, b, c, iso)];
        const bottom = [interp(x, x + CELL, d, c, iso), y + CELL];
        const left = [x, interp(y, y + CELL, a, d, iso)];

        const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
        switch (idx) {
          case 1: case 14: seg(left, bottom); break;
          case 2: case 13: seg(bottom, right); break;
          case 3: case 12: seg(left, right); break;
          case 4: case 11: seg(top, right); break;
          case 6: case 9:  seg(top, bottom); break;
          case 7: case 8:  seg(left, top); break;
          case 5:  seg(left, top); seg(bottom, right); break;
          case 10: seg(top, right); seg(left, bottom); break;
        }
      }
    }
    ctx.stroke();
  }

  function render(t) {
    ctx.clearRect(0, 0, w, h);
    sample(t);
    const rgb = getComputedStyle(root).getPropertyValue("--contour").trim();
    for (let k = 1; k <= LEVELS; k++) drawLevel(0.15 + (k / LEVELS) * 0.7, k % 4 === 0, rgb);
  }

  let last = 0;
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  function loop(now) {
    // ~24fps is plenty for slow drifting water and keeps CPU low
    if (visible && now - last > 42) {
      render(now * 0.00006);
      last = now;
    }
    requestAnimationFrame(loop);
  }

  canvas.parentElement.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width;
    my = (e.clientY - r.top) / r.height;
  });

  window.addEventListener("resize", () => { resize(); render(performance.now() * 0.00006); });
  resize();

  if (reduceMotion) render(0.5);
  else requestAnimationFrame(loop);
})();
