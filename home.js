(() => {
  // ---- Savings calculator ------------------------------------------------
  const engineers = document.getElementById("roi-engineers");
  const jobs = document.getElementById("roi-jobs");
  const rate = document.getElementById("roi-rate");
  if (engineers && jobs && rate) {
    const money = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    });
    const number = new Intl.NumberFormat("en-GB");
    const cta = document.getElementById("roi-cta");
    function update() {
      const e = Number(engineers.value);
      const j = Number(jobs.value);
      const r = Math.max(0, Number(rate.value) || 0);
      const defects = e * j * 35 * 0.4; // £35 average remedial, 40% captured on site
      const hours = e * 1.5 * 20; // 1.5 admin hours a day over 20 working days
      const annual = (defects + hours * r) * 12;
      document.getElementById("roi-engineers-out").textContent = e;
      document.getElementById("roi-jobs-out").textContent = j;
      document.getElementById("roi-defects").textContent = money.format(defects);
      document.getElementById("roi-hours").textContent = number.format(hours);
      document.getElementById("roi-annual").textContent = money.format(annual);
      cta.dataset.engineers = String(e);
    }
    [engineers, jobs, rate].forEach((el) => el.addEventListener("input", update));
    update();
  }

  // ---- Discipline tabs ----------------------------------------------------
  const root = document.querySelector(".dtabs");
  if (!root) return;
  const list = root.querySelector('[role="tablist"]');
  const buttons = [...list.querySelectorAll('[role="tab"]')];
  const panels = buttons.map((b) => document.getElementById(b.getAttribute("aria-controls")));
  if (panels.some((p) => !p)) return;
  function activate(index, focus = false) {
    buttons.forEach((b, i) => {
      const on = i === index;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) buttons[index].focus();
  }
  buttons.forEach((b, i) => {
    panels[i].setAttribute("role", "tabpanel");
    panels[i].setAttribute("aria-labelledby", b.id);
    b.addEventListener("click", () => activate(i));
    b.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (i + 1) % buttons.length;
      else if (event.key === "ArrowLeft") next = (i - 1 + buttons.length) % buttons.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = buttons.length - 1;
      else return;
      event.preventDefault();
      activate(next, true);
    });
  });
  activate(0);
  list.hidden = false;
})();
