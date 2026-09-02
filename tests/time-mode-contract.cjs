"use strict";

const assert = require("node:assert/strict");
const { contract } = require("./smoke.cjs");

const config = global.ERA_PHASES.config;
const inspection = contract.TIME_MODES.inspection;
const gameplay = contract.TIME_MODES.gameplay;
const chronicle = contract.TIME_MODES.chronicle;

function angularDistance(left, right) {
  return Math.abs(((Number(left) - Number(right) + 540) % 360) - 180);
}

function pointDistance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function snapshotAtMode(ms, timeMode, scenario, cycleIndex = 0) {
  return contract.getSnapshot(ms, {
    exact: true,
    timeMode,
    scenario,
    cycleIndex,
  });
}

function snapshotAt(ms, scenario, cycleIndex = 0) {
  return snapshotAtMode(ms, "inspection", scenario, cycleIndex);
}

assert.ok(Object.isFrozen(contract.TIME_MODES), "Zeitprofile sind unveränderlich");
assert.equal(config.defaultTimeMode, "chronicle", "die Zeitfahrt bleibt der Standard");
assert.equal(chronicle.presentationMs, 360000, "Erklärmodus dauert weiter sechs Minuten");
assert.equal(chronicle.convectionPresentationMs, 32000, "Erklärkonvektion bleibt 32 Sekunden groß");
assert.equal(inspection.millisecondsPerUm, 5000, "ein Um dauert im Prüfmodus fünf Sekunden");
assert.equal(inspection.umPerSecond, 0.2, "pro realer Sekunde verstreichen 0,2 Um");
assert.equal(inspection.presentationMs, 230400000, "46.080 Um ergeben exakt 64 Stunden");
assert.equal(inspection.convectionPresentationMs, 2000000, "400 Um ergeben 33 Minuten 20 Sekunden");
assert.equal(inspection.eraRotationDegreesPerSecond, 72, "Era dreht sich bei 1× um 72 Grad pro Sekunde");
assert.equal(gameplay.millisecondsPerUm, 900000, "ein Um dauert in der Spielsimulation 15 Minuten");
assert.equal(gameplay.umPerSecond, 1 / 900, "die Spielsimulation vergeht linear mit 1/900 Um pro Sekunde");
assert.equal(gameplay.presentationMs, 41472000000, "46.080 Um ergeben in der offenen-Welt-Grundzeit 480 Tage");
assert.equal(gameplay.convectionPresentationMs, 360000000, "400 Um Konvektion ergeben vier Tage und vier Stunden Spielzeit");
assert.equal(gameplay.eraRotationDegreesPerSecond, 0.4, "Era dreht sich in 15 Minuten exakt einmal");
assert.equal(gameplay.motionProfile, "inspection", "beide linearen Modi teilen denselben Um-basierten Bewegungsplan");
assert.ok(
  Math.abs(gameplay.speedMeterMaximum - inspection.speedMeterMaximum / 180) < 1e-12,
  "der Spielmodus skaliert die Geschwindigkeitsanzeige proportional zur 180-fach längeren Um-Dauer",
);
assert.equal(inspection.presentationMs / 6, 38400000, "der Prüfpfad dauert bei 6× exakt 10 Stunden 40 Minuten");
assert.equal(gameplay.presentationMs / 6, 6912000000, "der Spielpfad dauert bei 6× exakt 80 Tage");

document.querySelector("#time-mode").value = "inspection";
document.querySelector("#time-mode").emit("change");
contract.selectCycle(0, { cycleUm: 0 });
const scenario0 = contract.getState().scenario;
assert.equal(contract.getState().timeMode, "inspection");
assert.equal(contract.getState().presentationMs, 230400000);
assert.equal(document.querySelector("#time-slider").getAttribute("max"), "230400000", "Slider erhält die 64-Stunden-Grenze");
assert.equal(document.querySelector("#timeline-total").textContent, "64:00:00", "lange Prüflaufzeit wird als Stundenwert formatiert");
assert.equal(document.querySelector("#timeline-zoom-controls").hidden, false, "Prüfmodus blendet seine Zoomnavigation ein");
assert.equal(localStorage.getItem("era-time-mode"), "inspection", "Dropdown speichert den gewählten Prüfmodus");

