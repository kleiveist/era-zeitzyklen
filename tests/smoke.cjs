"use strict";

const assert = require("node:assert/strict");

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : Boolean(force);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }
}

class FakeElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.classList = new FakeClassList();
    this.style = {
      setProperty: (name, value) => {
        this.style[name] = value;
      },
    };
    this.value = "";
    this.textContent = "";
    this.hidden = false;
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  addEventListener(name, listener) {
    const listeners = this.listeners.get(name) || [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
  }

  emit(name, event = {}) {
    const payload = { key: undefined, ...event, target: this };
    for (const listener of this.listeners.get(name) || []) listener(payload);
  }

  querySelectorAll(selector) {
    if (selector === ".phase-segment") {
      return this.children.filter((child) => child.className === "phase-segment");
    }
    return [];
  }
}

const elements = new Map();
function elementFor(selector) {
  if (!elements.has(selector)) elements.set(selector, new FakeElement());
  return elements.get(selector);
}

global.window = global;
const documentElement = { dataset: { theme: "dark" } };
global.document = {
  activeElement: null,
  documentElement,
  querySelector: elementFor,
  createElement: (tagName) => new FakeElement(tagName),
  addEventListener: () => {},
};
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
};
global.matchMedia = () => ({
  matches: false,
  addEventListener: () => {},
  addListener: () => {},
});
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};

elementFor("#seed-input").value = "ERA-3500";
elementFor("#playback-rate").value = "1";
elementFor("#time-slider").value = "0";

require("../phases.js");
require("../app.js");

const track = elementFor("#phase-track");
const sigils = elementFor("#phase-sigils");
assert.ok(track.children.length >= ERA_PHASES.templates.length, "alle Vorlagen plus Wiederholungen");
assert.equal(sigils.children.length, ERA_PHASES.templates.length, "jede Vorlage besitzt ein anwählbares Siegel");
assert.ok(ERA_PHASES.templates.every((template) => /^icon-/.test(template.icon)), "jede Vorlage besitzt eine Icon-ID");
const firstSchedule = track.children.map((button) => button.attributes.get("aria-label"));
assert.equal(
  track.children.reduce((sum, button) => sum + Number(button.style["--segment-grow"]), 0),
  180000,
  "Zeitlinie umfasst exakt drei Minuten",
);
assert.equal(
  Number(track.children.at(-1).style["--segment-grow"]),
  16000,
  "Konvektion erhält die didaktisch vergrößerten 16 Sekunden",
);
assert.equal(
  Number(elementFor("#phase-count").textContent),
  track.children.length,
  "Phasenzähler entspricht der Zeitlinie",
);
assert.match(elementFor("#era-time").textContent, /^Mohn 0 · Dir 0 · Tan 0 · Um 0$/);

for (const template of ERA_PHASES.templates) {
  const select = elementFor("#phase-select");
  select.value = template.id;
  select.emit("change");
  assert.equal(
    elementFor("#active-phase-name").textContent,
    template.label,
    `Sprung zu ${template.id}`,
  );
  assert.equal(
    elementFor("#active-phase-icon-use").attributes.get("href"),
    `#${template.icon}`,
    `aktives Siegel für ${template.id}`,
  );
}

elementFor("#theme-toggle").emit("click");
assert.equal(documentElement.dataset.theme, "light", "Theme-Schalter aktiviert helles Pergament");
assert.equal(elementFor("#theme-label").textContent, "Helles Pergament");
assert.equal(storage.get("era-theme"), "light", "Theme-Präferenz wird gespeichert");
elementFor("#theme-toggle").emit("click");
assert.equal(documentElement.dataset.theme, "dark", "Theme-Schalter kehrt zur dunklen Chronik zurück");

const slider = elementFor("#time-slider");
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
  track.children.map((button) => button.attributes.get("aria-label")),
  firstSchedule,
  "gleicher Seed erzeugt denselben Ereignisplan",
);

elementFor("#seed-input").value = "ERA-ANDERES-SZENARIO";
elementFor("#apply-seed").emit("click");
assert.notDeepEqual(
  track.children.map((button) => button.attributes.get("aria-label")),
  firstSchedule,
  "anderer Seed erzeugt einen anderen Ereignisplan",
);
assert.match(elementFor("#era-time").textContent, /^Mohn 10 · Dir 0 · Tan 0 · Um 0$/);

const durationMode = elementFor("#duration-mode");
durationMode.value = "360000";
durationMode.emit("change");
assert.equal(
  track.children.reduce((sum, button) => sum + Number(button.style["--segment-grow"]), 0),
  360000,
  "lange Zeitfassung umfasst exakt sechs Minuten",
);
assert.equal(
  Number(track.children.at(-1).style["--segment-grow"]),
  32000,
  "Konvektion skaliert in der langen Zeitfassung auf 32 Sekunden",
);
assert.equal(elementFor("#time-slider").attributes.get("max"), "360000");
assert.equal(elementFor("#timeline-total").textContent, "6:00");

console.log(
  JSON.stringify({
    templates: ERA_PHASES.templates.length,
    sigils: sigils.children.length,
    generatedSegments: track.children.length,
    phaseJumps: ERA_PHASES.templates.length,
    longPresentationMs: track.children.reduce(
      (sum, button) => sum + Number(button.style["--segment-grow"]),
      0,
    ),
    finalEraTime: elementFor("#era-time").textContent,
  }),
);
