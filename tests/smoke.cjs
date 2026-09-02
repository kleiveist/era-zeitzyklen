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
let nextAnimationFrame = null;
global.requestAnimationFrame = (callback) => {
  nextAnimationFrame = callback;
  return 1;
};
global.cancelAnimationFrame = () => {
  nextAnimationFrame = null;
};

const directionGroup = registerElement("#horizon-direction-group", new FakeElement("div"));
directionGroup.setAttribute("role", "radiogroup");
const directionButtons = ["north", "east", "south", "west"].map((direction) => {
  const button = registerElement(`#horizon-direction-${direction}`, new FakeElement("button"));
  button.className = "horizon-direction";
  button.setAttribute("data-direction", direction);
  directionGroup.append(button);
  return button;
});
const latitudeGroup = registerElement("#horizon-latitude-group", new FakeElement("div"));
latitudeGroup.setAttribute("role", "radiogroup");
const latitudeButtons = [0, 30, 60].map((latitude) => {
  const button = registerElement(`#horizon-latitude-${latitude}`, new FakeElement("button"));
  button.className = "latitude-button";
  button.setAttribute("data-latitude", String(latitude));
  latitudeGroup.append(button);
  return button;
});

elementFor("#seed-input").value = "ERA-2880";
elementFor("#playback-rate").value = "1";
elementFor("#time-slider").value = "0";

require("../phases.js");
require("../app.js");

const contract = global.ERA_CYCLE_CONTRACT;
assert.ok(contract, "app.js veröffentlicht den read-only ERA_CYCLE_CONTRACT");
assert.ok(Object.isFrozen(contract), "ERA_CYCLE_CONTRACT ist eingefroren");

for (const constantName of ["ORBIT_GEOMETRY", "HORIZON_GEOMETRY", "HORIZON_DIRECTIONS", "HORIZON_LATITUDES", "HORIZON_PROJECTION_SCALE", "IRRADIANCE_MODEL", "ZEHS_PARAMETERS", "CELESTIAL_INSTRUMENT_ORDER", "CELESTIAL_INSTRUMENTS", "MOON_ORBIT_MODEL"]) {
  assert.ok(contract[constantName], `${constantName} ist Teil des Geometrievertrags`);
  assert.ok(Object.isFrozen(contract[constantName]), `${constantName} ist read-only`);
}
for (const functionName of [
  "normalizeDegrees",
  "normalizeHorizonLatitude",
  "getLatitudeLift",
  "getEraRotationDegrees",
  "getOrbitPoint",
  "getBodyVisualRadius",
  "getCelestialDistanceScale",
  "ensureOrbitClearance",
  "solveEccentricAnomaly",
  "getMoonOrbitState",
  "getMoonMapPoint",
  "getViewBasis",
  "projectOrbitPointToHorizon",
  "getMoonObserverBasis",
  "projectMoonToHorizon",
  "getIrradianceDwellAt",
  "getHorizonIrradiance",
  "getCelestialInstrumentValues",
  "selectCelestialBody",
  "getTimelineScrubTargetMs",
  "getSnapshot",
  "formatEraTime",
  "getLastRenderFrame",
  "getState",
]) {
  assert.equal(typeof contract[functionName], "function", `${functionName} ist testbar exportiert`);
}

const track = elementFor("#phase-track");
const sigils = elementFor("#phase-sigils");
const slider = elementFor("#time-slider");

assert.equal(ERA_PHASES.templates.length, 18, "exakt 18 kanonische Phasenvorlagen");
assert.equal(
  new Set(ERA_PHASES.templates.map((template) => template.id)).size,
  18,
  "jede Phasenvorlage besitzt eine eindeutige ID",
);
assert.equal(ERA_PHASES.config.umPerTan, 16, "ein Tan umfasst 16 Um");
assert.equal(ERA_PHASES.config.tanPerDir, 8, "ein Dir umfasst 8 Tan");
assert.equal(ERA_PHASES.config.dirPerMohn, 36, "ein Mohn umfasst 36 Dir");
assert.equal(ERA_PHASES.config.mohnPerCycle, 10, "ein Konvektionszyklus umfasst 10 Mohn");
assert.equal(ERA_PHASES.config.earthMinutesPerUm, 90, "ein Um entspricht 90 irdischen Vergleichsminuten");
assert.equal(ERA_PHASES.config.idealLightMinutesPerUm, 45, "die idealisierte Hellphase umfasst 45 Minuten");
assert.equal(ERA_PHASES.config.idealDarkMinutesPerUm, 45, "die idealisierte Dunkelphase umfasst 45 Minuten");
assert.equal(ERA_PHASES.config.totalUm, 46080, "Konvektionszyklus umfasst 46.080 Um");
assert.equal(ERA_PHASES.config.regularUm, 45680, "reguläre Phasen umfassen 45.680 Um");
assert.equal(ERA_PHASES.config.convectionDurationUm, 400, "Konvektion umfasst 400 Um");
assert.equal(ERA_PHASES.config.eraRotationDegreesPerSecond, 5.6, "Eras Eigenrotation wurde auf 5,6 Grad pro Sekunde verdoppelt");
assert.equal(ERA_PHASES.config.schemaVersion, 4, "Szenarioschema enthält Zeitmodus- und Kontinuitätsvertrag");
assert.equal(46080 / 4608, 10, "Konvektionszyklus entspricht 10 Mohn");
assert.equal(46080 / 128, 360, "Konvektionszyklus entspricht 360 Dir");
assert.equal(46080 / 16, 2880, "Konvektionszyklus entspricht 2.880 Tan");
assert.equal(contract.formatEraTime(16), "Mohn 0 · Dir 0 · Tan 1 · Um 0");
assert.equal(contract.formatEraTime(128), "Mohn 0 · Dir 1 · Tan 0 · Um 0");
assert.equal(contract.formatEraTime(4608), "Mohn 1 · Dir 0 · Tan 0 · Um 0");
assert.equal(contract.formatEraTime(46080), "Mohn 10 · Dir 0 · Tan 0 · Um 0");
assert.equal(contract.IRRADIANCE_MODEL.activationDelayUm, 2, "Einstrahlung beginnt exakt nach zwei sichtbaren Um");
assert.equal(contract.IRRADIANCE_MODEL.sampleMs, 200, "Einstrahlung wird fein genug für einen glatten Verlauf abgetastet");
assert.equal(contract.IRRADIANCE_MODEL.sampleUm, 0.05, "lineare Modi tasten die sichtbare Weltzeit unabhängig vom Echtzeitprofil ab");
assert.ok(contract.IRRADIANCE_MODEL.buildupUm > contract.IRRADIANCE_MODEL.activationDelayUm, "Einstrahlung steigert sich über mehrere weitere Um");
assert.ok(contract.IRRADIANCE_MODEL.heightFloor > 0, "ein niedriger Sonnenstand besitzt eine schwache, aber sichtbare Maximalstufe");
assert.equal(contract.HORIZON_PROJECTION_SCALE.celestial, 0.76, "alle Sol-/Yol-Phasen verwenden dieselbe Horizonthöhe");

const stableIrradianceSnapshot = {
  template: { motion: "orbit", category: "synchron" },
  segment: { displayStart: 0, umStart: 0 },
  ms: 30000,
  positionMs: 30000,
  cycleUm: 12,
  sol: { visible: true, intensity: 8, angularVelocity: 5.6 },
  yol: { visible: true, intensity: 8, angularVelocity: 5.6 },
};
const matureIrradianceHistory = {
  solDwellMs: 60000,
  yolDwellMs: 60000,
  solDwellUm: 12,
  yolDwellUm: 12,
};
const bothVisibleProjection = {
  sol: { visible: true, height: contract.HORIZON_GEOMETRY.maxSkyHeight },
  yol: { visible: true, height: contract.HORIZON_GEOMETRY.maxSkyHeight },
};
const polarIrradiance = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  bothVisibleProjection,
  0,
  matureIrradianceHistory,
);
const temperateIrradiance = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  bothVisibleProjection,
  30,
  matureIrradianceHistory,
);
const desertIrradiance = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  bothVisibleProjection,
  60,
  matureIrradianceHistory,
);
assert.equal(polarIrradiance.mode, "dual", "die Zwei-Um-Regel gilt auch am Pol, wenn beide Körper sichtbar sind");
assert.equal(temperateIrradiance.mode, "dual", "gemeinsame Sichtbarkeit mischt Sol und Yol");
assert.ok(temperateIrradiance.warm > 0 && temperateIrradiance.cool > 0, "Dualeinstrahlung enthält warme und kalte Farbe");
assert.ok(temperateIrradiance.shimmer > 0, "Dualeinstrahlung erzeugt Schimmer");
assert.equal(polarIrradiance.sol, temperateIrradiance.sol, "Breitengrad ersetzt nicht die tatsächliche Himmelshöhe");
assert.equal(desertIrradiance.yol, temperateIrradiance.yol, "gleiche Projekthöhe ergibt in jedem Biom dasselbe Maximum");