contract.setPlaying(true, { announce: false });
contract.tick(performance.now() + 5000);
assert.ok(
  contract.getState().currentMs >= 4990 && contract.getState().currentMs <= 5010,
  "rAF-Zeitanker übernimmt fünf Sekunden unabhängig von der Zahl gerenderter Bilder",
);
contract.setPlaying(false, { announce: false });
contract.selectCycle(0, { cycleUm: 0 });

contract.selectCycle(0, { cycleUm: 46079.99 });
contract.setPlaying(true, { announce: false });
contract.tick(performance.now() + 100);
assert.equal(contract.getState().playing, false, "ohne Autozyklus pausiert die Prüfung exakt am Zyklusende");
assert.equal(contract.getState().cycleIndex, 0, "ohne Autozyklus wird kein Anschlusszyklus betreten");
assert.equal(contract.getState().currentMs, inspection.presentationMs, "der abgeschlossene Endzustand bleibt sichtbar");

document.querySelector("#auto-cycle").emit("click");
contract.selectCycle(0, { cycleUm: 46079.99 });
contract.setPlaying(true, { announce: false });
contract.tick(performance.now() + 100);
assert.equal(contract.getState().cycleIndex, 1, "mit Autozyklus erhöht sich die Nummer des Konvektionsabschlusses");
assert.ok(contract.getState().absoluteWorldUm > 46080, "Zeitüberhang läuft in der absoluten Weltzeit weiter");
assert.equal(contract.getState().playing, true, "Anschlusszyklus läuft ohne Pause weiter");
contract.setPlaying(false, { announce: false });
document.querySelector("#auto-cycle").emit("click");
contract.selectCycle(0, { cycleUm: 0 });

const afterOneUm = snapshotAt(5000, scenario0);
assert.equal(afterOneUm.cycleUm, 1, "nach fünf Sekunden ist genau ein Um vergangen");
assert.equal(afterOneUm.absoluteWorldUm, 1, "Kalender und Bewegung verwenden dieselbe Weltzeit");
const gameplayAfterOneUm = snapshotAtMode(
  gameplay.millisecondsPerUm,
  "gameplay",
  scenario0,
);
assert.equal(gameplayAfterOneUm.cycleUm, 1, "nach 15 Spielminuten ist genau ein Um vergangen");
for (const bodyName of ["sol", "yol"]) {
  assert.ok(
    angularDistance(gameplayAfterOneUm[bodyName].angle, afterOneUm[bodyName].angle) < 1e-9,
    `${bodyName}: Prüf- und Spielmodus zeigen am selben Um denselben linearen Weltwinkel`,
  );
}
const eraAtZero = contract.getEraRotationUnwrappedDegrees(0, "orbit", {
  exact: true,
  timeMode: "inspection",
  scenario: scenario0,
  cycleIndex: 0,
});
const eraAfterOneUm = contract.getEraRotationUnwrappedDegrees(5000, "orbit", {
  exact: true,
  timeMode: "inspection",
  scenario: scenario0,
  cycleIndex: 0,
});
assert.equal(eraAfterOneUm - eraAtZero, 360, "ein Um erzeugt exakt eine Era-Rotation");
const gameplayEraAtZero = contract.getEraRotationUnwrappedDegrees(0, "orbit", {
  exact: true,
  timeMode: "gameplay",
  scenario: scenario0,
  cycleIndex: 0,
});
const gameplayEraAfterOneUm = contract.getEraRotationUnwrappedDegrees(
  gameplay.millisecondsPerUm,
  "orbit",
  {
    exact: true,
    timeMode: "gameplay",
    scenario: scenario0,
    cycleIndex: 0,
  },
);
assert.equal(gameplayEraAfterOneUm - gameplayEraAtZero, 360, "auch die Spielsimulation erzeugt pro Um exakt eine Era-Rotation");

const afterSixMinutes = snapshotAt(360000, scenario0);
assert.equal(afterSixMinutes.cycleUm, 72, "sechs reale Minuten ergeben im Prüfmodus 72 Um");
assert.equal(afterSixMinutes.cycleProgress, 72 / 46080, "Fortschritt ist ausschließlich Um geteilt durch 46.080");
assert.notEqual(afterSixMinutes.template.motion, "convection", "nach sechs Minuten ist der Zyklus nicht beendet");

