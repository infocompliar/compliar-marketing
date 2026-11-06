// BS 5839-1:2025 Annex E.1, using the default de-rating factor of 1.75
// when manufacturer-specific discharge data is not supplied.
function pickSize(cmin) {
  const sizes = [1.2, 2.1, 3.2, 7, 9, 12, 17, 24, 38, 65, 100, 120];
  return sizes.find((size) => size >= cmin) ?? null;
}

function batterySizing({ i1A, t1h, i2A, t2h }) {
  const c1 = 1.25 * (t1h * i1A + i2A * t2h);
  const d = c1 / 20 >= i2A ? 1 : 1.75;
  const cmin = d === 1 ? c1 : 1.25 * (t1h * i1A + 1.75 * i2A * t2h);
  const size = pickSize(cmin);
  return { c1, d, cmin, size, aboveMax: size === null };
}

if (typeof module !== "undefined") module.exports = { batterySizing, pickSize };
if (typeof window !== "undefined") window.CompliarBattery = { batterySizing, pickSize };
