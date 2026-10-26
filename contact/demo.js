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