const convectionStartMs = 45680 * 5000;
const beforeConvection = snapshotAt(convectionStartMs - 0.001, scenario0);
const convectionStart = snapshotAt(convectionStartMs, scenario0);
const cycleEnd = snapshotAt(46080 * 5000, scenario0);
assert.notEqual(beforeConvection.template.motion, "convection", "vor 63:26:40 läuft noch eine reguläre Phase");
assert.equal(convectionStart.template.motion, "convection", "Konvektion beginnt exakt bei 45.680 Um");
assert.equal(convectionStart.sol.visible, false, "Sol ist während der Konvektion unsichtbar");
assert.equal(convectionStart.yol.visible, false, "Yol ist während der Konvektion unsichtbar");
assert.equal(cycleEnd.cycleUm, 46080, "Zyklus endet exakt bei 46.080 Um");
assert.equal(cycleEnd.cycleProgress, 1, "abgeschlossener Zyklus zeigt 100 Prozent");

const synchronizedSegment = scenario0.segments.find(
  (segment) => segment.template.category === "synchron",
);
assert.ok(synchronizedSegment, "Szenario enthält eine synchrone Phase");
const synchronizedTimes = [
  (synchronizedSegment.umStart + 1) * 5000,
  (synchronizedSegment.umStart + 2) * 5000,
];
const synchronizedRelativeAngles = synchronizedTimes.map((ms) => {
  const snapshot = snapshotAt(ms, scenario0);
  const point = contract.getOrbitPoint(snapshot, "sol");
  const polarAngle = Math.atan2(
    point.y - contract.ORBIT_GEOMETRY.centerY,
    point.x - contract.ORBIT_GEOMETRY.centerX,
  ) * 180 / Math.PI;
  const eraAngle = contract.getEraRotationUnwrappedDegrees(ms, snapshot.template.motion, {
    exact: true,
    timeMode: "inspection",
    scenario: scenario0,
    cycleIndex: 0,
  });
  return contract.normalizeDegrees(polarAngle - eraAngle);
});
assert.ok(
  angularDistance(synchronizedRelativeAngles[0], synchronizedRelativeAngles[1]) < 1e-8,
  "synchroner polarer Richtungswinkel bleibt auch auf der Ellipse relativ zu Era konstant",
);

for (const [category, expectedSign] of [["langsam", 1], ["asynchron", -1]]) {
  const segment = scenario0.segments.find((candidate) => candidate.template.category === category);
  assert.ok(segment, `Szenario enthält die Kategorie ${category}`);
  const sample = snapshotAt(((segment.umStart + segment.umEnd) / 2) * 5000, scenario0);
  for (const bodyName of ["sol", "yol"]) {
    assert.equal(
      Math.sign(sample[bodyName].angularVelocityPerUm),
      expectedSign,
      `${category}/${bodyName}: vorgesehener Laufdrehsinn bleibt erhalten`,
    );
  }
}

const changingSegment = scenario0.segments.find(
  (segment) => segment.template.category === "wechselnd",
);
const changingMs = ((changingSegment.umStart + changingSegment.umEnd) / 2) * 5000;
assert.equal(
  snapshotAt(changingMs, scenario0).sol.angle,
  snapshotAt(changingMs, scenario0).sol.angle,
  "wechselnder Lauf ist für denselben Seed und Zeitpunkt reproduzierbar",
);
for (const bodyName of ["sol", "yol"]) {
  const directionSigns = new Set();
  for (let index = 1; index <= 64; index += 1) {
    const cycleUm = changingSegment.umStart +
      ((changingSegment.umEnd - changingSegment.umStart) * index) / 65;
    directionSigns.add(Math.sign(snapshotAt(cycleUm * 5000, scenario0)[bodyName].angularVelocityPerUm));
  }
  assert.ok(
    directionSigns.has(-1) && directionSigns.has(1),
    `wechselnder Lauf von ${bodyName} enthält reproduzierbaren Hin- und Gegenlauf`,
  );
}

const fixedSegment = scenario0.segments.find(
  (segment) => segment.template.motion === "fixed-orbit",
);
assert.ok(fixedSegment, "Szenario enthält die weltfest stehenden Sonnen");
const fixedStartMs = (fixedSegment.umStart + 1) * 5000;
const fixedEndMs = (fixedSegment.umStart + 2) * 5000;
for (const bodyName of ["sol", "yol"]) {
  const firstPoint = contract.getOrbitPoint(snapshotAt(fixedStartMs, scenario0), bodyName);
  const secondPoint = contract.getOrbitPoint(snapshotAt(fixedEndMs, scenario0), bodyName);
  assert.ok(
    pointDistance(firstPoint, secondPoint) < 1e-8,
    `${bodyName} bleibt im weltfesten Zustand am selben Weltpunkt`,
  );
}

