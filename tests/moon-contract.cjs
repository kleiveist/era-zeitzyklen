"use strict";

const assert = require("node:assert/strict");

require("./smoke.cjs");

const contract = global.ERA_CYCLE_CONTRACT;
const config = global.ERA_PHASES.config;
const model = contract.MOON_ORBIT_MODEL;
const moonNames = ["kor", "korsShard"];

assert.ok(Object.isFrozen(model), "Mondbahnmodell ist read-only");
assert.equal(model.supercycleLength, 300, "Nordpolausrichtung verwendet den 300-Zyklen-Vertrag");
assert.equal(model.alignmentCycleNumber, 300, "Zyklus 300 ist explizit adressierbar");
assert.match(model.modelStatus, /Illustratives Bahnmodell/, "offene Orbitalzahlen werden nicht als Kanon ausgegeben");
assert.equal(model.bodies.kor.name, "Kor", "großer Mondrest ist verbindlich benannt");
assert.equal(model.bodies.korsShard.name, "Kor's Shard", "Code verwendet die vereinbarte ASCII-Schreibweise");
assert.notDeepEqual(model.bodies.kor, model.bodies.korsShard, "beide Monde besitzen getrennte Bahnparameter");

function separation(first, second) {
  return Math.hypot(
    first.x - second.x,
    first.y - second.y,
    first.z - second.z,
  );
}

function nearestSampleInCycle(cycleIndex, bodyName) {
  let nearest = null;
  const samples = 1024;
  for (let index = 0; index <= samples; index += 1) {
    const cycleUm = (config.totalUm * index) / samples;
    const state = contract.getMoonOrbitState(
      cycleIndex * config.totalUm + cycleUm,
      bodyName,
    );
    if (!nearest || state.distance < nearest.state.distance) {
      nearest = { cycleUm, state };
    }
  }
  return nearest;
}

for (const bodyName of moonNames) {
  for (let cycleIndex = 0; cycleIndex < 6; cycleIndex += 1) {
    const nearest = nearestSampleInCycle(cycleIndex, bodyName);
    assert.ok(nearest.state.nearFactor > 0.97, `${bodyName}, Zyklus ${cycleIndex + 1}: besitzt ein Nähefenster`);
  }

  const firstNear = nearestSampleInCycle(0, bodyName);
  const secondNear = nearestSampleInCycle(1, bodyName);
  assert.ok(
    Math.abs(firstNear.cycleUm - secondNear.cycleUm) > 40,
    `${bodyName}: Nähefenster verschiebt sich zwischen Anschlusszyklen`,
  );

  const beforeBoundary = contract.getMoonOrbitState(config.totalUm - 0.0001, bodyName);
  const afterBoundary = contract.getMoonOrbitState(config.totalUm + 0.0001, bodyName);
  assert.ok(
    separation(beforeBoundary.worldPosition, afterBoundary.worldPosition) < 0.001,
    `${bodyName}: Zykluswechsel erzeugt keinen Positionssprung`,
  );
}

for (let sample = 0; sample <= 64; sample += 1) {
  const absoluteWorldUm = (config.totalUm * sample) / 64;
  const kor = contract.getMoonOrbitState(absoluteWorldUm, "kor");
  const shard = contract.getMoonOrbitState(absoluteWorldUm, "korsShard");
  assert.notEqual(kor.worldPosition, shard.worldPosition, "beide Körper behalten getrennte 3D-Zustände");
  assert.ok(
    separation(kor.worldPosition, shard.worldPosition) < 50,
    `Paarabstand bleibt klein gegenüber der großen Ellipsenbahn, Stichprobe ${sample}`,
  );
  for (const moon of [kor, shard]) {
    assert.ok(Number.isFinite(moon.worldPosition.x), "Mond-X ist endlich");
    assert.ok(Number.isFinite(moon.worldPosition.y), "Mond-Y ist endlich");
    assert.ok(Number.isFinite(moon.worldPosition.z), "Mond-Z ist endlich");
    assert.ok(moon.distance >= moon.minimumDistance, "Entfernung unterschreitet die illustrative Periapsis nicht");
    assert.ok(moon.distance <= moon.maximumDistance + 1e-7, "Entfernung überschreitet die illustrative Apoapsis nicht");
  }
}

const alignmentAbsoluteUm =
  (model.alignmentCycleNumber - 1) * config.totalUm + model.alignmentCycleUm;
