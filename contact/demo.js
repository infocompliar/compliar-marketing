(() => {
  const preferences = document.querySelector(".demo-preferences");
  const email = document.getElementById("demo-email");
  if (!preferences || !email) return;
  const focus = document.getElementById("demo-focus");
  const team = document.getElementById("demo-team");
  const notes = document.getElementById("demo-notes");
  const summary = document.getElementById("demo-request-summary");
  function updateRequest() {
    const extra = notes && notes.value.trim() ? `\n\nMy request:\n${notes.value.trim()}` : "";
    const body = `Hi Compliar,\n\nI’d like to arrange a demo.\n\nFocus: ${focus.value}\nTeam size: ${team.value}\nTrade: \nCurrent software: \nPreferred times: ${extra}\n\nThanks,`;
    email.href = `mailto:enquiry@compliar.co.uk?subject=${encodeURIComponent("Compliar demo request")}&body=${encodeURIComponent(body)}`;
    summary.textContent = `Your email draft will include: ${focus.value.toLowerCase()}${team.value === "Not specified" ? "" : ", " + team.value.toLowerCase()}.`;
  }
  preferences.addEventListener("change", updateRequest);
  preferences.addEventListener("input", updateRequest);
  updateRequest();
  preferences.hidden = false;
})();

(() => {
  const button = document.getElementById("demo-copy");
  const address = document.getElementById("demo-address");
  const status = document.getElementById("demo-copy-status");
  if (!button || !address || !status) return;
  const text = address.textContent.trim();
  let timer;
  function say(message) {
    // Clear first so a repeat press is announced again.
    status.textContent = "";
    clearTimeout(timer);
    timer = setTimeout(() => {
      status.textContent = message;
    }, 50);
  }
  function selectAddress() {
    const range = document.createRange();
    range.selectNodeContents(address);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      say("Email address copied.");
    } catch (error) {
      selectAddress();
      say("Could not copy automatically. The address is selected; copy it now.");
    }
  });
  button.hidden = false;
})();

// Arriving from a "Book a demo" button (/contact?subject=Demo+request):
// jump to the request card, and count a Google Ads conversion only when the
// visitor actually starts a demo request (email, copy address or trial email).
(() => {
  const params = new URLSearchParams(location.search);
  const card = document.getElementById("book-a-demo");
  if (card && params.has("subject") && !location.hash) {
    card.scrollIntoView();
  }
  function convert() {
    if (typeof gtag_report_conversion === "function") gtag_report_conversion();
  }
  const targets = [
    document.getElementById("demo-email"),
    document.getElementById("demo-address"),
    document.getElementById("demo-copy"),
    document.querySelector('a[href^="mailto:enquiry@compliar.co.uk?subject=Compliar%20demo%20and%20free%20trial"]'),
  ];
  targets.forEach((el) => el && el.addEventListener("click", convert));
})();