const beforeDelayIrradiance = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  bothVisibleProjection,
  60,
  { solDwellUm: 1.999, yolDwellUm: 1.999 },
);
const staleEnvelopeBeforeDelay = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  bothVisibleProjection,
  60,
  {
    solDwellUm: 1.999,
    yolDwellUm: 1.999,
    solEnvelope: 1,
    yolEnvelope: 1,
  },
);
const exactActivationIrradiance = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  bothVisibleProjection,
  60,
  { solDwellUm: 2, yolDwellUm: 2 },
);
const buildingIrradiance = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  bothVisibleProjection,
  60,
  { solDwellUm: 4, yolDwellUm: 4 },
);
assert.equal(beforeDelayIrradiance.mode, "none", "vor zwei vollständigen sichtbaren Um bleibt der Effekt exakt aus");
assert.equal(staleEnvelopeBeforeDelay.mode, "none", "ein alter Cachewert kann die exakte Zwei-Um-Schwelle nicht umgehen");
assert.equal(exactActivationIrradiance.mode, "dual", "bei exakt zwei sichtbaren Um erscheint die erste Effektstufe");
assert.ok(exactActivationIrradiance.sol > 0 && exactActivationIrradiance.yol > 0, "die Aktivierungsschwelle besitzt eine sichtbare Anfangsstärke");
assert.ok(buildingIrradiance.shimmer > exactActivationIrradiance.shimmer, "Schimmer wächst nach der Zwei-Um-Schwelle weiter");
assert.ok(desertIrradiance.shimmer > buildingIrradiance.shimmer, "lange gemeinsame Sichtbarkeit erzeugt eine stärkere Stufe");

const lowAltitudeIrradiance = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  {
    sol: { visible: true, height: contract.HORIZON_GEOMETRY.maxSkyHeight * 0.2 },
    yol: { visible: true, height: contract.HORIZON_GEOMETRY.maxSkyHeight * 0.2 },
  },
  60,
  matureIrradianceHistory,
);
assert.ok(desertIrradiance.sol > lowAltitudeIrradiance.sol, "ein hoher Sol-Stand erlaubt ein stärkeres Maximum als Horizontnähe");
assert.ok(desertIrradiance.yol > lowAltitudeIrradiance.yol, "ein hoher Yol-Stand erlaubt ein stärkeres Maximum als Horizontnähe");

const lowIntensityIrradiance = contract.getHorizonIrradiance(
  {
    ...stableIrradianceSnapshot,
    sol: { ...stableIrradianceSnapshot.sol, intensity: 2 },
    yol: { ...stableIrradianceSnapshot.yol, intensity: 2 },
  },
  bothVisibleProjection,
  60,
  matureIrradianceHistory,
);
assert.ok(desertIrradiance.sol > lowIntensityIrradiance.sol, "Sols S-Int begrenzt die erreichbare Effektstärke");
assert.ok(desertIrradiance.yol > lowIntensityIrradiance.yol, "Yols S-Int begrenzt die erreichbare Effektstärke");

const crossPhaseIrradianceBefore = contract.getHorizonIrradiance(
  {
    ...stableIrradianceSnapshot,
    segment: { index: 7, displayStart: 10000, umStart: 100 },
    ms: 19999,
    positionMs: 19999,
  },
  bothVisibleProjection,
  60,
  { solDwellMs: 10000, yolDwellMs: 10000, solDwellUm: 4, yolDwellUm: 4 },
);
const crossPhaseIrradianceAfter = contract.getHorizonIrradiance(
  {
    ...stableIrradianceSnapshot,
    segment: { index: 8, displayStart: 20000, umStart: 120 },
    ms: 20001,
    positionMs: 20001,
  },
  bothVisibleProjection,
  60,
  { solDwellMs: 10200, yolDwellMs: 10200, solDwellUm: 4.2, yolDwellUm: 4.2 },
);
assert.ok(
  crossPhaseIrradianceAfter.solDwellUm > crossPhaseIrradianceBefore.solDwellUm,
  "ein reiner Phasenwechsel setzt Sols sichtbare Um-Dauer nicht zurück",
);
assert.ok(
  crossPhaseIrradianceAfter.yolDwellUm > crossPhaseIrradianceBefore.yolDwellUm,
  "ein reiner Phasenwechsel setzt Yols sichtbare Um-Dauer nicht zurück",
);
assert.ok(
  crossPhaseIrradianceAfter.shimmer >= crossPhaseIrradianceBefore.shimmer,
  "der Schimmer addiert sich über eine unveränderte Phasengrenze weiter",
);

const settingIrradianceBefore = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  { sol: { visible: true, height: contract.HORIZON_GEOMETRY.maxSkyHeight }, yol: { visible: false, height: 0 } },
  60,
  { solDwellUm: 12, yolDwellUm: 0 },
);
const settingIrradianceAfter = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  { sol: { visible: false, height: 0 }, yol: { visible: false, height: 0 } },
  60,
  { solDwellUm: 0, yolDwellUm: 0 },
);
assert.ok(settingIrradianceBefore.sol > 0, "Sols Effekt ist nach langer Sichtbarkeit aktiv");
assert.equal(settingIrradianceAfter.sol, 0, "der Modellwert endet beim Untergang; CSS blendet die Ebenen weich aus");

