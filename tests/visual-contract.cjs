"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = path.resolve(__dirname, "..");
const sources = Object.fromEntries(
  ["index.html", "styles.css", "app.js", "phases.js"].map((file) => [
    file,
    fs.readFileSync(path.join(root, file), "utf8"),
  ]),
);

const artworkSpecs = [
  { file: "astral-map-dark-hd.png", minWidth: 1400, minHeight: 1000 },
  { file: "astral-map-light-hd.png", minWidth: 1400, minHeight: 1000 },
  { file: "horizon-polar-hd1.png", minWidth: 1600, minHeight: 700, alpha: true },
  { file: "horizon-polar-hd2.png", minWidth: 1600, minHeight: 700, alpha: true },
  { file: "horizon-polar-day-hd1.png", minWidth: 1600, minHeight: 700, alpha: true },
  { file: "horizon-polar-day-hd2.png", minWidth: 1600, minHeight: 700, alpha: true },
  { file: "horizon-temperate-hd1.png", minWidth: 1600, minHeight: 700, alpha: true },
  { file: "horizon-temperate-hd2.png", minWidth: 1600, minHeight: 700, alpha: true },
  { file: "horizon-temperate-day-hd1.png", minWidth: 1600, minHeight: 700, alpha: true },
  { file: "horizon-temperate-day-hd2.png", minWidth: 1600, minHeight: 700, alpha: true },
  { file: "horizon-desert-hd1.png", minWidth: 2100, minHeight: 700, alpha: true },
  { file: "horizon-desert-hd2.png", minWidth: 2100, minHeight: 700, alpha: true },
  { file: "horizon-desert-day-hd1.png", minWidth: 2100, minHeight: 700, alpha: true },
  { file: "horizon-desert-day-hd2.png", minWidth: 2100, minHeight: 700, alpha: true },
  { file: "horizon-clouds-pixel-hd.png", minWidth: 2100, minHeight: 700, alpha: true },
  { file: "horizon-stars-pixel-hd.png", minWidth: 2100, minHeight: 700, minBytes: 180_000, alpha: true },
  { file: "horizon-convection-hd.png", minWidth: 2100, minHeight: 700, alpha: true },
  { file: "orbit-convection-hd.png", minWidth: 1500, minHeight: 900, alpha: true },
  { file: "era-world-hd.png", minWidth: 600, minHeight: 600, alpha: true },
  { file: "sol-star-hd.png", minWidth: 600, minHeight: 600, alpha: true },
  { file: "yol-star-hd.png", minWidth: 600, minHeight: 600, alpha: true },
  { file: "zehs-star-hd.png", minWidth: 600, minHeight: 600, alpha: true },
];

const directionalBiomes = Object.freeze({
  polar: Object.freeze({ minWidth: 1600, minHeight: 700 }),
  temperate: Object.freeze({ minWidth: 1600, minHeight: 700 }),
  desert: Object.freeze({ minWidth: 2100, minHeight: 700 }),
});
const panoramaDirections = Object.freeze(["north", "east", "south", "west"]);
for (const [biome, dimensions] of Object.entries(directionalBiomes)) {
  for (const direction of panoramaDirections.slice(1)) {
    for (const themePart of ["", "day-"]) {
      for (const layer of ["hd1", "hd2"]) {
        artworkSpecs.push({
          file: `horizon-${biome}-${direction}-${themePart}${layer}.png`,
          ...dimensions,
          alpha: true,
        });
      }
    }
  }
}

for (const spec of artworkSpecs) {
  const artworkPath = path.join(root, "assets", "images", spec.file);
  const data = fs.readFileSync(artworkPath);
  assert.equal(data.toString("ascii", 1, 4), "PNG", `${spec.file}: gültige PNG-Signatur`);
  assert.ok(data.readUInt32BE(16) >= spec.minWidth, `${spec.file}: ausreichende native Breite`);
  assert.ok(data.readUInt32BE(20) >= spec.minHeight, `${spec.file}: ausreichende native Höhe`);
  assert.ok(data.byteLength > (spec.minBytes || 400_000), `${spec.file}: kein niedrig aufgelöster Platzhalter`);
  if (spec.alpha) assert.equal(data[25], 6, `${spec.file}: besitzt einen echten RGBA-Alphakanal`);
}

