// Preserve links to sections moved off the original homepage.
const legacySections = {
  features: "/features/",
  certificates: "/#standards-matrix",
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

// Header dropdowns (Disciplines & Trades, Tools): click, hover and keyboard.
(() => {
  const toggles = [...document.querySelectorAll(".mega-toggle")];
  if (!toggles.length) return;
  const hovers = () => window.matchMedia("(hover: hover)").matches;
  const entries = toggles
    .map((toggle) => {
      const panel = document.getElementById(toggle.getAttribute("aria-controls"));
      const item = toggle.closest(".has-mega");
      return panel && item ? { toggle, panel, item } : null;
    })
    .filter(Boolean);

  function closeAll(except) {
    entries.forEach(({ toggle, panel }) => {
      if (toggle === except) return;
      toggle.setAttribute("aria-expanded", "false");
      panel.hidden = true;
    });
  }

  entries.forEach(({ toggle, panel, item }) => {
    let timer;
    function set(open) {
      if (open) closeAll(toggle);
      toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    }
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
    panel.addEventListener("click", (event) => {
      if (event.target.closest("a, [data-standards-modal-open]")) set(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const openEntry = entries.find(({ panel }) => !panel.hidden);
      if (openEntry) {
        closeAll();
        openEntry.toggle.focus();
      }
    }
  });
  document.addEventListener("click", (event) => {
    if (!entries.some(({ item }) => item.contains(event.target))) closeAll();
  });
})();