for (const bodyName of moonNames) {
  const aligned = contract.getMoonOrbitState(alignmentAbsoluteUm, bodyName);
  const far = contract.getMoonOrbitState(alignmentAbsoluteUm + config.totalUm / 2, bodyName);
  assert.equal(aligned.alignmentCycle, true, `${bodyName}: 300. Zyklus ist als Ausrichtungszyklus markiert`);
  assert.equal(aligned.northAlignment, true, `${bodyName}: steht während der 300er-Konvektion exakt nordwärts`);
  assert.ok(aligned.worldPosition.z > 0, `${bodyName}: Nordpolausrichtung besitzt positive Poltiefe`);
  assert.ok(Math.hypot(aligned.worldPosition.x, aligned.worldPosition.y) < 0.001, `${bodyName}: Nordachse ist exakt`);
  assert.ok(aligned.distance < far.distance, `${bodyName}: Nordpassage ist näher als die ferne Bahnhälfte`);
  assert.ok(aligned.apparentScale > far.apparentScale * 4, `${bodyName}: scheinbare Größe folgt stark der Entfernung`);
  assert.ok(aligned.trueAngularVelocityPerUm > far.trueAngularVelocityPerUm * 20, `${bodyName}: Kepler-Lauf ist nahe Era schneller`);
}

const cycle150 = contract.getMoonOrbitState(
  149 * config.totalUm + model.alignmentCycleUm,
  "kor",
);
assert.equal(cycle150.alignmentCycle, false, "Zyklus 150 erfindet kein gleichwertiges Sonderereignis");

let settingSample = null;
for (let offsetUm = 0; offsetUm < 4000; offsetUm += 1) {
  const moon = contract.getMoonOrbitState(alignmentAbsoluteUm + offsetUm, "kor");
  const projection = contract.projectMoonToHorizon(moon, "south", 0, 0);
  if (projection.visible && Math.abs(projection.altitude) < 0.0015) {
    settingSample = { moon, projection };
    break;
  }
}
assert.ok(settingSample, "Kor besitzt einen kontinuierlich berechneten Untergang");
assert.ok(settingSample.projection.visualScale < 0.08, "Kor ist am Horizont bereits fast punktklein");
assert.ok(settingSample.projection.opacity < 0.15, "Kor blendet am Untergang weich aus");

contract.setTimeMode("inspection", { announce: false });
contract.selectCycle(299, { cycleUm: model.alignmentCycleUm });
const alignmentFrame = contract.getLastRenderFrame();
assert.equal(alignmentFrame.snapshot.template.id, "convection", "300er-Ausrichtung liegt innerhalb der Konvektion");
for (const bodyName of moonNames) {
  assert.deepEqual(
    alignmentFrame.worldPoints[bodyName],
    alignmentFrame.snapshot[bodyName].worldPosition,
    `${bodyName}: Draufsicht und Horizont teilen dieselbe 3D-Weltposition`,
  );
  assert.equal(alignmentFrame.horizonProjection[bodyName].visible, true, `${bodyName}: Nordpassage ist am Pol sichtbar`);
}
assert.equal(global.document.querySelector("#sol-body").getAttribute("aria-hidden"), "true", "Konvektion blendet Sol aus");
assert.equal(global.document.querySelector("#yol-body").getAttribute("aria-hidden"), "true", "Konvektion blendet Yol aus");
assert.equal(global.document.querySelector("#kor-body").getAttribute("aria-hidden"), "false", "Konvektion blendet Kor nicht regelwidrig aus");
assert.equal(global.document.querySelector("#kors-shard-body").getAttribute("aria-hidden"), "false", "Konvektion blendet Kor's Shard nicht regelwidrig aus");
assert.ok(global.document.querySelector("#kor-orbit-front").getAttribute("d").length > 20, "vordere Kor-Polbahn wird gezeichnet");
assert.ok(global.document.querySelector("#kor-orbit-rear").getAttribute("d").length > 20, "rückwärtige Kor-Polbahn wird gezeichnet");

global.document.querySelector("#cycle-jump-input").value = "300";
global.document.querySelector("#moon-alignment-jump").click();
assert.equal(contract.getState().cycleIndex, 299, "direkte Prüfsteuerung öffnet Zyklus 300");
assert.equal(
  contract.getLastRenderFrame().snapshot.cycleUm,
  model.alignmentCycleUm,
  "300er-Schalter springt direkt in die gemeinsame Nordpolausrichtung",
);

if (require.main === module) {
  console.log(JSON.stringify({
    moons: moonNames.length,
    alignmentCycle: model.alignmentCycleNumber,
    alignmentCycleUm: model.alignmentCycleUm,
    korSettingScale: settingSample.projection.visualScale,
    korSettingOpacity: settingSample.projection.opacity,
  }));
}
