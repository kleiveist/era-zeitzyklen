"use strict";

const assert = require("node:assert/strict");

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
    this.values = new Set();
  }

  tokens() {
    return new Set([
      ...String(this.owner.className || "").split(/\s+/).filter(Boolean),
      ...this.values,
    ]);
  }

  commit(tokens) {
    this.values = new Set(tokens);
    this.owner.className = [...tokens].join(" ");
  }

  add(...names) {
    const tokens = this.tokens();
    names.forEach((name) => tokens.add(name));
    this.commit(tokens);
  }

  remove(...names) {
    const tokens = this.tokens();
    names.forEach((name) => tokens.delete(name));
    this.commit(tokens);
  }

  contains(name) {
    return this.tokens().has(name);
  }

  toggle(name, force) {
    const tokens = this.tokens();
    const enabled = force === undefined ? !tokens.has(name) : Boolean(force);
    if (enabled) tokens.add(name);
    else tokens.delete(name);
    this.commit(tokens);
    return enabled;
  }
}

class FakeStyle {
  setProperty(name, value) {
    this[name] = String(value);
  }

  getPropertyValue(name) {
    return Object.hasOwn(this, name) ? String(this[name]) : "";
  }

  removeProperty(name) {
    const previous = this.getPropertyValue(name);
    delete this[name];
    return previous;
  }
}

function dataKeyFromAttribute(name) {
  return name
    .slice(5)
    .replace(/-([a-z])/g, (_, character) => character.toUpperCase());
}

function elementAttribute(element, name) {
  if (element.attributes.has(name)) return element.attributes.get(name);
  if (name.startsWith("data-")) {
    const key = dataKeyFromAttribute(name);
    return Object.hasOwn(element.dataset, key) ? String(element.dataset[key]) : null;
  }
  return null;
}

function matchesSelector(element, selector) {
  return selector.split(",").some((part) => {
    const candidate = part.trim();
    if (!candidate) return false;
    if (candidate.startsWith("#")) return element.id === candidate.slice(1);
    if (candidate.startsWith(".")) return element.classList.contains(candidate.slice(1));

    const attributeMatch = candidate.match(
      /^([a-z][\w-]*)?\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\]$/i,
    );
    if (attributeMatch) {
      const [, tagName, name, expected] = attributeMatch;
      if (tagName && element.tagName !== tagName.toUpperCase()) return false;
      const actual = elementAttribute(element, name);
      return actual !== null && (expected === undefined || actual === expected);
    }

    return element.tagName === candidate.toUpperCase();
  });
}

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.listeners = new Map();
    this.attributes = new Map();
    this.dataset = {};
    this.className = "";
    this.classList = new FakeClassList(this);
    this.style = new FakeStyle();
    this.id = "";
    this.value = "";
    this.textContent = "";
    this.hidden = false;
    this.tabIndex = 0;
  }

  append(...children) {
    for (const child of children) {
      if (child && typeof child === "object") child.parentElement = this;
      this.children.push(child);
    }
  }

  appendChild(child) {
    this.append(child);
    return child;
  }

  replaceChildren(...children) {
    this.children.forEach((child) => {
      if (child && typeof child === "object") child.parentElement = null;
    });
    this.children = [];
    this.append(...children);
  }

  setAttribute(name, value) {
    const normalized = String(value);
    this.attributes.set(name, normalized);
    if (name === "id") this.id = normalized;
    if (name === "class") this.className = normalized;
    if (name === "value") this.value = normalized;
    if (name === "tabindex") this.tabIndex = Number(normalized);
    if (name.startsWith("data-")) this.dataset[dataKeyFromAttribute(name)] = normalized;
  }

  getAttribute(name) {
    return elementAttribute(this, name);
  }

  hasAttribute(name) {
    return elementAttribute(this, name) !== null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name.startsWith("data-")) delete this.dataset[dataKeyFromAttribute(name)];
  }

  addEventListener(name, listener) {
    const listeners = this.listeners.get(name) || [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
  }

  emit(name, event = {}) {
    const payload = {
      key: undefined,
      bubbles: true,
      target: this,
      defaultPrevented: false,
      propagationStopped: false,
      ...event,
    };
    payload.preventDefault = () => {
      payload.defaultPrevented = true;
    };
    payload.stopPropagation = () => {
      payload.propagationStopped = true;
    };

    let current = this;
    while (current) {
      payload.currentTarget = current;
      for (const listener of current.listeners.get(name) || []) listener.call(current, payload);
      if (!payload.bubbles || payload.propagationStopped) break;
      current = current.parentElement;
    }
    return payload;
  }

  click() {
    return this.emit("click");
  }

  focus() {
    global.document.activeElement = this;
  }

  blur() {
    if (global.document.activeElement === this) global.document.activeElement = null;
  }

  matches(selector) {
    return matchesSelector(this, selector);
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches(selector)) return current;
      current = current.parentElement;
    }
    return null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const visit = (element) => {
      for (const child of element.children) {
        if (!child || typeof child !== "object") continue;
        if (matchesSelector(child, selector)) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

const elements = new Map();

function registerElement(selector, element = new FakeElement()) {
  if (selector.startsWith("#")) {
    element.id = selector.slice(1);
    element.attributes.set("id", element.id);
  }
  elements.set(selector, element);
  return element;
}

function elementFor(selector) {
  if (!elements.has(selector)) registerElement(selector);
  return elements.get(selector);
}

function allKnownElements() {
  const known = new Set();
  const visit = (element) => {
    if (!element || known.has(element)) return;
    known.add(element);
    element.children.forEach((child) => {
      if (child && typeof child === "object") visit(child);
    });
  };
  elements.forEach(visit);
  return [...known];
}

global.window = global;
const documentElement = { dataset: { theme: "dark" } };
const documentListeners = new Map();
global.document = {
  activeElement: null,
  documentElement,
  querySelector: elementFor,
  querySelectorAll: (selector) => allKnownElements().filter((element) => matchesSelector(element, selector)),
  createElement: (tagName) => new FakeElement(tagName),
  createElementNS: (_namespace, tagName) => new FakeElement(tagName),
  addEventListener: (name, listener) => {
    const listeners = documentListeners.get(name) || [];
    listeners.push(listener);
    documentListeners.set(name, listeners);
  },
};

const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};
global.matchMedia = () => ({
  matches: false,
  addEventListener: () => {},
  addListener: () => {},
});
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};