const solOnlyIrradiance = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  { sol: { visible: true, height: contract.HORIZON_GEOMETRY.maxSkyHeight }, yol: { visible: false, height: 0 } },
  60,
  matureIrradianceHistory,
);
const yolOnlyIrradiance = contract.getHorizonIrradiance(
  stableIrradianceSnapshot,
  { sol: { visible: false, height: 0 }, yol: { visible: true, height: contract.HORIZON_GEOMETRY.maxSkyHeight } },
  60,
  matureIrradianceHistory,
);
assert.equal(solOnlyIrradiance.mode, "sol", "Sol allein erzeugt den warmen Modus");
assert.ok(solOnlyIrradiance.warm > 0 && solOnlyIrradiance.cool === 0, "Sol allein hellt ausschließlich warm auf");
assert.ok(solOnlyIrradiance.shimmer > 0, "auch Sol erhält einen zunehmenden Lichtschimmer");
assert.equal(yolOnlyIrradiance.mode, "yol", "Yol allein erzeugt den kühlen Modus");
assert.ok(yolOnlyIrradiance.cool > 0 && yolOnlyIrradiance.warm === 0, "Yol allein färbt ausschließlich kühl");
assert.ok(yolOnlyIrradiance.shimmer > solOnlyIrradiance.shimmer, "Yols magischer Soloschimmer ist ausgeprägter");
assert.ok(desertIrradiance.shimmer > yolOnlyIrradiance.shimmer, "gemeinsame Sichtbarkeit schimmert stärker als Yol allein");
assert.ok(yolOnlyIrradiance.yolMana > 0 && yolOnlyIrradiance.yolParticles > 0, "Yol aktiviert Mana-Schleier und blaue Partikel");
assert.ok(yolOnlyIrradiance.yolFrost > 0 && yolOnlyIrradiance.yolSnow > 0, "Yols hohe Stufen aktivieren Frost und Schnee");
assert.ok(yolOnlyIrradiance.yolIcicles > 0, "Yols stärkste Stufe aktiviert Eiszapfen");
assert.ok(solOnlyIrradiance.solHeat > 0 && solOnlyIrradiance.solSparks > 0, "Sol aktiviert Hitzeflimmern und rote Funken");
assert.ok(solOnlyIrradiance.solBlaze > 0, "Sols stärkste Stufe aktiviert die glühende Hitzelage");
assert.equal(contract.ZEHS_PARAMETERS.name, "ZEHS", "Referenzstern besitzt seinen kanonischen Namen");
assert.equal(contract.ZEHS_PARAMETERS.type, "Referenzstern", "ZEHS ist als Referenzstern klassifiziert");
assert.equal(contract.ZEHS_PARAMETERS.distanceAu, 40, "ZEHS liegt ungefähr 40 AU entfernt");
assert.equal(contract.ZEHS_PARAMETERS.distanceQualifier, "ungefähr", "die Entfernung bleibt als Näherungswert gekennzeichnet");
assert.equal(contract.ZEHS_PARAMETERS.brightness, "sehr hell", "kanonische Helligkeitsangabe bleibt erhalten");
assert.equal(contract.ZEHS_PARAMETERS.motion, "annähernd fest", "kanonische Bewegungsangabe bleibt erhalten");
assert.match(contract.ZEHS_PARAMETERS.rotationReference, /vollständige Rotation Eras/);
assert.equal(contract.ZEHS_PARAMETERS.nameRelation, "Zehsen", "Namensbezug ist dokumentiert");
assert.equal(contract.ZEHS_PARAMETERS.orbitingBody, false, "ZEHS ist kein lokaler Umlaufkörper");
assert.equal(contract.ZEHS_PARAMETERS.sIntensity, null, "für ZEHS wird keine S-Int erfunden");
assert.ok(Object.isFrozen(contract.ZEHS_PARAMETERS.worldPoint), "ZEHS-Weltpunkt ist unveränderlich");
assert.deepEqual(
  contract.CELESTIAL_INSTRUMENT_ORDER,
  ["zehs", "sol", "yol", "era", "kor", "korsShard"],
  "Messpunkt bietet alle dargestellten Himmelskörper in stabiler Reihenfolge an",
);
for (const bodyId of contract.CELESTIAL_INSTRUMENT_ORDER) {
  const instrument = contract.CELESTIAL_INSTRUMENTS[bodyId];
  assert.ok(instrument, `${bodyId}: besitzt Messpunkt-Stammdaten`);
  assert.ok(Object.isFrozen(instrument), `${bodyId}: Stammdaten sind read-only`);
  assert.match(instrument.image, /^assets\/images\/.+-hd\.png$/, `${bodyId}: verwendet ein HD-Vorschaubild`);
}
assert.ok(track.children.length >= ERA_PHASES.templates.length, "alle Vorlagen plus Wiederholungen");
assert.equal(sigils.children.length, 18, "jede Vorlage besitzt ein anwählbares Siegel");
assert.ok(ERA_PHASES.templates.every((template) => /^icon-/.test(template.icon)), "jede Vorlage besitzt eine Icon-ID");