function paethPredictor(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

function readRgbaPngAlpha(file) {
  const data = fs.readFileSync(path.join(root, "assets", "images", file));
  const idatChunks = [];
  let width = 0;
  let height = 0;
  let offset = 8;
  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      assert.equal(chunk[8], 8, `${file}: Alphavertrag unterstützt 8-Bit-PNG`);
      assert.equal(chunk[9], 6, `${file}: Alphavertrag erwartet RGBA`);
      assert.equal(chunk[12], 0, `${file}: Alphavertrag erwartet ein nicht-interlaced PNG`);
    } else if (type === "IDAT") {
      idatChunks.push(chunk);
    } else if (type === "IEND") {
      break;
    }
    offset += length + 12;
  }

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const compressedRows = zlib.inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = compressedRows[sourceOffset];
    sourceOffset += 1;
    const rowOffset = y * stride;
    const previousRowOffset = rowOffset - stride;
    for (let x = 0; x < stride; x += 1) {
      const raw = compressedRows[sourceOffset];
      sourceOffset += 1;
      const left = x >= bytesPerPixel ? pixels[rowOffset + x - bytesPerPixel] : 0;
      const up = y > 0 ? pixels[previousRowOffset + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel
        ? pixels[previousRowOffset + x - bytesPerPixel]
        : 0;
      const predictor = filter === 0
        ? 0
        : filter === 1
          ? left
          : filter === 2
            ? up
            : filter === 3
              ? Math.floor((left + up) / 2)
              : filter === 4
                ? paethPredictor(left, up, upperLeft)
                : NaN;
      assert.ok(Number.isFinite(predictor), `${file}: unbekannter PNG-Zeilenfilter ${filter}`);
      pixels[rowOffset + x] = (raw + predictor) & 0xff;
    }
  }

  const alpha = Buffer.alloc(width * height);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    alpha[pixel] = pixels[pixel * bytesPerPixel + 3];
  }
  return { width, height, alpha };
}

function horizonArtworkFile(biome, direction, theme, layer) {
  const directionPart = direction === "north" ? "" : `-${direction}`;
  const themePart = theme === "day" ? "-day" : "";
  return `horizon-${biome}${directionPart}${themePart}-${layer}.png`;
}