const directionGroup = registerElement("#horizon-direction-group", new FakeElement("div"));
directionGroup.setAttribute("role", "radiogroup");
const directionButtons = ["north", "east", "south", "west"].map((direction) => {
  const button = registerElement(`#horizon-direction-${direction}`, new FakeElement("button"));
  button.className = "horizon-direction";
  button.setAttribute("data-direction", direction);
  directionGroup.append(button);
  return button;
});

elementFor("#seed-input").value = "ERA-3500";
elementFor("#playback-rate").value = "1";
elementFor("#time-slider").value = "0";
elementFor("#duration-mode").value = "180000";

require("../phases.js");
require("../app.js");

const contract = global.ERA_CYCLE_CONTRACT;
assert.ok(contract, "app.js veröffentlicht den read-only ERA_CYCLE_CONTRACT");
assert.ok(Object.isFrozen(contract), "ERA_CYCLE_CONTRACT ist eingefroren");

for (const constantName of ["ORBIT_GEOMETRY", "HORIZON_GEOMETRY", "HORIZON_DIRECTIONS"]) {
  assert.ok(contract[constantName], `${constantName} ist Teil des Geometrievertrags`);
  assert.ok(Object.isFrozen(contract[constantName]), `${constantName} ist read-only`);
}
for (const functionName of [
  "normalizeDegrees",
  "getEraRotationDegrees",
  "getOrbitPoint",
  "getBodyVisualRadius",
  "ensureOrbitClearance",
  "getViewBasis",
  "projectOrbitPointToHorizon",
  "getSnapshot",
  "getLastRenderFrame",
  "getState",
]) {
  assert.equal(typeof contract[functionName], "function", `${functionName} ist testbar exportiert`);
}

const track = elementFor("#phase-track");
const sigils = elementFor("#phase-sigils");
const slider = elementFor("#time-slider");
const durationMode = elementFor("#duration-mode");

