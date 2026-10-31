(() => {
  // ---- 1. Disciplines & Standards Sector Filter + Modal ---------------------
  const sectorTabs = [...document.querySelectorAll("[data-sector-filter]")];
  const sectorBlocks = [...document.querySelectorAll(".taxonomy-block[data-sector]")];
  if (sectorTabs.length && sectorBlocks.length) {
    sectorTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const filter = tab.dataset.sectorFilter;
        sectorTabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle("active", active);
          t.setAttribute("aria-selected", String(active));
        });
        sectorBlocks.forEach((block) => {
          block.hidden = filter !== "all" && block.dataset.sector !== filter;
        });
      });
    });
  }

  const standardsModal = document.getElementById("standards-modal");
  const standardsSearch = document.getElementById("standards-search");
  if (standardsModal && typeof HTMLDialogElement === "function") {
    document.querySelectorAll("[data-standards-modal-open]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        standardsModal.showModal();
        if (standardsSearch) standardsSearch.focus();
      });
    });
    standardsModal.querySelectorAll("[data-standards-modal-close]").forEach((btn) => {
      btn.addEventListener("click", () => standardsModal.close());
    });
    standardsModal.addEventListener("click", (e) => {
      if (e.target === standardsModal) standardsModal.close();
    });
    if (standardsSearch) {
      standardsSearch.addEventListener("input", () => {
        const q = standardsSearch.value.trim().toLowerCase();
        standardsModal.querySelectorAll("[data-sm-sector]").forEach((sec) => {
          const items = [...sec.querySelectorAll("li")];
          let visibleCount = 0;
          items.forEach((li) => {
            const match = !q || li.textContent.toLowerCase().includes(q);
            li.hidden = !match;
            if (match) visibleCount++;
          });
          sec.hidden = visibleCount === 0;
        });
      });
    }
  }

  // ---- 2. Live Interactive QR Logbook Demo Tabs -----------------------------
  const lbTabs = [...document.querySelectorAll("[data-lb-tab]")];
  const lbPanels = [...document.querySelectorAll("[data-lb-panel]")];
  if (lbTabs.length && lbPanels.length) {
    lbTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.lbTab;
        lbTabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle("active", active);
          t.setAttribute("aria-selected", String(active));
        });
        lbPanels.forEach((p) => {
          p.hidden = p.dataset.lbPanel !== target;
        });
      });
    });
  }

  // ---- 3. Branded Sticker Swatch Switcher -----------------------------------
  const swatches = [...document.querySelectorAll("[data-sticker-bg]")];
  const brandedImg = document.getElementById("branded-sticker-img");
  const contrastNote = document.getElementById("st-contrast-note");
  if (swatches.length && brandedImg) {
    swatches.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.stickerBg;
        swatches.forEach((b) => b.classList.toggle("active", b === btn));
        if (mode === "white") {
          brandedImg.src = "/assets/stickers/sticker-qr-white.png";
          if (contrastNote) contrastNote.textContent = "Contrast 16.4:1 (Pass)";
        } else {
          brandedImg.src = "/assets/stickers/sticker-qr-brand.png";
          if (contrastNote) contrastNote.textContent = "QR isolated on white square";
        }
      });
    });
  }

  // ---- 4. Demonstration-Only BS 5839-1 Battery Calculator -------------------
  const SIZES = [7, 9, 12, 17, 24, 38, 65, 100, 120];
  function pickSize(ah) {
    return SIZES.find((size) => size >= ah) ?? null;
  }

  const batT1 = document.getElementById("bat-t1");
  const batT2 = document.getElementById("bat-t2");
  const batI1 = document.getElementById("bat-i1");
  const batI2 = document.getElementById("bat-i2");
  if (batT1 && batT2 && batI1 && batI2) {
    let voltage = 24;
    let i1Unit = "mA";
    let i2Unit = "A";
    let lastSummaryText = "";

    const voltBtns = [...document.querySelectorAll("[data-bat-volt]")];
    const t1Btns = [...document.querySelectorAll("[data-t1]")];
    const t2Btns = [...document.querySelectorAll("[data-t2]")];
    const i1UnitBtns = [...document.querySelectorAll("[data-i1-unit]")];
    const i2UnitBtns = [...document.querySelectorAll("[data-i2-unit]")];
    const sizeChips = [...document.querySelectorAll(".bat-sizes-strip [data-size]")];
    const recalcBtn = document.getElementById("bat-btn-recalc");
    const resetBtn = document.getElementById("bat-btn-reset");
    const copyBtn = document.getElementById("bat-btn-copy");
    const copyToast = document.getElementById("bat-copy-toast");

    function syncPresets() {
      const t1Val = Number(batT1.value);
      const t2Val = Number(batT2.value);
      t1Btns.forEach((b) => b.classList.toggle("active", Number(b.dataset.t1) === t1Val));
      t2Btns.forEach((b) => b.classList.toggle("active", Math.abs(Number(b.dataset.t2) - t2Val) < 0.001));
    }

    function formatAhSize(s) {
      return s < 10 ? `${s}.0Ah` : `${s}Ah`;
    }

    function computeBattery() {
      const t1h = Math.max(0.1, Number(batT1.value) || 0);
      const t2h = Math.max(0.01, Number(batT2.value) || 0);
      const rawI1 = Math.max(0, Number(batI1.value) || 0);
      const rawI2 = Math.max(0, Number(batI2.value) || 0);
      const i1A = i1Unit === "mA" ? rawI1 / 1000 : rawI1;
      const i2A = i2Unit === "mA" ? rawI2 / 1000 : rawI2;

      // Base formula required by prompt: Ah = 1.25 * [(I1 * T1) + (I2 * T2)]
      const baseAh = 1.25 * (i1A * t1h + i2A * t2h);
      // Annex E high-rate check for reference
      const d = baseAh / 20 >= i2A ? 1.0 : 1.75;
      const annexAh = d === 1.0 ? baseAh : 1.25 * (i1A * t1h + 1.75 * i2A * t2h);
      const size = pickSize(baseAh);
      const annexSize = pickSize(annexAh);

      document.getElementById("bat-cmin").textContent = `${baseAh.toFixed(2)} Ah`;
      const voltTag = document.getElementById("bat-volt-tag");
      if (voltTag) voltTag.textContent = `${voltage}V System · 1.25 Aging Factor`;

      const annexNote = document.getElementById("bat-annex-note");
      if (annexNote) {
        annexNote.textContent =
          d === 1.0
            ? `With Annex E high-rate check (D = 1.0): ${annexAh.toFixed(2)} Ah`
            : `If Annex E.1.2 high-rate derating (D = 1.75) applies: ${annexAh.toFixed(2)} Ah (example size: ${annexSize ? formatAhSize(annexSize) : ">120Ah"})`;
      }

      const rec = document.getElementById("bat-rec");
      const recSub = document.getElementById("bat-rec-sub");
      const count = voltage === 24 ? 2 : 1;
      if (size === null) {
        rec.textContent = "Example only: Exceeds 120Ah single bank";
        recSub.textContent = "Illustrative only — large loads typically require distributed PSUs or parallel banks per manufacturer data.";
      } else {
        const label = formatAhSize(size);
        rec.textContent = `Example only: ${count} × 12V ${label} VRLA`;
        recSub.textContent =
          voltage === 24
            ? `Illustrative 24V series pair (e.g. 2× 12V 7.0Ah, 2× 12V 12Ah, 2× 12V 17Ah). Do not use for final selection.`
            : `Illustrative 12V unit (e.g. 1× 12V 7.0Ah, 1× 12V 17Ah). Do not use for final selection.`;
      }

      const formulaStr = `Ah = 1.25 × [(I1 × T1) + (I2 × T2)] = 1.25 × [(${i1A.toFixed(3)} A × ${t1h}h) + (${i2A.toFixed(3)} A × ${t2h}h)] = ${baseAh.toFixed(2)} Ah`;
      document.getElementById("bat-working").textContent = formulaStr;

      document.getElementById("bat-derate-exp").textContent =
        `Inputs: System = ${voltage}V DC | I1 = ${i1A.toFixed(3)} A (${Math.round(i1A * 1000)} mA) | T1 = ${t1h}h | I2 = ${i2A.toFixed(3)} A | T2 = ${t2h}h (${Math.round(t2h * 60)} min) | Illustrative aging factor = 1.25.`;

      sizeChips.forEach((chip) => {
        chip.classList.toggle("selected", Number(chip.dataset.size) === size);
      });
      syncPresets();

      lastSummaryText = [
        "COMPLIAR STANDBY BATTERY CALCULATION SUMMARY (DEMONSTRATION ONLY)",
        "-----------------------------------------------------------------",
        `System Voltage: ${voltage}V DC`,
        `Quiescent Load (I1): ${i1A.toFixed(3)} A (${Math.round(i1A * 1000)} mA)`,
        `Standby Duration (T1): ${t1h} hours`,
        `Full Alarm Load (I2): ${i2A.toFixed(3)} A (${Math.round(i2A * 1000)} mA)`,
        `Alarm Duration (T2): ${t2h} hours (${Math.round(t2h * 60)} mins)`,
        `Formula: ${formulaStr}`,
        `Illustrative Capacity Result: ${baseAh.toFixed(2)} Ah`,
        `Illustrative Battery Pairing (Example Only): ${size ? `${count} × 12V ${formatAhSize(size)} VRLA` : "Exceeds 120Ah single bank"}`,
        "",
        "DISCLAIMER: Demonstration tool only. This calculator provides an illustrative estimate and does not verify compliance or determine the correct battery for an installation. Actual selection depends on the system design, equipment data, applicable standards and guidance, and the manufacturer’s instructions. A competent person must verify all calculations and selections before use.",
      ].join("\n");
    }

    voltBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        voltage = Number(btn.dataset.batVolt) || 24;
        voltBtns.forEach((b) => b.classList.toggle("active", b === btn));
        computeBattery();
      });
    });

    t1Btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        batT1.value = btn.dataset.t1;
        computeBattery();
      });
    });

    t2Btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        batT2.value = btn.dataset.t2;
        computeBattery();
      });
    });

    i1UnitBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.dataset.i1Unit;
        if (next === i1Unit) return;
        const val = Number(batI1.value) || 0;
        batI1.value = next === "A" ? (val / 1000).toString() : Math.round(val * 1000).toString();
        batI1.step = next === "A" ? "0.01" : "10";
        i1Unit = next;
        i1UnitBtns.forEach((b) => b.classList.toggle("active", b === btn));
        computeBattery();
      });
    });

    i2UnitBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.dataset.i2Unit;
        if (next === i2Unit) return;
        const val = Number(batI2.value) || 0;
        batI2.value = next === "A" ? (val / 1000).toString() : Math.round(val * 1000).toString();
        batI2.step = next === "A" ? "0.05" : "50";
        i2Unit = next;
        i2UnitBtns.forEach((b) => b.classList.toggle("active", b === btn));
        computeBattery();
      });
    });

    if (recalcBtn) {
      recalcBtn.addEventListener("click", () => {
        computeBattery();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        voltage = 24;
        i1Unit = "mA";
        i2Unit = "A";
        batT1.value = "24";
        batT2.value = "0.5";
        batI1.step = "10";
        batI1.value = "180";
        batI2.step = "0.05";
        batI2.value = "1.2";
        voltBtns.forEach((b) => b.classList.toggle("active", b.dataset.batVolt === "24"));
        i1UnitBtns.forEach((b) => b.classList.toggle("active", b.dataset.i1Unit === "mA"));
        i2UnitBtns.forEach((b) => b.classList.toggle("active", b.dataset.i2Unit === "A"));
        if (copyToast) copyToast.hidden = true;
        computeBattery();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        computeBattery();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(lastSummaryText);
          }
        } catch (err) {}
        if (copyToast) {
          copyToast.hidden = false;
          clearTimeout(copyToast._timer);
          copyToast._timer = setTimeout(() => {
            copyToast.hidden = true;
          }, 4000);
        }
      });
    }

    [batT1, batT2, batI1, batI2].forEach((el) => el.addEventListener("input", computeBattery));
    computeBattery();
  }

  // ---- 5. Grounded ROI & Time Savings Estimator -----------------------------
  const engineers = document.getElementById("roi-engineers");
  const jobs = document.getElementById("roi-jobs");
  const turnaround = document.getElementById("roi-turnaround");
  if (engineers && jobs && turnaround) {
    const money = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    });
    const cta = document.getElementById("roi-cta");

    function updateRoi() {
      const e = Number(engineers.value);
      const j = Number(jobs.value);
      const t = Number(turnaround.value);

      // Credible UK contractor metrics: ~26 mins (0.44h) saved per completed job/cert
      // At 8 jobs/wk * 4.2 wks = ~33.6 jobs/mo -> ~15 hrs saved per engineer/month
      const perEngHours = Math.max(6, Math.min(28, Math.round(j * 0.44 * 4.2)));
      const totalHours = perEngHours * e;
      const totalCerts = Math.round(e * j * 4.2);
      // Grounded admin + certificate processing cost reduction (~£32/hr blended admin/engineer processing cost)
      const monthlySaving = Math.round(totalHours * 32);
      const annualSaving = monthlySaving * 12;

      document.getElementById("roi-engineers-out").textContent = `${e} engineer${e === 1 ? "" : "s"}`;
      document.getElementById("roi-jobs-out").textContent = `${j} jobs / week`;
      document.getElementById("roi-turnaround-out").textContent = `${t} day${t === 1 ? "" : "s"} (vs. Instant)`;

      document.getElementById("roi-per-eng-hours").textContent = `~${perEngHours} hrs / engineer / month`;
      document.getElementById("roi-team-hours").textContent = `(~${totalHours} hrs/month across ${e} engineer${e === 1 ? "" : "s"})`;
      document.getElementById("roi-quote-speed").textContent = "Same-Day Dispatch";
      document.getElementById("roi-quote-lag").textContent = `(eliminates ${t}-day office certificate & quote lag)`;
      document.getElementById("roi-admin-saving").textContent = `~${money.format(monthlySaving)} / month`;
      document.getElementById("roi-annual-note").textContent =
        `Equivalent to ~${money.format(annualSaving)}/year in reclaimed office & engineer capacity (plus zero per-cert token fees)`;
      document.getElementById("roi-certs-month").textContent = String(totalCerts);

      if (cta) cta.dataset.engineers = String(e);
    }

    [engineers, jobs, turnaround].forEach((el) => el.addEventListener("input", updateRoi));
    updateRoi();
  }

  // ---- 6. Screenshot Lightbox on Homepage -----------------------------------
  const shots = document.querySelectorAll("a.shot");
  if (shots.length && typeof HTMLDialogElement === "function") {
    const d = document.createElement("dialog");
    d.className = "shot-viewer";
    d.innerHTML = '<button type="button" aria-label="Close">\u00d7</button><img alt="" /><p></p>';
    document.body.appendChild(d);
    const img = d.querySelector("img");
    const cap = d.querySelector("p");
    d.addEventListener("click", () => d.close());
    shots.forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const src = a.querySelector("img");
        const fc = a.closest("figure") && a.closest("figure").querySelector("figcaption strong");
        img.src = a.getAttribute("href");
        img.alt = src ? src.alt : "";
        cap.textContent = fc ? fc.textContent : src ? src.alt : "Compliar Sticker Studio Dialog";
        d.showModal();
      });
    });
  }
})();
