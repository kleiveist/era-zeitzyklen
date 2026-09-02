"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
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
  { file: "horizon-stars-pixel-hd.png", minWidth: 2100, minHeight: 700, minBytes: 180_000, alpha: true },
  { file: "horizon-convection-hd.png", minWidth: 2100, minHeight: 700, alpha: true },
  { file: "orbit-convection-hd.png", minWidth: 1500, minHeight: 900, alpha: true },
  { file: "era-world-hd.png", minWidth: 600, minHeight: 600, alpha: true },
  { file: "sol-star-hd.png", minWidth: 600, minHeight: 600, alpha: true },
  { file: "yol-star-hd.png", minWidth: 600, minHeight: 600, alpha: true },
  { file: "zehs-star-hd.png", minWidth: 600, minHeight: 600, alpha: true },
  { file: "kor-moon-hd.png", minWidth: 1200, minHeight: 1200, minBytes: 1_000_000, alpha: true },
  { file: "kors-shard-hd.png", minWidth: 1200, minHeight: 1200, minBytes: 1_000_000, alpha: true },
];

const directionalBiomes = Object.freeze({
  polar: Object.freeze({ exactWidth: 2172, exactHeight: 724 }),
  temperate: Object.freeze({ exactWidth: 2172, exactHeight: 724 }),
  desert: Object.freeze({ exactWidth: 2172, exactHeight: 724 }),
});
const panoramaDirections = Object.freeze(["north", "east", "south", "west"]);
const panoramaThemes = Object.freeze(["night", "day"]);

for (const biome of ["polar", "temperate"]) {
  for (const direction of panoramaDirections) {
    artworkSpecs.push({
      file: `horizon-clouds-${biome}-${direction}-hd.png`,
      exactWidth: 2172,
      exactHeight: 724,
      minWidth: 2172,
      minHeight: 724,
      minBytes: 60_000,
      alpha: true,
    });
  }
}

function horizonArtworkFile(biome, direction, theme, layer) {
  const directionPart = direction === "north" ? "" : `-${direction}`;
  const themePart = theme === "day" ? "-day" : "";
  return `horizon-${biome}${directionPart}${themePart}-${layer}.png`;
}