assert.equal(ERA_PHASES.templates.length, 18, "exakt 18 kanonische Phasenvorlagen");
assert.equal(
  new Set(ERA_PHASES.templates.map((template) => template.id)).size,
  18,
  "jede Phasenvorlage besitzt eine eindeutige ID",
);
assert.equal(ERA_PHASES.config.totalUm, 70000, "Großzyklus umfasst 70.000 Um");
assert.equal(ERA_PHASES.config.regularUm, 69600, "reguläre Phasen umfassen 69.600 Um");
assert.equal(ERA_PHASES.config.convectionDurationUm, 400, "Konvektion umfasst 400 Um");
assert.equal(70000 / 7000, 10, "Großzyklus entspricht 10 Mohn");
assert.equal(70000 / 200, 350, "Großzyklus entspricht 350 Dir");
assert.equal(70000 / 20, 3500, "Großzyklus entspricht 3.500 Tan");
assert.ok(track.children.length >= ERA_PHASES.templates.length, "alle Vorlagen plus Wiederholungen");
assert.equal(sigils.children.length, 18, "jede Vorlage besitzt ein anwählbares Siegel");
assert.ok(ERA_PHASES.templates.every((template) => /^icon-/.test(template.icon)), "jede Vorlage besitzt eine Icon-ID");

const firstSchedule = track.children.map((button) => button.getAttribute("aria-label"));
assert.equal(
  track.children.reduce((sum, button) => sum + Number(button.style.getPropertyValue("--segment-grow")), 0),
  180000,
  "Zeitlinie umfasst exakt drei Minuten",
);
assert.equal(
  Number(track.children.at(-1).style.getPropertyValue("--segment-grow")),
  16000,
  "Konvektion erhält die didaktisch vergrößerten 16 Sekunden",
);
assert.equal(Number(elementFor("#phase-count").textContent), track.children.length, "Phasenzähler entspricht der Zeitlinie");
assert.match(elementFor("#era-time").textContent, /^Mohn 0 · Dir 0 · Tan 0 · Um 0$/);

for (const template of ERA_PHASES.templates) {
  const select = elementFor("#phase-select");
  select.value = template.id;
  select.emit("change");
  assert.equal(elementFor("#active-phase-name").textContent, template.label, `Sprung zu ${template.id}`);
  assert.equal(
    elementFor("#active-phase-icon-use").getAttribute("href"),
    `#${template.icon}`,
    `aktives Siegel für ${template.id}`,
  );
}

function pressed(button) {
  return button.getAttribute("aria-pressed") === "true" || button.getAttribute("aria-checked") === "true";
}

function assertDirection(expected, message) {
  const active = directionButtons.filter(pressed);
  assert.equal(active.length, 1, `${message}: genau ein aktiver ARIA-Zustand`);
  assert.equal(active[0].dataset.direction, expected, `${message}: sichtbarer Zustand`);
  assert.equal(contract.getState().horizonDirection, expected, `${message}: Anwendungszustand`);
}

function simulationSignature(snapshot) {
  const bodySignature = (body) => ({
    angle: body.angle,
    speed: body.speed,
    angularVelocity: body.angularVelocity,
    directionSign: body.directionSign,
    intensity: body.intensity,
    radialOffset: body.radialOffset,
    visible: body.visible,
  });
  return {
    ms: snapshot.ms,
    segmentIndex: snapshot.segment.index,
    templateId: snapshot.template.id,
    progress: snapshot.progress,
    cycleUm: snapshot.cycleUm,
    sol: bodySignature(snapshot.sol),
    yol: bodySignature(snapshot.yol),
  };
}

function pointOf(value) {
  return value && value.point ? value.point : value;
}

function assertPointClose(actualValue, expectedValue, message, epsilon = 1e-7) {
  const actual = pointOf(actualValue);
  const expected = pointOf(expectedValue);
  assert.ok(actual && expected, `${message}: Punkt vorhanden`);
  assert.ok(Number.isFinite(actual.x) && Number.isFinite(actual.y), `${message}: endliche Koordinaten`);
  assert.ok(Math.abs(actual.x - expected.x) <= epsilon, `${message}: x stimmt überein`);
  assert.ok(Math.abs(actual.y - expected.y) <= epsilon, `${message}: y stimmt überein`);
}

assert.equal(directionButtons.length, 4, "exakt vier Blickrichtungen");
assertDirection("north", "Standardrichtung Norden");

