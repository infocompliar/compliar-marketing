// Compliar time & cost calculator: pure arithmetic on the visitor's own inputs.
// The only figures supplied here are Compliar's published seat prices
// (ex VAT, per user). Everything else comes from the visitor.
// A month is averaged as 52 weeks / 12 months.

const SEAT_PRICES = Object.freeze({
  lite: Object.freeze({ name: "Lite", monthly: 35, yearly: 350 }),
  office: Object.freeze({ name: "Office", monthly: 65, yearly: 650 }),
  design: Object.freeze({ name: "Design", monthly: 95, yearly: 950 }),
});

// Optional, separate, never included in the net figure.
const LOG_BOOK_PER_SITE_PER_YEAR = 4;

const WEEKS_PER_MONTH = 52 / 12;

const LIMITS = Object.freeze({
  engineers: [0, 500],
  officeUsers: [0, 500],
  certsPerEngineerPerWeek: [0, 200],
  minutesToday: [0, 600],
  minutesWithCompliar: [0, 600],
  hourlyCost: [0, 1000],
});

function toPence(pounds) {
  // Round half away from zero to the nearest penny, avoiding binary float drift.
  const sign = pounds < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(pounds) * 100 + 1e-9)) / 100;
}

function clampNumber(value, [min, max]) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function clampCount(value, limits) {
  return Math.floor(clampNumber(value, limits));
}

function seatKey(value, fallback) {
  return Object.prototype.hasOwnProperty.call(SEAT_PRICES, value) ? value : fallback;
}

function calcRoi(input = {}) {
  const engineers = clampCount(input.engineers, LIMITS.engineers);
  const officeUsers = clampCount(input.officeUsers, LIMITS.officeUsers);
  const certs = clampNumber(input.certsPerEngineerPerWeek, LIMITS.certsPerEngineerPerWeek);
  const minutesToday = clampNumber(input.minutesToday, LIMITS.minutesToday);
  const minutesWith = clampNumber(input.minutesWithCompliar, LIMITS.minutesWithCompliar);
  const hourlyCost = clampNumber(input.hourlyCost, LIMITS.hourlyCost);
  const engineerSeat = seatKey(input.engineerSeat, "lite");
  const officeSeat = seatKey(input.officeSeat, "office");
  const billing = input.billing === "yearly" ? "yearly" : "monthly";

  // Minutes saved can be negative if the visitor expects Compliar to take longer.
  const minutesSavedPerCert = minutesToday - minutesWith;
  const certsPerMonth = engineers * certs * WEEKS_PER_MONTH;
  const hoursPerMonth = (certsPerMonth * minutesSavedPerCert) / 60;
  const valuePerMonth = hoursPerMonth * hourlyCost;

  // Subscription for the chosen seat mix. Yearly billing is the yearly price
  // per seat; its monthly equivalent is that divided by 12.
  const seatLines = [];
  const addSeats = (count, key) => {
    if (count <= 0) return;
    const price = SEAT_PRICES[key];
    const yearlyCost = billing === "yearly" ? count * price.yearly : count * price.monthly * 12;
    const existing = seatLines.find((l) => l.seat === key);
    if (existing) {
      existing.count += count;
      existing.yearly += yearlyCost;
    } else {
      seatLines.push({ seat: key, name: price.name, count, unit: price[billing], yearly: yearlyCost });
    }
  };
  addSeats(engineers, engineerSeat);
  addSeats(officeUsers, officeSeat);
  const subscriptionPerYear = seatLines.reduce((sum, l) => sum + l.yearly, 0);
  const subscriptionPerMonth = subscriptionPerYear / 12;

  // Monthly figures are rounded to the penny (hours to 0.01) first; every
  // yearly figure is exactly 12 x the rounded monthly one so the page always
  // reconciles. subscriptionBilledPerYear is the actual yearly invoice
  // (ex VAT), which with yearly billing can differ from 12 x the rounded
  // monthly equivalent by a few pence.
  const hoursM = toPence(hoursPerMonth);
  const valueM = toPence(valuePerMonth);
  const subM = toPence(subscriptionPerMonth);
  const netM = toPence(valueM - subM);
  const times12 = (n) => toPence(n * 12);

  return {
    inputs: {
      engineers,
      officeUsers,
      certsPerEngineerPerWeek: certs,
      minutesToday,
      minutesWithCompliar: minutesWith,
      hourlyCost,
      engineerSeat,
      officeSeat,
      billing,
    },
    minutesSavedPerCert: toPence(minutesSavedPerCert),
    certsPerMonth: toPence(certsPerMonth),
    hoursPerMonth: hoursM,
    hoursPerYear: times12(hoursM),
    valuePerMonth: valueM,
    valuePerYear: times12(valueM),
    subscriptionPerMonth: subM,
    subscriptionPerYear: times12(subM),
    subscriptionBilledPerYear: toPence(subscriptionPerYear),
    netPerMonth: netM,
    netPerYear: times12(netM),
    seatLines: seatLines.map((l) => ({ ...l, yearly: toPence(l.yearly) })),
  };
}

const CompliarRoi = { calcRoi, toPence, SEAT_PRICES, LOG_BOOK_PER_SITE_PER_YEAR, WEEKS_PER_MONTH, LIMITS };

if (typeof module !== "undefined") module.exports = CompliarRoi;
if (typeof window !== "undefined") window.CompliarRoi = CompliarRoi;
