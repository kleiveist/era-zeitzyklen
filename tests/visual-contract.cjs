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

const artworkSpecs = [
  { file: "astral-map-dark-hd.png", minWidth: 1500, minHeight: 900 },
  { file: "astral-map-light-hd.png", minWidth: 1500, minHeight: 900 },
  { file: "horizon-polar-hd.png", minWidth: 2100, minHeight: 700 },
  { file: "horizon-temperate-hd.png", minWidth: 2100, minHeight: 700 },
  { file: "horizon-desert-hd.png", minWidth: 2100, minHeight: 700 },
  { file: "era-world-hd.png", minWidth: 600, minHeight: 600, alpha: true },
  { file: "sol-star-hd.png", minWidth: 600, minHeight: 600, alpha: true },
  { file: "yol-star-hd.png", minWidth: 600, minHeight: 600, alpha: true },
  { file: "zehs-star-hd.png", minWidth: 600, minHeight: 600, alpha: true },
];

for (const spec of artworkSpecs) {
  const artworkPath = path.join(root, "assets", "images", spec.file);
  const data = fs.readFileSync(artworkPath);
  assert.equal(data.toString("ascii", 1, 4), "PNG", `${spec.file}: gültige PNG-Signatur`);
  assert.ok(data.readUInt32BE(16) >= spec.minWidth, `${spec.file}: ausreichende native Breite`);
  assert.ok(data.readUInt32BE(20) >= spec.minHeight, `${spec.file}: ausreichende native Höhe`);
  assert.ok(data.byteLength > 400_000, `${spec.file}: kein niedrig aufgelöster Platzhalter`);
  if (spec.alpha) assert.equal(data[25], 6, `${spec.file}: besitzt einen echten RGBA-Alphakanal`);
}

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
assert.match(horizonTag, /\bdata-biome\s*=\s*["']polar["']/i, "Horizont startet mit der polaren Eiswelt");
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

const latitudeGroupTag = openingTag("index.html", "horizon-latitude-group");
assert.match(latitudeGroupTag, /\brole\s*=\s*["']radiogroup["']/i, "Breitenauswahl ist ein Radiogroup");
assert.match(latitudeGroupTag, /\baria-label(?:ledby)?\s*=/i, "Breitenauswahl besitzt einen zugänglichen Namen");
for (const latitude of [0, 30, 60]) {
  const tag = openingTag("index.html", `horizon-latitude-${latitude}`);
  assert.match(tag, /^<button\b/i, `${latitude} Grad: echte Schaltfläche`);
  assert.match(tag, new RegExp(`\\bdata-latitude\\s*=\\s*["']${latitude}["']`, "i"), `${latitude} Grad: zentraler Breitenwert`);
  assert.match(tag, /\baria-label\s*=/i, `${latitude} Grad: eindeutiger zugänglicher Name`);
  assert.match(tag, /\baria-(?:pressed|checked)\s*=/i, `${latitude} Grad: expliziter Auswahlzustand`);
}
assert.equal(
  [...sources["index.html"].matchAll(/\bid\s*=\s*["']horizon-latitude-(?:0|30|60)["']/gi)].length,
  3,
  "index.html: exakt drei Breitenstufen",
);
reject("index.html", /\bdata-latitude\s*=\s*["']90["']/i, "der Äquator ist nicht auswählbar");
requireMatch("index.html", /Äquator bei 90° bleibt ausgeschlossen/i, "die Grenze zum Äquator wird erklärt");

for (const id of [
  "era-surface",
  "era-view-arrow",
  "era-horizon-cut",
  "era-latitude-ring",
  "era-observer-marker",
  "horizon-sol-body",
  "horizon-yol-body",
  "zehs-body",
  "horizon-zehs-star",
  "horizon-biome-polar",
  "horizon-biome-temperate",
  "horizon-biome-desert",
  "zehs-visibility",
  "zehs-position",
]) {
  openingTag("index.html", id);
}

for (const className of [
  "orbit-artwork",
  "celestial-artwork",
  "horizon-artwork",
  "orbit-nebula",
  "orbit-distant-worlds",
  "orbit-axis-lines",
  "orbit-map-frame",
  "star-cross-field",
  "era-aura-outer",
  "era-ocean-depth",
  "horizon-nebula",
  "horizon-star-crosses",
  "mountain-back-light",
  "horizon-runes",
  "biome-sky",
  "polar-glacier-light",
  "temperate-forest-front",
  "desert-dunes-light",
  "zehs-point",
  "zehs-point-core",
  "zehs-instrument",
  "instrument-rail",
  "zehs-panel",
]) {
  requireMatch("index.html", new RegExp(`\\bclass\\s*=\\s*["'][^"']*\\b${className}\\b`, "i"), `${className} gehört zur hochauflösenden Pixelkulisse`);
}

for (const asset of artworkSpecs) {
  requireMatch(
    "index.html",
    new RegExp(`assets/images/${asset.file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"),
    `${asset.file}: wird von der Live-Darstellung verwendet`,
  );
}
requireMatch(
  "index.html",
  /class=["']instrument-rail["'][\s\S]*class=["'][^"']*algorithm-panel[^"']*["'][\s\S]*class=["'][^"']*zehs-panel[^"']*["']/i,
  "ZEHS steht als separates Infofenster unter dem Orakel in derselben Instrumentenschiene",
);
requireMatch(
  "styles.css",
  /:root\[data-theme=["']dark["']\][^{]*\.orbit-artwork-dark[\s\S]*:root\[data-theme=["']light["']\][^{]*\.orbit-artwork-light/i,
  "Astralkarte besitzt getrennte hochauflösende Artworks für Hell und Dunkel",
);

for (const name of [
  "ORBIT_GEOMETRY",
  "HORIZON_GEOMETRY",
  "HORIZON_DIRECTIONS",
  "HORIZON_LATITUDES",
  "ZEHS_PARAMETERS",
  "normalizeDegrees",
  "normalizeHorizonLatitude",
  "getLatitudeLift",
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
requireMatch("app.js", /era-horizon-latitude/, "Breitenstufe wird unter dem vereinbarten localStorage-Schlüssel gespeichert");
requireMatch("app.js", /Object\.freeze\(\[0,\s*30,\s*60\]\)/, "nur die drei vereinbarten Breitenstufen sind wählbar");
requireMatch("app.js", /biome\s*:\s*["']polar["']/, "0 Grad wählen die polare Eiswelt");
requireMatch("app.js", /biome\s*:\s*["']temperate["']/, "30 Grad wählen die gemäßigte Tannenlandschaft");
requireMatch("app.js", /biome\s*:\s*["']desert["']/, "60 Grad wählen die Wüstenlandschaft");
for (const biome of ["polar", "temperate", "desert"]) {
  requireMatch(
    "styles.css",
    new RegExp(`#horizon-view\\[data-biome=["']${biome}["']\\]`, "i"),
    `${biome}: SVG-Biom wird über den zentralen Datenzustand eingeblendet`,
  );
}
for (const variable of [
  "orbit-dust-a",
  "era-surface-color",
  "polar-snow",
  "temperate-pine",
  "desert-sand",
]) {
  requireMatch("styles.css", new RegExp(`--${variable}\\s*:`, "i"), `${variable}: Theme-Palette ist definiert`);
}
requireMatch(
  "styles.css",
  /:root\[data-theme=["']light["']\][\s\S]*--polar-snow\s*:[\s\S]*--temperate-pine\s*:[\s\S]*--desert-sand\s*:/i,
  "das helle Theme besitzt eigene Farben für alle drei Landschaften",
);
requireMatch("index.html", /\bid\s*=\s*["']zehs-star-shape["']/, "ZEHS besitzt ein wiederverwendbares Pixelstern-Symbol");
requireMatch("index.html", /\bdata-distance-au\s*=\s*["']40["']/, "ZEHS trägt die kanonische Näherungsentfernung");
requireMatch("index.html", /\bdata-brightness\s*=\s*["']sehr hell["']/, "ZEHS trägt die kanonische Helligkeit");
requireMatch("index.html", /\bdata-motion\s*=\s*["']annähernd fest["']/, "ZEHS trägt die kanonische Bewegungsangabe");
requireMatch("index.html", /\bdata-orbiting-body\s*=\s*["']false["']/, "ZEHS wird nicht als lokaler Umlaufkörper ausgegeben");
requireMatch("index.html", /<dt>S-Int<\/dt><dd>nicht definiert<\/dd>/i, "für ZEHS wird keine S-Int erfunden");
requireMatch("index.html", /<dt>Namensbezug<\/dt><dd>Zehsen<\/dd>/i, "ZEHS dokumentiert den Namensbezug");
requireMatch("app.js", /distanceAu\s*:\s*40\b/, "ZEHS-Entfernung gehört zum zentralen Parametervertrag");
requireMatch("app.js", /rotationReference\s*:\s*["'][^"']*vollständige Rotation Eras/i, "ZEHS dokumentiert den Rotationsbezug");
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
    artworkAssets: artworkSpecs.length,
    orbitRendering: "crispEdges",
    horizonRendering: "crispEdges",
  }),
);
