// Cookie banner for Google Ads and analytics consent (UK GDPR / PECR).
// The inline script at the top of <head> sets every consent type to "denied"
// and re-applies a stored "granted" choice before the Google tag loads. This
// file only asks first-time visitors and lets anyone change their choice from
// the "Cookie settings" link in the footer.
(() => {
  const KEY = "compliar_cookie_consent";
  const TYPES = [
    "ad_storage",
    "ad_user_data",
    "ad_personalization",
    "analytics_storage",
  ];

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (error) {
      return null;
    }
  }

  function save(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (error) {
      // Storage blocked: the choice still applies to this page view.
    }
  }

  function applyConsent(value) {
    if (typeof gtag !== "function") return;
    const state = {};
    TYPES.forEach((type) => {
      state[type] = value;
    });
    gtag("consent", "update", state);
  }

  const banner = document.createElement("section");
  banner.className = "cookie-banner";
  banner.setAttribute("aria-label", "Cookie choices");
  banner.hidden = true;
  banner.innerHTML = `
    <p>
      We use essential cookies to make our site work, and optional analytics &amp;
      marketing cookies to understand how you interact with Compliar and track
      demo requests. <a href="/cookies/">Cookie policy</a>
    </p>
    <div class="cookie-actions">
      <button type="button" class="btn btn-primary btn-sm" data-consent="granted">Accept All</button>
      <button type="button" class="btn btn-ghost-on-navy btn-sm" data-consent="denied">Essential Only</button>
    </div>`;
  document.body.appendChild(banner);

  let returnFocus = null;

  function open(fromSettings) {
    banner.hidden = false;
    if (fromSettings) {
      returnFocus = document.activeElement;
      banner.querySelector("[data-consent]").focus();
    }
  }

  function close() {
    banner.hidden = true;
    if (returnFocus) {
      returnFocus.focus();
      returnFocus = null;
    }
  }

  banner.addEventListener("click", (event) => {
    const button = event.target.closest("[data-consent]");
    if (!button) return;
    const value = button.dataset.consent === "granted" ? "granted" : "denied";
    applyConsent(value);
    save(value);
    close();
  });

  document.querySelectorAll("[data-cookie-settings]").forEach((link) => {
    link.addEventListener("click", () => open(true));
    const item = link.closest("li");
    if (item) item.hidden = false;
  });

  const choice = stored();
  if (choice !== "granted" && choice !== "denied") open(false);
})();
