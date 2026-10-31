// Cookie banner for Google Ads and analytics consent (UK GDPR / PECR).
// The inline script at the top of <head> sets every consent type to "denied"
// and re-applies any stored consent before the Google tag loads. This file
// shows a discrete banner with Accept All, Reject Non-Essential, and
// Preferences options, and lets visitors reopen it from the footer link.
(() => {
  const KEY = "compliar_cookie_consent";
  const PREFS_KEY = "compliar_cookie_prefs";

  function storedChoice() {
    try {
      return localStorage.getItem(KEY);
    } catch (error) {
      return null;
    }
  }

  function storedPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {}
    const legacy = storedChoice();
    if (legacy === "granted") return { analytics: true, marketing: true };
    return { analytics: false, marketing: false };
  }

  function saveConsent(prefs) {
    const allGranted = Boolean(prefs.analytics && prefs.marketing);
    const summary = allGranted
      ? "granted"
      : prefs.analytics || prefs.marketing
        ? "custom"
        : "denied";
    try {
      localStorage.setItem(KEY, summary);
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      // Storage blocked: the choice still applies to this page view.
    }
    applyConsent(prefs);
  }

  function applyConsent(prefs) {
    if (typeof gtag !== "function") return;
    const adState = prefs.marketing ? "granted" : "denied";
    const analyticsState = prefs.analytics ? "granted" : "denied";
    gtag("consent", "update", {
      ad_storage: adState,
      ad_user_data: adState,
      ad_personalization: adState,
      analytics_storage: analyticsState,
    });
  }

  const banner = document.createElement("section");
  banner.className = "cookie-banner";
  banner.setAttribute("aria-label", "Cookie consent");
  banner.hidden = true;
  banner.innerHTML = `
    <div class="cookie-banner-main">
      <p>
        We use essential cookies to make our site work, and optional analytics &amp;
        marketing cookies (Google Consent Mode v2) to measure site usage and demo
        conversions. <a href="/cookies/">Cookie policy</a>
      </p>
      <div class="cookie-actions">
        <button type="button" class="btn btn-primary btn-sm" data-consent-action="accept-all">Accept All</button>
        <button type="button" class="btn btn-ghost-on-navy btn-sm" data-consent-action="reject">Reject Non-Essential</button>
        <button type="button" class="cookie-pref-btn" data-consent-action="preferences" aria-expanded="false">Preferences</button>
      </div>
    </div>
    <div class="cookie-prefs-panel" hidden>
      <div class="cookie-pref-row">
        <div>
          <strong>Essential Cookies</strong>
          <span>Required for security, navigation, and remembering your privacy preferences.</span>
        </div>
        <span class="cookie-always-on">Always active</span>
      </div>
      <label class="cookie-pref-row" for="cp-analytics">
        <div>
          <strong>Analytics Storage</strong>
          <span>Helps us understand which pages and contractor tools are most useful.</span>
        </div>
        <input type="checkbox" id="cp-analytics" data-pref-analytics />
      </label>
      <label class="cookie-pref-row" for="cp-marketing">
        <div>
          <strong>Marketing &amp; Google Ads</strong>
          <span>Measures the effectiveness of our UK trade campaigns and demo requests.</span>
        </div>
        <input type="checkbox" id="cp-marketing" data-pref-marketing />
      </label>
      <div class="cookie-pref-foot">
        <button type="button" class="btn btn-primary btn-sm" data-consent-action="save-prefs">Save Preferences</button>
      </div>
    </div>`;
  document.body.appendChild(banner);

  const prefsPanel = banner.querySelector(".cookie-prefs-panel");
  const prefBtn = banner.querySelector('[data-consent-action="preferences"]');
  const analyticsBox = banner.querySelector("[data-pref-analytics]");
  const marketingBox = banner.querySelector("[data-pref-marketing]");
  let returnFocus = null;

  function syncCheckboxes() {
    const current = storedPrefs();
    analyticsBox.checked = Boolean(current.analytics);
    marketingBox.checked = Boolean(current.marketing);
  }

  function open(fromSettings) {
    syncCheckboxes();
    banner.hidden = false;
    if (fromSettings) {
      returnFocus = document.activeElement;
      prefsPanel.hidden = false;
      prefBtn.setAttribute("aria-expanded", "true");
      analyticsBox.focus();
    }
  }

  function close() {
    banner.hidden = true;
    prefsPanel.hidden = true;
    prefBtn.setAttribute("aria-expanded", "false");
    if (returnFocus) {
      returnFocus.focus();
      returnFocus = null;
    }
  }

  banner.addEventListener("click", (event) => {
    const button = event.target.closest("[data-consent-action]");
    if (!button) return;
    const action = button.dataset.consentAction;
    if (action === "accept-all") {
      saveConsent({ analytics: true, marketing: true });
      close();
    } else if (action === "reject") {
      saveConsent({ analytics: false, marketing: false });
      close();
    } else if (action === "preferences") {
      const nextOpen = prefsPanel.hidden;
      prefsPanel.hidden = !nextOpen;
      prefBtn.setAttribute("aria-expanded", String(nextOpen));
    } else if (action === "save-prefs") {
      saveConsent({
        analytics: analyticsBox.checked,
        marketing: marketingBox.checked,
      });
      close();
    }
  });

  document.querySelectorAll("[data-cookie-settings]").forEach((link) => {
    link.addEventListener("click", () => open(true));
    const item = link.closest("li");
    if (item) item.hidden = false;
  });

  const choice = storedChoice();
  if (choice === "granted" || choice === "custom" || choice === "denied") {
    applyConsent(storedPrefs());
  } else {
    open(false);
  }
})();