for (const biome of Object.keys(directionalBiomes)) {
  for (const direction of panoramaDirections) {
    for (const layer of ["hd1", "hd2"]) {
      const nightFile = horizonArtworkFile(biome, direction, "night", layer);
      const dayFile = horizonArtworkFile(biome, direction, "day", layer);
      const night = readRgbaPngAlpha(nightFile);
      const day = readRgbaPngAlpha(dayFile);
      const north = readRgbaPngAlpha(horizonArtworkFile(biome, "north", "night", layer));
      assert.equal(day.width, night.width, `${biome}/${direction}/${layer}: Tag und Nacht besitzen dieselbe Breite`);
      assert.equal(day.height, night.height, `${biome}/${direction}/${layer}: Tag und Nacht besitzen dieselbe Höhe`);
      assert.ok(day.alpha.equals(night.alpha), `${biome}/${direction}/${layer}: Tag und Nacht besitzen exakt dieselbe Alphamaske`);
      assert.ok(
        night.alpha.equals(north.alpha),
        `${biome}/${direction}/${layer}: Richtungsvariante behält die geprüfte Ebenenkante ohne Gebirgslücke`,
      );
    }
  }
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
requireMatch("phases.js", /\bUM_PER_TAN\s*=\s*16\b/, "ein Tan besteht aus 16 Um");
requireMatch("phases.js", /\bTAN_PER_DIR\s*=\s*8\b/, "ein Dir besteht aus 8 Tan");
requireMatch("phases.js", /\bDIR_PER_MOHN\s*=\s*36\b/, "ein Mohn besteht aus 36 Dir");
requireMatch("phases.js", /\bMOHN_PER_CYCLE\s*=\s*10\b/, "ein Konvektionszyklus besteht aus 10 Mohn");
requireMatch("phases.js", /\beraRotationDegreesPerSecond\s*:\s*5\.6\b/, "Eras Eigenrotation ist auf 5,6 Grad pro Sekunde verdoppelt");
requireMatch("phases.js", /\bschemaVersion\s*:\s*3\b/, "Szenarioschema schützt kontinuierliche Phasenübergänge");
requireMatch("app.js", /template\.category\s*===\s*["']synchron["'][\s\S]*?drift\s*=\s*config\.eraRotationDegreesPerSecond[\s\S]*?amplitude\s*=\s*0\b/, "alle synchronen Phasen bleiben exakt an Eras Winkelgeschwindigkeit gekoppelt");
requireMatch("app.js", /startRadialOffset[\s\S]*endRadialOffset[\s\S]*startIntensity[\s\S]*endIntensity/i, "Radialposition und Intensität besitzen explizite kontinuierliche Segmentenden");
requireMatch("app.js", /finalCelestialState[\s\S]*initialCelestialState/i, "vollständige Zyklen übergeben ihre letzte Sternposition an den nächsten Seed");

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
assert.match(horizonTag, /\bdata-direction\s*=\s*["']north["']/i, "Horizont startet mit dem bisherigen Nordpanorama");
assert.match(horizonTag, /\bdata-panorama\s*=\s*["']polar-north["']/i, "Horizont protokolliert die aktive Panorama-ID");
requireMatch("index.html", /\bstroke-linecap\s*=\s*["']square["']/i, "blockige SVG-Linien verwenden square linecaps");
requireMatch("index.html", /\bstroke-linejoin\s*=\s*["']miter["']/i, "blockige SVG-Linien verwenden miter joins");
requireMatch(
  "index.html",
  /class=["']orbit-plane["'][^>]*shape-rendering=["']geometricPrecision["'][\s\S]*?orbit-sol-track[\s\S]*?orbit-sol-track[\s\S]*?orbit-sol-track[\s\S]*?orbit-yol-track[\s\S]*?orbit-yol-track[\s\S]*?orbit-yol-track/i,
  "beide Umlaufbahnen besitzen je drei geometrisch präzise Vektorlagen",
);
requireMatch("styles.css", /\.orbit,[\s\S]*?\.orbit-track\s*\{[^}]*vector-effect\s*:\s*non-scaling-stroke/is, "Umlaufbahnen bleiben bei jeder Skalierung scharf");
reject("index.html", /\b(?:direction-path-(?:sol|yol)|(?:sol|yol)-direction-arrow)\b/i, "sinnlose Umlaufbahnpfeile sind entfernt");
reject("index.html", /marker-end=["']url\(#(?:sol|yol)-direction-arrow\)["']/i, "Umlaufbahnen besitzen keine Pfeilmarker mehr");
reject("app.js", /\bbuildBlockArrowPath\b/, "JavaScript erzeugt keine orbitalen Pfeile mehr");

const directionGroupTag = openingTag("index.html", "horizon-direction-group");
assert.match(directionGroupTag, /\brole\s*=\s*["']radiogroup["']/i, "Richtungsauswahl ist ein Radiogroup");
assert.match(directionGroupTag, /\baria-label(?:ledby)?\s*=/i, "Richtungsauswahl besitzt einen zugänglichen Namen");

const autoCycleTag = openingTag("index.html", "auto-cycle");
assert.match(autoCycleTag, /^<button\b/i, "Auto-Neuwürfeln ist eine echte Schaltfläche");
assert.match(autoCycleTag, /\baria-pressed\s*=\s*["']false["']/i, "Auto-Neuwürfeln startet deaktiviert");
assert.match(autoCycleTag, /\baria-label\s*=/i, "Auto-Neuwürfeln besitzt einen zugänglichen Namen");
requireMatch("index.html", /\bid\s*=\s*["']icon-auto-cycle["'][\s\S]*?<circle\b[^>]*cx=["']7\.5["'][\s\S]*?<circle\b[^>]*cx=["']16\.5["']/i, "Doppelkreis-Icon zeigt zwei nebeneinanderliegende Kreise");
requireMatch("index.html", /id=["']play-toggle["'][\s\S]*id=["']auto-cycle["'][\s\S]*id=["']restart["']/i, "Doppelkreis-Schalter sitzt rechts neben Abspielen/Pause und vor Zum Anfang");
requireMatch("styles.css", /\.auto-cycle-toggle\s*\{[^}]*width\s*:\s*48px\b[^}]*flex\s*:\s*0\s+0\s+48px\b/is, "Doppelkreis-Schalter bleibt eine kleine quadratische Schaltfläche");
requireMatch("app.js", /if\s*\(state\.autoCycle\)[\s\S]*?initialCelestialState\s*=\s*state\.scenario\.finalCelestialState[\s\S]*?initialEraRotationDegrees\s*=\s*getEraRotationDegrees[\s\S]*?loadScenario\(createNewSeed\(\),\s*\{[\s\S]*?initialCelestialState,[\s\S]*?initialEraRotationDegrees,[\s\S]*?\}\)[\s\S]*?requestAnimationFrame\(tick\)/i, "aktiver Endlosmodus würfelt nach Zyklusende neu, übernimmt Sternpositionen und Eras Blickwinkel und läuft weiter");

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
  "horizon-artwork-night",
  "horizon-artwork-day",
  "horizon-artwork-back",
  "horizon-artwork-front",
  "horizon-atmosphere",
  "horizon-stars-artwork",
  "horizon-clouds-artwork",
  "horizon-irradiance",
  "horizon-irradiance-warm",
  "horizon-irradiance-cool",
  "horizon-shimmer",
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
const panoramaArtworkTags = [
  ...sources["index.html"].matchAll(/<image\b[^>]*\bclass=["'][^"']*\bhorizon-artwork\b[^"']*["'][^>]*>/gi),
];
assert.equal(panoramaArtworkTags.length, 48, "vier Richtungen, drei Biome, zwei Themes und zwei Ebenen ergeben exakt 48 Panoramabilder");

for (const biome of Object.keys(directionalBiomes)) {
  requireMatch(
    "styles.css",
    new RegExp(`#horizon-view\\[data-biome=["']${biome}["']\\]\\s+\\.horizon-artwork-${biome}[\\s\\S]*?visibility\\s*:\\s*visible`, "i"),
    `${biome}: nur das aktive Biom wird sichtbar`,
  );
  for (const direction of panoramaDirections) {
    for (const theme of ["night", "day"]) {
      for (const layer of ["hd1", "hd2"]) {
        const file = horizonArtworkFile(biome, direction, theme, layer);
        const layerClass = layer === "hd1" ? "back" : "front";
        requireMatch(
          "index.html",
          new RegExp(`class=["'][^"']*horizon-artwork-${theme}[^"']*horizon-artwork-${layerClass}[^"']*horizon-artwork-${biome}[^"']*horizon-artwork-${direction}[^"']*["'][^>]*href=["']assets/images/${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i"),
          `${biome}/${direction}/${theme}/${layer}: richtige Mehrfachebene ist eingebunden`,
        );
      }
    }
  }
}

for (const direction of panoramaDirections) {
  requireMatch(
    "styles.css",
    new RegExp(`data-theme=["']dark["'][^\\n]*data-direction=["']${direction}["'][^\\n]*horizon-artwork-night\\.horizon-artwork-${direction}`, "i"),
    `${direction}: dunkles Theme verwendet das richtungsgenaue Nachtpanorama`,
  );
  requireMatch(
    "styles.css",
    new RegExp(`data-theme=["']light["'][^\\n]*data-direction=["']${direction}["'][^\\n]*horizon-artwork-day\\.horizon-artwork-${direction}`, "i"),
    `${direction}: helles Theme verwendet das richtungsgenaue Tagpanorama`,
  );
}
requireMatch("app.js", /data-panorama[\s\S]*?biome[^\n]*state\.horizonDirection/i, "Laufzeit protokolliert Biom und Blickrichtung als Panorama-ID");
requireMatch(
  "styles.css",
  /:root\[data-theme=["']light["']\]\s+\.horizon-stars-artwork\s*\{[^}]*display\s*:\s*none[^}]*opacity\s*:\s*0/is,
  "die hochauflösende Sternenebene verschwindet im hellen Theme vollständig",
);
requireMatch(
  "styles.css",
  /:root\[data-theme=["']light["']\]\s+\.star-field,[\s\S]*?\.horizon-constellations\s*\{[^}]*display\s*:\s*none[^}]*opacity\s*:\s*0/is,
  "alle dekorativen SVG-Sterne und Konstellationen verschwinden im hellen Theme",
);
requireMatch(
  "index.html",
  /horizon-polar-hd1\.png[\s\S]*horizon-stars-pixel-hd\.png[\s\S]*id=["']horizon-zehs-star["'][\s\S]*id=["']horizon-sol-body["'][\s\S]*id=["']horizon-yol-body["'][\s\S]*horizon-clouds-pixel-hd\.png[\s\S]*horizon-polar-hd2\.png/i,
  "Horizontebenen liegen in der Reihenfolge Hintergrund, Sterne, Himmelskörper, Wolken und Vordergrund",
);
requireMatch("styles.css", /\.horizon-atmosphere\s*\{[^}]*mix-blend-mode\s*:\s*screen\b/i, "Atmosphärenebenen blenden den schwarzen Bildgrund ohne Blur aus");
requireMatch("styles.css", /\.horizon-clouds-artwork\s*\{[^}]*opacity\s*:\s*0\.12\b/i, "Wolken bleiben stark transparent");
requireMatch("index.html", /id=["']horizon-irradiance["'][\s\S]*horizon-irradiance-warm[\s\S]*horizon-irradiance-cool[\s\S]*horizon-shimmer-a[\s\S]*horizon-shimmer-b/i, "Einstrahlung besitzt warme, kühle und zweifache Schimmerebenen");
requireMatch("index.html", /id=["']horizon-warm-field["'][\s\S]*id=["']horizon-cool-field["'][\s\S]*id=["']horizon-shimmer-spectrum["']/i, "Einstrahlung verwendet hochauflösende kontinuierliche Farbfelder");
requireMatch("index.html", /id=["']horizon-shimmer-noise["'][^>]*filterRes=["']3360 1120["'][\s\S]*<feTurbulence\b[^>]*numOctaves=["']3["']/i, "Schimmerrauschen wird mit hoher Filterauflösung erzeugt");
requireMatch("index.html", /<rect\b[^>]*class=["'][^"']*horizon-shimmer-a[^"']*["'][^>]*filter=["']url\(#horizon-shimmer-noise\)["']/i, "erste Schimmerebene ist ein glattes Vektorfeld statt Pixelkreuzen");
requireMatch("index.html", /<rect\b[^>]*class=["'][^"']*horizon-shimmer-b[^"']*["'][^>]*filter=["']url\(#horizon-shimmer-noise\)["']/i, "zweite Schimmerebene ist ein glattes Vektorfeld statt Pixelkreuzen");
requireMatch("styles.css", /\.horizon-irradiance\s*\{[^}]*image-rendering\s*:\s*auto[^}]*shape-rendering\s*:\s*geometricPrecision/is, "Einstrahlung wird nicht pixelig skaliert");
requireMatch("styles.css", /\.horizon-shimmer-a\s*\{[^}]*animation\s*:\s*horizon-shimmer-a\s+8\.4s\s+ease-in-out/is, "Schimmer bewegt sich kontinuierlich statt in Rasterstufen");
requireMatch("styles.css", /\.horizon-shimmer-b\s*\{[^}]*animation\s*:\s*horizon-shimmer-b\s+11\.6s\s+ease-in-out/is, "zweite Schimmerlage bewegt sich kontinuierlich");
reject("styles.css", /\.horizon-shimmer-(?:a|b)\s*\{[^}]*animation\s*:[^;]*steps\s*\(/is, "Einstrahlung verwendet keine pixeligen Animationsschritte");
requireMatch("styles.css", /--irradiance-warm\s*:\s*0[\s\S]*--irradiance-cool\s*:\s*0[\s\S]*--irradiance-shimmer\s*:\s*0/i, "Einstrahlung startet visuell vollständig deaktiviert");
requireMatch("app.js", /latitudeStrength:\s*Object\.freeze\(\{\s*0:\s*0,\s*30:\s*0\.64,\s*60:\s*1\s*\}\)/i, "Einstrahlung ist am Pol aus und bei 60 Grad stärker als bei 30 Grad");
requireMatch("app.js", /delayMs\s*:\s*2200[\s\S]*buildupMs\s*:\s*12000[\s\S]*sampleMs\s*:\s*200[\s\S]*continuityThresholdPx\s*:\s*12/i, "Einstrahlung baut sich fein abgetastet nach anhaltender Sichtbarkeit auf");
requireMatch("app.js", /function\s+buildIrradianceTimeline[\s\S]*?continuous[\s\S]*?previous\[bodyName\]\.dwellMs\s*\+\s*IRRADIANCE_MODEL\.sampleMs/i, "sichtbare Verweildauer wird unabhängig von Phasenlabels fortgeschrieben");
requireMatch("app.js", /data-irradiance-mode[\s\S]*--irradiance-warm[\s\S]*--irradiance-cool[\s\S]*--irradiance-shimmer/i, "der berechnete Einstrahlungszustand steuert die Live-Grafik");
requireMatch("index.html", /id=["']convection-field["'][^>]*orbit-convection-hd\.png/i, "Orbit-Konvektion verwendet eine hochauflösende RGBA-Textur");
requireMatch("index.html", /id=["']horizon-convection-field["'][^>]*horizon-convection-hd\.png/i, "Horizont-Konvektion verwendet eine hochauflösende RGBA-Textur");
reject("index.html", /class=["'][^"']*(?:convection-band|convection-shard|horizon-shards)\b/i, "alte niedrig aufgelöste Konvektionsflächen sind entfernt");
requireMatch("styles.css", /\.convection-artwork\s*\{[^}]*image-rendering\s*:\s*auto\b[^}]*mix-blend-mode\s*:\s*screen\b/is, "HD-Konvektion wird detailreich und transparent eingeblendet");
requireMatch("styles.css", /#horizon-view\[data-biome\]\s+\.biome-sky[\s\S]*?display\s*:\s*none/i, "alte biome-spezifische SVG-Himmel bleiben hinter den HD-Ebenen deaktiviert");
requireMatch("index.html", /class=["']horizon-sky-base["']\s+width=["']840["']\s+height=["']252["']/, "freigestellte Horizontbereiche besitzen eine ruhige Grundfläche");
requireMatch("index.html", /horizon-polar-hd1\.png[^>]*height=["']400["']/, "polare Hintergrundkante überlappt den Vordergrund ohne Spalt");
requireMatch("index.html", /horizon-temperate-hd1\.png[^>]*height=["']460["']/, "gemäßigte Hintergrundkante überlappt den Vordergrund ohne Spalt");
reject("index.html", /class=["'][^"']*horizon-sky-band\b/i, "alte Farbbänder scheinen nicht durch transparente Pixel hindurch");
requireMatch("styles.css", /--radius-md\s*:\s*10px\b/i, "grafische Felder verwenden einen konsistenten sanften Radius");

for (const name of [
  "ORBIT_GEOMETRY",
  "HORIZON_GEOMETRY",
  "HORIZON_DIRECTIONS",
  "HORIZON_LATITUDES",
  "HORIZON_PROJECTION_SCALE",
  "IRRADIANCE_MODEL",
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
  "getIrradianceDwellAt",
  "getHorizonIrradiance",
  "getSnapshot",
  "formatEraTime",
  "getLastRenderFrame",
  "getState",
  "ERA_CYCLE_CONTRACT",
]) {
  requireMatch("app.js", new RegExp(`\\b${name}\\b`), `${name} gehört zum gemeinsamen Geometrie-/Testvertrag`);
}

requireMatch("app.js", /era-horizon-direction/, "Blickrichtung wird unter dem vereinbarten localStorage-Schlüssel gespeichert");
requireMatch("app.js", /era-horizon-latitude/, "Breitenstufe wird unter dem vereinbarten localStorage-Schlüssel gespeichert");
requireMatch("app.js", /Object\.freeze\(\[0,\s*30,\s*60\]\)/, "nur die drei vereinbarten Breitenstufen sind wählbar");
requireMatch("app.js", /motion\s*===\s*["']zehs["']\s*\?\s*HORIZON_GEOMETRY\.maxLatitudeDegrees\s*-\s*safeDegrees\s*:\s*safeDegrees/i, "ZEHS erhält die nordsternartig invertierte Breitenhöhe");
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
  assert.match(declaration, /\b(?:none|steps\s*\(|ease-in-out\b)/i, `styles.css: Animation verwendet Rasterstufen oder den bewusst glatten Einstrahlungsverlauf: ${declaration}`);
}

console.log(
  JSON.stringify({
    checkedFiles: Object.keys(sources),
    directions: directionIds.length,
    forbiddenPatterns: forbiddenPatterns.length,
    artworkAssets: artworkSpecs.length,
    panoramaLayers: panoramaArtworkTags.length,
    orbitRendering: "geometricPrecision",
    horizonRendering: "crispEdges",
  }),
);
