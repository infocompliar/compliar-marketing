import test from "node:test";
import assert from "node:assert/strict";
import battery from "../fire-alarm-battery-calculator/battery.js";

const { batterySizing, pickSize } = battery;
const vectors = [
  { i1A: 0.02, t1h: 24, i2A: 0.2, t2h: 0.5, d: 1.75, cmin: 0.81875, shown: "0.82", size: 1.2 },
  { i1A: 0.125, t1h: 24, i2A: 0.45, t2h: 0.5, d: 1.75, cmin: 4.2421875, shown: "4.24", size: 7 },
  { i1A: 0.18, t1h: 24, i2A: 1.2, t2h: 0.5, d: 1.75, cmin: 6.7125, shown: "6.71", size: 7 },
  { i1A: 0.18, t1h: 72, i2A: 1.2, t2h: 0.5, d: 1.75, cmin: 17.5125, shown: "17.51", size: 24 },
  { i1A: 0.5, t1h: 24, i2A: 0.3, t2h: 0.5, d: 1, cmin: 15.1875, shown: "15.19", size: 17 },
  { i1A: 0.36, t1h: 24, i2A: 0.75, t2h: 0.5, d: 1.75, cmin: 11.6203125, shown: "11.62", size: 12 },
  { i1A: 1.25, t1h: 6, i2A: 0.5, t2h: 1, d: 1, cmin: 10, shown: "10.00", size: 12 },
];

for (const vector of vectors) {
  const { i1A, t1h, i2A, t2h, d, cmin, shown, size } = vector;
  test(`${i1A} A / ${t1h} h / ${i2A} A / ${t2h} h => D=${d}, ${shown} Ah, ${size} Ah`, () => {
    const input = Object.freeze({ i1A, t1h, i2A, t2h });
    const result = batterySizing(input);
    assert.equal(result.c1, 1.25 * (t1h * i1A + i2A * t2h));
    assert.equal(result.d, d);
    assert.ok(Math.abs(result.cmin - cmin) < 1e-12);
    assert.equal(result.cmin.toFixed(2), shown);
    assert.equal(result.size, size);
    assert.equal(result.aboveMax, false);
  });
}

test("pickSize compares the unrounded capacity and includes every listed size", () => {
  for (const size of [1.2, 2.1, 3.2, 7, 9, 12, 17, 24, 38, 65, 100, 120]) {
    assert.equal(pickSize(size), size);
  }
  // A small load now gets a small battery instead of being rounded up to 7 Ah.
  assert.equal(pickSize(0.82), 1.2);
  assert.equal(pickSize(1.21), 2.1);
  assert.equal(pickSize(2.5), 3.2);
  assert.equal(pickSize(3.21), 7);
  assert.equal(pickSize(12.0001), 17);
  assert.equal(pickSize(120.01), null);
});

test("batterySizing keeps precision when selecting a size", () => {
  const result = batterySizing({ i1A: 0.400001, t1h: 24, i2A: 0, t2h: 0.5 });
  assert.equal(result.cmin.toFixed(2), "12.00");
  assert.equal(result.size, 17);
});

test("a capacity above the largest size has no recommendation", () => {
  const result = batterySizing({ i1A: 2, t1h: 72, i2A: 10, t2h: 1 });
  assert.ok(result.cmin > 120);
  assert.equal(result.size, null);
  assert.equal(result.aboveMax, true);
});
