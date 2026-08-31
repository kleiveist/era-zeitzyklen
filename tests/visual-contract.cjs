"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sources = Object.fromEntries(
  ["index.html", "styles.css", "app.js", "phases.js"].map((file) => [
    file,
    fs.readFileSync(path.join(root, file), "utf8"),
  ]),
);

function reject(file, pattern, message) {
  assert.doesNotMatch(sources[file], pattern, `${file}: ${message}`);
}

function requireMatch(file, pattern, message) {
  assert.match(sources[file], pattern, `${file}: ${message}`);
}

function openingTag(file, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = sources[file].match(
    new RegExp(`<[a-z][^>]*\\bid\\s*=\\s*["']${escaped}["'][^>]*>`, "i"),
  );
  assert.ok(match, `${file}: #${id} ist vorhanden`);
  return match[0];
}

const forbiddenPatterns = [
  ["styles.css", /\b(?:-webkit-)?backdrop-filter\s*:/i, "kein Glassmorphism/backdrop-filter"],
  ["styles.css", /border-radius\s*:\s*999px\b/i, "keine modernen Pillenradien"],
  ["styles.css", /radial-gradient\s*\(/i, "keine weichen dekorativen Radialverläufe"],
  ["styles.css", /filter\s*:\s*[^;]*(?:blur|drop-shadow)\s*\(/i, "keine CSS-Blur- oder Glow-Filter"],
  ["index.html", /<feGaussianBlur\b/i, "kein SVG-Gauß-Weichzeichner"],
  ["index.html", /<radialGradient\b/i, "keine radialen SVG-Hochglanzflächen"],
  ["index.html", /\bstroke-linecap\s*=\s*["']round["']/i, "keine runden Linecaps"],
  ["index.html", /\bid\s*=\s*["'](?:era-gradient|sol-gradient|yol-gradient)["']/i, "alte Verlaufs-IDs sind entfernt"],
  ["index.html", /\bid\s*=\s*["'](?:era-equator|era-meridian)["']/i, "keine gekippte Kugel-/Äquatorperspektive"],
  ["index.html", /filter\s*=\s*["']url\(#[^"']*(?:glow|blur)[^"']*\)["']/i, "keine SVG-Glow-Filter"],
  ["app.js", /\bverticalScaleFor\b/, "Horizontphasen skalieren keine orbitalen Y-Radien"],
];

for (const [file, pattern, message] of forbiddenPatterns) reject(file, pattern, message);

for (const id of ["era-gradient", "sol-gradient", "yol-gradient"]) {
  for (const file of ["index.html", "styles.css", "app.js"]) {
    reject(file, new RegExp(`\\b${id}\\b`, "i"), `alte SVG-ID ${id} wird nirgends referenziert`);
  }
}

for (const file of ["index.html", "styles.css", "app.js", "phases.js"]) {
  reject(file, /\bTODO\b/i, "keine TODOs oder halbfertigen Produktionspfade");
}

reject("index.html", /\bid\s*=\s*["']duration-mode["']/i, "keine alternative Drei-Minuten-Zeitfassung");
reject("phases.js", /\blongPresentationMs\b/, "keine zweite Präsentationsdauer");
requireMatch("phases.js", /\bpresentationMs\s*:\s*360000\b/, "die Chronik ist fest auf sechs Minuten eingestellt");
requireMatch("phases.js", /\bconvectionPresentationMs\s*:\s*32000\b/, "die Konvektion erhält 32 Sekunden");

reject(
  "index.html",
  /<(?:script|link)\b[^>]*(?:src|href)\s*=\s*["']https?:\/\//i,
  "keine externen CDN- oder Laufzeitabhängigkeiten",
);

const orbitTag = openingTag("index.html", "orbit-view");
const horizonTag = openingTag("index.html", "horizon-view");
assert.match(orbitTag, /\bshape-rendering\s*=\s*["']crispEdges["']/i, "Orbitansicht rendert mit crispEdges");
assert.match(horizonTag, /\bshape-rendering\s*=\s*["']crispEdges["']/i, "Horizontansicht rendert mit crispEdges");
assert.match(orbitTag, /\baria-labelledby\s*=/i, "Orbitansicht besitzt zugänglichen Titel und Beschreibung");
assert.match(horizonTag, /\baria-labelledby\s*=/i, "Horizontansicht besitzt zugänglichen Titel und Beschreibung");
requireMatch("index.html", /\bstroke-linecap\s*=\s*["']square["']/i, "blockige SVG-Linien verwenden square linecaps");
requireMatch("index.html", /\bstroke-linejoin\s*=\s*["']miter["']/i, "blockige SVG-Linien verwenden miter joins");

const directionGroupTag = openingTag("index.html", "horizon-direction-group");
assert.match(directionGroupTag, /\brole\s*=\s*["']radiogroup["']/i, "Richtungsauswahl ist ein Radiogroup");
assert.match(directionGroupTag, /\baria-label(?:ledby)?\s*=/i, "Richtungsauswahl besitzt einen zugänglichen Namen");

const directionIds = ["north", "east", "south", "west"];
for (const direction of directionIds) {
  const tag = openingTag("index.html", `horizon-direction-${direction}`);
  assert.match(tag, /^<button\b/i, `${direction}: echte Schaltfläche`);
  assert.match(tag, new RegExp(`\\bdata-direction\\s*=\\s*["']${direction}["']`, "i"), `${direction}: zentrale Richtungs-ID`);
  assert.match(tag, /\baria-label\s*=/i, `${direction}: eindeutiger zugänglicher Name`);
  assert.match(tag, /\baria-(?:pressed|checked)\s*=/i, `${direction}: expliziter Auswahlzustand`);
}
assert.equal(
  [...sources["index.html"].matchAll(/\bid\s*=\s*["']horizon-direction-(?:north|east|south|west)["']/gi)].length,
  4,
  "index.html: exakt vier Richtungsbuttons",
);

for (const id of [
  "era-surface",
  "era-view-arrow",
  "era-horizon-cut",
  "horizon-sol-body",
  "horizon-yol-body",
]) {
  openingTag("index.html", id);
}

for (const className of [
  "orbit-nebula",
  "star-cross-field",
  "era-aura-outer",
  "era-ocean-depth",
  "horizon-nebula",
  "horizon-star-crosses",
  "mountain-back-light",
  "horizon-runes",
]) {
  requireMatch("index.html", new RegExp(`\\bclass\\s*=\\s*["'][^"']*\\b${className}\\b`, "i"), `${className} gehört zur hochauflösenden Pixelkulisse`);
}

for (const name of [
  "ORBIT_GEOMETRY",
  "HORIZON_GEOMETRY",
  "HORIZON_DIRECTIONS",
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
  "ERA_CYCLE_CONTRACT",
]) {
  requireMatch("app.js", new RegExp(`\\b${name}\\b`), `${name} gehört zum gemeinsamen Geometrie-/Testvertrag`);
}

requireMatch("app.js", /era-horizon-direction/, "Blickrichtung wird unter dem vereinbarten localStorage-Schlüssel gespeichert");
requireMatch(
  "styles.css",
  /:active[^{}]*\{[^{}]*(?:translateY\(\s*2px\s*\)|translate\(\s*(?:0|2px)\s*,\s*2px\s*\)|translate\s*:\s*(?:0|2px)\s+2px)/is,
  "gedrückte Bedienelemente verschieben sich exakt um 2 px",
);
requireMatch("styles.css", /@media\s*\([^)]*prefers-reduced-motion\s*:\s*reduce[^)]*\)/i, "reduzierte Bewegung wird respektiert");

const animationDeclarations = sources["styles.css"].match(/\banimation(?:-timing-function)?\s*:[^;]+;/gi) || [];
for (const declaration of animationDeclarations) {
  assert.match(declaration, /\b(?:none|steps\s*\()/i, `styles.css: Animation verwendet none oder steps(): ${declaration}`);
}

console.log(
  JSON.stringify({
    checkedFiles: Object.keys(sources),
    directions: directionIds.length,
    forbiddenPatterns: forbiddenPatterns.length,
    orbitRendering: "crispEdges",
    horizonRendering: "crispEdges",
  }),
);
