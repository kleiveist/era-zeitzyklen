"use strict";

const assert = require("node:assert/strict");

require("./smoke.cjs");

const contract = global.ERA_CYCLE_CONTRACT;
const config = global.ERA_PHASES.config;
const model = contract.MOON_ORBIT_MODEL;
const collapseModel = contract.MOON_COLLAPSE_EFFECT;
const worldNames = ["kor", "korsShard"];

assert.ok(Object.isFrozen(model), "Bahnmodell der Kor-Welten ist read-only");
assert.equal(model.supercycleLength, 300, "Nordpolausrichtung verwendet den 300-Zyklen-Vertrag");
assert.equal(model.alignmentCycleNumber, 300, "Zyklus 300 ist explizit adressierbar");
assert.equal(model.orbitalPassesPerCycle, 2, "jeder Weltkörper besitzt zwei vollständige Sichtpassagen pro Zyklus");
assert.match(model.modelStatus, /Illustratives Bahnmodell/, "offene Orbitalzahlen werden nicht als Kanon ausgegeben");
assert.equal(model.bodies.kor.name, "Kor", "größere Welt ist verbindlich benannt");
assert.equal(model.bodies.korsShard.name, "Kor's Shard", "Code verwendet die vereinbarte ASCII-Schreibweise");
assert.notDeepEqual(model.bodies.kor, model.bodies.korsShard, "beide Welten besitzen getrennte Bahnparameter");
assert.notEqual(model.bodies.kor.nodeDegrees, model.bodies.korsShard.nodeDegrees, "die Polbahnen besitzen getrennte Bahnknoten");
assert.notEqual(model.bodies.kor.eccentricity, model.bodies.korsShard.eccentricity, "die Polbahnen besitzen getrennte Exzentrizitäten");
assert.notEqual(
  model.bodies.kor.initialPhaseOffsetRadians,
  model.bodies.korsShard.initialPhaseOffsetRadians,
  "Kor's Shard ist nicht an Kors Bahnphase gekoppelt",
);
assert.ok(Object.isFrozen(collapseModel), "roter Zusammenbruchseffekt ist read-only");
assert.equal(collapseModel.firstCycleNumber, 300, "erster roter Zusammenbruch liegt im 300. Zyklus");
assert.equal(collapseModel.centerUm, model.alignmentCycleUm, "Effektmaximum folgt der gemeinsamen Nordausrichtung");
assert.equal(collapseModel.approachUm, 10, "Rotaufbau beginnt zehn Um vor dem Maximum");
assert.equal(collapseModel.aftermathUm, 10, "Rotabnahme endet zehn Um nach dem Maximum");

const collapseSamples = [
  contract.getMoonCollapseEffect(299, model.alignmentCycleUm - 10),
  contract.getMoonCollapseEffect(299, model.alignmentCycleUm - 5),
  contract.getMoonCollapseEffect(299, model.alignmentCycleUm),
  contract.getMoonCollapseEffect(299, model.alignmentCycleUm + 5),
  contract.getMoonCollapseEffect(299, model.alignmentCycleUm + 10),
];
assert.deepEqual(
  collapseSamples.map((sample) => sample.intensity),
  [0, 0.5, 1, 0.5, 0],
  "Rotintensität steigt zehn Um linear an und fällt zehn Um linear ab",
);
assert.deepEqual(
  collapseSamples.map((sample) => sample.phase),
  ["approach", "approach", "collapse", "aftermath", "aftermath"],
  "Ereignis unterscheidet Annäherung, Maximum und Nachbeben",
);
assert.equal(
  contract.getMoonCollapseEffect(299, model.alignmentCycleUm - 10.001).active,
  false,
  "vor dem 20-Um-Fenster bleibt die Welt unverändert",
);
assert.equal(
  contract.getMoonCollapseEffect(299, model.alignmentCycleUm + 10.001).active,
  false,
  "nach dem 20-Um-Fenster ist die Rotabnahme beendet",
);
assert.equal(
  contract.getMoonCollapseEffect(298, model.alignmentCycleUm).intensity,
  0,
  "Zyklus 299 erhält am selben Um keinen falschen Zusammenbruch",
);
assert.equal(
  contract.getMoonCollapseEffect(599, model.alignmentCycleUm).intensity,
  1,
  "bestätigter 300-Zyklen-Rhythmus wiederholt das Maximum in Zyklus 600",
);