for (let index = 1; index < scenario0.segments.length; index += 1) {
  const boundaryMs = scenario0.segments[index].umStart * 5000;
  const before = snapshotAt(boundaryMs - 0.001, scenario0);
  const after = snapshotAt(boundaryMs, scenario0);
  for (const bodyName of ["sol", "yol"]) {
    assert.ok(
      angularDistance(before[bodyName].angle, after[bodyName].angle) < 0.001,
      `${index}/${bodyName}: Prüfmoduswinkel ist an der Phasengrenze stetig`,
    );
    assert.ok(
      Math.abs(before[bodyName].radialOffset - after[bodyName].radialOffset) < 0.001,
      `${index}/${bodyName}: Prüfbahnradius ist an der Phasengrenze stetig`,
    );
  }
}

const end0 = snapshotAt(inspection.presentationMs, scenario0, 0);
contract.selectCycle(1, { cycleUm: 0 });
const state1 = contract.getState();
const scenario1 = state1.scenario;
const start1 = snapshotAt(0, scenario1, 1);
const cycleStartIrradiance = contract.getIrradianceDwellAt(0, "north", 60);
assert.equal(state1.seed, contract.deriveCycleSeed(state1.rootSeed, 1), "Folgeseed wird reproduzierbar abgeleitet");
assert.equal(start1.absoluteWorldUm, 46080, "absolute Weltzeit läuft über den Zykluswechsel weiter");
assert.equal(cycleStartIrradiance.solDwellUm, 0, "ein neuer Zyklus startet Sols sichtbare Um-Serie bei null");
assert.equal(cycleStartIrradiance.yolDwellUm, 0, "ein neuer Zyklus startet Yols sichtbare Um-Serie bei null");
for (const bodyName of ["sol", "yol"]) {
  assert.ok(
    angularDistance(end0[bodyName].angle, start1[bodyName].angle) < 1e-9,
    `${bodyName}: Zyklusanschluss übernimmt den exakten Winkel`,
  );
  assert.ok(
    pointDistance(contract.getOrbitPoint(end0, bodyName), contract.getOrbitPoint(start1, bodyName)) < 1e-8,
    `${bodyName}: Zyklusanschluss besitzt keinen Weltpunktsprung`,
  );
}

contract.selectCycle(1, { cycleUm: 72 });
const phaseBeforeModeSwitch = contract.getLastRenderFrame().snapshot.template.id;
contract.setTimeMode("chronicle", { persist: false, announce: false });
assert.equal(contract.getState().cycleIndex, 1, "Moduswechsel bewahrt den ausgewählten Zyklus");
assert.ok(Math.abs(contract.getState().absoluteWorldUm - (46080 + 72)) < 1e-8, "Moduswechsel bewahrt den Um-Stand");
assert.equal(contract.getLastRenderFrame().snapshot.template.id, phaseBeforeModeSwitch, "Moduswechsel bewahrt die Phase");
contract.setTimeMode("inspection", { persist: false, announce: false });

contract.setTimelineZoom("series", { announce: false });
assert.ok(
  document.querySelector("#phase-track").querySelectorAll(".cycle-segment").length >= 2,
  "Folgenzoom zeigt alle bereits materialisierten Zyklen",
);
assert.equal(
  contract.getTimelineScrubTargetMs(500, {
    left: 0,
    clientWidth: 1000,
    scrollWidth: 1000,
  }),
  null,
  "Folgenzoom bleibt eine reine Zyklusauswahl ohne Scrubbing",
);
contract.setTimelineZoom("cycle", { announce: false });
assert.equal(
  document.querySelector("#phase-track").querySelectorAll(".phase-segment").length,
  scenario1.segments.length,
  "Zykluszoom zeigt genau einen vollständigen Zyklus",
);