slider.value = "54000";
slider.emit("input");
const directionFrameBefore = contract.getLastRenderFrame();
const directionStateBefore = contract.getState();
directionButtons[1].emit("click");
assertDirection("east", "Klick auf Osten");
assert.equal(storage.get("era-horizon-direction"), "east", "Osten wird gespeichert");
const directionFrameAfter = contract.getLastRenderFrame();
const directionStateAfter = contract.getState();
assert.equal(directionStateAfter.currentMs, directionStateBefore.currentMs, "Richtungswahl verändert die Zeit nicht");
assert.equal(directionStateAfter.seed, directionStateBefore.seed, "Richtungswahl verändert den Seed nicht");
assert.deepEqual(
  simulationSignature(directionFrameAfter.snapshot),
  simulationSignature(directionFrameBefore.snapshot),
  "Richtungswahl erzeugt keinen neuen Simulationssnapshot",
);
for (const bodyName of ["sol", "yol"]) {
  assertPointClose(
    directionFrameAfter.worldPoints[bodyName],
    directionFrameBefore.worldPoints[bodyName],
    `${bodyName}: Richtungswahl verändert den Weltpunkt nicht`,
  );
}
assert.equal(
  directionFrameAfter.eraRotationDegrees,
  directionFrameBefore.eraRotationDegrees,
  "Richtungswahl verändert Eras Rotation nicht",
);
assert.notDeepEqual(directionFrameAfter.viewBasis, directionFrameBefore.viewBasis, "nur die Blickbasis wird neu projiziert");

directionButtons[2].emit("click");
assertDirection("south", "Klick auf Süden");
assert.equal(storage.get("era-horizon-direction"), "south", "Süden wird gespeichert");
directionButtons[3].emit("click");
assertDirection("west", "Klick auf Westen");
assert.equal(storage.get("era-horizon-direction"), "west", "Westen wird gespeichert");

directionButtons[3].focus();
let keyEvent = directionButtons[3].emit("keydown", { key: "ArrowRight" });
assert.ok(keyEvent.defaultPrevented, "Pfeil-rechts verhindert Browser-Standardverhalten");
assertDirection("north", "Pfeil-rechts wechselt zyklisch weiter");
assert.equal(document.activeElement, directionButtons[0], "Fokus folgt zu Norden");
keyEvent = directionButtons[0].emit("keydown", { key: "ArrowDown" });
assert.ok(keyEvent.defaultPrevented, "Pfeil-runter verhindert Browser-Standardverhalten");
assertDirection("east", "Pfeil-runter wechselt zyklisch weiter");
keyEvent = directionButtons[1].emit("keydown", { key: "ArrowLeft" });
assert.ok(keyEvent.defaultPrevented, "Pfeil-links verhindert Browser-Standardverhalten");
assertDirection("north", "Pfeil-links wechselt zyklisch zurück");
keyEvent = directionButtons[0].emit("keydown", { key: "ArrowUp" });
assert.ok(keyEvent.defaultPrevented, "Pfeil-hoch verhindert Browser-Standardverhalten");
assertDirection("west", "Pfeil-hoch wechselt zyklisch zurück");

const preservedDirection = "west";
slider.value = "68000";
slider.emit("input");
assertDirection(preservedDirection, "Zeitsprung bewahrt die Blickrichtung");
elementFor("#phase-select").value = "async-parabola";
elementFor("#phase-select").emit("change");
assertDirection(preservedDirection, "Phasensprung bewahrt die Blickrichtung");
assert.equal(elementFor("#active-phase-name").textContent, "Asynchroner Parabellauf", "Phasensprung wurde ausgeführt");

elementFor("#theme-toggle").emit("click");
assert.equal(documentElement.dataset.theme, "light", "Theme-Schalter aktiviert helles Pergament");
assert.equal(elementFor("#theme-label").textContent, "Helles Pergament");
assert.equal(storage.get("era-theme"), "light", "Theme-Präferenz wird gespeichert");
elementFor("#theme-toggle").emit("click");
assert.equal(documentElement.dataset.theme, "dark", "Theme-Schalter kehrt zur dunklen Chronik zurück");

slider.value = "180000";
slider.emit("input");
assert.match(elementFor("#era-time").textContent, /^Mohn 10 · Dir 0 · Tan 0 · Um 0$/);
assert.equal(elementFor("#active-phase-name").textContent, "Konvektion");
assert.equal(elementFor("#sol-intensity").textContent, "nicht sichtbar");
assert.equal(elementFor("#yol-intensity").textContent, "nicht sichtbar");

const firstCount = elementFor("#phase-count").textContent;
elementFor("#apply-seed").emit("click");
assert.equal(elementFor("#phase-count").textContent, firstCount, "gleicher Seed bleibt stabil");
assert.deepEqual(
  track.children.map((button) => button.getAttribute("aria-label")),
  firstSchedule,
  "gleicher Seed erzeugt denselben Ereignisplan",
);
assertDirection(preservedDirection, "Seed-Neuladen bewahrt die Blickrichtung");

