// Client-side UI behaviors.

function initScrollReveal() {
  const targets = document.querySelectorAll<HTMLElement>(".reveal, [data-reveal-children]");
  if (!targets.length || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -50px 0px" },
  );
  targets.forEach((el) => io.observe(el));
}

function initHeaderScrollState() {
  const header = document.querySelector<HTMLElement>(".site-header");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initMobileMenu() {
  const toggle = document.querySelector<HTMLButtonElement>("[data-mobile-toggle]");
  const panel = document.querySelector<HTMLElement>("[data-mobile-panel]");
  if (!toggle || !panel) return;
  const close = () => {
    panel.classList.add("hidden");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const open = panel.classList.toggle("hidden");
    toggle.setAttribute("aria-expanded", String(!open));
  });
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

function initMenuTabs() {
  const root = document.querySelector<HTMLElement>("[data-menu-tabs]");
  if (!root) return;
  const tabs = root.querySelectorAll<HTMLButtonElement>("[data-tab]");
  const panels = root.querySelectorAll<HTMLElement>("[data-panel]");
  const activate = (key: string) => {
    tabs.forEach((b) => {
      const active = b.dataset.tab === key;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", String(active));
    });
    panels.forEach((p) => {
      const active = p.dataset.panel === key;
      if (active) {
        p.classList.remove("hidden");
        requestAnimationFrame(() => p.classList.add("is-active"));
      } else {
        p.classList.remove("is-active");
        setTimeout(() => {
          if (!p.classList.contains("is-active")) p.classList.add("hidden");
        }, 350);
      }
    });
  };
  tabs.forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.tab) activate(b.dataset.tab);
    }),
  );
  const first = tabs[0]?.dataset.tab;
  if (first) activate(first);
}

function initCountUp() {
  const targets = document.querySelectorAll<HTMLElement>("[data-count-up]");
  if (!targets.length || !("IntersectionObserver" in window)) return;
  const animate = (el: HTMLElement, target: number) => {
    const duration = 1600;
    const start = performance.now();
    const fmt = (n: number) => Math.floor(n).toLocaleString("ko-KR");
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          const target = Number(el.dataset.countUp || "0");
          animate(el, target);
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.35 },
  );
  targets.forEach((el) => {
    el.textContent = "0";
    io.observe(el);
  });
}

function initParallax() {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
  if (!els.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let ticking = false;
  const update = () => {
    const vh = window.innerHeight;
    els.forEach((el) => {
      const speed = Number(el.dataset.parallaxSpeed || "0.25");
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - vh / 2;
      const offset = -center * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

function initPopup() {
  const popups = Array.from(document.querySelectorAll<HTMLElement>("[data-popup]"));
  if (!popups.length) {
    // Still wire any triggers gracefully (no-op when target missing).
    document.querySelectorAll<HTMLElement>("[data-popup-open]").forEach((el) =>
      el.addEventListener("click", (e) => e.preventDefault()),
    );
    return;
  }

  const findPopup = (name: string) =>
    popups.find((p) => p.dataset.popup === name) || null;

  const open = (root: HTMLElement) => {
    root.classList.remove("hidden");
    root.classList.add("flex");
    document.body.style.overflow = "hidden";
  };
  const close = (root: HTMLElement) => {
    root.classList.add("hidden");
    root.classList.remove("flex");
    // Only release body scroll if no other popup is open.
    const stillOpen = popups.some((p) => !p.classList.contains("hidden"));
    if (!stillOpen) document.body.style.overflow = "";
  };

  // External triggers — each <[data-popup-open]> can target a specific popup by name.
  // Default target (no value) is "inquiry" for backward compatibility.
  document.querySelectorAll<HTMLElement>("[data-popup-open]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const name = el.dataset.popupOpen || "inquiry";
      const target = findPopup(name);
      if (target) open(target);
    }),
  );

  // Per-popup wiring.
  popups.forEach((root) => {
    const name = root.dataset.popup || "";

    // Auto-open only for the promo popup, with 24h dismissal via localStorage.
    if (name === "promo") {
      const STORAGE_KEY = `bonga-popup-hide-until::promo`;
      let suppressed = false;
      try {
        const until = Number(localStorage.getItem(STORAGE_KEY) || "0");
        suppressed = !!(until && Date.now() < until);
      } catch { /* localStorage unavailable */ }
      if (!suppressed) open(root);

      root.querySelectorAll<HTMLElement>("[data-popup-hide-1d]").forEach((el) =>
        el.addEventListener("click", () => {
          try {
            const until = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem(STORAGE_KEY, String(until));
          } catch { /* ignore */ }
          close(root);
        }),
      );
    }

    // Close button(s) inside the popup.
    root.querySelectorAll<HTMLElement>("[data-popup-close]").forEach((el) =>
      el.addEventListener("click", (e) => {
        if ((e.currentTarget as HTMLElement).tagName !== "A") e.preventDefault();
        close(root);
      }),
    );

    // Backdrop click closes.
    root.addEventListener("click", (e) => {
      if (e.target === root) close(root);
    });
  });

  // ESC closes the topmost open popup.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openOnes = popups.filter((p) => !p.classList.contains("hidden"));
    const top = openOnes[openOnes.length - 1];
    if (top) close(top);
  });
}

function initHeroVideoRotator() {
  const rotator = document.querySelector<HTMLElement>("[data-hero-rotator]");
  if (!rotator) return;
  const videos = Array.from(rotator.querySelectorAll<HTMLVideoElement>("[data-hero-video]"));
  if (videos.length < 2) return;

  const interval = Number(rotator.dataset.interval || "10000");
  let current = 0;

  // Track which videos have ever loaded successfully
  const ready = new Set<number>();
  videos.forEach((v, i) => {
    const markReady = () => ready.add(i);
    v.addEventListener("canplay", markReady, { once: true });
    v.addEventListener("loadeddata", markReady, { once: true });
    // Force eager load so transitions are seamless
    try { v.preload = "auto"; v.load(); } catch {}
  });
  // First video is the visible one — start by assuming it'll be ready
  ready.add(0);

  const advance = () => {
    // Find the next video that's ready to play. Skip broken/loading ones.
    let next = current;
    for (let i = 1; i <= videos.length; i++) {
      const candidate = (current + i) % videos.length;
      // readyState >= 2 (HAVE_CURRENT_DATA) is enough to show without flashing poster
      if (ready.has(candidate) && videos[candidate].readyState >= 2) {
        next = candidate;
        break;
      }
    }
    if (next === current) return; // nothing else ready yet — stay on current

    const cur = videos[current];
    const nxt = videos[next];

    // Pause the OUTGOING video immediately and freeze its last frame.
    // If we don't, it may loop back to frame 0 mid-fade and the user sees a
    // brief flash of the same video restarting.
    try { cur.pause(); } catch {}

    // Start the next clip from the beginning before the fade begins so its
    // first frames are already painted when opacity goes to 1.
    try { nxt.currentTime = 0; } catch {}
    const playPromise = nxt.play().catch(() => {});

    // Fade — both transitions run together
    nxt.classList.remove("opacity-0");
    nxt.classList.add("opacity-100");
    cur.classList.remove("opacity-100");
    cur.classList.add("opacity-0");

    // (Optional) once next has a real frame, no-op — opacity transition handles the rest
    Promise.resolve(playPromise).then(() => {});

    current = next;
  };

  setInterval(advance, interval);
}

function init() {
  initScrollReveal();
  initHeaderScrollState();
  initMobileMenu();
  initMenuTabs();
  initCountUp();
  initParallax();
  initPopup();
  initHeroVideoRotator();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
