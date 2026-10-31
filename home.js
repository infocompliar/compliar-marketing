(() => {
  // ---- 1. Standby Battery Calculator (BS 5839-1:2025 Annex E) ---------------
  const SIZES = [7, 9, 12, 17, 24, 38, 65, 100, 120];
  function pickSize(cmin) {
    return SIZES.find((size) => size >= cmin) ?? null;
  }
  function batterySizing({ i1A, t1h, i2A, t2h }) {
    const c1 = 1.25 * (t1h * i1A + i2A * t2h);
    const d = c1 / 20 >= i2A ? 1 : 1.75;
    const cmin = d === 1 ? c1 : 1.25 * (t1h * i1A + 1.75 * i2A * t2h);
    const size = pickSize(cmin);
    return { c1, d, cmin, size, aboveMax: size === null };
  }

  const batT1 = document.getElementById("bat-t1");
  const batT2 = document.getElementById("bat-t2");
  const batI1 = document.getElementById("bat-i1");
  const batI2 = document.getElementById("bat-i2");
  if (batT1 && batT2 && batI1 && batI2) {
    let sys = "fire";
    let i1Unit = "mA";
    let i2Unit = "A";

    const sysBtns = [...document.querySelectorAll("[data-bat-sys]")];
    const t1Btns = [...document.querySelectorAll("[data-t1]")];
    const t2Btns = [...document.querySelectorAll("[data-t2]")];
    const i1UnitBtns = [...document.querySelectorAll("[data-i1-unit]")];
    const i2UnitBtns = [...document.querySelectorAll("[data-i2-unit]")];
    const sizeChips = [...document.querySelectorAll(".bat-sizes-strip [data-size]")];

    function syncPresets() {
      const t1Val = Number(batT1.value);
      const t2Val = Number(batT2.value);
      t1Btns.forEach((b) => b.classList.toggle("active", Number(b.dataset.t1) === t1Val));
      t2Btns.forEach((b) => b.classList.toggle("active", Math.abs(Number(b.dataset.t2) - t2Val) < 0.001));
    }

    function computeBattery() {
      const t1h = Math.max(0.1, Number(batT1.value) || 0);
      const t2h = Math.max(0.01, Number(batT2.value) || 0);
      const rawI1 = Math.max(0, Number(batI1.value) || 0);
      const rawI2 = Math.max(0, Number(batI2.value) || 0);
      const i1A = i1Unit === "mA" ? rawI1 / 1000 : rawI1;
      const i2A = i2Unit === "mA" ? rawI2 / 1000 : rawI2;

      const { c1, d, cmin, size, aboveMax } = batterySizing({ i1A, t1h, i2A, t2h });

      document.getElementById("bat-cmin").textContent = `${cmin.toFixed(2)} Ah`;
      const tag = document.getElementById("bat-derate-tag");
      tag.textContent = d === 1 ? "D = 1.0 (no derating needed)" : "D = 1.75 derating applied";
      tag.classList.toggle("derate-low", d === 1);

      const rec = document.getElementById("bat-rec");
      const recSub = document.getElementById("bat-rec-sub");
      if (aboveMax) {
        rec.textContent = "Exceeds 120 Ah single bank";
        recSub.textContent = "Split across distributed PSU enclosures or parallel banks per manufacturer data.";
      } else if (sys === "intruder") {
        rec.textContent = `1 × 12V ${size} Ah VRLA Battery`;
        recSub.textContent = `For a 12V intruder panel (or 2 × 12V ${size} Ah in series for 24V supplies)`;
      } else {
        rec.textContent = `2 × 12V ${size} Ah VRLA Batteries`;
        recSub.textContent = `For a 24V fire alarm panel (or 1 × 12V ${size} Ah for a 12V system)`;
      }

      const dPart = d === 1 ? `1.0 × ${i2A.toFixed(3)}` : `1.75 × ${i2A.toFixed(3)}`;
      document.getElementById("bat-working").textContent =
        `Cmin = 1.25 × (T1 · I1 + D · I2 · T2) = 1.25 × (${t1h} × ${i1A.toFixed(3)} + ${dPart} × ${t2h}) = ${cmin.toFixed(2)} Ah`;

      const c1Rate = c1 / 20;
      document.getElementById("bat-derate-exp").textContent =
        d === 1
          ? `20-hour discharge check: Underrated capacity C1 / 20 = ${c1Rate.toFixed(2)} A ≥ I2 (${i2A.toFixed(2)} A), so D = 1.0 applies with the 1.25 (25%) ageing factor.`
          : `20-hour discharge check: Underrated capacity C1 / 20 = ${c1Rate.toFixed(2)} A < I2 (${i2A.toFixed(2)} A), so Annex E.1.2 derating factor D = 1.75 is applied, plus the 1.25 (25%) battery ageing allowance.`;

      sizeChips.forEach((chip) => {
        chip.classList.toggle("selected", Number(chip.dataset.size) === size);
      });
      syncPresets();
    }

    sysBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        sys = btn.dataset.batSys;
        sysBtns.forEach((b) => b.classList.toggle("active", b === btn));
        if (sys === "intruder") {
          batT1.value = "12";
          batT2.value = "0.07";
        } else {
          batT1.value = "24";
          batT2.value = "0.5";
        }
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

    [batT1, batT2, batI1, batI2].forEach((el) => el.addEventListener("input", computeBattery));
    computeBattery();
  }

  // ---- 2. Grounded ROI Calculator -------------------------------------------
  const engineers = document.getElementById("roi-engineers");
  const rate = document.getElementById("roi-rate");
  const remedial = document.getElementById("roi-remedial");
  if (engineers && rate && remedial) {
    const money = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    });
    const cta = document.getElementById("roi-cta");
    function updateRoi() {
      const e = Number(engineers.value);
      const r = Number(rate.value);
      const rem = Number(remedial.value);
      const hours = e * 1.5 * 4.2; // 1.5 hrs/week * 4.2 weeks/month
      const timeVal = Math.round(hours * r);
      const defectVal = Math.round(e * 2 * rem);
      const monthly = timeVal + defectVal;
      const annual = monthly * 12;

      document.getElementById("roi-engineers-out").textContent = e;
      document.getElementById("roi-rate-out").textContent = `£${r}/hr`;
      document.getElementById("roi-remedial-out").textContent = `£${rem}`;
      document.getElementById("roi-hours").textContent = `~${Math.round(hours)} hours / month`;
      document.getElementById("roi-time-val").textContent = `(${money.format(timeVal)} value)`;
      document.getElementById("roi-defects").textContent = `~${money.format(defectVal)}`;
      document.getElementById("roi-monthly").textContent = `~${money.format(monthly)}`;
      document.getElementById("roi-annual-note").textContent =
        `Equivalent to ~${money.format(annual)} across a 12-month year.`;
      if (cta) cta.dataset.engineers = String(e);
    }
    [engineers, rate, remedial].forEach((el) => el.addEventListener("input", updateRoi));
    updateRoi();
  }

  // ---- 3. Screenshot Lightbox on Homepage -----------------------------------
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
        cap.textContent = fc ? fc.textContent : src ? src.alt : "";
        d.showModal();
      });
    });
  }
})();