elementFor("#seed-input").value = "ERA-ANDERES-SZENARIO";
elementFor("#apply-seed").emit("click");
assert.notDeepEqual(
  track.children.map((button) => button.getAttribute("aria-label")),
  firstSchedule,
  "anderer Seed erzeugt einen anderen Ereignisplan",
);
assert.match(elementFor("#era-time").textContent, /^Mohn 10 · Dir 0 · Tan 0 · Um 0$/);
assertDirection(preservedDirection, "Seedwechsel bewahrt die Blickrichtung");

durationMode.value = "360000";
durationMode.emit("change");
assert.equal(
  track.children.reduce((sum, button) => sum + Number(button.style.getPropertyValue("--segment-grow")), 0),
  360000,
  "lange Zeitfassung umfasst exakt sechs Minuten",
);
assert.equal(
  Number(track.children.at(-1).style.getPropertyValue("--segment-grow")),
  32000,
  "Konvektion skaliert in der langen Zeitfassung auf 32 Sekunden",
);
assert.equal(slider.getAttribute("max"), "360000");
assert.equal(elementFor("#timeline-total").textContent, "6:00");
assertDirection(preservedDirection, "Zeitfassungswechsel bewahrt die Blickrichtung");

const orbitGeometry = contract.ORBIT_GEOMETRY;
const horizonGeometry = contract.HORIZON_GEOMETRY;
for (const property of ["centerX", "centerY", "eraRadius", "safeGap", "maxVisualBodyRadius"]) {
  assert.ok(Number.isFinite(orbitGeometry[property]), `ORBIT_GEOMETRY.${property} ist endlich`);
}
assert.ok(orbitGeometry.safeGap > 0, "der orbitale Sicherheitsabstand ist positiv");

function assertClearance(snapshot, bodyName, context) {
  const body = snapshot[bodyName];
  assert.ok(Number.isFinite(body.angle), `${context}: Winkel ist endlich`);
  assert.ok(Number.isFinite(body.radialOffset), `${context}: radialOffset ist endlich`);
  if (!body.visible) {
    assert.equal(body.intensity, null, `${context}: unsichtbarer Körper hat keine S-Int 0`);
    return;
  }
  assert.ok(body.intensity >= 1 && body.intensity <= 10, `${context}: S-Int liegt zwischen 1 und 10`);
  const visualRadius = contract.getBodyVisualRadius(body.intensity, bodyName);
  assert.ok(Number.isFinite(visualRadius) && visualRadius > 0, `${context}: visueller Radius ist positiv`);
  assert.ok(visualRadius <= orbitGeometry.maxVisualBodyRadius, `${context}: maximaler Körperradius wird eingehalten`);
  const point = pointOf(contract.getOrbitPoint(snapshot, bodyName));
  assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y), `${context}: Weltpunkt ist endlich`);
  const distance = Math.hypot(point.x - orbitGeometry.centerX, point.y - orbitGeometry.centerY);
  const required = orbitGeometry.eraRadius + visualRadius + orbitGeometry.safeGap;
  assert.ok(distance + 1e-7 >= required, `${context}: Körper und Pixelhalo überdecken Era nicht`);
  const width = orbitGeometry.width ?? orbitGeometry.viewBoxWidth;
  const height = orbitGeometry.height ?? orbitGeometry.viewBoxHeight;
  assert.ok(Number.isFinite(width) && Number.isFinite(height), `${context}: Orbit-ViewBox ist definiert`);
  assert.ok(point.x - visualRadius >= -1e-7, `${context}: linke Körperkante bleibt im SVG`);
  assert.ok(point.x + visualRadius <= width + 1e-7, `${context}: rechte Körperkante bleibt im SVG`);
  assert.ok(point.y - visualRadius >= -1e-7, `${context}: obere Körperkante bleibt im SVG`);
  assert.ok(point.y + visualRadius <= height + 1e-7, `${context}: untere Körperkante bleibt im SVG`);
}

let sampledSnapshots = 0;
for (const presentationMs of [180000, 360000]) {
  durationMode.value = String(presentationMs);
  durationMode.emit("change");
  assert.equal(contract.getState().presentationMs, presentationMs, `${presentationMs} ms sind im State aktiv`);
  for (let index = 0; index < 200; index += 1) {
    const ms = (presentationMs * index) / 199;
    const snapshot = contract.getSnapshot(ms);
    assert.equal(snapshot.ms, ms, `${presentationMs} ms, Stichprobe ${index}: Zeitpunkt bleibt exakt`);
    assertClearance(snapshot, "sol", `${presentationMs} ms, Stichprobe ${index}, Sol`);
    assertClearance(snapshot, "yol", `${presentationMs} ms, Stichprobe ${index}, Yol`);
    sampledSnapshots += 1;
  }
}
assert.equal(sampledSnapshots, 400, "mindestens 200 Snapshots je Zeitfassung geprüft");