function separation(first, second) {
  return Math.hypot(
    first.x - second.x,
    first.y - second.y,
    first.z - second.z,
  );
}

function countCircularTransitions(flags, target) {
  let transitions = 0;
  for (let index = 0; index < flags.length; index += 1) {
    const previous = flags[(index - 1 + flags.length) % flags.length];
    if (flags[index] === target && previous !== target) transitions += 1;
  }
  return transitions;
}

function sampleCycle(cycleIndex, bodyName, samples = 4096) {
  const states = [];
  for (let index = 0; index < samples; index += 1) {
    states.push(contract.getMoonOrbitState(
      (cycleIndex + index / samples) * config.totalUm,
      bodyName,
    ));
  }
  return states;
}

const representativeCycles = [0, 149, 299, 449, 599];

for (const bodyName of worldNames) {
  for (const cycleIndex of representativeCycles) {
    const states = sampleCycle(cycleIndex, bodyName);
    const front = states.map((state) => state.depth === "front");
    const near = states.map((state) => state.nearFactor > 0.9);
    const hiddenByEra = states.map((state) => contract.isMoonOccludedByEra(
      state,
      contract.getMoonMapPoint(state, bodyName),
      bodyName,
    ));
    const horizonVisible = states.map((state) =>
      contract.projectMoonToHorizon(state, "north", 0, 0).visible,
    );

    for (const [label, flags] of [
      ["Polpassage", front],
      ["Nähefenster", near],
      ["Era-Verdeckung", hiddenByEra],
      ["Horizontauftritt", horizonVisible],
    ]) {
      assert.equal(
        countCircularTransitions(flags, true),
        2,
        `${bodyName}, Zyklus ${cycleIndex + 1}: ${label} beginnt genau zweimal`,
      );
      assert.equal(
        countCircularTransitions(flags, false),
        2,
        `${bodyName}, Zyklus ${cycleIndex + 1}: ${label} endet genau zweimal`,
      );
    }
  }

  const earlyPhase = contract.getMoonOrbitState(config.totalUm / 3, bodyName);
  const laterPhase = contract.getMoonOrbitState(100 * config.totalUm + config.totalUm / 3, bodyName);
  assert.ok(
    Math.abs(earlyPhase.phaseOffset - laterPhase.phaseOffset) > 0.1,
    `${bodyName}: der eigene Phasenplan verschiebt die Passagen zwischen Zyklen`,
  );

  const beforeBoundary = contract.getMoonOrbitState(config.totalUm - 0.0001, bodyName);
  const afterBoundary = contract.getMoonOrbitState(config.totalUm + 0.0001, bodyName);
  assert.ok(
    separation(beforeBoundary.worldPosition, afterBoundary.worldPosition) < 0.001,
    `${bodyName}: Zykluswechsel erzeugt keinen Positionssprung`,
  );
}

