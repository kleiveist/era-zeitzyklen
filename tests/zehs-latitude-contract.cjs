"use strict";

const assert = require("node:assert/strict");
const { contract } = require("./smoke.cjs");

const latitudes = [0, 30, 60];
const solYolLift = latitudes.map((latitude) => contract.getLatitudeLift(latitude, "orbit"));
const zehsLift = latitudes.map((latitude) => contract.getLatitudeLift(latitude, "zehs"));

assert.deepEqual(
  zehsLift,
  [...solYolLift].reverse(),
  "ZEHS verwendet über 0°, 30° und 60° exakt die umgekehrte Breitenkurve von Sol und Yol",
);
assert.ok(zehsLift[0] > zehsLift[1], "ZEHS steht bei 0° höher als bei 30°");
assert.ok(zehsLift[1] > zehsLift[2], "ZEHS steht bei 30° höher als bei 60°");
assert.equal(zehsLift[2], 0, "ZEHS besitzt bei 60° keine zusätzliche Horizonthöhe");

for (const directionId of ["north", "east", "south", "west"]) {
  const basis = contract.getViewBasis(directionId, 0);
  const pointInFront = {
    x: contract.ORBIT_GEOMETRY.centerX + basis.forward.x * 200,
    y: contract.ORBIT_GEOMETRY.centerY + basis.forward.y * 200,
  };
  const projections = latitudes.map((latitude) =>
    contract.projectOrbitPointToHorizon(pointInFront, basis, "zehs", latitude),
  );

  assert.ok(projections.every((projection) => projection.visible), `${directionId}: Prüfpunkt bleibt sichtbar`);
  assert.ok(projections[0].y < projections[1].y, `${directionId}: 0° projiziert ZEHS höher als 30°`);
  assert.ok(projections[1].y < projections[2].y, `${directionId}: 30° projiziert ZEHS höher als 60°`);
  assert.equal(projections[0].x, projections[1].x, `${directionId}: Breitenwechsel verschiebt ZEHS nicht seitlich`);
  assert.equal(projections[1].x, projections[2].x, `${directionId}: zweite Breitenstufe verschiebt ZEHS nicht seitlich`);
}

console.log(
  JSON.stringify({
    contract: "zehs-latitude-inversion",
    directions: 4,
    latitudes,
    ordering: "0° highest > 30° > 60° flattest",
  }),
);
