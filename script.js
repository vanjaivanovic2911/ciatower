const header = document.querySelector(".header");
const nav = document.querySelector("#navigacija");
const toggle = document.querySelector(".menu-toggle");
const progress = document.querySelector(".progress");
const heroImage = document.querySelector(".hero-image");
const crests = [...document.querySelectorAll(".crest")].map(crest => ({
  crest,
  onHero: Boolean(crest.closest(".showcase"))
}));
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const mobile = matchMedia("(max-width: 730px)");

document.documentElement.classList.add("js");
document.documentElement.classList.toggle("motion", !motion.matches);

function setMenu(open) {
  nav.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
}

toggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.addEventListener("click", event => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    setMenu(false);
    toggle.focus();
  }
});
document.addEventListener("click", event => {
  if (!header.contains(event.target)) setMenu(false);
});
mobile.addEventListener("change", () => setMenu(false));

if ("IntersectionObserver" in window) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("revealed");
      reveal.unobserve(entry.target);
    }
  }, { threshold: 0.08 });
  document.querySelectorAll("[data-reveal]").forEach(element => reveal.observe(element));
}

const links = [...nav.querySelectorAll("a")];
const sections = links.map(link => document.querySelector(link.hash));
let scheduled = false;

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function moveLogos() {
  if (motion.matches) {
    crests.forEach(({ crest }) => crest.style.removeProperty("--logo-offset"));
    return;
  }

  const offsets = crests.map(({ crest, onHero }) => {
    const { top, bottom, left } = crest.getBoundingClientRect();
    const unseen = onHero
      ? clamp((innerHeight * .58 - bottom) / (innerHeight * .58))
      : clamp((top - innerHeight * .42) / (innerHeight * .58));
    return Math.round((innerWidth - left + 24) * unseen);
  });
  crests.forEach(({ crest }, index) => crest.style.setProperty("--logo-offset", `${offsets[index]}px`));
}

function updateScroll() {
  const limit = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${limit > 0 ? clamp(scrollY / limit) : 0})`;
  if (!motion.matches && !mobile.matches) {
    const offset = Math.round(118 * clamp(scrollY / 620));
    heroImage.style.setProperty("--parallax-y", `${offset}px`);
  }

  const marker = header.offsetHeight + innerHeight * 0.26;
  let current = -1;
  sections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= marker) current = index;
  });
  links.forEach((link, index) => {
    if (index === current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  moveLogos();
  scheduled = false;
}

function scheduleScroll() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(updateScroll);
}

motion.addEventListener("change", () => {
  document.documentElement.classList.toggle("motion", !motion.matches);
  scheduleScroll();
});
addEventListener("scroll", scheduleScroll, { passive: true });
addEventListener("resize", scheduleScroll);
addEventListener("load", scheduleScroll);
updateScroll();

// Ease discrete mouse-wheel steps while leaving small trackpad deltas native.
let wheelFrame = 0;
let wheelTarget = 0;
let wheelPosition = 0;
let lastWheelY = 0;
let lastWheelTime = 0;

function stopWheelScroll() {
  cancelAnimationFrame(wheelFrame);
  wheelFrame = 0;
}

function animateWheelScroll(time) {
  wheelFrame = 0;
  if (motion.matches || Math.abs(scrollY - lastWheelY) > 2) return;

  const limit = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  wheelTarget = Math.min(wheelTarget, limit);
  const ease = 1 - Math.exp(-(time - lastWheelTime) / 130);
  lastWheelTime = time;
  wheelPosition += (wheelTarget - wheelPosition) * ease;

  const arrived = Math.abs(wheelTarget - wheelPosition) < 1;
  window.scrollTo({ top: arrived ? wheelTarget : wheelPosition, behavior: "instant" });
  lastWheelY = scrollY;
  if (!arrived) wheelFrame = requestAnimationFrame(animateWheelScroll);
}

function easeWheelStep(event) {
  if (motion.matches || !event.cancelable || event.defaultPrevented || event.ctrlKey || event.shiftKey) return;

  const mode = event.deltaMode;
  const delta = event.deltaY;
  if (!delta || Math.abs(event.deltaX) >= Math.abs(delta)) return;
  if (mode === WheelEvent.DOM_DELTA_PIXEL && Math.abs(delta) < 50) {
    stopWheelScroll();
    return;
  }

  const multiplier = mode === WheelEvent.DOM_DELTA_LINE ? 16
    : mode === WheelEvent.DOM_DELTA_PAGE ? innerHeight : 1;
  const limit = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const start = wheelFrame ? wheelTarget : scrollY;
  const target = Math.min(limit, Math.max(0, start + delta * multiplier));
  if (!wheelFrame && target === start) return;

  event.preventDefault();
  wheelTarget = target;
  if (!wheelFrame) {
    wheelPosition = scrollY;
    lastWheelY = scrollY;
    lastWheelTime = performance.now();
    wheelFrame = requestAnimationFrame(animateWheelScroll);
  }
}

addEventListener("wheel", easeWheelStep, { passive: false });
addEventListener("keydown", stopWheelScroll, { passive: true });
addEventListener("pointerdown", stopWheelScroll, { passive: true });
