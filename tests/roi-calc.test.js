const test = require("node:test");
const assert = require("node:assert/strict");
const { calcRoi, toPence, WEEKS_PER_MONTH } = require("../roi-calc.js");

const base = Object.freeze({
  engineers: 5,
  officeUsers: 1,
  certsPerEngineerPerWeek: 8,
  minutesToday: 30,
  minutesWithCompliar: 15,
  hourlyCost: 25,
});

const isPence = (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

test("zero inputs give zero everywhere, no NaN", () => {
  const r = calcRoi({
    engineers: 0,
    officeUsers: 0,
    certsPerEngineerPerWeek: 0,
    minutesToday: 0,
    minutesWithCompliar: 0,
    hourlyCost: 0,
  });
  for (const key of ["hoursPerMonth", "valuePerMonth", "subscriptionPerMonth", "netPerMonth", "netPerYear"]) {
    assert.equal(r[key], 0, key);
  }
  assert.deepEqual(r.seatLines, []);
  // Missing / blank / junk input behaves like zero rather than producing NaN.
  const blank = calcRoi({ engineers: "", officeUsers: undefined, hourlyCost: "abc" });
  assert.equal(blank.netPerMonth, 0);
  assert.equal(calcRoi().netPerMonth, 0);
});

test("worked example: 5 engineers on Lite, 1 office user on Office, monthly", () => {
  const r = calcRoi(base);
  assert.equal(r.certsPerMonth, 173.33); // 5 * 8 * 52/12
  assert.equal(r.hoursPerMonth, 43.33); // 173.33 * 15 / 60
  assert.equal(r.valuePerMonth, 1083.33); // 43.333 * £25
  assert.equal(r.subscriptionPerMonth, 240); // 5*35 + 1*65
  assert.equal(r.netPerMonth, 843.33);
});

test("mixed seats: default mix, overridden mix, and same-tier merging", () => {
  // Defaults: engineers Lite, office users Office.
  const d = calcRoi({ ...base, engineers: 3, officeUsers: 2 });
  assert.equal(d.subscriptionPerMonth, 3 * 35 + 2 * 65);
  assert.deepEqual(
    d.seatLines.map((l) => [l.name, l.count]),
    [["Lite", 3], ["Office", 2]]
  );

  // Engineers on Office, office users on Design.
  const o = calcRoi({ ...base, engineers: 4, officeUsers: 2, engineerSeat: "office", officeSeat: "design" });
  assert.equal(o.subscriptionPerMonth, 4 * 65 + 2 * 95);

  // Both groups on the same tier merge into one line.
  const m = calcRoi({ ...base, engineers: 2, officeUsers: 3, engineerSeat: "design", officeSeat: "design" });
  assert.equal(m.seatLines.length, 1);
  assert.equal(m.seatLines[0].count, 5);
  assert.equal(m.subscriptionPerMonth, 5 * 95);

  // Yearly billing uses the yearly price per seat.
  const y = calcRoi({ ...base, engineers: 3, officeUsers: 1, billing: "yearly" });
  assert.equal(y.subscriptionBilledPerYear, 3 * 350 + 1 * 650);
  assert.equal(y.subscriptionPerMonth, toPence((3 * 350 + 650) / 12)); // 141.67

  // Unknown seat type falls back to the default for that group.
  const f = calcRoi({ ...base, engineers: 1, officeUsers: 0, engineerSeat: "platinum" });
  assert.equal(f.subscriptionPerMonth, 35);
});

test("negative net result is reported honestly", () => {
  // Small time difference: 1 engineer, 2 certs/week, 5 minutes saved at £20/hr.
  const r = calcRoi({
    engineers: 1,
    officeUsers: 1,
    certsPerEngineerPerWeek: 2,
    minutesToday: 20,
    minutesWithCompliar: 15,
    hourlyCost: 20,
  });
  assert.equal(r.valuePerMonth, 14.44); // 8.667 certs * 5 min / 60 * 20
  assert.equal(r.subscriptionPerMonth, 100);
  assert.equal(r.netPerMonth, -85.56);
  assert.ok(r.netPerYear < 0);

  // Visitor expects Compliar to take longer: time difference itself is negative.
  const slower = calcRoi({ ...base, minutesToday: 10, minutesWithCompliar: 20 });
  assert.ok(slower.hoursPerMonth < 0);
  assert.ok(slower.valuePerMonth < 0);
  assert.ok(slower.netPerMonth < slower.valuePerMonth);
});

test("money is rounded to pence, including halves and negatives", () => {
  assert.equal(toPence(1.005), 1.01);
  assert.equal(toPence(1.004), 1);
  assert.equal(toPence(-1.005), -1.01);
  assert.equal(toPence(0.1 + 0.2), 0.3);

  const odd = calcRoi({
    engineers: 7,
    officeUsers: 3,
    certsPerEngineerPerWeek: 6.5,
    minutesToday: 37,
    minutesWithCompliar: 11,
    hourlyCost: 23.75,
    engineerSeat: "lite",
    officeSeat: "design",
    billing: "yearly",
  });
  for (const key of [
    "valuePerMonth",
    "valuePerYear",
    "subscriptionPerMonth",
    "subscriptionPerYear",
    "subscriptionBilledPerYear",
    "netPerMonth",
    "netPerYear",
  ]) {
    assert.ok(isPence(odd[key]), `${key}=${odd[key]} is not whole pence`);
  }
  // Net equals the rounded parts, so the page always adds up.
  assert.equal(odd.netPerMonth, toPence(odd.valuePerMonth - odd.subscriptionPerMonth));
});

test("yearly figures are exactly 12 x the monthly figures", () => {
  const cases = [
    base,
    { ...base, billing: "yearly" },
    { ...base, engineers: 13, officeUsers: 4, certsPerEngineerPerWeek: 9.5, minutesToday: 41, minutesWithCompliar: 17, hourlyCost: 31.4 },
    { ...base, engineers: 1, officeUsers: 2, minutesToday: 5, minutesWithCompliar: 25, engineerSeat: "design" },
  ];
  for (const c of cases) {
    const r = calcRoi(c);
    assert.equal(r.hoursPerYear, toPence(r.hoursPerMonth * 12));
    assert.equal(r.valuePerYear, toPence(r.valuePerMonth * 12));
    assert.equal(r.subscriptionPerYear, toPence(r.subscriptionPerMonth * 12));
    assert.equal(r.netPerYear, toPence(r.netPerMonth * 12));
  }
});

test("inputs are clamped to the same min/max as the form", () => {
  const r = calcRoi({ engineers: -3, officeUsers: 9999, certsPerEngineerPerWeek: 1e6, hourlyCost: -5 });
  assert.equal(r.inputs.engineers, 0);
  assert.equal(r.inputs.officeUsers, 500);
  assert.equal(r.inputs.certsPerEngineerPerWeek, 200);
  assert.equal(r.inputs.hourlyCost, 0);
  assert.equal(calcRoi({ engineers: 2.7 }).inputs.engineers, 2);
  assert.equal(WEEKS_PER_MONTH, 52 / 12);
});

test("optional current spend: blank leaves results unchanged, a figure is added back", () => {
  const without = calcRoi(base);
  const blank = calcRoi({ ...base, currentSpendPerMonth: "" });
  assert.equal(blank.netPerMonth, without.netPerMonth);
  assert.equal(blank.currentSpendPerMonth, 0);
  assert.equal(blank.spendDifferencePerMonth, -without.subscriptionPerMonth);

  // Pays £300 a month today; Compliar seats cost £240 on the base mix.
  const r = calcRoi({ ...base, currentSpendPerMonth: 300 });
  assert.equal(r.currentSpendPerMonth, 300);
  assert.equal(r.currentSpendPerYear, 3600);
  assert.equal(r.spendDifferencePerMonth, 60);
  assert.equal(r.spendDifferencePerYear, 720);
  assert.equal(r.netPerMonth, toPence(without.netPerMonth + 300));
  assert.equal(r.netPerYear, toPence(r.netPerMonth * 12));

  // Pays less today than Compliar would cost: difference is negative, net still honest.
  const cheaper = calcRoi({ ...base, currentSpendPerMonth: 100 });
  assert.equal(cheaper.spendDifferencePerMonth, -140);
  assert.equal(cheaper.netPerMonth, toPence(without.netPerMonth + 100));

  // Out-of-range and junk values clamp rather than break.
  assert.equal(calcRoi({ ...base, currentSpendPerMonth: -50 }).currentSpendPerMonth, 0);
  assert.equal(calcRoi({ ...base, currentSpendPerMonth: "abc" }).currentSpendPerMonth, 0);
  assert.equal(calcRoi({ ...base, currentSpendPerMonth: 1e9 }).currentSpendPerMonth, 100000);
});