const maxVisualRadius = orbitGeometry.maxVisualBodyRadius;
const correctedCenter = pointOf(
  contract.ensureOrbitClearance(
    { x: orbitGeometry.centerX, y: orbitGeometry.centerY },
    maxVisualRadius,
  ),
);
const correctedDistance = Math.hypot(
  correctedCenter.x - orbitGeometry.centerX,
  correctedCenter.y - orbitGeometry.centerY,
);
assert.ok(Number.isFinite(correctedCenter.x) && Number.isFinite(correctedCenter.y), "Clearance behandelt selbst den Mittelpunkt ohne NaN");
assert.ok(
  correctedDistance + 1e-7 >= orbitGeometry.eraRadius + maxVisualRadius + orbitGeometry.safeGap,
  "Clearance korrigiert einen maximal großen Körper defensiv",
);

durationMode.value = "180000";
durationMode.emit("change");
const geometrySnapshot = contract.getSnapshot(54000);
for (const bodyName of ["sol", "yol"]) {
  const referencePoint = contract.getOrbitPoint(geometrySnapshot, bodyName);
  for (const motion of ["orbit", "horizon", "reverse-horizon", "parabola"]) {
    const synthetic = {
      ...geometrySnapshot,
      template: { ...geometrySnapshot.template, motion },
      segment: {
        ...geometrySnapshot.segment,
        template: { ...geometrySnapshot.segment.template, motion },
      },
    };
    assertPointClose(
      contract.getOrbitPoint(synthetic, bodyName),
      referencePoint,
      `${bodyName}: ${motion} verändert die Nordpol-Orbitgeometrie nicht`,
    );
  }

  const maxRadialOffset = Math.max(...ERA_PHASES.templates.map((template) => template[bodyName].radialAmplitude));
  for (let angle = 0; angle < 360; angle += 15) {
    const synthetic = {
      ...geometrySnapshot,
      [bodyName]: {
        ...geometrySnapshot[bodyName],
        angle,
        intensity: 10,
        radialOffset: -maxRadialOffset,
        visible: true,
      },
    };
    assertClearance(synthetic, bodyName, `${bodyName}, S-Int 10, radialOffset ${-maxRadialOffset}, ${angle}°`);
  }
}

assert.equal(contract.normalizeDegrees(-90), 270, "negative Winkel werden normalisiert");
assert.equal(contract.normalizeDegrees(450), 90, "Winkel über 360° werden normalisiert");

function directionMetadata(directionId) {
  if (Array.isArray(contract.HORIZON_DIRECTIONS)) {
    return contract.HORIZON_DIRECTIONS.find((direction) => direction.id === directionId);
  }
  return contract.HORIZON_DIRECTIONS[directionId];
}

function vectorOf(basis, name) {
  return basis[name] || basis[`view${name[0].toUpperCase()}${name.slice(1)}`];
}

function compassInitial(value) {
  return String(value || "").trim().charAt(0).toUpperCase();
}

const compassExpectations = {
  north: ["W", "O"],
  east: ["N", "S"],
  south: ["O", "W"],
  west: ["S", "N"],
};

