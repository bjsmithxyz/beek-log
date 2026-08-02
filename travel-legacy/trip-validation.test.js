const test = require("node:test");
const assert = require("node:assert/strict");
const { validateTrip } = require("./trip-validation");
const currentTrip = require("./trips.json");

function validTrip() {
  return {
    meta: { title: "Long Way Round", subtitle: "A journey" },
    stops: [
      {
        name: "Bangkok",
        country: "Thailand",
        cc: "TH",
        lat: 13.7563,
        lon: 100.5018,
        arrive: "2025-06-20",
        depart: "2025-06-23",
      },
    ],
  };
}

test("the committed trip data is valid", () => {
  assert.deepEqual(validateTrip(currentTrip), []);
});

test("accepts a valid trip", () => {
  assert.deepEqual(validateTrip(validTrip()), []);
});

test("rejects missing and malformed stop fields", () => {
  const trip = validTrip();
  trip.stops[0] = { name: "", country: "Thailand", cc: "TH", lat: 91, lon: 0, arrive: "bad", depart: "2025-06-23" };
  const errors = validateTrip(trip);
  assert.ok(errors.some((error) => error.includes("place name")));
  assert.ok(errors.some((error) => error.includes("latitude")));
  assert.ok(errors.some((error) => error.includes("arrival date")));
});

test("rejects a departure before arrival", () => {
  const trip = validTrip();
  trip.stops[0].depart = "2025-06-19";
  assert.ok(validateTrip(trip).some((error) => error.includes("departs before")));
});

test("rejects impossible calendar dates", () => {
  const trip = validTrip();
  trip.stops[0].arrive = "2025-02-30";
  assert.ok(validateTrip(trip).some((error) => error.includes("arrival date")));
});