for (const [biome, dimensions] of Object.entries(directionalBiomes)) {
  for (const direction of panoramaDirections) {
    for (const theme of panoramaThemes) {
      artworkSpecs.push({
        file: horizonArtworkFile(biome, direction, theme, "hd"),
        ...dimensions,
        minWidth: dimensions.exactWidth,
        minHeight: dimensions.exactHeight,
        runtime: false,
      });
      for (const layer of ["hd1", "hd2"]) {
        artworkSpecs.push({
          file: horizonArtworkFile(biome, direction, theme, layer),
          ...dimensions,
          minWidth: dimensions.exactWidth,
          minHeight: dimensions.exactHeight,
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
  if (spec.exactWidth) assert.equal(data.readUInt32BE(16), spec.exactWidth, `${spec.file}: exakte 3:1-Breite`);
  if (spec.exactHeight) assert.equal(data.readUInt32BE(20), spec.exactHeight, `${spec.file}: exakte 3:1-Höhe`);
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

function readPngPixels(file) {
  const data = fs.readFileSync(path.join(root, "assets", "images", file));
  const idatChunks = [];
  let width = 0;
  let height = 0;
  let colorType = 0;
  let offset = 8;
  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      colorType = chunk[9];
      assert.equal(chunk[8], 8, `${file}: Ebenenvertrag unterstützt 8-Bit-PNG`);
      assert.ok(colorType === 2 || colorType === 6, `${file}: Ebenenvertrag erwartet RGB oder RGBA`);
      assert.equal(chunk[12], 0, `${file}: Ebenenvertrag erwartet ein nicht-interlaced PNG`);
    } else if (type === "IDAT") {
      idatChunks.push(chunk);
    } else if (type === "IEND") {
      break;
    }
    offset += length + 12;
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
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

  const rgb = Buffer.alloc(width * height * 3);
  const alpha = Buffer.alloc(width * height, 255);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const source = pixel * bytesPerPixel;
    const target = pixel * 3;
    rgb[target] = pixels[source];
    rgb[target + 1] = pixels[source + 1];
    rgb[target + 2] = pixels[source + 2];
    if (bytesPerPixel === 4) alpha[pixel] = pixels[source + 3];
  }
  return { width, height, colorType, rgb, alpha };
}

const cloudMaskHashes = new Set();
const cloudCoverageByDirection = {};
for (const direction of panoramaDirections) {
  cloudCoverageByDirection[direction] = {};
  for (const biome of ["polar", "temperate"]) {
    const file = `horizon-clouds-${biome}-${direction}-hd.png`;
    const clouds = readPngPixels(file);
    const alphaSum = clouds.alpha.reduce((sum, alpha) => sum + alpha, 0);
    const coverage = alphaSum / (255 * clouds.width * clouds.height);
    cloudCoverageByDirection[direction][biome] = coverage;
    cloudMaskHashes.add(crypto.createHash("sha256").update(clouds.alpha).digest("hex"));
    if (biome === "polar") {
      assert.ok(coverage > 0.015 && coverage < 0.06, `${direction}: Polarhimmel besitzt nur wenige Wolken`);
    } else {
      assert.ok(coverage > 0.12 && coverage < 0.25, `${direction}: gemäßigter Himmel besitzt einige Wolken`);
    }
  }
  assert.ok(
    cloudCoverageByDirection[direction].polar < cloudCoverageByDirection[direction].temperate * 0.4,
    `${direction}: Polar bleibt deutlich wolkenärmer als Gemäßigt`,
  );
}
assert.equal(cloudMaskHashes.size, 8, "jede Biom-/Richtungskombination besitzt ein eigenes Wolkenmuster");

for (const biome of Object.keys(directionalBiomes)) {
  for (const direction of panoramaDirections) {
    const palettes = {};
    for (const theme of panoramaThemes) {
      const original = readPngPixels(horizonArtworkFile(biome, direction, theme, "hd"));
      const horizon = readPngPixels(horizonArtworkFile(biome, direction, theme, "hd1"));
      const foreground = readPngPixels(horizonArtworkFile(biome, direction, theme, "hd2"));
      palettes[theme] = { original, horizon, foreground };

      assert.equal(original.width, original.height * 3, `${biome}/${direction}/${theme}: Original ist ein echtes 3:1-Panorama`);
      assert.equal(horizon.width, original.width, `${biome}/${direction}/${theme}: Horizont besitzt Originalbreite`);
      assert.equal(horizon.height, original.height, `${biome}/${direction}/${theme}: Horizont besitzt Originalhöhe`);
      assert.equal(foreground.width, original.width, `${biome}/${direction}/${theme}: Vordergrund besitzt Originalbreite`);
      assert.equal(foreground.height, original.height, `${biome}/${direction}/${theme}: Vordergrund besitzt Originalhöhe`);
      assert.equal(original.colorType, 2, `${biome}/${direction}/${theme}: kombiniertes Original bleibt RGB`);
      assert.equal(horizon.colorType, 6, `${biome}/${direction}/${theme}: Horizont besitzt echte RGBA-Transparenz`);
      assert.equal(foreground.colorType, 6, `${biome}/${direction}/${theme}: Vordergrund besitzt echte RGBA-Transparenz`);
      assert.ok(horizon.rgb.equals(original.rgb), `${biome}/${direction}/${theme}: hd1 verwendet ausschließlich Originalpixel`);
      assert.ok(foreground.rgb.equals(original.rgb), `${biome}/${direction}/${theme}: hd2 verwendet ausschließlich Originalpixel`);

      let foregroundPixels = 0;
      let foregroundPixelsTopThird = 0;
      let hardPixelEdges = true;
      let complementaryLayers = true;
      const topThirdHeight = Math.floor(original.height / 3);
      for (let pixel = 0; pixel < original.width * original.height; pixel += 1) {
        const horizonAlpha = horizon.alpha[pixel];
        const foregroundAlpha = foreground.alpha[pixel];
        if (
          (horizonAlpha !== 0 && horizonAlpha !== 255) ||
          (foregroundAlpha !== 0 && foregroundAlpha !== 255)
        ) hardPixelEdges = false;
        if (horizonAlpha + foregroundAlpha !== 255) complementaryLayers = false;
        if (foregroundAlpha === 255) {
          foregroundPixels += 1;
          if (Math.floor(pixel / original.width) < topThirdHeight) foregroundPixelsTopThird += 1;
        }
      }
      assert.ok(hardPixelEdges, `${biome}/${direction}/${theme}: Ebenenkanten bleiben harte Pixelkanten`);
      assert.ok(complementaryLayers, `${biome}/${direction}/${theme}: hd1 und hd2 teilen jeden Originalpixel verlustfrei`);
      const foregroundRatio = foregroundPixels / (original.width * original.height);
      const foregroundTopRatio = foregroundPixelsTopThird / (original.width * topThirdHeight);
      assert.ok(foregroundRatio > 0.05 && foregroundRatio < 0.55, `${biome}/${direction}/${theme}: Vordergrund bleibt eine gezielte Tiefenebene`);
      assert.ok(foregroundTopRatio < 0.01, `${biome}/${direction}/${theme}: keine falsche Bergwand ragt in das obere Panoramadrittel`);
    }

    assert.ok(
      palettes.day.horizon.alpha.equals(palettes.night.horizon.alpha),
      `${biome}/${direction}: Tag und Nacht verwenden dieselbe Horizontmaske`,
    );
    assert.ok(
      palettes.day.foreground.alpha.equals(palettes.night.foreground.alpha),
      `${biome}/${direction}: Tag und Nacht verwenden dieselbe Vordergrundmaske`,
    );
    let changedPixels = 0;
    for (let pixel = 0; pixel < palettes.day.original.width * palettes.day.original.height; pixel += 1) {
      const rgbOffset = pixel * 3;
      if (
        palettes.day.original.rgb[rgbOffset] !== palettes.night.original.rgb[rgbOffset] ||
        palettes.day.original.rgb[rgbOffset + 1] !== palettes.night.original.rgb[rgbOffset + 1] ||
        palettes.day.original.rgb[rgbOffset + 2] !== palettes.night.original.rgb[rgbOffset + 2]
      ) changedPixels += 1;
    }
    assert.ok(
      changedPixels > palettes.day.original.width * palettes.day.original.height * 0.5,
      `${biome}/${direction}: Tag und Nacht sind eigenständige Farbpaletten derselben Szene`,
    );
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
requireMatch("phases.js", /\bCHRONICLE_PRESENTATION_MS\s*=\s*360000\b/, "der Erklärmodus bleibt auf sechs Minuten eingestellt");
requireMatch("phases.js", /\bCHRONICLE_CONVECTION_MS\s*=\s*32000\b/, "die Erklärmodus-Konvektion erhält weiter 32 Sekunden");
requireMatch("phases.js", /\bINSPECTION_MILLISECONDS_PER_UM\s*=\s*5000\b/, "der Prüfmodus verwendet fünf Sekunden pro Um");
requireMatch("phases.js", /\bINSPECTION_PRESENTATION_MS\s*=\s*TOTAL_UM\s*\*\s*INSPECTION_MILLISECONDS_PER_UM\b/, "die 64 Stunden werden aus 46.080 Um berechnet");
requireMatch("phases.js", /\bGAMEPLAY_MINUTES_PER_UM\s*=\s*15\b/, "die Spielsimulation übernimmt 15 Minuten pro Um aus dem Gameplay-Dokument");
requireMatch("phases.js", /\bGAMEPLAY_MILLISECONDS_PER_UM\s*=\s*GAMEPLAY_MINUTES_PER_UM\s*\*\s*60\s*\*\s*1000\b/, "die Gameplay-Grundzeit wird ohne handgeschriebenen Millisekundenwert abgeleitet");
requireMatch("phases.js", /\bGAMEPLAY_PRESENTATION_MS\s*=\s*TOTAL_UM\s*\*\s*GAMEPLAY_MILLISECONDS_PER_UM\b/, "die 480 Spieltage werden aus 46.080 Um berechnet");
const gameplayTimeDocument = fs.readFileSync(
  path.join(root, "docs", "00-zeitdarstellung", "zeitdarstellung-im-spiel.md"),
  "utf8",
);
assert.match(gameplayTimeDocument, /Offene Welt und Außenbereiche[^\n]*1,0×[^\n]*15 Minuten/, "Gameplay-Doku: offene Welt verwendet 15 Minuten pro Um");
assert.match(gameplayTimeDocument, /gewöhnliche Innenbereiche[^\n]*1,5×[^\n]*10 Minuten/, "Gameplay-Doku: Innenraumzeit folgt weiterhin dem Faktor 1,5×");
assert.match(gameplayTimeDocument, /Große Dungeons[^\n]*2,0×[^\n]*7 Minuten 30 Sekunden/, "Gameplay-Doku: Dungeonzeit folgt weiterhin dem Faktor 2×");
assert.match(gameplayTimeDocument, /Schnellreise[^\n]*60× bis 600×[^\n]*15 bis 1,5 Sekunden/, "Gameplay-Doku: Schnellreisezeiten sind aus der neuen Basis abgeleitet");
assert.match(gameplayTimeDocument, /Kurzes Warten[^\n]*900×[^\n]*1 Um dauert 1 Sekunde/, "Gameplay-Doku: Wartezeit ist aus der neuen Basis abgeleitet");
assert.match(gameplayTimeDocument, /Schlafen[^\n]*1\.800×[^\n]*1 Um dauert 0,5 Sekunden/, "Gameplay-Doku: Schlafzeit ist aus der neuen Basis abgeleitet");
requireMatch("phases.js", /\bdefaultTimeMode\s*:\s*["']chronicle["']/, "die sechsminütige Zeitfahrt bleibt Standard");
requireMatch("phases.js", /\bUM_PER_TAN\s*=\s*16\b/, "ein Tan besteht aus 16 Um");
requireMatch("phases.js", /\bTAN_PER_DIR\s*=\s*8\b/, "ein Dir besteht aus 8 Tan");
requireMatch("phases.js", /\bDIR_PER_MOHN\s*=\s*36\b/, "ein Mohn besteht aus 36 Dir");
requireMatch("phases.js", /\bMOHN_PER_CYCLE\s*=\s*10\b/, "ein Konvektionszyklus besteht aus 10 Mohn");
requireMatch("phases.js", /\beraRotationDegreesPerSecond\s*:\s*5\.6\b/, "Eras Eigenrotation ist auf 5,6 Grad pro Sekunde verdoppelt");
requireMatch("phases.js", /\bschemaVersion\s*:\s*4\b/, "Szenarioschema schützt Zeitmodi und kontinuierliche Übergänge");
requireMatch("app.js", /template\.category\s*===\s*["']synchron["'][\s\S]*?mode\.eraRotationDegreesPerUm[\s\S]*?amplitude\s*=\s*0\b/, "alle synchronen Prüfphasen bleiben exakt an Eras Winkelgeschwindigkeit gekoppelt");
requireMatch("app.js", /template\.motion\s*===\s*["']fixed-orbit["'][\s\S]*?if\s*\(linear\)[\s\S]*?drift\s*=\s*0[\s\S]*?amplitude\s*=\s*0/, "weltfest stehende Sonnen erhalten in linearen Modi keine Winkelbewegung");
requireMatch("app.js", /startRadialOffset[\s\S]*endRadialOffset[\s\S]*startIntensity[\s\S]*endIntensity/i, "Radialposition und Intensität besitzen explizite kontinuierliche Segmentenden");
requireMatch("app.js", /finalCelestialStates[\s\S]*initialCelestialStates/i, "vollständige Zyklen übergeben ihre letzten Sternpositionen getrennt je Zeitmodus");

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
reject(
  "index.html",
  /<path\b[^>]*d=["']M20 52V20H52M788 20H820V52M20 468V500H52M788 500H820V468["']/i,
  "die vier pixeligen rechten Winkel liegen nicht mehr über der Astralkarte",
);
requireMatch(
  "styles.css",
  /\.sky-stage\s*,\s*\.horizon-stage\s*\{[^}]*border\s*:\s*4px\s+solid/is,
  "der eigentliche Rahmen der Astralkarte bleibt erhalten",
);
reject(
  "styles.css",
  /\.sky-stage\s*\{[^}]*border\s*:\s*0/is,
  "der Astralkartenrahmen wird nicht mehr irrtümlich entfernt",
);
assert.match(horizonTag, /\bdata-biome\s*=\s*["']polar["']/i, "Horizont startet mit der polaren Eiswelt");
assert.match(horizonTag, /\bdata-direction\s*=\s*["']north["']/i, "Horizont startet mit dem neuen Nordpanorama");
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

const timeModeTag = openingTag("index.html", "time-mode");
assert.match(timeModeTag, /^<select\b/i, "Zeitmodus ist ein natives, tastaturbedienbares Auswahlfeld");
assert.match(timeModeTag, /\baria-label\s*=/i, "Zeitmodus besitzt einen zugänglichen Namen");
requireMatch("index.html", /id=["']time-mode["'][\s\S]*?<option\b[^>]*value=["']chronicle["'][\s\S]*?<option\b[^>]*value=["']inspection["'][\s\S]*?<option\b[^>]*value=["']gameplay["']/i, "Dropdown enthält Erklär-, Prüf- und Spielsimulationsmodus");
requireMatch("index.html", /5\s*s\/Um\s*·\s*64\s*Stunden/i, "Prüfoption benennt 5 s/Um und 64 Stunden eindeutig");
requireMatch("index.html", /15\s*min\/Um\s*·\s*Spielsimulation/i, "Gameplay-Option benennt die dokumentierte Grundgeschwindigkeit eindeutig");
requireMatch("index.html", /<option\b[^>]*value=["']4["'][^>]*>[\s\S]*?<option\b[^>]*value=["']6["'][^>]*>\s*6×/i, "6× steht unterhalb der vorhandenen Wiedergabetempi");
requireMatch("index.html", /<label\b[^>]*for=["']cycle-jump-input["'][^>]*>\s*Konvektionsabschluss\s*<\/label>/i, "direkte Prüfpfadauswahl heißt Konvektionsabschluss");
reject("index.html", />\s*Zyklusnummer\s*</i, "veraltete Oberflächenbezeichnung Zyklusnummer ist entfernt");
for (const controlId of ["timeline-zoom-out", "timeline-zoom-in", "previous-cycle", "next-cycle"]) {
  assert.match(openingTag("index.html", controlId), /^<button\b/i, `${controlId}: Timeline-Steuerung ist eine echte Schaltfläche`);
}
requireMatch("styles.css", /\.phase-segment-detail::before\s*\{[^}]*width\s*:\s*var\(--segment-progress[^}]*height\s*:\s*100%/is, "großes Abschnittssiegel füllt sich flächig von links nach rechts");
requireMatch("styles.css", /:root\[data-theme="light"\]\s+\.phase-segment\.is-active\s*\{[^}]*background\s*:\s*linear-gradient\([^}]*#fffef9/is, "aktives Phasen- und Detailfeld bleibt im Hellmodus ausdrücklich hell");
requireMatch("styles.css", /:root\[data-theme="light"\]\s+\.phase-segment-detail::before\s*\{[^}]*opacity\s*:\s*0\.1/is, "Detailfortschritt dunkelt die helle Fläche nur dezent ab");
requireMatch("styles.css", /\.cycle-segment::before\s*\{[^}]*width\s*:\s*var\(--cycle-progress/is, "Zyklussiegel besitzt eine Gesamtfortschrittsfüllung");
requireMatch("styles.css", /:root\[data-theme="light"\]\s+\.cycle-segment\s*\{[^}]*background\s*:\s*linear-gradient\([^}]*var\(--paper-inset\)/is, "große Zyklusschalter besitzen eine ausdrücklich helle Theme-Fläche");
requireMatch("styles.css", /\.phase-track\[data-time-kind="linear-world-time"\][^{]*\{[^}]*cursor\s*:\s*ew-resize[^}]*touch-action\s*:\s*pan-y/is, "beide linearen Zeitpfade kennzeichnen horizontales Pointer-Scrubbing");
requireMatch("app.js", /state\.playbackAnchorMs\s*\+\s*elapsed\s*\*\s*state\.playbackRate/i, "rAF-Zeitstempel bestimmt die Wiedergabe analytisch");
reject("app.js", /clamp\(timestamp\s*-\s*state\.lastFrameAt\s*,\s*0\s*,\s*120\)/i, "gedrosselte Frames verlieren keine Weltzeit durch die alte 120-ms-Kappung");

const autoCycleTag = openingTag("index.html", "auto-cycle");
assert.match(autoCycleTag, /^<button\b/i, "Autozyklus ist eine echte Schaltfläche");
assert.match(autoCycleTag, /\baria-pressed\s*=\s*["']false["']/i, "Autozyklus startet deaktiviert");
assert.match(autoCycleTag, /\baria-label\s*=/i, "Autozyklus besitzt einen zugänglichen Namen");
requireMatch("index.html", /\bid\s*=\s*["']icon-auto-cycle["'][\s\S]*?<circle\b[^>]*cx=["']7\.5["'][\s\S]*?<circle\b[^>]*cx=["']16\.5["']/i, "Doppelkreis-Icon zeigt zwei nebeneinanderliegende Kreise");
requireMatch("index.html", /id=["']play-toggle["'][\s\S]*id=["']auto-cycle["'][\s\S]*id=["']restart["']/i, "Doppelkreis-Schalter sitzt rechts neben Abspielen/Pause und vor Zum Anfang");
requireMatch("styles.css", /\.auto-cycle-toggle\s*\{[^}]*width\s*:\s*48px\b[^}]*flex\s*:\s*0\s+0\s+48px\b/is, "Doppelkreis-Schalter bleibt eine kleine quadratische Schaltfläche");
requireMatch("app.js", /if\s*\(state\.autoCycle\)[\s\S]*?targetCycleIndex[\s\S]*?ensureCycle\(targetCycleIndex\)[\s\S]*?state\.cycleIndex\s*=\s*targetCycleIndex[\s\S]*?requestAnimationFrame\(tick\)/i, "aktiver Endlosmodus schließt reproduzierbar und ohne Pause an den nächsten registrierten Zyklus an");

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
  "celestial-instrument",
  "celestial-selector-toggle",
  "celestial-selector-menu",
  "celestial-selector-image",
  "celestial-class",
  "celestial-distance",
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
  "horizon-sol-heat-noise",
  "horizon-sol-embers",
  "horizon-yol-mana-noise",
  "horizon-yol-blue-points",
  "horizon-yol-frost-crystals",
  "horizon-yol-snow",
  "horizon-yol-icicles",
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
  "biome-sky",
  "polar-glacier-light",
  "temperate-forest-front",
  "desert-dunes-light",
  "zehs-point",
  "zehs-point-core",
  "zehs-instrument",
  "celestial-selector",
  "celestial-selector-toggle",
  "celestial-selector-menu",
  "celestial-selector-option",
  "instrument-rail",
  "zehs-panel",
]) {
  requireMatch("index.html", new RegExp(`\\bclass\\s*=\\s*["'][^"']*\\b${className}\\b`, "i"), `${className} gehört zur hochauflösenden Pixelkulisse`);
}

reject("index.html", /class=["'][^"']*\bhorizon-runes\b/i, "dekorative Pixelrunen oberhalb der Kompassleiste sind entfernt");
reject("index.html", /class=["'][^"']*\bhorizon-body-label\b/i, "Sol und Yol bleiben im Horizontbild unbeschriftet");
reject(
  "index.html",
  /id=["']horizon-zehs-star["'][\s\S]{0,600}<text\b[^>]*>\s*ZEHS\s*<\/text>/i,
  "ZEHS bleibt im Horizontbild unbeschriftet",
);

for (const asset of artworkSpecs) {
  if (asset.runtime === false) continue;
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
assert.equal(panoramaArtworkTags.length, 48, "vier Richtungen, drei Biome, zwei Theme-Slots und zwei Ebenen ergeben exakt 48 Panoramaslots");

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
        const matchingTags = [
          ...sources["index.html"].matchAll(
            new RegExp(`<image\\b[^>]*href=["']assets/images/${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`, "gi"),
          ),
        ];
        assert.equal(matchingTags.length, 1, `${biome}/${direction}/${theme}/${layer}: jede Palette besitzt genau einen eigenen Slot`);
        assert.match(
          matchingTags[0][0],
          /\bwidth=["']840["'][^>]*\bheight=["']280["']/i,
          `${biome}/${direction}/${theme}/${layer}: 3:1-Layer wird ohne Richtungsbeschnitt gerendert`,
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
  /:root\[data-theme=["']dark["']\]\s+#horizon-view\[data-direction=["']north["']\]\s+\.horizon-artwork-night\.horizon-artwork-north\s*\{[^}]*filter\s*:\s*brightness\(1\.4\)/is,
  "alle drei Nordpanoramen erhalten ausschließlich im dunklen Theme einen Helligkeitsausgleich",
);
requireMatch(
  "styles.css",
  /:root\[data-theme=["']light["']\]\s+\.star-field,[\s\S]*?\.horizon-constellations\s*\{[^}]*display\s*:\s*none[^}]*opacity\s*:\s*0/is,
  "alle dekorativen SVG-Sterne und Konstellationen verschwinden im hellen Theme",
);
requireMatch(
  "index.html",
  /horizon-polar-hd1\.png[\s\S]*horizon-stars-pixel-hd\.png[\s\S]*id=["']horizon-zehs-star["'][\s\S]*id=["']horizon-sol-body["'][\s\S]*id=["']horizon-yol-body["'][\s\S]*horizon-clouds-polar-north-hd\.png[\s\S]*horizon-clouds-temperate-west-hd\.png[\s\S]*horizon-polar-hd2\.png/i,
  "Horizontebenen liegen in der Reihenfolge Hintergrund, Sterne, Himmelskörper, Wolken und Vordergrund",
);
requireMatch("styles.css", /\.horizon-atmosphere\s*\{[^}]*mix-blend-mode\s*:\s*screen\b/i, "Atmosphärenebenen blenden den schwarzen Bildgrund ohne Blur aus");
requireMatch("styles.css", /\.horizon-clouds-artwork\s*\{[^}]*opacity\s*:\s*0\.12\b/i, "Wolken bleiben stark transparent");
assert.equal(
  [...sources["index.html"].matchAll(/<image\b[^>]*\bclass=["'][^"']*\bhorizon-clouds-artwork\b[^"']*["'][^>]*>/gi)].length,
  8,
  "Polar und Gemäßigt besitzen je vier richtungsgenaue Wolkenebenen",
);
for (const biome of ["polar", "temperate"]) {
  for (const direction of panoramaDirections) {
    requireMatch(
      "styles.css",
      new RegExp(`#horizon-view\\[data-biome=["']${biome}["']\\]\\[data-direction=["']${direction}["']\\]\\s+\\.horizon-clouds-${biome}\\.horizon-clouds-${direction}`, "i"),
      `${biome}/${direction}: exakt passendes Wolkenmuster wird eingeblendet`,
    );
  }
}
requireMatch(
  "styles.css",
  /#horizon-view\[data-biome=["']desert["']\]\s+\.horizon-clouds-artwork\s*\{[^}]*display\s*:\s*none[^}]*opacity\s*:\s*0/is,
  "die Wüste blendet Wolken ausdrücklich vollständig aus",
);
reject("index.html", /horizon-clouds-pixel-hd\.png/i, "die frühere gemeinsame Wolkenebene wird nicht mehr verwendet");
reject("index.html", /horizon-clouds-desert-/i, "für die Wüste existiert keine Wolkenebene");
requireMatch("index.html", /id=["']horizon-irradiance["'][\s\S]*horizon-sol-effects[\s\S]*horizon-irradiance-warm[\s\S]*horizon-sol-heat-noise[\s\S]*horizon-sol-embers-a[\s\S]*horizon-sol-embers-b/i, "Sol besitzt getrennte Farb-, Hitzeflimmer- und zweifache Funkenlagen");
requireMatch("index.html", /id=["']horizon-irradiance["'][\s\S]*horizon-yol-effects[\s\S]*horizon-irradiance-cool[\s\S]*horizon-yol-mana-noise[\s\S]*horizon-yol-mana-veil-a[\s\S]*horizon-yol-mana-veil-b/i, "Yol besitzt getrennte Farb-, Mana- und Schleierlagen");
requireMatch("index.html", /horizon-yol-blue-points[\s\S]*horizon-yol-frost-crystals[\s\S]*horizon-yol-snow-a[\s\S]*horizon-yol-snow-b[\s\S]*horizon-yol-icicles/i, "Yols höhere Stufen enthalten blaue Punkte, Frost, Schnee und Eiszapfen");
requireMatch("index.html", /horizon-dual-interference[\s\S]*horizon-shimmer-a[\s\S]*horizon-shimmer-b/i, "gemeinsame Sichtbarkeit besitzt zwei eigene Interferenzlagen");
requireMatch("index.html", /id=["']horizon-warm-field["'][\s\S]*id=["']horizon-cool-field["'][\s\S]*id=["']horizon-shimmer-spectrum["']/i, "Einstrahlung verwendet hochauflösende kontinuierliche Farbfelder");
requireMatch("index.html", /id=["']horizon-shimmer-noise["'][^>]*filterRes=["']3360 1120["'][\s\S]*<feTurbulence\b[^>]*numOctaves=["']3["']/i, "Schimmerrauschen wird mit hoher Filterauflösung erzeugt");
requireMatch("index.html", /id=["']horizon-sol-heat-noise["'][^>]*filterRes=["']3360 1120["'][\s\S]*id=["']horizon-yol-mana-noise["'][^>]*filterRes=["']3360 1120["']/i, "Sol-Hitze und Yol-Mana verwenden getrennte hochauflösende Filter");
requireMatch("index.html", /id=["']horizon-sol-spark-shape["'][\s\S]*fill=["']#ff542f["'][\s\S]*fill=["']#ffd05a["']/i, "Sols gestaffelte Funken verwenden rote und glühend gelbe Vektorfarben");
requireMatch("index.html", /id=["']horizon-yol-snowflake-shape["'][\s\S]*stroke=["']#a9f4ff["'][\s\S]*fill=["']url\(#horizon-yol-ice\)["']/i, "Yols Kältestufen verwenden gezeichnete Schneeflocken, Frost und Eis");
requireMatch("index.html", /<rect\b[^>]*class=["'][^"']*horizon-shimmer-a[^"']*["'][^>]*filter=["']url\(#horizon-shimmer-noise\)["']/i, "erste Schimmerebene ist ein glattes Vektorfeld statt Pixelkreuzen");
requireMatch("index.html", /<rect\b[^>]*class=["'][^"']*horizon-shimmer-b[^"']*["'][^>]*filter=["']url\(#horizon-shimmer-noise\)["']/i, "zweite Schimmerebene ist ein glattes Vektorfeld statt Pixelkreuzen");
requireMatch("styles.css", /\.horizon-irradiance\s*\{[^}]*image-rendering\s*:\s*auto[^}]*shape-rendering\s*:\s*geometricPrecision/is, "Einstrahlung wird nicht pixelig skaliert");
requireMatch("styles.css", /\.horizon-shimmer-a\s*\{[^}]*animation\s*:\s*horizon-shimmer-a\s+8\.4s\s+ease-in-out/is, "Schimmer bewegt sich kontinuierlich statt in Rasterstufen");
requireMatch("styles.css", /\.horizon-shimmer-b\s*\{[^}]*animation\s*:\s*horizon-shimmer-b\s+11\.6s\s+ease-in-out/is, "zweite Schimmerlage bewegt sich kontinuierlich");
reject("styles.css", /\.horizon-shimmer-(?:a|b)\s*\{[^}]*animation\s*:[^;]*steps\s*\(/is, "Einstrahlung verwendet keine pixeligen Animationsschritte");
requireMatch("styles.css", /--irradiance-warm\s*:\s*0[\s\S]*--irradiance-sol-heat\s*:\s*0[\s\S]*--irradiance-yol-mana\s*:\s*0[\s\S]*--irradiance-yol-icicles\s*:\s*0[\s\S]*--irradiance-dual\s*:\s*0/i, "alle Effektstufen starten visuell vollständig deaktiviert");
requireMatch("styles.css", /\.horizon-irradiance-warm,[\s\S]*?\.horizon-sol-heat-noise,[\s\S]*?\.horizon-sol-embers,[\s\S]*?\.horizon-yol-mana-noise,[\s\S]*?\.horizon-yol-snow,[\s\S]*?\.horizon-yol-icicles,[\s\S]*?\.horizon-dual-interference\s*\{[^}]*transition\s*:\s*opacity\s+900ms\s+ease-in-out/is, "mehrere Effektlagen besitzen eine weiche Aktivierungsblende");
requireMatch("styles.css", /:root\[data-theme=["']light["']\][\s\S]*?\.horizon-yol-frost-crystals,[\s\S]*?\.horizon-yol-snow,[\s\S]*?\.horizon-yol-icicles,[\s\S]*?\.horizon-dual-interference\s*\{[^}]*mix-blend-mode\s*:\s*multiply/is, "Frost, Schnee, Eis und Interferenz bleiben im hellen Theme kontrastreich");
requireMatch("app.js", /activationDelayUm\s*:\s*2[\s\S]*activationFloor\s*:\s*0\.08[\s\S]*buildupUm\s*:\s*6[\s\S]*heightFloor\s*:\s*0\.28[\s\S]*sampleUm\s*:\s*0\.05/i, "Einstrahlung verwendet die exakte Zwei-Um-Schwelle und weltzeitbasierte Abstufung");
requireMatch("app.js", /function\s+advanceIrradianceHistory[\s\S]*?previous\.dwellUm\s*\+\s*elapsedUm[\s\S]*?getIrradianceBuildup\(dwellUm\)/i, "sichtbare Um werden phasenübergreifend innerhalb des aktiven Zyklus fortgeführt");
requireMatch("app.js", /Dwell-Um is the source of truth[\s\S]*?const\s+buildup\s*=\s*visible\s*\?\s*getIrradianceBuildup\(dwellUm\)\s*:\s*0/i, "die Zwei-Um-Schwelle wird aus sichtbaren Um statt aus einem veralteten Cachewert bestimmt");
requireMatch("app.js", /projectionHeight\s*\/[\s\S]*HORIZON_GEOMETRY\.maxSkyHeight[\s\S]*heightMaximum[\s\S]*buildup\s*\*\s*heightMaximum/i, "das Effektmaximum folgt der tatsächlichen Höhe des Himmelskörpers");
requireMatch("index.html", /id=["']horizon-cool-field["'][\s\S]*?#347cff[\s\S]*?#203de8/i, "Yols Einstrahlungsfeld verwendet die klarere blaue Palette");
requireMatch("app.js", /--irradiance-cool[\s\S]*?horizonIrradiance\.cool\s*\*\s*0\.72/i, "Yols blaue Grundwirkung ist sichtbar verstärkt");
requireMatch("app.js", /data-sol-effect-stage[\s\S]*data-yol-effect-stage[\s\S]*--irradiance-sol-heat[\s\S]*--irradiance-sol-sparks[\s\S]*--irradiance-yol-mana[\s\S]*--irradiance-yol-snow[\s\S]*--irradiance-yol-icicles/i, "der berechnete Stufenplan steuert alle Live-Grafikebenen");
requireMatch("index.html", /id=["']convection-field["'][^>]*orbit-convection-hd\.png/i, "Orbit-Konvektion verwendet eine hochauflösende RGBA-Textur");
requireMatch("index.html", /id=["']horizon-convection-field["'][^>]*horizon-convection-hd\.png/i, "Horizont-Konvektion verwendet eine hochauflösende RGBA-Textur");
reject("index.html", /class=["'][^"']*(?:convection-band|convection-shard|horizon-shards)\b/i, "alte niedrig aufgelöste Konvektionsflächen sind entfernt");
requireMatch("styles.css", /\.convection-artwork\s*\{[^}]*image-rendering\s*:\s*auto\b[^}]*mix-blend-mode\s*:\s*screen\b/is, "HD-Konvektion wird detailreich und transparent eingeblendet");
requireMatch("styles.css", /#horizon-view\[data-biome\]\s+\.biome-sky[\s\S]*?display\s*:\s*none/i, "alte biome-spezifische SVG-Himmel bleiben hinter den HD-Ebenen deaktiviert");
requireMatch("index.html", /class=["']horizon-sky-base["']\s+width=["']840["']\s+height=["']252["']/, "freigestellte Horizontbereiche besitzen eine ruhige Grundfläche");
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
  "MOON_ORBIT_MODEL",
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
  "isMoonOccludedByEra",
  "getViewBasis",
  "projectOrbitPointToHorizon",
  "getMoonObserverBasis",
  "projectMoonToHorizon",
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
requireMatch("index.html", /<dt>S-Int<\/dt><dd\b[^>]*>nicht definiert<\/dd>/i, "für ZEHS wird keine S-Int erfunden");
requireMatch("index.html", /<dt>Namensbezug<\/dt><dd\b[^>]*>Zehsen<\/dd>/i, "ZEHS dokumentiert den Namensbezug");
requireMatch("app.js", /distanceAu\s*:\s*40\b/, "ZEHS-Entfernung gehört zum zentralen Parametervertrag");
requireMatch("app.js", /rotationReference\s*:\s*["'][^"']*vollständige Rotation Eras/i, "ZEHS dokumentiert den Rotationsbezug");
const celestialToggleTag = openingTag("index.html", "celestial-selector-toggle");
assert.match(celestialToggleTag, /^<button\b/i, "aktuelles Himmelskörperbild ist eine echte Schaltfläche");
assert.match(celestialToggleTag, /\baria-haspopup\s*=\s*["']listbox["']/i, "Bildschalter kündigt sein Listbox-Dropdown an");
assert.match(celestialToggleTag, /\baria-expanded\s*=\s*["']false["']/i, "Bildschalter startet geschlossen");
assert.match(celestialToggleTag, /\baria-controls\s*=\s*["']celestial-selector-menu["']/i, "Bildschalter referenziert sein Dropdown");
const celestialMenuTag = openingTag("index.html", "celestial-selector-menu");
assert.match(celestialMenuTag, /\brole\s*=\s*["']listbox["']/i, "Himmelskörper-Dropdown ist eine Listbox");
assert.match(celestialMenuTag, /\bhidden\b/i, "Himmelskörper-Dropdown startet verborgen");
const celestialOptionSpecs = [
  ["zehs", "zehs-star-hd.png"],
  ["sol", "sol-star-hd.png"],
  ["yol", "yol-star-hd.png"],
  ["era", "era-world-hd.png"],
  ["kor", "kor-moon-hd.png"],
  ["kors-shard", "kors-shard-hd.png"],
];
for (const [optionId, imageFile] of celestialOptionSpecs) {
  const optionTag = openingTag("index.html", `celestial-option-${optionId}`);
  assert.match(optionTag, /^<button\b/i, `${optionId}: Bildoption ist eine echte Schaltfläche`);
  assert.match(optionTag, /\brole\s*=\s*["']option["']/i, `${optionId}: Bildoption besitzt ihre Listbox-Rolle`);
  requireMatch(
    "index.html",
    new RegExp(`id=["']celestial-option-${optionId}["'][\\s\\S]*?<img\\b[^>]*src=["']assets/images/${imageFile.replace(".", "\\.")}["']`, "i"),
    `${optionId}: Bildoption verwendet das zugehörige HD-Bild`,
  );
}
requireMatch("styles.css", /\.celestial-selector-menu\s*\{[^}]*grid-template-columns\s*:\s*repeat\(3\s*,/is, "Dropdown ordnet die Bildfelder als kompaktes Raster an");
requireMatch("styles.css", /\.zehs-instrument-heading\s+img\s*\{[^}]*width\s*:\s*56px[^}]*height\s*:\s*56px/is, "Hauptbild und Dropdownbilder verwenden denselben quadratischen Rahmen");
requireMatch("app.js", /function\s+updateCelestialInstrument\s*\([^)]*frame[\s\S]*?getCelestialInstrumentValues\([^,]+,\s*frame\)/i, "Messkarte wird aus dem gemeinsamen Render-Frame gefüllt");
requireMatch("index.html", /id=["']kor-body["'][\s\S]*?kor-moon-hd\.png[\s\S]*?id=["']kors-shard-body["'][\s\S]*?kors-shard-hd\.png/i, "Kor und Kor’s Shard besitzen getrennte HD-Kartenkörper");
requireMatch("index.html", /id=["']horizon-kor-body["'][\s\S]*?kor-moon-hd\.png[\s\S]*?id=["']horizon-kors-shard-body["'][\s\S]*?kors-shard-hd\.png/i, "beide Kor-Welten besitzen getrennte unbeschriftete Horizontkörper");
requireMatch("index.html", /id=["']kor-orbit-rear["'][\s\S]*?id=["']kors-shard-orbit-rear["'][\s\S]*?id=["']kor-orbit-front["'][\s\S]*?id=["']kors-shard-orbit-front["']/i, "beide Polbahnen unterscheiden Vorder- und Rückseite");
requireMatch("styles.css", /\.moon-orbit-rear\s*\{[^}]*stroke-dasharray[^}]*opacity/is, "rückwärtige Polbahnen sind gestrichelt und zurückgenommen");
requireMatch("app.js", /function\s+solveEccentricAnomaly[\s\S]*?eccentricity\s*\*\s*Math\.sin\(anomaly\)/i, "Kor-Weltpositionen folgen einer kontinuierlichen elliptischen Kepler-Lösung");
requireMatch("app.js", /worldPosition\s*=\s*Object\.freeze\(\{[\s\S]*?x:[\s\S]*?y:[\s\S]*?z:/i, "Kor-Weltzustände besitzen echte 3D-Weltkoordinaten");
requireMatch("app.js", /orbitalPassesPerCycle\s*:\s*2\b/i, "beide Kor-Welten besitzen zwei Sichtpassagen pro Zyklus");
requireMatch("app.js", /initialPhaseOffsetRadians\s*:\s*-?[\d.]+[\s\S]*?initialPhaseOffsetRadians\s*:\s*-?[\d.]+/i, "beide Kor-Welten besitzen getrennte Phasenpläne");
requireMatch("app.js", /alignmentCycleNumber\s*:\s*300[\s\S]*?alignmentCycleUm\s*:\s*config\.regularUm\s*\+\s*config\.convectionDurationUm\s*\/\s*2/i, "300er-Ausrichtung liegt in der Mitte der dokumentierten Konvektion");
requireMatch("app.js", /setBodyElementState\([\s\S]*?visualScale:\s*horizonProjection\.sol\.apparentScale[\s\S]*?visualScale:\s*horizonProjection\.yol\.apparentScale/i, "Sol und Yol werden im Horizont aus der Bahnentfernung skaliert");
requireMatch("index.html", /id=["']cycle-jump-input["'][^>]*max=["']300["'][\s\S]*?id=["']moon-alignment-jump["']/i, "Prüfmodus besitzt direkte Zyklus- und 300er-Navigation");
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