for (const [directionId, [leftExpected, rightExpected]] of Object.entries(compassExpectations)) {
  const metadata = directionMetadata(directionId);
  assert.ok(metadata, `${directionId}: zentrale Richtungsmetadaten vorhanden`);
  const leftLabel = metadata.leftLabel ?? metadata.left ?? metadata.leftCompass;
  const rightLabel = metadata.rightLabel ?? metadata.right ?? metadata.rightCompass;
  assert.equal(compassInitial(leftLabel), leftExpected, `${directionId}: linke Kompassbeschriftung stimmt`);
  assert.equal(compassInitial(rightLabel), rightExpected, `${directionId}: rechte Kompassbeschriftung stimmt`);

  const basis = contract.getViewBasis(directionId, 0);
  const forward = vectorOf(basis, "forward");
  const right = vectorOf(basis, "right");
  assert.ok(forward && right, `${directionId}: Vorwärts- und Rechtsvektor vorhanden`);
  assert.ok(Math.abs(Math.hypot(forward.x, forward.y) - 1) < 1e-9, `${directionId}: Vorwärtsvektor ist normalisiert`);
  assert.ok(Math.abs(Math.hypot(right.x, right.y) - 1) < 1e-9, `${directionId}: Rechtsvektor ist normalisiert`);
  assert.ok(Math.abs(forward.x * right.x + forward.y * right.y) < 1e-9, `${directionId}: Blickbasis ist orthogonal`);

  const frontPoint = {
    x: orbitGeometry.centerX + forward.x * 120,
    y: orbitGeometry.centerY + forward.y * 120,
  };
  const rearPoint = {
    x: orbitGeometry.centerX - forward.x * 120,
    y: orbitGeometry.centerY - forward.y * 120,
  };
  const cutPoint = {
    x: orbitGeometry.centerX + right.x * 120,
    y: orbitGeometry.centerY + right.y * 120,
  };
  const frontProjection = contract.projectOrbitPointToHorizon(frontPoint, basis, "orbit");
  const rearProjection = contract.projectOrbitPointToHorizon(rearPoint, basis, "orbit");
  const cutProjection = contract.projectOrbitPointToHorizon(cutPoint, basis, "orbit");
  assert.equal(frontProjection.visible, true, `${directionId}: Vorderseite kann sichtbar sein`);
  assert.equal(rearProjection.visible, false, `${directionId}: Rückseite bleibt unsichtbar`);
  assert.equal(cutProjection.visible, true, `${directionId}: Schnittlinie gehört zum Horizont`);
  assert.ok(Math.abs(pointOf(cutProjection).y - horizonGeometry.horizonY) < 1e-7, `${directionId}: Schnittlinie liegt auf Horizonthöhe`);

  const flatProjection = contract.projectOrbitPointToHorizon(frontPoint, basis, "horizon");
  const reverseFlatProjection = contract.projectOrbitPointToHorizon(frontPoint, basis, "reverse-horizon");
  const parabolaProjection = contract.projectOrbitPointToHorizon(frontPoint, basis, "parabola");
  const flatHeight = horizonGeometry.horizonY - pointOf(flatProjection).y;
  const reverseFlatHeight = horizonGeometry.horizonY - pointOf(reverseFlatProjection).y;
  const parabolaHeight = horizonGeometry.horizonY - pointOf(parabolaProjection).y;
  assert.ok(parabolaHeight > flatHeight * 1.5, `${directionId}: Parabellauf ist deutlich höher als Horizontlauf`);
  assert.ok(parabolaHeight > reverseFlatHeight * 1.5, `${directionId}: Parabellauf ist deutlich höher als umgekehrter Horizontlauf`);
  assert.equal(
    contract.projectOrbitPointToHorizon(frontPoint, basis, "convection").visible,
    false,
    `${directionId}: Konvektion besitzt keinen sichtbaren Sonnenlauf`,
  );
}

