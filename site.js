// Preserve links to sections moved off the original homepage.
const legacySections = {
  features: "/features/",
  certificates: "/features/#certificates",
  pricing: "/pricing/",
  faq: "/faqs/",
  roadmap: "/about/#roadmap",
};
if (location.pathname === "/" || location.pathname === "/index.html") {
  const destination = legacySections[location.hash.slice(1)];
  if (destination) location.replace(destination);
}
const menu = document.querySelector(".mobile-menu");
if (menu) {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) || event.target.closest("a"))
      menu.open = false;
  });
}

// Disciplines mega-menu: opens on click, hover (pointer devices) and keyboard.
(() => {
  const toggle = document.querySelector(".mega-toggle");
  if (!toggle) return;
  const panel = document.getElementById(toggle.getAttribute("aria-controls"));
  const item = toggle.closest(".has-mega");
  if (!panel || !item) return;
  const hovers = () => window.matchMedia("(hover: hover)").matches;
  function set(open) {
    toggle.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
  }
  let timer;
  toggle.addEventListener("click", () => set(panel.hidden));
  item.addEventListener("mouseenter", () => {
    clearTimeout(timer);
    if (hovers()) set(true);
  });
  item.addEventListener("mouseleave", () => {
    if (hovers()) timer = setTimeout(() => set(false), 120);
  });
  item.addEventListener("focusout", (event) => {
    if (!item.contains(event.relatedTarget)) set(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      set(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!item.contains(event.target)) set(false);
  });
})();