const firstSchedule = track.children.map((button) => button.getAttribute("aria-label"));
assert.equal(
  track.children.reduce((sum, button) => sum + Number(button.style.getPropertyValue("--segment-grow")), 0),
  360000,
  "Zeitlinie umfasst exakt sechs Minuten",
);
assert.equal(
  Number(track.children.at(-1).style.getPropertyValue("--segment-grow")),
  32000,
  "Konvektion erhält die didaktisch vergrößerten 32 Sekunden",
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
  if (template.category === "synchron") {
    const synchronizedSnapshot = contract.getLastRenderFrame().snapshot;
    for (const bodyName of ["sol", "yol"]) {
      assert.deepEqual(
        template[bodyName].speed,
        [ERA_PHASES.config.eraRotationDegreesPerSecond, ERA_PHASES.config.eraRotationDegreesPerSecond],
        `${template.id}/${bodyName}: Geschwindigkeitsvertrag entspricht Era`,
      );
      assert.equal(
        synchronizedSnapshot[bodyName].angularVelocity,
        ERA_PHASES.config.eraRotationDegreesPerSecond,
        `${template.id}/${bodyName}: momentane Winkelgeschwindigkeit bleibt an Era gekoppelt`,
      );
      assert.equal(
        synchronizedSnapshot[bodyName].speed,
        ERA_PHASES.config.eraRotationDegreesPerSecond,
        `${template.id}/${bodyName}: angezeigte Geschwindigkeit entspricht Era`,
      );
    }
  }
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

function assertLatitude(expected, message) {
  const active = latitudeButtons.filter(pressed);
  assert.equal(active.length, 1, `${message}: genau eine aktive Breitenstufe`);
  assert.equal(Number(active[0].dataset.latitude), expected, `${message}: sichtbarer Zustand`);
  assert.equal(contract.getState().horizonLatitude, expected, `${message}: Anwendungszustand`);
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
assert.equal(latitudeButtons.length, 3, "exakt drei Breitenstufen");
assertDirection("north", "Standardrichtung Norden");
assertLatitude(0, "Standardbreite ist der bisherige Polstand");
assert.equal(contract.getState().autoCycle, false, "automatisches Neuwürfeln ist standardmäßig aus");
assert.equal(contract.getState().eraRotationOffsetDegrees, 0, "der erste Zyklus beginnt mit Eras vereinbartem Nullwinkel");
assert.equal(elementFor("#auto-cycle").getAttribute("aria-pressed"), "false", "Doppelkreis-Schalter meldet den inaktiven Zustand");
assert.equal(elementFor("#horizon-view").getAttribute("data-irradiance-mode"), "none", "vor der Zwei-Um-Schwelle bleibt die Einstrahlung aus");
assert.equal(elementFor("#horizon-view").style.getPropertyValue("--irradiance-warm"), "0.000", "vor der Schwelle besitzt Sol keine warme Tönung");
assert.equal(elementFor("#horizon-view").style.getPropertyValue("--irradiance-cool"), "0.000", "vor der Schwelle besitzt Yol keine kühle Tönung");
assert.equal(elementFor("#horizon-view").style.getPropertyValue("--irradiance-sol-sparks"), "0.000", "Sol-Funken starten deaktiviert");
assert.equal(elementFor("#horizon-view").style.getPropertyValue("--irradiance-yol-snow"), "0.000", "Yol-Schnee startet deaktiviert");
assert.equal(elementFor("#horizon-view").style.getPropertyValue("--irradiance-yol-icicles"), "0.000", "Yol-Eiszapfen starten deaktiviert");

slider.value = "54000";
slider.emit("input");
const directionFrameBefore = contract.getLastRenderFrame();
const directionStateBefore = contract.getState();
directionButtons[1].emit("click");
assertDirection("east", "Klick auf Osten");
assert.equal(storage.get("era-horizon-direction"), "east", "Osten wird gespeichert");
assert.equal(elementFor("#horizon-view").getAttribute("data-panorama"), "polar-east", "Osten aktiviert das polare Ostpanorama");
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
for (const bodyName of ["kor", "korsShard"]) {
  assert.deepEqual(
    directionFrameAfter.worldPoints[bodyName],
    directionFrameBefore.worldPoints[bodyName],
    `${bodyName}: Richtungswahl verändert die 3D-Weltposition nicht`,
  );
}
assertPointClose(
  directionFrameAfter.worldPoints.zehs,
  directionFrameBefore.worldPoints.zehs,
  "ZEHS: Richtungswahl verändert den festen Weltpunkt nicht",
);
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

const latitudeFrameBefore = contract.getLastRenderFrame();
const latitudeStateBefore = contract.getState();
latitudeButtons[1].emit("click");
assertLatitude(30, "Klick aktiviert die mittlere Breitenstufe");
assert.equal(storage.get("era-horizon-latitude"), "30", "30 Grad werden gespeichert");
const latitudeFrame30 = contract.getLastRenderFrame();
assert.equal(latitudeFrame30.snapshot, latitudeFrameBefore.snapshot, "Breitenwahl erzeugt keinen neuen Simulationssnapshot");
assert.equal(contract.getState().currentMs, latitudeStateBefore.currentMs, "Breitenwahl verändert die Zeit nicht");
assert.equal(contract.getState().seed, latitudeStateBefore.seed, "Breitenwahl verändert den Seed nicht");
assert.equal(latitudeFrame30.eraRotationDegrees, latitudeFrameBefore.eraRotationDegrees, "Breitenwahl verändert Eras Rotation nicht");
for (const bodyName of ["sol", "yol"]) {
  assertPointClose(
    latitudeFrame30.worldPoints[bodyName],
    latitudeFrameBefore.worldPoints[bodyName],
    `${bodyName}: Breitenwahl verändert den Weltpunkt nicht`,
  );
  assert.equal(latitudeFrame30.horizonProjection[bodyName].latitudeDegrees, 30, `${bodyName}: 30 Grad fließen in die Projektion ein`);
}
for (const bodyName of ["kor", "korsShard"]) {
  assert.deepEqual(
    latitudeFrame30.worldPoints[bodyName],
    latitudeFrameBefore.worldPoints[bodyName],
    `${bodyName}: Breitenwahl verändert die 3D-Weltposition nicht`,
  );
  assert.equal(
    latitudeFrame30.horizonProjection[bodyName].latitudeDegrees,
    30,
    `${bodyName}: 30 Grad fließen nur in die Mondprojektion ein`,
  );
}
assertPointClose(
  latitudeFrame30.worldPoints.zehs,
  latitudeFrameBefore.worldPoints.zehs,
  "ZEHS: Breitenwahl verändert den festen Weltpunkt nicht",
);
assert.equal(latitudeFrame30.horizonProjection.zehs.latitudeDegrees, 30, "ZEHS wird aus derselben Breitenstufe projiziert");
const ringRadius30 = Number(elementFor("#era-latitude-ring").getAttribute("r"));
assert.ok(ringRadius30 > 8, "der ERA-Breitenring wächst bei 30 Grad aus dem Polpunkt heraus");
assert.equal(elementFor("#era-latitude-indicator").getAttribute("data-latitude-degrees"), "30");
assert.equal(elementFor("#horizon-view").getAttribute("data-latitude-degrees"), "30");
assert.equal(elementFor("#horizon-view").getAttribute("data-biome"), "temperate", "30 Grad aktivieren die Tannenlandschaft");
assert.equal(elementFor("#horizon-view").getAttribute("data-panorama"), "temperate-west", "30 Grad und Westen wählen das gemäßigte Westpanorama");
assert.equal(elementFor("#orbit-view").getAttribute("data-horizon-biome"), "temperate", "Orbitkarte protokolliert das gewählte Tannenbiom");
assert.equal(elementFor("#horizon-title").textContent, "Horizontverlauf · Westen · 30° Gemäßigtes");

latitudeButtons[2].emit("click");
assertLatitude(60, "Klick aktiviert die äquatornahe Grenzstufe");
assert.equal(storage.get("era-horizon-latitude"), "60", "60 Grad werden gespeichert");
assert.equal(elementFor("#horizon-view").getAttribute("data-biome"), "desert", "60 Grad aktivieren die Wüstenlandschaft");
assert.equal(elementFor("#horizon-view").getAttribute("data-panorama"), "desert-west", "60 Grad und Westen wählen das Wüsten-Westpanorama");
assert.equal(elementFor("#horizon-title").textContent, "Horizontverlauf · Westen · 60° Wüste");
const ringRadius60 = Number(elementFor("#era-latitude-ring").getAttribute("r"));
assert.ok(ringRadius60 > ringRadius30, "der ERA-Breitenring wächst logisch bis 60 Grad");

latitudeButtons[2].focus();
keyEvent = latitudeButtons[2].emit("keydown", { key: "ArrowRight" });
assert.ok(keyEvent.defaultPrevented, "Breitenwahl verhindert Pfeil-rechts-Standardverhalten");
assertLatitude(0, "Breitenwahl läuft nach der Grenzstufe zum Polstand zurück");
assert.equal(document.activeElement, latitudeButtons[0], "Fokus folgt zum Polstand");
keyEvent = latitudeButtons[0].emit("keydown", { key: "ArrowLeft" });
assert.ok(keyEvent.defaultPrevented, "Breitenwahl verhindert Pfeil-links-Standardverhalten");
assertLatitude(60, "Breitenwahl läuft rückwärts zur Grenzstufe");
keyEvent = latitudeButtons[2].emit("keydown", { key: "Home" });
assert.ok(keyEvent.defaultPrevented, "Home wird in der Breitenwahl verarbeitet");
assertLatitude(0, "Home springt zum Polstand");
keyEvent = latitudeButtons[0].emit("keydown", { key: "End" });
assert.ok(keyEvent.defaultPrevented, "Ende wird in der Breitenwahl verarbeitet");
assertLatitude(60, "Ende springt zur Grenzstufe");
latitudeButtons[0].emit("click");
assertLatitude(0, "Test setzt die bisherige Polansicht wieder her");
assert.equal(elementFor("#horizon-view").getAttribute("data-biome"), "polar", "0 Grad stellen die polare Eiswelt wieder her");
assert.equal(elementFor("#horizon-title").textContent, "Horizontverlauf · Westen · 0° Polare Eiswelt");

const preservedDirection = "west";
slider.value = "68000";
slider.emit("input");
assertDirection(preservedDirection, "Zeitsprung bewahrt die Blickrichtung");
elementFor("#phase-select").value = "async-parabola";
elementFor("#phase-select").emit("change");
assertDirection(preservedDirection, "Phasensprung bewahrt die Blickrichtung");
assert.equal(elementFor("#active-phase-name").textContent, "Asynchroner Parabellauf", "Phasensprung wurde ausgeführt");

latitudeButtons[2].emit("click");
const irradianceBeforeThemeChange = {
  frame: contract.getLastRenderFrame().horizonIrradiance,
  mode: elementFor("#horizon-view").getAttribute("data-irradiance-mode"),
  warm: elementFor("#horizon-view").style.getPropertyValue("--irradiance-warm"),
  cool: elementFor("#horizon-view").style.getPropertyValue("--irradiance-cool"),
  shimmer: elementFor("#horizon-view").style.getPropertyValue("--irradiance-shimmer"),
  heat: elementFor("#horizon-view").style.getPropertyValue("--irradiance-sol-heat"),
  sparks: elementFor("#horizon-view").style.getPropertyValue("--irradiance-sol-sparks"),
  mana: elementFor("#horizon-view").style.getPropertyValue("--irradiance-yol-mana"),
  snow: elementFor("#horizon-view").style.getPropertyValue("--irradiance-yol-snow"),
  icicles: elementFor("#horizon-view").style.getPropertyValue("--irradiance-yol-icicles"),
};
elementFor("#theme-toggle").emit("click");
assert.equal(documentElement.dataset.theme, "light", "Theme-Schalter aktiviert helles Pergament");
assert.equal(elementFor("#theme-label").textContent, "Helles Pergament");
assert.equal(storage.get("era-theme"), "light", "Theme-Präferenz wird gespeichert");
assert.deepEqual(
  {
    frame: contract.getLastRenderFrame().horizonIrradiance,
    mode: elementFor("#horizon-view").getAttribute("data-irradiance-mode"),
    warm: elementFor("#horizon-view").style.getPropertyValue("--irradiance-warm"),
    cool: elementFor("#horizon-view").style.getPropertyValue("--irradiance-cool"),
    shimmer: elementFor("#horizon-view").style.getPropertyValue("--irradiance-shimmer"),
    heat: elementFor("#horizon-view").style.getPropertyValue("--irradiance-sol-heat"),
    sparks: elementFor("#horizon-view").style.getPropertyValue("--irradiance-sol-sparks"),
    mana: elementFor("#horizon-view").style.getPropertyValue("--irradiance-yol-mana"),
    snow: elementFor("#horizon-view").style.getPropertyValue("--irradiance-yol-snow"),
    icicles: elementFor("#horizon-view").style.getPropertyValue("--irradiance-yol-icicles"),
  },
  irradianceBeforeThemeChange,
  "Tagmodus bewahrt die berechnete Einstrahlung unverändert",
);
elementFor("#theme-toggle").emit("click");
assert.equal(documentElement.dataset.theme, "dark", "Theme-Schalter kehrt zur dunklen Chronik zurück");
latitudeButtons[0].emit("click");

slider.value = "360000";
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
assert.match(elementFor("#era-time").textContent, /^Mohn 0 · Dir 0 · Tan 0 · Um 0$/);
assertDirection(preservedDirection, "Seedwechsel bewahrt die Blickrichtung");

assert.equal(
  track.children.reduce((sum, button) => sum + Number(button.style.getPropertyValue("--segment-grow")), 0),
  360000,
  "Zeitfassung umfasst exakt sechs Minuten",
);
assert.equal(
  Number(track.children.at(-1).style.getPropertyValue("--segment-grow")),
  32000,
  "Konvektion skaliert in der langen Zeitfassung auf 32 Sekunden",
);
assert.equal(slider.getAttribute("max"), "360000");
assert.equal(elementFor("#timeline-total").textContent, "6:00");
assert.equal(contract.getState().presentationMs, 360000, "der sechsminütige Erklärmodus ist standardmäßig aktiv");

function angularDistanceDegrees(left, right) {
  return Math.abs(((Number(left) - Number(right) + 540) % 360) - 180);
}

const continuityScenario = contract.getState().scenario;
let checkedPhaseBoundaries = 0;
let checkedProjectedBoundaries = 0;
for (let segmentIndex = 1; segmentIndex < continuityScenario.segments.length; segmentIndex += 1) {
  const nextSegment = continuityScenario.segments[segmentIndex];
  const boundaryMs = nextSegment.displayStart;
  const beforeBoundary = contract.getSnapshot(boundaryMs - 0.001, { exact: true });
  const afterBoundary = contract.getSnapshot(boundaryMs, { exact: true });

  for (const bodyName of ["sol", "yol"]) {
    assert.ok(
      angularDistanceDegrees(beforeBoundary[bodyName].angle, afterBoundary[bodyName].angle) < 0.001,
      `${segmentIndex}/${bodyName}: Winkel bleibt an der Phasengrenze stetig`,
    );
    assert.ok(
      Math.abs(beforeBoundary[bodyName].radialOffset - afterBoundary[bodyName].radialOffset) < 0.001,
      `${segmentIndex}/${bodyName}: Radialposition bleibt an der Phasengrenze stetig`,
    );
    if (beforeBoundary[bodyName].intensity !== null && afterBoundary[bodyName].intensity !== null) {
      assert.ok(
        Math.abs(beforeBoundary[bodyName].intensity - afterBoundary[bodyName].intensity) < 0.001,
        `${segmentIndex}/${bodyName}: Intensität springt nicht an der Phasengrenze`,
      );
    }

    if (beforeBoundary[bodyName].visible && afterBoundary[bodyName].visible) {
      const beforePoint = contract.getOrbitPoint(beforeBoundary, bodyName);
      const afterPoint = contract.getOrbitPoint(afterBoundary, bodyName);
      assertPointClose(
        beforePoint,
        afterPoint,
        `${segmentIndex}/${bodyName}: Weltpunkt springt nicht an der Phasengrenze`,
        0.02,
      );
      for (const direction of ["north", "east", "south", "west"]) {
        for (const latitude of [0, 30, 60]) {
          const beforeBasis = contract.getViewBasis(
            direction,
            contract.getEraRotationDegrees(boundaryMs - 0.001, beforeBoundary.template.motion),
          );
          const afterBasis = contract.getViewBasis(
            direction,
            contract.getEraRotationDegrees(boundaryMs, afterBoundary.template.motion),
          );
          const beforeProjection = contract.projectOrbitPointToHorizon(
            beforePoint,
            beforeBasis,
            "celestial",
            latitude,
          );
          const afterProjection = contract.projectOrbitPointToHorizon(
            afterPoint,
            afterBasis,
            "celestial",
            latitude,
          );
          assertPointClose(
            beforeProjection,
            afterProjection,
            `${segmentIndex}/${bodyName}/${direction}/${latitude}: Horizontpunkt bleibt stetig`,
            0.02,
          );
          checkedProjectedBoundaries += 1;
        }
      }
    }
  }
  for (const direction of ["north", "east", "south", "west"]) {
    for (const latitude of [0, 30, 60]) {
      const beforeZehs = contract.projectOrbitPointToHorizon(
        contract.ZEHS_PARAMETERS.worldPoint,
        contract.getViewBasis(
          direction,
          contract.getEraRotationDegrees(boundaryMs - 0.001, beforeBoundary.template.motion),
        ),
        "zehs",
        latitude,
      );
      const afterZehs = contract.projectOrbitPointToHorizon(
        contract.ZEHS_PARAMETERS.worldPoint,
        contract.getViewBasis(
          direction,
          contract.getEraRotationDegrees(boundaryMs, afterBoundary.template.motion),
        ),
        "zehs",
        latitude,
      );
      assertPointClose(
        beforeZehs,
        afterZehs,
        `${segmentIndex}/ZEHS/${direction}/${latitude}: Referenzstern springt nicht`,
        0.02,
      );
    }
  }
  checkedPhaseBoundaries += 1;
}
assert.equal(
  checkedPhaseBoundaries,
  continuityScenario.segments.length - 1,
  "jede erzeugte Phasengrenze besitzt einen Positionsvertrag",
);
assert.ok(checkedProjectedBoundaries > 0, "sichtbare Grenzpunkte wurden in allen Richtungen und Breiten geprüft");

function projectedBodySample(ms, direction, latitude, bodyName) {
  const snapshot = contract.getSnapshot(ms, { exact: true });
  const point = contract.getOrbitPoint(snapshot, bodyName);
  const basis = contract.getViewBasis(
    direction,
    contract.getEraRotationDegrees(ms, snapshot.template.motion),
  );
  const projection = contract.projectOrbitPointToHorizon(
    point,
    basis,
    snapshot.template.motion === "convection" ? "convection" : "celestial",
    latitude,
  );
  return {
    projection,
    visible: snapshot[bodyName].visible && projection.visible && snapshot.template.motion !== "convection",
  };
}

let carriedIrradianceBoundaries = 0;
for (const direction of ["north", "east", "south", "west"]) {
  for (const latitude of [30, 60]) {
    for (let segmentIndex = 1; segmentIndex < continuityScenario.segments.length; segmentIndex += 1) {
      const boundaryMs = continuityScenario.segments[segmentIndex].displayStart;
      const sampleMs = contract.IRRADIANCE_MODEL.sampleMs;
      const beforeSampleMs = Math.floor((boundaryMs - 0.001) / sampleMs) * sampleMs;
      const afterSampleMs = beforeSampleMs + sampleMs;
      const historyBefore = contract.getIrradianceDwellAt(
        beforeSampleMs,
        direction,
        latitude,
      );
      const historyAfter = contract.getIrradianceDwellAt(
        afterSampleMs,
        direction,
        latitude,
      );
      for (const bodyName of ["sol", "yol"]) {
        const before = projectedBodySample(
          beforeSampleMs,
          direction,
          latitude,
          bodyName,
        );
        const after = projectedBodySample(
          afterSampleMs,
          direction,
          latitude,
          bodyName,
        );
        const dwellProperty = `${bodyName}DwellUm`;
        const envelopeProperty = `${bodyName}Envelope`;
        if (
          before.visible &&
          after.visible &&
          historyBefore[envelopeProperty] > 0
        ) {
          assert.ok(
            historyAfter[dwellProperty] >= historyBefore[dwellProperty],
            `${segmentIndex}/${bodyName}/${direction}/${latitude}: sichtbare Um addieren sich über die Phasengrenze`,
          );
          assert.ok(
            historyAfter[envelopeProperty] >= historyBefore[envelopeProperty],
            `${segmentIndex}/${bodyName}/${direction}/${latitude}: Effekt wächst über die sichtbare Phasengrenze ohne Rücksetzen weiter`,
          );
          carriedIrradianceBoundaries += 1;
        }
      }
    }
  }
}
assert.ok(
  carriedIrradianceBoundaries > 0,
  "reale Phasengrenzen mit unveränderter Sichtposition führen Einstrahlung weiter",
);

let cleanIrradianceSettings = 0;
for (const direction of ["north", "east", "south", "west"]) {
  for (const latitude of [30, 60]) {
    for (
      let afterSampleMs = contract.IRRADIANCE_MODEL.sampleMs;
      afterSampleMs <= ERA_PHASES.config.presentationMs;
      afterSampleMs += contract.IRRADIANCE_MODEL.sampleMs
    ) {
      const beforeSampleMs = afterSampleMs - contract.IRRADIANCE_MODEL.sampleMs;
      const beforeHistory = contract.getIrradianceDwellAt(beforeSampleMs, direction, latitude);
      const afterHistory = contract.getIrradianceDwellAt(afterSampleMs, direction, latitude);
      for (const bodyName of ["sol", "yol"]) {
        const before = projectedBodySample(beforeSampleMs, direction, latitude, bodyName);
        const after = projectedBodySample(afterSampleMs, direction, latitude, bodyName);
        const envelopeProperty = `${bodyName}Envelope`;
        if (
          before.visible &&
          !after.visible &&
          beforeHistory[envelopeProperty] > 0.01
        ) {
          assert.ok(
            afterHistory[envelopeProperty] === 0,
            `${bodyName}/${direction}/${latitude}: Untergang beendet die Zwei-Um-Bedingung im Modell`,
          );
          cleanIrradianceSettings += 1;
        }
      }
    }
  }
}
assert.ok(cleanIrradianceSettings > 0, "reale Sol-/Yol-Untergänge setzen die sichtbare Um-Serie zurück");

const autoCycleButton = elementFor("#auto-cycle");
autoCycleButton.emit("click");
assert.equal(contract.getState().autoCycle, true, "Doppelkreis-Schalter aktiviert den Endlosmodus");
assert.equal(autoCycleButton.getAttribute("aria-pressed"), "true", "aktiver Endlosmodus ist zugänglich ausgewiesen");
assert.ok(autoCycleButton.classList.contains("is-active"), "aktiver Endlosmodus erhält einen sichtbaren Zustand");
slider.value = "359950";
slider.emit("input");
const completedSeed = contract.getState().seed;
const completedCelestialState = contract.getState().scenario.finalCelestialState;
const completedEndSnapshot = contract.getSnapshot(contract.getState().presentationMs, { exact: true });
const completedEraRotation = contract.getEraRotationDegrees(
  contract.getState().presentationMs,
  completedEndSnapshot.template.motion,
);
elementFor("#play-toggle").emit("click");
assert.equal(contract.getState().playing, true, "Wiedergabe startet kurz vor Zyklusende");
assert.equal(typeof nextAnimationFrame, "function", "laufende Wiedergabe plant ein Animationsbild");
const completionFrame = nextAnimationFrame;
nextAnimationFrame = null;
completionFrame(performance.now() + 200);
assert.notEqual(contract.getState().seed, completedSeed, "nach der Konvektion wird ein reproduzierbarer Folgeseed aktiviert");
assert.ok(
  contract.getState().currentMs >= 0 && contract.getState().currentMs < 400,
  "der Anschlusszyklus übernimmt den nicht verbrauchten rAF-Zeitanteil",
);
assert.equal(contract.getState().playing, true, "der neue Konvektionszyklus läuft ohne Pause weiter");
assert.equal(typeof nextAnimationFrame, "function", "Endlosmodus plant den nächsten Zyklus weiter");
const automaticRestartSnapshot = contract.getSnapshot(0, { exact: true });
assert.ok(
  angularDistanceDegrees(contract.getEraRotationDegrees(0, automaticRestartSnapshot.template.motion), completedEraRotation) < 1e-9,
  "der automatische Anschluss bewahrt auch Eras lokalen Blickwinkel",
);
for (const bodyName of ["sol", "yol"]) {
  assert.ok(
    angularDistanceDegrees(automaticRestartSnapshot[bodyName].angle, completedCelestialState[bodyName].angle) < 1e-9,
    `${bodyName}: der automatische Anschluss bewahrt die Sternposition`,
  );
  assert.ok(
    Math.abs(automaticRestartSnapshot[bodyName].radialOffset - completedCelestialState[bodyName].radialOffset) < 1e-9,
    `${bodyName}: der automatische Anschluss bewahrt den Bahnradius`,
  );
  const completedPoint = contract.getOrbitPoint(completedEndSnapshot, bodyName);
  const restartedPoint = contract.getOrbitPoint(automaticRestartSnapshot, bodyName);
  for (const direction of ["north", "east", "south", "west"]) {
    for (const latitude of [0, 30, 60]) {
      const completedProjection = contract.projectOrbitPointToHorizon(
        completedPoint,
        contract.getViewBasis(direction, completedEraRotation),
        "celestial",
        latitude,
      );
      const restartedProjection = contract.projectOrbitPointToHorizon(
        restartedPoint,
        contract.getViewBasis(direction, contract.getEraRotationDegrees(0, automaticRestartSnapshot.template.motion)),
        "celestial",
        latitude,
      );
      assertPointClose(
        restartedProjection,
        completedProjection,
        `${bodyName}/${direction}/${latitude}: Vollzyklus bewahrt den Horizontpunkt`,
        0.02,
      );
    }
  }
}
for (const direction of ["north", "east", "south", "west"]) {
  for (const latitude of [0, 30, 60]) {
    const completedZehsProjection = contract.projectOrbitPointToHorizon(
      contract.ZEHS_PARAMETERS.worldPoint,
      contract.getViewBasis(direction, completedEraRotation),
      "zehs",
      latitude,
    );
    const restartedZehsProjection = contract.projectOrbitPointToHorizon(
      contract.ZEHS_PARAMETERS.worldPoint,
      contract.getViewBasis(direction, contract.getEraRotationDegrees(0, automaticRestartSnapshot.template.motion)),
      "zehs",
      latitude,
    );
    assertPointClose(
      restartedZehsProjection,
      completedZehsProjection,
      `ZEHS/${direction}/${latitude}: Vollzyklus bewahrt den Horizontpunkt`,
      0.02,
    );
  }
}
const firstAutomaticSeed = contract.getState().seed;
slider.value = "359950";
slider.emit("input");
const secondCompletionFrame = nextAnimationFrame;
nextAnimationFrame = null;
secondCompletionFrame(performance.now() + 200);
assert.notEqual(
  contract.getState().seed,
  firstAutomaticSeed,
  "Endlosmodus leitet auch den nächsten Folgeseed ab",
);
assert.ok(
  contract.getState().currentMs >= 0 && contract.getState().currentMs < 400,
  "auch der zweite Anschluss bewahrt den rAF-Zeitüberhang",
);
assert.equal(contract.getState().playing, true, "Endlosmodus bleibt über mehrere Zyklen aktiv");
elementFor("#play-toggle").emit("click");
assert.equal(contract.getState().playing, false, "Pause beendet auch den automatisch fortgesetzten Lauf");
const pausedFrame = nextAnimationFrame;
nextAnimationFrame = null;
if (pausedFrame) pausedFrame(performance.now() + 16);
autoCycleButton.emit("click");
assert.equal(contract.getState().autoCycle, false, "Doppelkreis-Schalter deaktiviert den Endlosmodus wieder");
assert.equal(autoCycleButton.getAttribute("aria-pressed"), "false", "deaktivierter Endlosmodus ist zugänglich ausgewiesen");

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
const presentationMs = 360000;
assert.equal(contract.getState().presentationMs, presentationMs, "360000 ms sind im State aktiv");
for (let index = 0; index < 200; index += 1) {
  const ms = (presentationMs * index) / 199;
  const snapshot = contract.getSnapshot(ms);
  assert.equal(snapshot.ms, ms, `${presentationMs} ms, Stichprobe ${index}: Zeitpunkt bleibt exakt`);
  assertClearance(snapshot, "sol", `${presentationMs} ms, Stichprobe ${index}, Sol`);
  assertClearance(snapshot, "yol", `${presentationMs} ms, Stichprobe ${index}, Yol`);
  sampledSnapshots += 1;
}
assert.equal(sampledSnapshots, 200, "mindestens 200 Snapshots der Zeitfassung geprüft");

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
const rotationOrigin = contract.getEraRotationDegrees(0, "orbit");
assert.ok(
  angularDistanceDegrees(contract.getEraRotationDegrees(1000, "orbit"), rotationOrigin + 5.6) < 1e-9,
  "Era dreht sich relativ zum fortgeführten Zykluswinkel nach einer Sekunde um 5,6 Grad",
);
assert.ok(
  angularDistanceDegrees(contract.getEraRotationDegrees(2000, "orbit"), rotationOrigin + 11.2) < 1e-9,
  "Eras verdoppelte Eigenrotation bleibt über Zyklusgrenzen linear",
);
assert.deepEqual(Object.keys(contract.HORIZON_LATITUDES), ["0", "30", "60"], "nur drei äquatorwärtige Breitenstufen sind definiert");
assert.equal(contract.HORIZON_LATITUDES[0].biome, "polar", "0 Grad sind mit Eis und Schnee verknüpft");
assert.equal(contract.HORIZON_LATITUDES[30].biome, "temperate", "30 Grad sind mit gemäßigtem Tannenland verknüpft");
assert.equal(contract.HORIZON_LATITUDES[60].biome, "desert", "60 Grad sind mit der Wüste verknüpft");
assert.equal(contract.normalizeHorizonLatitude(0), 0, "Polstand bleibt 0 Grad");
assert.equal(contract.normalizeHorizonLatitude(30), 30, "Mittelstufe bleibt 30 Grad");
assert.equal(contract.normalizeHorizonLatitude(60), 60, "Grenzstufe bleibt 60 Grad");
assert.equal(contract.normalizeHorizonLatitude(90), 0, "der Äquator bei 90 Grad ist keine wählbare Stufe");
assert.equal(contract.getLatitudeLift(0), 0, "Polstand verändert die bisherige Horizonthöhe nicht");
assert.ok(contract.getLatitudeLift(30) > 0, "30 Grad heben sichtbare Körper an");
assert.ok(contract.getLatitudeLift(60) > contract.getLatitudeLift(30), "60 Grad heben sichtbare Körper stärker an");
assert.ok(contract.getLatitudeLift(0, "zehs") > contract.getLatitudeLift(30, "zehs"), "ZEHS steht bei 0 Grad höher als bei 30 Grad");
assert.ok(contract.getLatitudeLift(30, "zehs") > contract.getLatitudeLift(60, "zehs"), "ZEHS sinkt von 30 auf 60 Grad weiter ab");
assert.equal(contract.getLatitudeLift(60, "zehs"), 0, "ZEHS erreicht bei 60 Grad seine flachste Zusatzhöhe");

const zehsWorldPoint = contract.ZEHS_PARAMETERS.worldPoint;
assert.ok(Number.isFinite(zehsWorldPoint.x) && Number.isFinite(zehsWorldPoint.y), "ZEHS besitzt einen endlichen Kartenpunkt");
const zehsNorthBasis = contract.getViewBasis("north", 0);
const zehsSouthBasis = contract.getViewBasis("south", 0);
const zehsNorth0 = contract.projectOrbitPointToHorizon(zehsWorldPoint, zehsNorthBasis, "zehs", 0);
const zehsNorth30 = contract.projectOrbitPointToHorizon(zehsWorldPoint, zehsNorthBasis, "zehs", 30);
const zehsNorth60 = contract.projectOrbitPointToHorizon(zehsWorldPoint, zehsNorthBasis, "zehs", 60);
const zehsSouth0 = contract.projectOrbitPointToHorizon(zehsWorldPoint, zehsSouthBasis, "zehs", 0);
assert.equal(zehsNorth0.visible, true, "ZEHS kann über dem nördlichen Horizont als Punkt erscheinen");
assert.equal(zehsSouth0.visible, false, "ZEHS kann durch Eras Horizont verdeckt werden");
assert.ok(zehsNorth0.y < zehsNorth30.y, "ZEHS steht am Polstand nordsternartig am höchsten");
assert.ok(zehsNorth30.y < zehsNorth60.y, "ZEHS wandert mit höherem Polversatz flacher zum Horizont");

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
  const frontProjection30 = contract.projectOrbitPointToHorizon(frontPoint, basis, "orbit", 30);
  const frontProjection60 = contract.projectOrbitPointToHorizon(frontPoint, basis, "orbit", 60);
  const rearProjection = contract.projectOrbitPointToHorizon(rearPoint, basis, "orbit");
  const cutProjection = contract.projectOrbitPointToHorizon(cutPoint, basis, "orbit");
  assert.equal(frontProjection.visible, true, `${directionId}: Vorderseite kann sichtbar sein`);
  assert.equal(rearProjection.visible, false, `${directionId}: Rückseite bleibt unsichtbar`);
  assert.equal(cutProjection.visible, true, `${directionId}: Schnittlinie gehört zum Horizont`);
  assert.ok(Math.abs(pointOf(cutProjection).y - horizonGeometry.horizonY) < 1e-7, `${directionId}: Schnittlinie liegt auf Horizonthöhe`);
  assert.ok(frontProjection30.y < frontProjection.y, `${directionId}: 30 Grad stellen den Himmelskörper höher`);
  assert.ok(frontProjection60.y < frontProjection30.y, `${directionId}: 60 Grad stellen den Himmelskörper nochmals höher`);
  assert.equal(frontProjection30.latitudeDegrees, 30, `${directionId}: mittlere Breitenstufe wird protokolliert`);
  assert.equal(frontProjection60.latitudeDegrees, 60, `${directionId}: Grenzstufe wird protokolliert`);
  assert.ok(frontProjection60.y >= 0, `${directionId}: Grenzstufe bleibt innerhalb des Horizont-SVG`);

  const flatProjection = contract.projectOrbitPointToHorizon(frontPoint, basis, "horizon");
  const reverseFlatProjection = contract.projectOrbitPointToHorizon(frontPoint, basis, "reverse-horizon");
  const parabolaProjection = contract.projectOrbitPointToHorizon(frontPoint, basis, "parabola");
  assertPointClose(flatProjection, frontProjection, `${directionId}: Horizontlauf behält denselben Weltpunkt`);
  assertPointClose(reverseFlatProjection, frontProjection, `${directionId}: umgekehrter Horizontlauf behält denselben Weltpunkt`);
  assertPointClose(parabolaProjection, frontProjection, `${directionId}: Parabellauf behält denselben Weltpunkt`);
  assert.equal(flatProjection.heightScale, contract.HORIZON_PROJECTION_SCALE.celestial, `${directionId}: Horizontlauf nutzt die gemeinsame Projektionshöhe`);
  assert.equal(reverseFlatProjection.heightScale, contract.HORIZON_PROJECTION_SCALE.celestial, `${directionId}: Umkehrlauf nutzt die gemeinsame Projektionshöhe`);
  assert.equal(parabolaProjection.heightScale, contract.HORIZON_PROJECTION_SCALE.celestial, `${directionId}: Parabellauf nutzt die gemeinsame Projektionshöhe`);
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
assertPointClose(frame.worldPoints.zehs, contract.ZEHS_PARAMETERS.worldPoint, "Frame verwendet den festen ZEHS-Kartenpunkt");
const expectedZehsProjection = contract.projectOrbitPointToHorizon(
  contract.ZEHS_PARAMETERS.worldPoint,
  frame.viewBasis,
  "zehs",
  contract.getState().horizonLatitude,
);
assertPointClose(frame.horizonProjection.zehs, expectedZehsProjection, "ZEHS-Horizontpunkt stammt aus derselben Blickprojektion");
assert.equal(frame.horizonProjection.zehs.visible, expectedZehsProjection.visible, "ZEHS-Sichtbarkeit folgt der lokalen Horizontebene");

const zehsMapElement = elementFor("#zehs-body");
const zehsHorizonElement = elementFor("#horizon-zehs-star");
assert.equal(zehsMapElement.getAttribute("aria-hidden"), "false", "ZEHS bleibt in der Nordpolkarte als Punkt sichtbar");
assert.equal(zehsMapElement.getAttribute("data-distance-au"), "40", "ZEHS-Kartenpunkt trägt die Entfernungsangabe");
assert.equal(zehsMapElement.getAttribute("data-brightness"), "sehr hell", "ZEHS-Kartenpunkt trägt die Helligkeitsangabe");
assert.equal(zehsMapElement.getAttribute("data-motion"), "annähernd fest", "ZEHS-Kartenpunkt trägt die Bewegungsangabe");
assert.equal(zehsMapElement.getAttribute("data-orbiting-body"), "false", "ZEHS-Kartenpunkt ist kein Umlaufkörper");
assert.equal(zehsMapElement.getAttribute("data-s-int"), "nicht definiert", "ZEHS-Kartenpunkt erfindet keine S-Int");
assert.equal(
  zehsHorizonElement.getAttribute("aria-hidden"),
  String(!frame.horizonProjection.zehs.visible),
  "ZEHS-Punkt im Horizont spiegelt die berechnete Sichtbarkeit",
);
assert.equal(
  elementFor("#zehs-visibility").getAttribute("data-visible"),
  String(frame.horizonProjection.zehs.visible),
  "ZEHS-Messkarte spiegelt den Horizontstatus",
);
assert.match(elementFor("#zehs-position").textContent, /^x \d+ · /, "ZEHS-Messkarte meldet die schematische Punktposition");

const celestialToggle = elementFor("#celestial-selector-toggle");
const celestialMenu = elementFor("#celestial-selector-menu");
const celestialOptionIds = {
  zehs: "#celestial-option-zehs",
  sol: "#celestial-option-sol",
  yol: "#celestial-option-yol",
  era: "#celestial-option-era",
  kor: "#celestial-option-kor",
  korsShard: "#celestial-option-kors-shard",
};
assert.equal(celestialMenu.hidden, true, "Himmelskörper-Dropdown startet geschlossen");
celestialToggle.click();
assert.equal(celestialMenu.hidden, false, "Bildschalter öffnet das Himmelskörper-Dropdown");
assert.equal(celestialToggle.getAttribute("aria-expanded"), "true", "Bildschalter meldet den offenen Zustand");
celestialToggle.emit("keydown", { key: "ArrowDown" });
assert.equal(document.activeElement, elementFor(celestialOptionIds.zehs), "Pfeiltaste fokussiert die aktuelle Auswahl");
elementFor(celestialOptionIds.zehs).emit("keydown", { key: "ArrowRight" });
assert.equal(document.activeElement, elementFor(celestialOptionIds.sol), "Pfeiltaste wechselt zum nächsten Bildfeld");
elementFor(celestialOptionIds.sol).click();
assert.equal(contract.getState().selectedCelestialId, "sol", "Bildauswahl aktiviert Sol");
assert.equal(celestialMenu.hidden, true, "Auswahl schließt das Dropdown");
assert.equal(document.activeElement, celestialToggle, "Fokus kehrt nach der Auswahl zum Bildschalter zurück");

for (const bodyId of contract.CELESTIAL_INSTRUMENT_ORDER) {
  contract.selectCelestialBody(bodyId, { announce: false, focus: false });
  const values = contract.getCelestialInstrumentValues(bodyId);
  assert.equal(contract.getState().selectedCelestialId, bodyId, `${bodyId}: Auswahl wird im Zustand geführt`);
  assert.equal(elementFor("#celestial-selector-image").getAttribute("src"), values.image, `${bodyId}: Hauptbild wird ersetzt`);
  assert.equal(elementFor("#zehs-instrument-title").textContent, values.title, `${bodyId}: Titel füllt die Messkarte`);
  assert.equal(elementFor("#celestial-class").textContent, values.type, `${bodyId}: Klasse füllt die Messkarte`);
  assert.equal(elementFor("#zehs-visibility").getAttribute("data-body"), bodyId, `${bodyId}: Horizontstatus gehört zur Auswahl`);
  assert.equal(elementFor("#zehs-position").getAttribute("data-body"), bodyId, `${bodyId}: Punktposition gehört zur Auswahl`);
  assert.ok(elementFor("#zehs-position").textContent.length > 1, `${bodyId}: Punktposition ist gefüllt`);
  for (const optionBodyId of contract.CELESTIAL_INSTRUMENT_ORDER) {
    assert.equal(
      elementFor(celestialOptionIds[optionBodyId]).getAttribute("aria-selected"),
      String(optionBodyId === bodyId),
      `${bodyId}: Dropdown besitzt genau einen ausgewählten Eintrag`,
    );
  }
}
contract.selectCelestialBody("zehs", { announce: false, focus: false });
assert.equal(
  elementFor("#zehs-visibility").getAttribute("data-visible"),
  String(frame.horizonProjection.zehs.visible),
  "Rückkehr zu ZEHS stellt dessen dynamischen Horizontstatus wieder her",
);
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
    contract
      .getBodyVisualRadius(
        frame.snapshot[bodyName].intensity,
        bodyName,
        frame.horizonProjection[bodyName].apparentScale,
      )
      .toFixed(3),
    `${bodyName}: Horizontgröße wird aus der gemeinsamen Weltentfernung berechnet`,
  );
  assert.equal(
    orbitBody.getAttribute("data-apparent-scale"),
    "1.0000",
    `${bodyName}: die Draufsicht bleibt eine unskalierte Kartenmarke`,
  );
  assert.equal(
    horizonBody.getAttribute("data-apparent-scale"),
    frame.horizonProjection[bodyName].apparentScale.toFixed(4),
    `${bodyName}: der Horizont protokolliert die entfernungsabhängige Größe`,
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

slider.value = "360000";
slider.emit("input");
const convectionFrame = contract.getLastRenderFrame();
assert.equal(convectionFrame.snapshot.template.id, "convection", "Endzustand ist die Konvektion");
assert.equal(convectionFrame.horizonProjection.sol.visible, false, "Konvektion versteckt Sol im Horizont");
assert.equal(convectionFrame.horizonProjection.yol.visible, false, "Konvektion versteckt Yol im Horizont");
assert.equal(elementFor("#sol-body").getAttribute("aria-hidden"), "true", "Konvektion versteckt Sol im Orbit");
assert.equal(elementFor("#yol-body").getAttribute("aria-hidden"), "true", "Konvektion versteckt Yol im Orbit");
assert.equal(elementFor("#horizon-sol-body").getAttribute("aria-hidden"), "true", "Konvektion versteckt Sol im Panorama");
assert.equal(elementFor("#horizon-yol-body").getAttribute("aria-hidden"), "true", "Konvektion versteckt Yol im Panorama");
assert.equal(elementFor("#zehs-body").getAttribute("aria-hidden"), "false", "Konvektion entfernt den ZEHS-Kartenpunkt nicht");
assert.equal(
  elementFor("#horizon-zehs-star").getAttribute("aria-hidden"),
  String(!convectionFrame.horizonProjection.zehs.visible),
  "ZEHS behält während der Konvektion seine normale Horizontprojektion",
);

if (require.main === module) {
  console.log(
    JSON.stringify({
      templates: ERA_PHASES.templates.length,
      sigils: sigils.children.length,
      generatedSegments: track.children.length,
      phaseJumps: ERA_PHASES.templates.length,
      directions: directionButtons.length,
      latitudes: latitudeButtons.length,
      zehsDistanceAu: contract.ZEHS_PARAMETERS.distanceAu,
      moons: Object.keys(contract.MOON_ORBIT_MODEL.bodies).length,
      geometrySnapshots: sampledSnapshots,
      finalEraTime: elementFor("#era-time").textContent,
    }),
  );
}

module.exports = Object.freeze({ contract });