const phaseTrack = document.querySelector("#phase-track");
phaseTrack.getBoundingClientRect = () => ({ left: 100, width: 1000 });
phaseTrack.clientWidth = 1000;
phaseTrack.scrollWidth = 1000;
phaseTrack.scrollLeft = 0;
contract.setPlaying(true, { announce: false });
phaseTrack.emit("pointerdown", {
  pointerId: 7,
  pointerType: "mouse",
  button: 0,
  clientX: 100,
});
const scrubMove = phaseTrack.emit("pointermove", { pointerId: 7, clientX: 600 });
assert.equal(scrubMove.defaultPrevented, true, "horizontales Ziehen übernimmt die Pointer-Geste");
assert.equal(
  contract.getState().currentMs,
  inspection.presentationMs / 2,
  "Ziehen zur Mitte stellt den Zyklus exakt auf 50 Prozent",
);
assert.equal(contract.getState().playing, false, "Scrubbing pausiert eine laufende Wiedergabe");
assert.equal(phaseTrack.classList.contains("is-scrubbing"), true, "Zeitpfad zeigt den aktiven Ziehzustand");
phaseTrack.emit("pointerup", { pointerId: 7, clientX: 850 });
assert.equal(
  contract.getState().currentMs,
  inspection.presentationMs * 0.75,
  "Loslassen bei drei Vierteln übernimmt den feinjustierten Zyklusstand",
);
assert.equal(phaseTrack.classList.contains("is-scrubbing"), false, "Loslassen beendet den Ziehzustand");

contract.setTimelineZoom("detail", { announce: false });
assert.equal(
  document.querySelector("#phase-track").querySelectorAll(".phase-segment-detail").length,
  1,
  "Detailzoom zeigt genau ein großes Abschnittssiegel",
);
assert.match(
  document.querySelector("#phase-track").querySelector(".segment-detail-progress").textContent,
  /% Abschnittsfortschritt$/,
  "großes Siegel weist seinen Abschnittsfortschritt auch als Text aus",
);
const detailSegment = contract.getLastRenderFrame().snapshot.segment;
const detailStartMs = detailSegment.umStart * inspection.millisecondsPerUm;
const detailEndMs = detailSegment.umEnd * inspection.millisecondsPerUm;
const detailButton = phaseTrack.querySelector(".phase-segment-detail");
phaseTrack.emit("pointerdown", {
  pointerId: 8,
  pointerType: "mouse",
  button: 0,
  clientX: 100,
});
phaseTrack.emit("pointermove", { pointerId: 8, clientX: 350 });
phaseTrack.emit("pointerup", { pointerId: 8, clientX: 350 });
const detailQuarterMs = detailStartMs + (detailEndMs - detailStartMs) * 0.25;
assert.ok(
  Math.abs(contract.getState().currentMs - detailQuarterMs) < 1e-8,
  "Detail-Scrubbing bildet die Breite ausschließlich auf den sichtbaren Abschnitt ab",
);
detailButton.click();
assert.ok(
  Math.abs(contract.getState().currentMs - detailQuarterMs) < 1e-8,
  "der synthetische Klick nach einer Ziehgeste löst keinen zweiten Zeitsprung aus",
);

const inspectionFrameBeforeGameplay = contract.getLastRenderFrame();
const worldUmBeforeGameplay = inspectionFrameBeforeGameplay.snapshot.absoluteWorldUm;
document.querySelector("#time-mode").value = "gameplay";
document.querySelector("#time-mode").emit("change");
assert.equal(contract.getState().timeMode, "gameplay", "Dropdown aktiviert die dritte Zeit-Einstellung");
assert.equal(contract.getState().absoluteWorldUm, worldUmBeforeGameplay, "Spielmoduswechsel bewahrt den exakten Weltzeitstand");
assert.equal(document.querySelector("#time-slider").getAttribute("max"), "41472000000", "Spielzeit-Slider umfasst den vollständigen 480-Tage-Zyklus");
assert.equal(document.querySelector("#time-slider").getAttribute("step"), "1000", "Spielzeit-Slider verwendet stabile Sekundenschritte");
assert.equal(document.querySelector("#timeline-total").textContent, "480 Tage · 00:00:00", "Spielzeit wird als lesbare Tagesdauer ausgegeben");
assert.equal(document.querySelector("#timeline-title").textContent, "Linearer 15-min/Um-Spielpfad");
assert.match(document.querySelector("#timeline-summary").textContent, /15 Spielminuten/);
assert.equal(document.querySelector("#timeline-zoom-controls").hidden, false, "Spielsimulation erhält dieselbe Langzeitnavigation");
assert.equal(document.querySelector("#phase-track").getAttribute("data-time-kind"), "linear-world-time", "Spielpfad verwendet die gemeinsame lineare Interaktion");
assert.equal(localStorage.getItem("era-time-mode"), "gameplay", "Dropdown speichert die Spielsimulation");
const gameplayFrameAfterSwitch = contract.getLastRenderFrame();
for (const bodyName of ["sol", "yol"]) {
  assert.ok(
    angularDistance(
      inspectionFrameBeforeGameplay.snapshot[bodyName].angle,
      gameplayFrameAfterSwitch.snapshot[bodyName].angle,
    ) < 1e-9,
    `${bodyName}: Moduswechsel verändert am selben Um nicht den Weltwinkel`,
  );
}
for (const property of [
  "solDwellUm",
  "yolDwellUm",
  "solBuildup",
  "yolBuildup",
  "sol",
  "yol",
  "solHeat",
  "solSparks",
  "solBlaze",
  "solStorm",
  "yolCold",
  "yolParticles",
  "yolDeepCold",
  "yolStorm",
  "dualInterference",
]) {
  assert.ok(
    Math.abs(
      inspectionFrameBeforeGameplay.horizonIrradiance[property] -
        gameplayFrameAfterSwitch.horizonIrradiance[property],
    ) < 1e-8,
    `${property}: Prüf- und Spielpfad berechnen am selben Um dieselbe Einstrahlung`,
  );
}