slider.value = "54000";
slider.emit("input");
const frame = contract.getLastRenderFrame();
assert.ok(frame && frame.snapshot && frame.worldPoints, "Render-Frame enthält genau einen gemeinsamen Snapshot und Weltpunkte");
assert.equal(frame.snapshot.ms, contract.getState().currentMs, "Frame und State verwenden denselben Zeitpunkt");
assert.ok(Number.isFinite(frame.eraRotationDegrees), "Frame enthält Eras Rotationswinkel");
assert.ok(frame.viewBasis, "Frame enthält eine gemeinsame Blickbasis");
assert.ok(frame.horizonProjection, "Frame enthält die aus den Weltpunkten abgeleitete Horizontprojektion");
assert.ok(
  Math.abs(
    frame.eraRotationDegrees -
      contract.getEraRotationDegrees(frame.snapshot.ms, frame.snapshot.template.motion)
  ) < 1e-9,
  "Oberfläche, Blickpfeil, Schnittlinie und Projektion teilen Eras Rotationswinkel",
);
const expectedBasis = contract.getViewBasis(contract.getState().horizonDirection, frame.eraRotationDegrees);
assertPointClose(vectorOf(frame.viewBasis, "forward"), vectorOf(expectedBasis, "forward"), "Frame verwendet die erwartete Vorwärtsbasis");
assertPointClose(vectorOf(frame.viewBasis, "right"), vectorOf(expectedBasis, "right"), "Frame verwendet die erwartete Rechtsbasis");
for (const bodyName of ["sol", "yol"]) {
  assertPointClose(
    frame.worldPoints[bodyName],
    contract.getOrbitPoint(frame.snapshot, bodyName),
    `${bodyName}: Render-Frame nutzt den Weltpunkt des gemeinsamen Snapshots`,
  );
  const expectedProjection = contract.projectOrbitPointToHorizon(
    pointOf(frame.worldPoints[bodyName]),
    frame.viewBasis,
    frame.snapshot.template.motion,
  );
  assert.equal(
    frame.horizonProjection[bodyName].visible,
    frame.snapshot[bodyName].visible && expectedProjection.visible,
    `${bodyName}: Sichtbarkeit stammt aus Snapshot und gemeinsamer Projektion`,
  );
  assertPointClose(
    frame.horizonProjection[bodyName],
    expectedProjection,
    `${bodyName}: Horizont verwendet denselben Weltpunkt`,
  );

  const orbitBody = elementFor(`#${bodyName}-body`);
  const horizonBody = elementFor(`#horizon-${bodyName}-body`);
  assert.equal(
    horizonBody.getAttribute("data-visual-radius"),
    orbitBody.getAttribute("data-visual-radius"),
    `${bodyName}: beide Grafiken verwenden dieselbe Körpergröße`,
  );
  assert.equal(
    horizonBody.getAttribute("data-source-angle"),
    orbitBody.getAttribute("data-source-angle"),
    `${bodyName}: beide Grafiken verwenden denselben Quellwinkel`,
  );
  assert.equal(
    horizonBody.getAttribute("data-world-x"),
    orbitBody.getAttribute("data-world-x"),
    `${bodyName}: beide Grafiken referenzieren dieselbe Welt-X-Koordinate`,
  );
  assert.equal(
    horizonBody.getAttribute("data-world-y"),
    orbitBody.getAttribute("data-world-y"),
    `${bodyName}: beide Grafiken referenzieren dieselbe Welt-Y-Koordinate`,
  );

  const label = elementFor(`#${bodyName}-label`);
  const labelOffset = { x: Number(label.getAttribute("x")), y: Number(label.getAttribute("y")) };
  const worldPoint = pointOf(frame.worldPoints[bodyName]);
  const outward = {
    x: worldPoint.x - orbitGeometry.centerX,
    y: worldPoint.y - orbitGeometry.centerY,
  };
  assert.ok(
    labelOffset.x * outward.x + labelOffset.y * outward.y > 0,
    `${bodyName}: Beschriftung wird von Era weg versetzt`,
  );
  assert.ok(
    Math.hypot(labelOffset.x, labelOffset.y) + 1 >=
      contract.getBodyVisualRadius(frame.snapshot[bodyName].intensity, bodyName) +
        orbitGeometry.labelGap,
    `${bodyName}: Beschriftung berücksichtigt Körperradius und Labelabstand`,
  );
}

assert.equal(
  elementFor("#era-surface").getAttribute("data-era-rotation"),
  elementFor("#horizon-view").getAttribute("data-era-rotation"),
  "Era-Oberfläche und Horizontprojektion verwenden denselben Rotationswert",
);

slider.value = "180000";
slider.emit("input");
const convectionFrame = contract.getLastRenderFrame();
assert.equal(convectionFrame.snapshot.template.id, "convection", "Endzustand ist die Konvektion");
assert.equal(convectionFrame.horizonProjection.sol.visible, false, "Konvektion versteckt Sol im Horizont");
assert.equal(convectionFrame.horizonProjection.yol.visible, false, "Konvektion versteckt Yol im Horizont");
assert.equal(elementFor("#sol-body").getAttribute("aria-hidden"), "true", "Konvektion versteckt Sol im Orbit");
assert.equal(elementFor("#yol-body").getAttribute("aria-hidden"), "true", "Konvektion versteckt Yol im Orbit");
assert.equal(elementFor("#horizon-sol-body").getAttribute("aria-hidden"), "true", "Konvektion versteckt Sol im Panorama");
assert.equal(elementFor("#horizon-yol-body").getAttribute("aria-hidden"), "true", "Konvektion versteckt Yol im Panorama");

console.log(
  JSON.stringify({
    templates: ERA_PHASES.templates.length,
    sigils: sigils.children.length,
    generatedSegments: track.children.length,
    phaseJumps: ERA_PHASES.templates.length,
    directions: directionButtons.length,
    geometrySnapshots: sampledSnapshots,
    finalEraTime: elementFor("#era-time").textContent,
  }),
);
