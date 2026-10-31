// Demo request & contact form: embedded on the homepage (#contact-form) and
// /contact/ page, plus available as a modal when any [data-demo-open] button is
// clicked. Submissions go to Web3Forms (enquiry@compliar.co.uk). Google Ads
// conversion fires when marketing consent is granted.
(() => {
  const ENDPOINT = "https://api.web3forms.com/submit";
  const ACCESS_KEY = "00a6f18c-3054-40ab-8342-6d7598f91c09";
  const ADS_CONVERSION = "AW-18545152858/mXfZCOGjwq4dENqmgotF";
  const CONSENT_KEY = "compliar_cookie_consent";
  const PREFS_KEY = "compliar_cookie_prefs";
  const SIZES = ["1–3", "4–10", "11–25", "25+"];
  const DISCIPLINES = [
    "Electrical",
    "Fire Alarms",
    "Emergency Lighting",
    "Security & Access",
    "Passive Fire",
  ];
  let uid = 0;

  function sizeFor(engineers) {
    if (engineers <= 3) return "1–3";
    if (engineers <= 10) return "4–10";
    if (engineers <= 25) return "11–25";
    return "25+";
  }

  function hasMarketingConsent() {
    try {
      const prefsRaw = localStorage.getItem(PREFS_KEY);
      if (prefsRaw) {
        const prefs = JSON.parse(prefsRaw);
        return Boolean(prefs.marketing);
      }
      return localStorage.getItem(CONSENT_KEY) === "granted";
    } catch (error) {
      return false;
    }
  }

  function trackConversion() {
    if (!hasMarketingConsent() || typeof gtag !== "function") return;
    gtag("event", "conversion", {
      send_to: ADS_CONVERSION,
    });
  }

  function buildForm(options = {}) {
    const id = ++uid;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <form class="demo-form" novalidate>
        <p class="demo-prefill" ${options.engineers ? "" : "hidden"}>${
          options.engineers
            ? `Based on your ROI estimate: ${options.engineers} field engineer${options.engineers === 1 ? "" : "s"}`
            : ""
        }</p>
        <div class="grid2">
          <div>
            <label for="df-name-${id}">Full Name *</label>
            <input id="df-name-${id}" name="name" type="text" autocomplete="name" placeholder="e.g. David Reynolds" required />
          </div>
          <div>
            <label for="df-email-${id}">Work Email *</label>
            <input id="df-email-${id}" name="email" type="email" autocomplete="email" placeholder="david@yourcompany.co.uk" required />
          </div>
          <div>
            <label for="df-phone-${id}">Phone Number *</label>
            <input id="df-phone-${id}" name="phone" type="tel" autocomplete="tel" placeholder="07700 900123" required />
          </div>
          <div>
            <label for="df-company-${id}">Company Name *</label>
            <input id="df-company-${id}" name="company" type="text" autocomplete="organization" placeholder="Harbourview Fire & Security Ltd" required />
          </div>
        </div>
        <div class="grid2">
          <div>
            <label for="df-size-${id}">Number of Field Engineers</label>
            <select id="df-size-${id}" name="team_size">
              <option value="">Select team size…</option>
              ${SIZES.map((s) => `<option value="${s}">${s} field engineers</option>`).join("")}
            </select>
          </div>
          <fieldset class="demo-fieldset">
            <legend>Primary Disciplines</legend>
            <div class="demo-checks">
              ${DISCIPLINES.map((d) => `<label><input type="checkbox" name="disciplines" value="${d}" /> <span>${d}</span></label>`).join("")}
            </div>
          </fieldset>
        </div>
        <div>
          <label for="df-message-${id}">Optional Message / Requirements</label>
          <textarea id="df-message-${id}" name="message" rows="3" placeholder="Tell us about your current certificate software, log books, or any specific BS workflows you want to see…"></textarea>
        </div>
        <div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="botcheck" tabindex="-1" autocomplete="off" /></label></div>
        <div class="demo-error" role="alert" hidden></div>
        <div class="demo-submit-row">
          <button type="submit" class="btn btn-primary">Book a Demo Walkthrough</button>
          <p class="fine">We use these details only to arrange your walkthrough. See our <a href="/privacy/">Privacy Policy</a>.</p>
        </div>
      </form>`;
    const form = wrap.firstElementChild;
    if (options.engineers) form.elements.team_size.value = sizeFor(options.engineers);

    const error = form.querySelector(".demo-error");
    const button = form.querySelector("button[type=submit]");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.hidden = true;
      if (!form.reportValidity()) return;
      if (form.elements.botcheck.value) return showThanks();
      const disciplines = [...form.querySelectorAll("input[name=disciplines]:checked")].map((c) => c.value);
      const payload = {
        access_key: ACCESS_KEY,
        subject: "Compliar demo walkthrough request",
        from_name: "Compliar website",
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        company: form.elements.company.value.trim(),
        team_size: form.elements.team_size.value || "Not specified",
        disciplines: disciplines.join(", ") || "Not specified",
        message: form.elements.message.value.trim() || "None provided",
        engineers_from_calculator: form.dataset.engineers || (options.engineers ? String(options.engineers) : ""),
        page: location.href,
      };
      button.disabled = true;
      button.textContent = "Submitting request…";
      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Request failed");
        trackConversion();
        showThanks();
      } catch (err) {
        error.textContent =
          "Sorry, that didn’t send. Please try again, or email enquiry@compliar.co.uk and we’ll reply within one business day.";
        error.hidden = false;
        button.disabled = false;
        button.textContent = "Book a Demo Walkthrough";
      }
    });

    function showThanks() {
      const card = document.createElement("div");
      card.className = "demo-thanks";
      card.setAttribute("role", "status");
      card.innerHTML =
        '<div class="demo-thanks-icon" aria-hidden="true">✓</div><h3>Walkthrough Request Received</h3><p>Thank you. We\'ll be in touch within one business day to arrange your walkthrough.</p>';
      form.replaceWith(card);
    }
    return form;
  }

  let dialog;
  function openModal(options) {
    if (typeof HTMLDialogElement === "undefined") {
      location.href = "/#contact-form";
      return;
    }
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "demo-modal";
      dialog.setAttribute("aria-labelledby", "demo-modal-title");
      dialog.innerHTML = `
        <div class="demo-modal-inner">
          <button type="button" class="demo-modal-close" aria-label="Close">✕</button>
          <h2 id="demo-modal-title">Book a 15-Minute Demo</h2>
          <p class="modal-sub">Tell us which disciplines you maintain and we’ll tailor the walkthrough to your team.</p>
          <div class="modal-form"></div>
        </div>`;
      document.body.appendChild(dialog);
      dialog.querySelector(".demo-modal-close").addEventListener("click", () => dialog.close());
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    }
    dialog.querySelector(".modal-form").replaceChildren(buildForm(options));
    dialog.showModal();
    dialog.querySelector("input").focus();
  }

  document.addEventListener("click", (event) => {
    const roiBtn = event.target.closest("#roi-cta");
    if (roiBtn) {
      const eng = parseInt(roiBtn.dataset.engineers, 10);
      const inlineForm = document.querySelector("#contact-form form.demo-form, #demo form.demo-form");
      if (inlineForm && eng) {
        inlineForm.elements.team_size.value = sizeFor(eng);
        inlineForm.dataset.engineers = String(eng);
        const pre = inlineForm.querySelector(".demo-prefill");
        if (pre) {
          pre.textContent = `Based on your ROI estimate: ${eng} field engineer${eng === 1 ? "" : "s"}`;
          pre.hidden = false;
        }
      }
      return;
    }
    const opener = event.target.closest("[data-demo-open]");
    if (!opener) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const engineers = parseInt(opener.dataset.engineers, 10);
    openModal(engineers ? { engineers } : {});
  });

  document.querySelectorAll("[data-demo-form]").forEach((mount) => {
    mount.replaceChildren(buildForm());
  });

  const card = document.getElementById("book-a-demo") || document.getElementById("contact-form");
  if (card && new URLSearchParams(location.search).has("subject") && !location.hash) {
    card.scrollIntoView();
  }
})();