contract.setTimelineZoom("series", { announce: false });
assert.ok(
  document.querySelector("#phase-track").querySelectorAll(".cycle-segment").length >= 2,
  "Spielsimulation besitzt den Zyklusfolgen-Zoom",
);
contract.setTimelineZoom("cycle", { announce: false });
assert.equal(
  contract.getTimelineScrubTargetMs(600, {
    left: 100,
    clientWidth: 1000,
    scrollWidth: 1000,
  }),
  gameplay.presentationMs / 2,
  "Spielpfad-Scrubbing bildet die Mitte auf 240 Tage ab",
);
contract.setTimelineZoom("detail", { announce: false });
assert.equal(
  document.querySelector("#phase-track").querySelectorAll(".phase-segment-detail").length,
  1,
  "Spielsimulation besitzt denselben Detail-Zoom",
);

contract.selectCycle(0, { cycleUm: 0 });
document.querySelector("#playback-rate").value = "6";
document.querySelector("#playback-rate").emit("change");
assert.equal(contract.getState().playbackRate, 6, "6× ist als Wiedergabetempo aktivierbar");
contract.setPlaying(true, { announce: false });
contract.tick(performance.now() + 1000);
assert.ok(
  contract.getState().currentMs >= 5990 && contract.getState().currentMs <= 6020,
  "6× lässt pro realer Sekunde sechs Sekunden der gewählten Zeitlinie verstreichen",
);
contract.setPlaying(false, { announce: false });
document.querySelector("#playback-rate").value = "1";
document.querySelector("#playback-rate").emit("change");

document.querySelector("#time-mode").value = "inspection";
document.querySelector("#time-mode").emit("change");
contract.selectCycle(0, { cycleUm: 0 });
document.querySelector("#playback-rate").value = "6";
document.querySelector("#playback-rate").emit("change");
contract.setPlaying(true, { announce: false });
contract.tick(performance.now() + 1000);
assert.ok(
  contract.getState().currentMs >= 5990 && contract.getState().currentMs <= 6020,
  "6× beschleunigt auch den linearen Prüfpfad um denselben Faktor",
);
contract.setPlaying(false, { announce: false });
document.querySelector("#playback-rate").value = "1";
document.querySelector("#playback-rate").emit("change");

document.querySelector("#time-mode").value = "chronicle";
document.querySelector("#time-mode").emit("change");
assert.equal(contract.getState().presentationMs, 360000, "Rückkehr zum Erklärmodus stellt 6:00 wieder her");
assert.equal(document.querySelector("#timeline-total").textContent, "6:00");
assert.equal(document.querySelector("#timeline-zoom-controls").hidden, true, "Erklärmodus behält die kompakte Timeline");
assert.equal(localStorage.getItem("era-time-mode"), "chronicle", "Dropdown speichert die Rückkehr zum Erklärmodus");

process.stdout.write(`${JSON.stringify({
  contract: "triple-time-mode",
  inspectionHours: inspection.presentationMs / 3600000,
  gameplayDays: gameplay.presentationMs / 86400000,
  convectionStart: "63:26:40",
  cycleEnd: "64:00:00",
  materializedCycles: state1.cycleCount,
})}\n`);