let asynchronousSamples = 0;
for (let sample = 0; sample <= 64; sample += 1) {
  const absoluteWorldUm = (config.totalUm * sample) / 64;
  const kor = contract.getMoonOrbitState(absoluteWorldUm, "kor");
  const shard = contract.getMoonOrbitState(absoluteWorldUm, "korsShard");
  assert.notEqual(kor.worldPosition, shard.worldPosition, "beide Körper behalten getrennte 3D-Zustände");
  if (kor.depth !== shard.depth || separation(kor.worldPosition, shard.worldPosition) > 100) {
    asynchronousSamples += 1;
  }
  for (const world of [kor, shard]) {
    assert.ok(Number.isFinite(world.worldPosition.x), "Welt-X ist endlich");
    assert.ok(Number.isFinite(world.worldPosition.y), "Welt-Y ist endlich");
    assert.ok(Number.isFinite(world.worldPosition.z), "Welt-Z ist endlich");
    assert.ok(world.distance >= world.minimumDistance, "Entfernung unterschreitet die illustrative Periapsis nicht");
    assert.ok(world.distance <= world.maximumDistance + 1e-7, "Entfernung überschreitet die illustrative Apoapsis nicht");
  }
}
assert.ok(asynchronousSamples > 48, "Kor und Kor's Shard laufen sichtbar unabhängig statt als synchrones Paar");

const alignmentAbsoluteUm =
  (model.alignmentCycleNumber - 1) * config.totalUm + model.alignmentCycleUm;
for (const bodyName of worldNames) {
  const aligned = contract.getMoonOrbitState(alignmentAbsoluteUm, bodyName);
  const far = contract.getMoonOrbitState(alignmentAbsoluteUm + config.totalUm / 4, bodyName);
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
assert.equal(cycle150.northAlignment, false, "Zyklus 150 erfindet keine exakte Nordpolausrichtung");

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
assert.equal(alignmentFrame.snapshot.moonCollapse.phase, "collapse", "Ausrichtung öffnet den roten Zusammenbruch am Maximum");
assert.equal(alignmentFrame.snapshot.moonCollapse.intensity, 1, "Ausrichtung erreicht volle Rotintensität");
for (const bodyName of worldNames) {
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
for (const viewId of ["#orbit-view", "#horizon-view"]) {
  const view = global.document.querySelector(viewId);
  assert.equal(view.getAttribute("data-moon-collapse-phase"), "collapse", `${viewId}: Maximum ist als Kollapsphase markiert`);
  assert.equal(view.getAttribute("data-moon-collapse-intensity"), "1.000", `${viewId}: volle Rotintensität erreicht die Grafik`);
  assert.equal(view.style.getPropertyValue("--moon-collapse-intensity"), "1.000", `${viewId}: rote Flächenebene erhält volle Stärke`);
  assert.equal(view.style.getPropertyValue("--moon-collapse-core-intensity"), "1.000", `${viewId}: Kollapskern erhält volle Stärke`);
  assert.equal(view.style.getPropertyValue("--moon-collapse-shock-intensity"), "1.000", `${viewId}: Finalimpuls erhält volle Stärke`);
  assert.equal(view.classList.contains("is-moon-collapse-active"), true, `${viewId}: rote Effektklasse ist aktiv`);
}
assert.equal(global.document.querySelector("#orbit-moon-collapse-effect").getAttribute("aria-hidden"), "false", "Orbit zeigt den roten Zusammenbruch");
assert.equal(global.document.querySelector("#horizon-moon-collapse-effect").getAttribute("aria-hidden"), "false", "Horizont zeigt den roten Zusammenbruch");
assert.match(global.document.querySelector("#orbit-moon-collapse-core").getAttribute("transform"), /^translate\(/, "Orbitkern folgt dem gemeinsamen Mondpunkt");
assert.match(global.document.querySelector("#horizon-moon-collapse-core").getAttribute("transform"), /^translate\(/, "Horizontkern folgt der projizierten Einflussachse");
assert.equal(global.document.querySelector("#convection-title").textContent, "Gemeinsamer Nordpol-Zusammenbruch", "Konvektionshinweis benennt das Maximum");

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
    worlds: worldNames.length,
    alignmentCycle: model.alignmentCycleNumber,
    alignmentCycleUm: model.alignmentCycleUm,
    korSettingScale: settingSample.projection.visualScale,
    korSettingOpacity: settingSample.projection.opacity,
  }));
}
