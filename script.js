const header = document.querySelector(".header");
const nav = document.querySelector("#navigacija");
const toggle = document.querySelector(".menu-toggle");
const progress = document.querySelector(".progress");
const heroImage = document.querySelector(".hero-image");
const crests = [...document.querySelectorAll(".crest")].map(crest => ({
  crest,
  logo: crest.querySelector(".logo")
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
  const positions = crests.map(({ crest }) => crest.getBoundingClientRect());
  crests.forEach(({ crest, logo }, index) => {
    if (motion.matches) {
      crest.style.removeProperty("--travel");
      logo.style.removeProperty("--motion");
      return;
    }
    const { top, height } = positions[index];
    const middle = top + height / 2;
    const position = clamp((innerHeight - middle) / innerHeight) * 2 - 1;
    crest.style.setProperty("--travel", position.toFixed(3));
    logo.style.setProperty("--motion", (1 - Math.abs(position)).toFixed(3));
  });
}

function updateScroll() {
  const limit = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${limit > 0 ? clamp(scrollY / limit) : 0})`;
  heroImage.style.translate = motion.matches || mobile.matches ? "" : `0 ${Math.min(scrollY * 0.12, 105)}px`;

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
