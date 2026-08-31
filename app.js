(function runEraCycle() {
  "use strict";

  const source = window.ERA_PHASES;
  if (!source) {
    throw new Error("ERA_PHASES wurde nicht geladen.");
  }

  const { config, categories, templates } = source;
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const sigilButtonsById = new Map();
  const regularTemplates = templates.filter((template) => template.id !== "convection");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const ORBIT_GEOMETRY = Object.freeze({
    width: 840,
    height: 520,
    centerX: 420,
    centerY: 260,
    eraRadius: 82,
    safeGap: 16,
    maxVisualBodyRadius: 34,
    labelGap: 14,
    sol: Object.freeze({ radiusX: 310, radiusY: 172, maxRadialOffset: 34 }),
    yol: Object.freeze({ radiusX: 240, radiusY: 158, maxRadialOffset: 30 }),
  });

  const HORIZON_GEOMETRY = Object.freeze({
    width: 840,
    height: 280,
    centerX: 420,
    horizonY: 176,
    usableHalfWidth: 300,
    maxSkyHeight: 112,
    maxLatitudeLift: 52,
    maxLatitudeDegrees: 60,
  });

  const HORIZON_DIRECTIONS = Object.freeze({
    north: Object.freeze({
      id: "north",
      abbreviation: "N",
      name: "Norden",
      baseAngle: -90,
      vector: Object.freeze({ x: 0, y: -1 }),
      leftLabel: "Westen",
      rightLabel: "Osten",
    }),
    east: Object.freeze({
      id: "east",
      abbreviation: "O",
      name: "Osten",
      baseAngle: 0,
      vector: Object.freeze({ x: 1, y: 0 }),
      leftLabel: "Norden",
      rightLabel: "Süden",
    }),
    south: Object.freeze({
      id: "south",
      abbreviation: "S",
      name: "Süden",
      baseAngle: 90,
      vector: Object.freeze({ x: 0, y: 1 }),
      leftLabel: "Osten",
      rightLabel: "Westen",
    }),
    west: Object.freeze({
      id: "west",
      abbreviation: "W",
      name: "Westen",
      baseAngle: 180,
      vector: Object.freeze({ x: -1, y: 0 }),
      leftLabel: "Süden",
      rightLabel: "Norden",
    }),
  });

  const HORIZON_DIRECTION_ORDER = Object.freeze(["north", "east", "south", "west"]);
  const HORIZON_LATITUDES = Object.freeze({
    0: Object.freeze({ degrees: 0, title: "Polare Eiswelt", name: "polare Eiswelt", biome: "polar", description: "Eis- und Schneelandschaft am Polstand" }),
    30: Object.freeze({ degrees: 30, title: "Gemäßigtes", name: "gemäßigte Tannenlandschaft", biome: "temperate", description: "gemäßigte Waldlandschaft 30 Grad äquatorwärts" }),
    60: Object.freeze({ degrees: 60, title: "Wüste", name: "heiße Wüstenlandschaft", biome: "desert", description: "Wüstenrand 60 Grad äquatorwärts" }),
  });
  const HORIZON_LATITUDE_ORDER = Object.freeze([0, 30, 60]);
  const ZEHS_PARAMETERS = Object.freeze({
    id: "zehs",
    name: "ZEHS",
    type: "Referenzstern",
    distanceAu: 40,
    distanceQualifier: "ungefähr",
    brightness: "sehr hell",
    motion: "annähernd fest",
    rotationReference: "Untergang und erneuter Aufgang markieren eine vollständige Rotation Eras",
    nameRelation: "Zehsen",
    orbitingBody: false,
    sIntensity: null,
    modelStatus: "Weltenlogik · schematische Darstellung",
    worldPoint: Object.freeze({ x: 756, y: 68 }),
  });
  const HORIZON_HEIGHT_SCALE = Object.freeze({
    hold: 0.46,
    horizon: 0.22,
    "reverse-horizon": 0.22,
    parabola: 1,
    "fixed-orbit": 0.72,
    zehs: 0.88,
    convection: 0,
  });

  const elements = {
    phaseSelect: document.querySelector("#phase-select"),
    jumpPhase: document.querySelector("#jump-phase"),
    previousPhase: document.querySelector("#previous-phase"),
    nextPhase: document.querySelector("#next-phase"),
    phaseSigils: document.querySelector("#phase-sigils"),
    activeCategory: document.querySelector("#active-category"),
    activePhaseSigil: document.querySelector("#active-phase-sigil"),
    activePhaseIconUse: document.querySelector("#active-phase-icon-use"),
    activePhaseName: document.querySelector("#active-phase-name"),
    activePhaseDescription: document.querySelector("#active-phase-description"),
    activeDirection: document.querySelector("#active-direction"),
    activeSpan: document.querySelector("#active-span"),
    phaseOccurrence: document.querySelector("#phase-occurrence"),
    stateBadge: document.querySelector("#state-badge"),
    stateBadgeShell: document.querySelector("#state-badge-shell"),
    stateCategoryIconUse: document.querySelector("#state-category-icon-use"),
    orbitView: document.querySelector("#orbit-view"),
    orbitDescription: document.querySelector("#orbit-description"),
    orbitSol: document.querySelector(".orbit-sol"),
    orbitYol: document.querySelector(".orbit-yol"),
    solBody: document.querySelector("#sol-body"),
    yolBody: document.querySelector("#yol-body"),
    solDisc: document.querySelector("#sol-disc"),
    yolDisc: document.querySelector("#yol-disc"),
    solHalo: document.querySelector("#sol-halo"),
    yolHalo: document.querySelector("#yol-halo"),
    solLabel: document.querySelector("#sol-label"),
    yolLabel: document.querySelector("#yol-label"),
    zehsBody: document.querySelector("#zehs-body"),
    eraSurface: document.querySelector("#era-surface"),
    eraFrontHalf: document.querySelector("#era-front-half"),
    eraHorizonCut: document.querySelector("#era-horizon-cut"),
    eraLatitudeIndicator: document.querySelector("#era-latitude-indicator"),
    eraLatitudeRing: document.querySelector("#era-latitude-ring"),
    eraObserverMarker: document.querySelector("#era-observer-marker"),
    eraViewArrow: document.querySelector("#era-view-arrow"),
    eraViewLetter: document.querySelector("#era-view-letter"),
    directionPathSol: document.querySelector("#direction-path-sol"),
    directionPathYol: document.querySelector("#direction-path-yol"),
    convectionMessage: document.querySelector("#convection-message"),
    horizonDirectionGroup: document.querySelector("#horizon-direction-group"),
    horizonDirectionButtons: Object.freeze({
      north: document.querySelector("#horizon-direction-north"),
      east: document.querySelector("#horizon-direction-east"),
      south: document.querySelector("#horizon-direction-south"),
      west: document.querySelector("#horizon-direction-west"),
    }),
    horizonLatitudeGroup: document.querySelector("#horizon-latitude-group"),
    horizonLatitudeButtons: Object.freeze({
      0: document.querySelector("#horizon-latitude-0"),
      30: document.querySelector("#horizon-latitude-30"),
      60: document.querySelector("#horizon-latitude-60"),
    }),
    horizonTitle: document.querySelector("#horizon-title"),
    horizonSvgTitle: document.querySelector("#horizon-svg-title"),
    horizonView: document.querySelector("#horizon-view"),
    horizonDescription: document.querySelector("#horizon-description"),
    horizonSolBody: document.querySelector("#horizon-sol-body"),
    horizonYolBody: document.querySelector("#horizon-yol-body"),
    horizonZehsStar: document.querySelector("#horizon-zehs-star"),
    horizonLeftLabel: document.querySelector("#horizon-left-label"),
    horizonCenterLabel: document.querySelector("#horizon-center-label"),
    horizonRightLabel: document.querySelector("#horizon-right-label"),
    horizonConvectionField: document.querySelector("#horizon-convection-field"),
    zehsVisibility: document.querySelector("#zehs-visibility"),
    zehsPosition: document.querySelector("#zehs-position"),
    eraTime: document.querySelector("#era-time"),
    solIntensity: document.querySelector("#sol-intensity"),
    yolIntensity: document.querySelector("#yol-intensity"),
    solSpeed: document.querySelector("#sol-speed"),
    yolSpeed: document.querySelector("#yol-speed"),
    presentationTime: document.querySelector("#presentation-time"),
    seedInput: document.querySelector("#seed-input"),
    applySeed: document.querySelector("#apply-seed"),
    newSeed: document.querySelector("#new-seed"),
    solSpeedMeter: document.querySelector("#sol-speed-meter"),
    yolSpeedMeter: document.querySelector("#yol-speed-meter"),
    solSpeedMeterLabel: document.querySelector("#sol-speed-meter-label"),
    yolSpeedMeterLabel: document.querySelector("#yol-speed-meter-label"),
    phaseCount: document.querySelector("#phase-count"),
    repeatCount: document.querySelector("#repeat-count"),
    segmentRange: document.querySelector("#segment-range"),
    phaseTrack: document.querySelector("#phase-track"),
    timelineTitle: document.querySelector("#timeline-title"),
    timeSlider: document.querySelector("#time-slider"),
    playToggle: document.querySelector("#play-toggle"),
    playIcon: document.querySelector("#play-icon"),
    playIconUse: document.querySelector("#play-icon-use"),
    playLabel: document.querySelector("#play-label"),
    autoCycle: document.querySelector("#auto-cycle"),
    restart: document.querySelector("#restart"),
    playbackRate: document.querySelector("#playback-rate"),
    timelineNow: document.querySelector("#timeline-now"),
    timelineTotal: document.querySelector("#timeline-total"),
    themeToggle: document.querySelector("#theme-toggle"),
    themeIconUse: document.querySelector("#theme-icon-use"),
    themeLabel: document.querySelector("#theme-label"),
    themeColor: document.querySelector("#theme-color"),
    liveRegion: document.querySelector("#live-region"),
  };

  const state = {
    seed: normalizeSeed(elements.seedInput.value),
    scenario: null,
    currentMs: 0,
    playing: false,
    autoCycle: false,
    playbackRate: 1,
    presentationMs: config.presentationMs,
    animationFrame: null,
    lastFrameAt: null,
    lastRenderedSegment: -1,
    reducedMotion: reducedMotionQuery.matches,
    theme: document.documentElement?.dataset?.theme === "light" ? "light" : "dark",
    horizonDirection: readStoredHorizonDirection(),
    horizonLatitude: readStoredHorizonLatitude(),
  };

  let lastRenderFrame = null;

  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  function createSvgElement(name) {
    return typeof document.createElementNS === "function"
      ? document.createElementNS(SVG_NAMESPACE, name)
      : document.createElement(name);
  }

  function setUseHref(element, iconId) {
    if (element) element.setAttribute("href", `#${iconId}`);
  }

  function createIcon(iconId, className = "") {
    const svg = createSvgElement("svg");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const use = createSvgElement("use");
    setUseHref(use, iconId);
    svg.append(use);
    return svg;
  }

  function applyTheme(theme, options = {}) {
    const normalized = theme === "light" ? "light" : "dark";
    state.theme = normalized;
    if (document.documentElement?.dataset) document.documentElement.dataset.theme = normalized;
    elements.themeToggle.setAttribute("aria-pressed", String(normalized === "dark"));
    elements.themeToggle.setAttribute(
      "aria-label",
      normalized === "dark" ? "Zu hellem Pergament wechseln" : "Zur dunklen Chronik wechseln",
    );
    elements.themeLabel.textContent = normalized === "dark" ? "Dunkle Chronik" : "Helles Pergament";
    setUseHref(elements.themeIconUse, normalized === "dark" ? "icon-theme-moon" : "icon-theme-sun");
    elements.themeColor.setAttribute("content", normalized === "dark" ? "#070b1a" : "#dce8f2");
    if (options.persist !== false) {
      try {
        localStorage.setItem("era-theme", normalized);
      } catch (_) {
        // Das Erscheinungsbild funktioniert auch ohne verfügbaren lokalen Speicher.
      }
    }
  }

  function normalizeSeed(value) {
    const normalized = String(value ?? "")
      .normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 64);
    return normalized || "ERA-2880";
  }

  function hashString(value) {
    let hash = 2166136261;
    for (const symbol of String(value)) {
      const codePoint = symbol.codePointAt(0);
      hash ^= codePoint;
      hash = Math.imul(hash, 16777619);
      hash ^= codePoint >>> 16;
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    let value = seed >>> 0;
    return function random() {
      value += 0x6d2b79f5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function unitFor(seed, stream) {
    return mulberry32(hashString(`${config.schemaVersion}|${seed}|${stream}`))();
  }

  function randomBetween(random, min, max) {
    return min + random() * (max - min);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeDegrees(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0;
    return ((numericValue % 360) + 360) % 360;
  }

  function readStoredHorizonDirection() {
    try {
      const storedDirection = localStorage.getItem("era-horizon-direction");
      return HORIZON_DIRECTIONS[storedDirection] ? storedDirection : "north";
    } catch (_) {
      return "north";
    }
  }

  function normalizeHorizonLatitude(value) {
    const numericValue = Number(value);
    return HORIZON_LATITUDE_ORDER.includes(numericValue) ? numericValue : 0;
  }

  function readStoredHorizonLatitude() {
    try {
      return normalizeHorizonLatitude(localStorage.getItem("era-horizon-latitude"));
    } catch (_) {
      return 0;
    }
  }

  function getLatitudeLift(latitudeDegrees, motion = "orbit") {
    const numericValue = Number(latitudeDegrees);
    const safeDegrees = clamp(
      Number.isFinite(numericValue) ? numericValue : 0,
      0,
      HORIZON_GEOMETRY.maxLatitudeDegrees,
    );
    const projectedDegrees = motion === "zehs"
      ? HORIZON_GEOMETRY.maxLatitudeDegrees - safeDegrees
      : safeDegrees;
    return Math.sin((projectedDegrees * Math.PI) / 180) * HORIZON_GEOMETRY.maxLatitudeLift;
  }

  function getEraRotationDegrees(ms, motion) {
    const safeMs = Number.isFinite(Number(ms)) ? Number(ms) : 0;
    const sampledMs = state.reducedMotion ? Math.round(safeMs / 1000) * 1000 : safeMs;
    return normalizeDegrees((sampledMs / 1000) * config.eraRotationDegreesPerSecond);
  }

  function getIntensityTier(intensity) {
    const safeIntensity = Number.isFinite(Number(intensity)) ? Number(intensity) : 1;
    return clamp(Math.ceil(clamp(safeIntensity, 1, 10) / 2), 1, 5);
  }

  function getBodyVisualRadius(intensity, bodyName) {
    if (intensity === null || intensity === undefined) return 0;
    const tier = getIntensityTier(intensity);
    const baseRadius = bodyName === "yol" ? 13 : 14;
    return Math.min(ORBIT_GEOMETRY.maxVisualBodyRadius, baseRadius + tier * 4);
  }

  function ensureOrbitClearance(point, visualRadius) {
    const requestedRadius = Number(visualRadius);
    const bodyRadius = clamp(
      Number.isFinite(requestedRadius) ? requestedRadius : 0,
      0,
      ORBIT_GEOMETRY.maxVisualBodyRadius,
    );
    const edgePadding = bodyRadius + ORBIT_GEOMETRY.labelGap;
    const minimumDistance = ORBIT_GEOMETRY.eraRadius + bodyRadius + ORBIT_GEOMETRY.safeGap;
    let x = Number(point?.x);
    let y = Number(point?.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = ORBIT_GEOMETRY.centerX + minimumDistance;
      y = ORBIT_GEOMETRY.centerY;
    }

    function pushOutsideEra() {
      const deltaX = x - ORBIT_GEOMETRY.centerX;
      const deltaY = y - ORBIT_GEOMETRY.centerY;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance >= minimumDistance) return;
      const unitX = distance > 0.000001 ? deltaX / distance : 1;
      const unitY = distance > 0.000001 ? deltaY / distance : 0;
      x = ORBIT_GEOMETRY.centerX + unitX * minimumDistance;
      y = ORBIT_GEOMETRY.centerY + unitY * minimumDistance;
    }

    pushOutsideEra();
    x = clamp(x, edgePadding, ORBIT_GEOMETRY.width - edgePadding);
    y = clamp(y, edgePadding, ORBIT_GEOMETRY.height - edgePadding);
    pushOutsideEra();
    x = clamp(x, edgePadding, ORBIT_GEOMETRY.width - edgePadding);
    y = clamp(y, edgePadding, ORBIT_GEOMETRY.height - edgePadding);

    return { x, y };
  }

  function getOrbitPoint(snapshot, bodyName) {
    const orbit = ORBIT_GEOMETRY[bodyName];
    const bodySnapshot = snapshot?.[bodyName];
    if (!orbit || !bodySnapshot) {
      return ensureOrbitClearance(
        { x: ORBIT_GEOMETRY.centerX, y: ORBIT_GEOMETRY.centerY },
        ORBIT_GEOMETRY.maxVisualBodyRadius,
      );
    }

    const radians = (normalizeDegrees(bodySnapshot.angle) * Math.PI) / 180;
    const baseX = orbit.radiusX * Math.cos(radians);
    const baseY = orbit.radiusY * Math.sin(radians);
    const baseDistance = Math.hypot(baseX, baseY) || 1;
    const requestedOffset = Number(bodySnapshot.radialOffset);
    const radialOffset = clamp(
      Number.isFinite(requestedOffset) ? requestedOffset : 0,
      -orbit.maxRadialOffset,
      orbit.maxRadialOffset,
    );
    const point = {
      x: ORBIT_GEOMETRY.centerX + baseX + (baseX / baseDistance) * radialOffset,
      y: ORBIT_GEOMETRY.centerY + baseY + (baseY / baseDistance) * radialOffset,
    };
    return ensureOrbitClearance(
      point,
      getBodyVisualRadius(bodySnapshot.intensity, bodyName),
    );
  }

  function getViewBasis(directionId, eraRotationDegrees) {
    const direction = HORIZON_DIRECTIONS[directionId] || HORIZON_DIRECTIONS.north;
    const angleDegrees = normalizeDegrees(direction.baseAngle + normalizeDegrees(eraRotationDegrees));
    const radians = (angleDegrees * Math.PI) / 180;
    const forward = Object.freeze({ x: Math.cos(radians), y: Math.sin(radians) });
    const right = Object.freeze({ x: -forward.y, y: forward.x });
    return Object.freeze({
      directionId: direction.id,
      direction,
      angleDegrees,
      forward,
      right,
      viewForward: forward,
      viewRight: right,
    });
  }

  function projectOrbitPointToHorizon(point, viewBasis, motion, latitudeDegrees = 0) {
    const basis = viewBasis || getViewBasis("north", 0);
    const deltaX = Number(point?.x) - ORBIT_GEOMETRY.centerX;
    const deltaY = Number(point?.y) - ORBIT_GEOMETRY.centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const unitX = distance > 0.000001 && Number.isFinite(distance) ? deltaX / distance : 0;
    const unitY = distance > 0.000001 && Number.isFinite(distance) ? deltaY / distance : -1;
    const forwardAmount = clamp(unitX * basis.forward.x + unitY * basis.forward.y, -1, 1);
    const rightAmount = clamp(unitX * basis.right.x + unitY * basis.right.y, -1, 1);
    const heightScale = HORIZON_HEIGHT_SCALE[motion] ?? 0.76;
    const visible = motion !== "convection" && forwardAmount >= -0.000001;
    const baseHeight =
      Math.pow(Math.max(0, forwardAmount), 0.8) * HORIZON_GEOMETRY.maxSkyHeight * heightScale;
    const latitudeLift = visible ? getLatitudeLift(latitudeDegrees, motion) : 0;
    const height = baseHeight + latitudeLift;

    return Object.freeze({
      x: clamp(
        HORIZON_GEOMETRY.centerX + rightAmount * HORIZON_GEOMETRY.usableHalfWidth,
        0,
        HORIZON_GEOMETRY.width,
      ),
      y: clamp(HORIZON_GEOMETRY.horizonY - height, 0, HORIZON_GEOMETRY.height),
      visible,
      forward: forwardAmount,
      right: rightAmount,
      height,
      baseHeight,
      latitudeDegrees: clamp(
        Number.isFinite(Number(latitudeDegrees)) ? Number(latitudeDegrees) : 0,
        0,
        HORIZON_GEOMETRY.maxLatitudeDegrees,
      ),
      latitudeLift,
      heightScale,
    });
  }

  function shuffle(values, random) {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    return shuffled;
  }

  function weightedPick(items, random) {
    const total = items.reduce((sum, item) => sum + item.repeatWeight, 0);
    let cursor = random() * total;
    for (const item of items) {
      cursor -= item.repeatWeight;
      if (cursor <= 0) return item;
    }
    return items[items.length - 1];
  }

  function avoidDirectDuplicates(sequence) {
    for (let index = 1; index < sequence.length; index += 1) {
      if (sequence[index].id !== sequence[index - 1].id) continue;
      const swapIndex = sequence.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex > index &&
          candidate.id !== sequence[index].id &&
          candidate.id !== sequence[index - 1].id,
      );
      if (swapIndex !== -1) {
        [sequence[index], sequence[swapIndex]] = [sequence[swapIndex], sequence[index]];
      }
    }
    return sequence;
  }

  function allocateIntegerDurations(weights, total, minimum) {
    const count = weights.length;
    const guaranteed = minimum * count;
    const distributable = Math.max(0, total - guaranteed);
    const weightTotal = weights.reduce((sum, weight) => sum + weight, 0) || 1;
    const exact = weights.map((weight) => minimum + (distributable * weight) / weightTotal);
    const values = exact.map(Math.floor);
    let difference = total - values.reduce((sum, value) => sum + value, 0);
    const remainderOrder = exact
      .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
      .sort((a, b) => b.remainder - a.remainder);
    let cursor = 0;
    while (difference > 0) {
      values[remainderOrder[cursor % count].index] += 1;
      cursor += 1;
      difference -= 1;
    }
    return values;
  }

  function directionFor(template) {
    if (template.category === "asynchron") return -1;
    if (template.motion === "switching") return 0;
    return 1;
  }

  function createMotionParameters(seed, segment, bodyName, startAngle) {
    const template = segment.template;
    const bodyConfig = template[bodyName];
    const prefix = `${segment.index}|${template.id}|${bodyName}`;
    const minSpeed = bodyConfig.speed[0];
    const maxSpeed = bodyConfig.speed[1];
    const speedRange = maxSpeed - minSpeed;
    const baseSpeed = minSpeed + speedRange * unitFor(seed, `${prefix}|base-speed`);
    const direction = directionFor(template);
    const phase = unitFor(seed, `${prefix}|phase`) * Math.PI * 2;
    const frequency = 0.45 + unitFor(seed, `${prefix}|frequency`) * 1.25;
    let drift = direction * baseSpeed;
    let amplitude = Math.max(0.06, baseSpeed * (0.08 + unitFor(seed, `${prefix}|noise`) * 0.16));

    if (template.category === "synchron") {
      drift = config.eraRotationDegreesPerSecond;
      amplitude = 0;
    } else if (template.motion === "switching") {
      drift = (unitFor(seed, `${prefix}|drift`) - 0.5) * 1.4;
      amplitude = 13 + unitFor(seed, `${prefix}|switch-amplitude`) * 24;
    } else if (template.motion === "oscillate") {
      drift *= 0.18;
      amplitude = 9 + unitFor(seed, `${prefix}|osc-amplitude`) * 16;
    } else if (template.motion === "fixed-orbit") {
      drift *= 0.15;
      amplitude = 0.8;
    } else if (template.motion === "hold") {
      drift *= 0.25;
      amplitude = 1.2;
    }

    return {
      startAngle,
      baseSpeed,
      minSpeed,
      maxSpeed,
      drift,
      amplitude,
      frequency,
      phase,
      intensityPhase: unitFor(seed, `${prefix}|intensity-phase`) * Math.PI * 2,
      intensityCycles: 0.45 + unitFor(seed, `${prefix}|intensity-cycles`) * 1.8,
      radialPhase: unitFor(seed, `${prefix}|radial-phase`) * Math.PI * 2,
    };
  }

  function rawAngle(parameters, localSeconds) {
    const wave =
      parameters.amplitude *
      (Math.sin(parameters.frequency * localSeconds + parameters.phase) -
        Math.sin(parameters.phase));
    return parameters.startAngle + parameters.drift * localSeconds + wave;
  }

  function buildScenario(seed) {
    const random = mulberry32(hashString(`${config.schemaVersion}|${seed}|schedule`));
    const repeatTotal = Math.round(
      randomBetween(random, config.minRepeatedTemplates, config.maxRepeatedTemplates),
    );
    const forcedChanging = Math.round(repeatTotal * 0.6);
    const extras = [];
    for (let index = 0; index < forcedChanging; index += 1) {
      extras.push(templateById.get("changing"));
    }
    for (let index = forcedChanging; index < repeatTotal; index += 1) {
      extras.push(weightedPick(regularTemplates, random));
    }

    const sequence = avoidDirectDuplicates(shuffle([...regularTemplates, ...extras], random));
    const umWeights = sequence.map(
      (template) => template.durationWeight * randomBetween(random, 0.72, 1.28),
    );
    const umDurations = allocateIntegerDurations(umWeights, config.regularUm, 120);
    const displayWeights = umDurations.map(
      (duration, index) => Math.sqrt(duration) * (sequence[index].id === "changing" ? 1.12 : 1),
    );
    const convectionPresentationMs = Math.round(
      config.convectionPresentationMs * (state.presentationMs / config.presentationMs),
    );
    const displayDurations = allocateIntegerDurations(
      displayWeights,
      state.presentationMs - convectionPresentationMs,
      2200,
    );

    let umCursor = 0;
    let displayCursor = 0;
    const segments = sequence.map((template, index) => {
      const segment = {
        index,
        template,
        umStart: umCursor,
        umEnd: umCursor + umDurations[index],
        displayStart: displayCursor,
        displayEnd: displayCursor + displayDurations[index],
        motion: {},
      };
      umCursor = segment.umEnd;
      displayCursor = segment.displayEnd;
      return segment;
    });

    const convectionTemplate = templateById.get("convection");
    segments.push({
      index: segments.length,
      template: convectionTemplate,
      umStart: config.regularUm,
      umEnd: config.totalUm,
      displayStart: state.presentationMs - convectionPresentationMs,
      displayEnd: state.presentationMs,
      motion: {},
    });

    let solAngle = unitFor(seed, "initial|sol-angle") * 360;
    let yolAngle = unitFor(seed, "initial|yol-angle") * 360 + 140;
    for (const segment of segments) {
      segment.motion.sol = createMotionParameters(seed, segment, "sol", solAngle);
      segment.motion.yol = createMotionParameters(seed, segment, "yol", yolAngle);
      const durationSeconds = (segment.displayEnd - segment.displayStart) / 1000;
      solAngle = rawAngle(segment.motion.sol, durationSeconds);
      yolAngle = rawAngle(segment.motion.yol, durationSeconds);
    }

    return {
      seed,
      repeatTotal,
      presentationMs: state.presentationMs,
      convectionPresentationMs,
      segments,
      occurrences: segments.reduce((map, segment) => {
        const list = map.get(segment.template.id) || [];
        list.push(segment.index);
        map.set(segment.template.id, list);
        return map;
      }, new Map()),
    };
  }

  function findSegment(ms) {
    const bounded = clamp(ms, 0, state.presentationMs);
    if (bounded === state.presentationMs) {
      return state.scenario.segments[state.scenario.segments.length - 1];
    }
    return (
      state.scenario.segments.find(
        (segment) => bounded >= segment.displayStart && bounded < segment.displayEnd,
      ) || state.scenario.segments[0]
    );
  }

  function getSnapshot(ms) {
    const segment = findSegment(ms);
    const displayDuration = Math.max(1, segment.displayEnd - segment.displayStart);
    const progress = clamp((ms - segment.displayStart) / displayDuration, 0, 1);
    const cycleUm = segment.umStart + (segment.umEnd - segment.umStart) * progress;
    const positionMs = state.reducedMotion ? Math.round(ms / 1000) * 1000 : ms;
    const positionProgress = clamp(
      (positionMs - segment.displayStart) / displayDuration,
      0,
      1,
    );
    const localSeconds = (positionProgress * displayDuration) / 1000;
    const template = segment.template;

    function bodySnapshot(bodyName) {
      const bodyConfig = template[bodyName];
      const parameters = segment.motion[bodyName];
      const angle = rawAngle(parameters, localSeconds);
      const derivative =
        parameters.drift +
        parameters.amplitude *
          parameters.frequency *
          Math.cos(parameters.frequency * localSeconds + parameters.phase);
      const speed = clamp(Math.abs(derivative), parameters.minSpeed, parameters.maxSpeed);
      const directionSign = Math.abs(derivative) < 0.0001 ? 0 : derivative > 0 ? 1 : -1;
      const intensity = bodyConfig.intensity
        ? clamp(
            bodyConfig.intensity[0] +
              (bodyConfig.intensity[1] - bodyConfig.intensity[0]) *
                (0.5 +
                  0.5 *
                    Math.sin(
                      parameters.intensityPhase +
                        positionProgress * parameters.intensityCycles * Math.PI * 2,
                    )),
            1,
            10,
          )
        : null;
      const radialOffset =
        bodyConfig.radialAmplitude *
        Math.sin(parameters.radialPhase + positionProgress * Math.PI * 2);
      return {
        angle,
        angularVelocity: derivative,
        directionSign,
        speed,
        intensity,
        radialOffset,
        visible: bodyConfig.visible,
      };
    }

    return {
      ms,
      segment,
      template,
      progress,
      cycleUm,
      positionMs,
      sol: bodySnapshot("sol"),
      yol: bodySnapshot("yol"),
    };
  }

  function formatClock(ms) {
    const totalSeconds = Math.round(clamp(ms, 0, state.presentationMs) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function formatEraTime(cycleUm) {
    const safeUm = clamp(Math.floor(cycleUm), 0, config.totalUm);
    const umPerDir = config.umPerTan * config.tanPerDir;
    const umPerMohn = umPerDir * config.dirPerMohn;
    const mohn = Math.floor(safeUm / umPerMohn);
    let remainder = safeUm % umPerMohn;
    const dir = Math.floor(remainder / umPerDir);
    remainder %= umPerDir;
    const tan = Math.floor(remainder / config.umPerTan);
    const um = remainder % config.umPerTan;
    return `Mohn ${mohn} · Dir ${dir} · Tan ${tan} · Um ${um}`;
  }

  function formatRange(segment) {
    const duration = segment.umEnd - segment.umStart;
    return `${segment.umStart.toLocaleString("de-DE")}–${segment.umEnd.toLocaleString("de-DE")} Um · ${duration.toLocaleString("de-DE")} Um`;
  }

  function setBodyElementState(element, bodySnapshot, bodyName, point, visible) {
    if (!element) return;
    const intensityTier = getIntensityTier(bodySnapshot.intensity);
    element.setAttribute(
      "transform",
      `translate(${Math.round(point.x)} ${Math.round(point.y)})`,
    );
    element.setAttribute("data-intensity-tier", String(intensityTier));
    element.setAttribute("data-source-angle", normalizeDegrees(bodySnapshot.angle).toFixed(3));
    element.setAttribute("data-direction-sign", String(bodySnapshot.directionSign));
    element.setAttribute("data-world-x", point.x.toFixed(3));
    element.setAttribute("data-world-y", point.y.toFixed(3));
    element.setAttribute(
      "data-visual-radius",
      getBodyVisualRadius(bodySnapshot.intensity, bodyName).toFixed(3),
    );
    element.setAttribute("aria-hidden", String(!visible));
    element.style.opacity = visible ? "1" : "0";
    element.style.visibility = visible ? "visible" : "hidden";
  }

  function setZehsElementState(element, point, visible) {
    if (!element) return;
    element.setAttribute(
      "transform",
      `translate(${Math.round(point.x)} ${Math.round(point.y)})`,
    );
    element.setAttribute("data-projected-x", Number(point.x).toFixed(3));
    element.setAttribute("data-projected-y", Number(point.y).toFixed(3));
    element.setAttribute("data-distance-au", String(ZEHS_PARAMETERS.distanceAu));
    element.setAttribute("data-brightness", ZEHS_PARAMETERS.brightness);
    element.setAttribute("data-motion", ZEHS_PARAMETERS.motion);
    element.setAttribute("data-orbiting-body", String(ZEHS_PARAMETERS.orbitingBody));
    element.setAttribute("data-s-int", "nicht definiert");
    element.setAttribute("aria-hidden", String(!visible));
    element.style.opacity = visible ? "1" : "0";
    element.style.visibility = visible ? "visible" : "hidden";
  }

  function positionOrbitLabel(label, point, bodySnapshot, bodyName) {
    if (!label) return;
    const deltaX = point.x - ORBIT_GEOMETRY.centerX;
    const deltaY = point.y - ORBIT_GEOMETRY.centerY;
    const distance = Math.hypot(deltaX, deltaY) || 1;
    const unitX = deltaX / distance;
    const unitY = deltaY / distance;
    const offset =
      getBodyVisualRadius(bodySnapshot.intensity, bodyName) + ORBIT_GEOMETRY.labelGap;
    label.setAttribute("x", String(Math.round(unitX * offset)));
    label.setAttribute("y", String(Math.round(unitY * offset)));
    label.setAttribute("text-anchor", unitX > 0.34 ? "start" : unitX < -0.34 ? "end" : "middle");
    label.setAttribute(
      "dominant-baseline",
      unitY > 0.34 ? "hanging" : unitY < -0.34 ? "auto" : "middle",
    );
  }

  function buildBlockArrowPath(bodyName, directionSign) {
    if (!directionSign) return "";
    const orbit = ORBIT_GEOMETRY[bodyName];
    if (!orbit) return "";
    const arrowAngles = bodyName === "sol" ? [28, 148, 268] : [78, 198, 318];

    return arrowAngles
      .map((angleDegrees) => {
        const radians = (angleDegrees * Math.PI) / 180;
        const centerX = ORBIT_GEOMETRY.centerX + orbit.radiusX * Math.cos(radians);
        const centerY = ORBIT_GEOMETRY.centerY + orbit.radiusY * Math.sin(radians);
        const tangentX = -orbit.radiusX * Math.sin(radians) * directionSign;
        const tangentY = orbit.radiusY * Math.cos(radians) * directionSign;
        const tangentLength = Math.hypot(tangentX, tangentY) || 1;
        const unitX = tangentX / tangentLength;
        const unitY = tangentY / tangentLength;
        const normalX = -unitY;
        const normalY = unitX;
        const pointAt = (along, across) =>
          `${Math.round(centerX + unitX * along + normalX * across)} ${Math.round(
            centerY + unitY * along + normalY * across,
          )}`;
        return [
          `M ${pointAt(11, 0)}`,
          `L ${pointAt(2, 7)}`,
          `L ${pointAt(2, 3)}`,
          `L ${pointAt(-10, 3)}`,
          `L ${pointAt(-10, -3)}`,
          `L ${pointAt(2, -3)}`,
          `L ${pointAt(2, -7)}`,
          "Z",
        ].join(" ");
      })
      .join(" ");
  }

  function createFrameProjection(point, viewBasis, snapshot, bodyName) {
    const projection = projectOrbitPointToHorizon(
      point,
      viewBasis,
      snapshot.template.motion,
      state.horizonLatitude,
    );
    return Object.freeze({
      ...projection,
      visible: projection.visible && snapshot[bodyName].visible,
    });
  }

  function createRenderFrame(snapshot) {
    const worldPoints = Object.freeze({
      sol: Object.freeze(getOrbitPoint(snapshot, "sol")),
      yol: Object.freeze(getOrbitPoint(snapshot, "yol")),
      zehs: ZEHS_PARAMETERS.worldPoint,
    });
    const eraRotationDegrees = getEraRotationDegrees(snapshot.ms, snapshot.template.motion);
    const viewBasis = getViewBasis(state.horizonDirection, eraRotationDegrees);
    const horizonProjection = Object.freeze({
      sol: createFrameProjection(worldPoints.sol, viewBasis, snapshot, "sol"),
      yol: createFrameProjection(worldPoints.yol, viewBasis, snapshot, "yol"),
      zehs: projectOrbitPointToHorizon(
        worldPoints.zehs,
        viewBasis,
        "zehs",
        state.horizonLatitude,
      ),
    });
    return Object.freeze({
      snapshot,
      worldPoints,
      eraRotationDegrees,
      viewBasis,
      horizonLatitude: state.horizonLatitude,
      horizonProjection,
    });
  }

  function reprojectRenderFrame(frame) {
    const viewBasis = getViewBasis(state.horizonDirection, frame.eraRotationDegrees);
    return Object.freeze({
      snapshot: frame.snapshot,
      worldPoints: frame.worldPoints,
      eraRotationDegrees: frame.eraRotationDegrees,
      viewBasis,
      horizonLatitude: state.horizonLatitude,
      horizonProjection: Object.freeze({
        sol: createFrameProjection(frame.worldPoints.sol, viewBasis, frame.snapshot, "sol"),
        yol: createFrameProjection(frame.worldPoints.yol, viewBasis, frame.snapshot, "yol"),
        zehs: projectOrbitPointToHorizon(
          frame.worldPoints.zehs,
          viewBasis,
          "zehs",
          state.horizonLatitude,
        ),
      }),
    });
  }

  function updateDirectionControls() {
    const activeDirection = HORIZON_DIRECTIONS[state.horizonDirection];
    const activeLatitude = HORIZON_LATITUDES[state.horizonLatitude];
    if (elements.horizonDirectionGroup) {
      elements.horizonDirectionGroup.setAttribute("role", "radiogroup");
      elements.horizonDirectionGroup.setAttribute(
        "aria-label",
        "Blickrichtung für den Horizontverlauf",
      );
    }
    for (const directionId of HORIZON_DIRECTION_ORDER) {
      const button = elements.horizonDirectionButtons[directionId];
      if (!button) continue;
      const direction = HORIZON_DIRECTIONS[directionId];
      const active = directionId === state.horizonDirection;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", String(active));
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", `Blick nach ${direction.name}`);
      button.setAttribute("tabindex", active ? "0" : "-1");
      button.classList.toggle("is-active", active);
    }
    if (elements.horizonTitle) {
      elements.horizonTitle.textContent = `Horizontverlauf · ${activeDirection.name} · ${activeLatitude.degrees}° ${activeLatitude.title}`;
    }
    if (elements.horizonSvgTitle) {
      elements.horizonSvgTitle.textContent = `Horizontverlauf mit Blick nach ${activeDirection.name} bei ${activeLatitude.degrees} Grad Polversatz`;
    }
    if (elements.horizonLeftLabel) {
      elements.horizonLeftLabel.textContent = activeDirection.leftLabel;
    }
    if (elements.horizonCenterLabel) {
      elements.horizonCenterLabel.textContent = `${activeDirection.abbreviation} · ${activeDirection.name}`;
    }
    if (elements.horizonRightLabel) {
      elements.horizonRightLabel.textContent = activeDirection.rightLabel;
    }
  }

  function updateLatitudeControls() {
    if (elements.horizonLatitudeGroup) {
      elements.horizonLatitudeGroup.setAttribute("role", "radiogroup");
      elements.horizonLatitudeGroup.setAttribute(
        "aria-label",
        "Breitenversatz des Beobachters in Richtung Äquator",
      );
      elements.horizonLatitudeGroup.setAttribute(
        "data-active-latitude",
        String(state.horizonLatitude),
      );
      elements.horizonLatitudeGroup.setAttribute(
        "data-active-biome",
        HORIZON_LATITUDES[state.horizonLatitude].biome,
      );
    }
    for (const latitudeDegrees of HORIZON_LATITUDE_ORDER) {
      const button = elements.horizonLatitudeButtons[latitudeDegrees];
      if (!button) continue;
      const latitude = HORIZON_LATITUDES[latitudeDegrees];
      const active = latitudeDegrees === state.horizonLatitude;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", String(active));
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute(
        "aria-label",
        `${latitude.degrees} Grad äquatorwärts, ${latitude.name}${latitude.degrees === 0 ? ", Polstand wie bisher" : ""}`,
      );
      button.setAttribute("tabindex", active ? "0" : "-1");
      button.classList.toggle("is-active", active);
    }
  }

  function updateEraOrientation(frame) {
    const { forward, right } = frame.viewBasis;
    const centerX = ORBIT_GEOMETRY.centerX;
    const centerY = ORBIT_GEOMETRY.centerY;
    const eraRadius = ORBIT_GEOMETRY.eraRadius;
    const latitudeDegrees = state.horizonLatitude;
    const latitudeRingRadius = latitudeDegrees === 0
      ? 8
      : Math.round(Math.sin((latitudeDegrees * Math.PI) / 180) * (eraRadius - 12));
    if (elements.eraSurface) {
      elements.eraSurface.setAttribute(
        "transform",
        `rotate(${frame.eraRotationDegrees.toFixed(3)} ${centerX} ${centerY})`,
      );
      elements.eraSurface.setAttribute(
        "data-era-rotation",
        frame.eraRotationDegrees.toFixed(3),
      );
    }
    if (elements.eraFrontHalf) {
      elements.eraFrontHalf.setAttribute(
        "d",
        `M ${centerX - eraRadius} ${centerY} A ${eraRadius} ${eraRadius} 0 0 1 ${
          centerX + eraRadius
        } ${centerY} L ${centerX - eraRadius} ${centerY} Z`,
      );
      elements.eraFrontHalf.setAttribute(
        "transform",
        `rotate(${(frame.viewBasis.angleDegrees + 90).toFixed(3)} ${centerX} ${centerY})`,
      );
    }
    const cutX1 = centerX - right.x * eraRadius;
    const cutY1 = centerY - right.y * eraRadius;
    const cutX2 = centerX + right.x * eraRadius;
    const cutY2 = centerY + right.y * eraRadius;
    if (elements.eraHorizonCut) {
      elements.eraHorizonCut.setAttribute("x1", String(Math.round(cutX1)));
      elements.eraHorizonCut.setAttribute("y1", String(Math.round(cutY1)));
      elements.eraHorizonCut.setAttribute("x2", String(Math.round(cutX2)));
      elements.eraHorizonCut.setAttribute("y2", String(Math.round(cutY2)));
      elements.eraHorizonCut.setAttribute(
        "d",
        `M ${Math.round(cutX1)} ${Math.round(cutY1)} L ${Math.round(cutX2)} ${Math.round(
          cutY2,
        )}`,
      );
    }
    if (elements.eraLatitudeIndicator) {
      elements.eraLatitudeIndicator.setAttribute(
        "data-latitude-degrees",
        String(latitudeDegrees),
      );
      elements.eraLatitudeIndicator.setAttribute(
        "data-ring-radius",
        String(latitudeRingRadius),
      );
    }
    if (elements.eraLatitudeRing) {
      elements.eraLatitudeRing.setAttribute("cx", String(centerX));
      elements.eraLatitudeRing.setAttribute("cy", String(centerY));
      elements.eraLatitudeRing.setAttribute("r", String(latitudeRingRadius));
    }
    if (elements.eraObserverMarker) {
      const observerX = centerX + forward.x * latitudeRingRadius;
      const observerY = centerY + forward.y * latitudeRingRadius;
      elements.eraObserverMarker.setAttribute(
        "transform",
        `translate(${(observerX - centerX).toFixed(3)} ${(observerY - centerY).toFixed(3)})`,
      );
      elements.eraObserverMarker.setAttribute("data-observer-x", observerX.toFixed(3));
      elements.eraObserverMarker.setAttribute("data-observer-y", observerY.toFixed(3));
    }
    if (elements.eraViewArrow) {
      const arrowPath = elements.eraViewArrow.querySelector?.("path") || elements.eraViewArrow;
      const startX = centerX + forward.x * 16;
      const startY = centerY + forward.y * 16;
      const tipX = centerX + forward.x * (eraRadius - 8);
      const tipY = centerY + forward.y * (eraRadius - 8);
      const neckX = tipX - forward.x * 14;
      const neckY = tipY - forward.y * 14;
      const side = 7;
      arrowPath.setAttribute(
        "d",
        [
          `M ${Math.round(startX - right.x * 3)} ${Math.round(startY - right.y * 3)}`,
          `L ${Math.round(neckX - right.x * 3)} ${Math.round(neckY - right.y * 3)}`,
          `L ${Math.round(neckX - right.x * side)} ${Math.round(neckY - right.y * side)}`,
          `L ${Math.round(tipX)} ${Math.round(tipY)}`,
          `L ${Math.round(neckX + right.x * side)} ${Math.round(neckY + right.y * side)}`,
          `L ${Math.round(neckX + right.x * 3)} ${Math.round(neckY + right.y * 3)}`,
          `L ${Math.round(startX + right.x * 3)} ${Math.round(startY + right.y * 3)}`,
          "Z",
        ].join(" "),
      );
    }
    if (elements.eraViewLetter) {
      const direction = HORIZON_DIRECTIONS[state.horizonDirection];
      elements.eraViewLetter.textContent = direction.abbreviation;
      elements.eraViewLetter.setAttribute(
        "x",
        String(Math.round(centerX + forward.x * (eraRadius - 21))),
      );
      elements.eraViewLetter.setAttribute(
        "y",
        String(Math.round(centerY + forward.y * (eraRadius - 21))),
      );
    }
  }

  function updateOrbitGeometry(frame) {
    const { snapshot, worldPoints } = frame;
    const isConvection = snapshot.template.motion === "convection";
    if (elements.orbitSol) {
      elements.orbitSol.setAttribute("cx", String(ORBIT_GEOMETRY.centerX));
      elements.orbitSol.setAttribute("cy", String(ORBIT_GEOMETRY.centerY));
      elements.orbitSol.setAttribute("rx", String(ORBIT_GEOMETRY.sol.radiusX));
      elements.orbitSol.setAttribute("ry", String(ORBIT_GEOMETRY.sol.radiusY));
    }
    if (elements.orbitYol) {
      elements.orbitYol.setAttribute("cx", String(ORBIT_GEOMETRY.centerX));
      elements.orbitYol.setAttribute("cy", String(ORBIT_GEOMETRY.centerY));
      elements.orbitYol.setAttribute("rx", String(ORBIT_GEOMETRY.yol.radiusX));
      elements.orbitYol.setAttribute("ry", String(ORBIT_GEOMETRY.yol.radiusY));
    }
    setBodyElementState(
      elements.solBody,
      snapshot.sol,
      "sol",
      worldPoints.sol,
      snapshot.sol.visible && !isConvection,
    );
    setBodyElementState(
      elements.yolBody,
      snapshot.yol,
      "yol",
      worldPoints.yol,
      snapshot.yol.visible && !isConvection,
    );
    setZehsElementState(elements.zehsBody, worldPoints.zehs, true);
    if (elements.zehsBody) {
      elements.zehsBody.setAttribute("data-world-x", worldPoints.zehs.x.toFixed(3));
      elements.zehsBody.setAttribute("data-world-y", worldPoints.zehs.y.toFixed(3));
      elements.zehsBody.setAttribute("data-reference-role", "vollständige Era-Rotation");
    }
    positionOrbitLabel(elements.solLabel, worldPoints.sol, snapshot.sol, "sol");
    positionOrbitLabel(elements.yolLabel, worldPoints.yol, snapshot.yol, "yol");
    if (elements.directionPathSol) {
      elements.directionPathSol.setAttribute(
        "d",
        isConvection ? "" : buildBlockArrowPath("sol", snapshot.sol.directionSign),
      );
      elements.directionPathSol.setAttribute("data-direction-sign", String(snapshot.sol.directionSign));
    }
    if (elements.directionPathYol) {
      elements.directionPathYol.setAttribute(
        "d",
        isConvection ? "" : buildBlockArrowPath("yol", snapshot.yol.directionSign),
      );
      elements.directionPathYol.setAttribute("data-direction-sign", String(snapshot.yol.directionSign));
    }
    elements.orbitView.classList.toggle("is-convection", isConvection);
    elements.orbitView.setAttribute("data-horizon-latitude", String(state.horizonLatitude));
    elements.orbitView.setAttribute(
      "data-horizon-biome",
      HORIZON_LATITUDES[state.horizonLatitude].biome,
    );
    elements.convectionMessage.hidden = !isConvection;
    elements.orbitDescription.textContent = isConvection
      ? "Nordpol-Draufsicht während der Konvektion: Sol und Yol sind nicht sichtbar; ferne Splitterwelten treten hervor. ZEHS bleibt als ungefähr 40 AU entfernter Referenzpunkt kartiert."
      : `${snapshot.template.label}: vollständige schematische Orbits aus der Nordpol-Draufsicht. ZEHS ist als ungefähr 40 AU entfernter, annähernd fester Referenzpunkt markiert. Blickpfeil und Schnittlinie kennzeichnen die gewählte Horizontprojektion.`;
  }

  function updateHorizonGeometry(frame) {
    const { snapshot, worldPoints, horizonProjection } = frame;
    const isConvection = snapshot.template.motion === "convection";
    const solVisible = snapshot.sol.visible && horizonProjection.sol.visible && !isConvection;
    const yolVisible = snapshot.yol.visible && horizonProjection.yol.visible && !isConvection;
    const zehsVisible = horizonProjection.zehs.visible;
    setBodyElementState(
      elements.horizonSolBody,
      snapshot.sol,
      "sol",
      horizonProjection.sol,
      solVisible,
    );
    setBodyElementState(
      elements.horizonYolBody,
      snapshot.yol,
      "yol",
      horizonProjection.yol,
      yolVisible,
    );
    setZehsElementState(elements.horizonZehsStar, horizonProjection.zehs, zehsVisible);
    if (elements.horizonSolBody) {
      elements.horizonSolBody.setAttribute("data-world-x", worldPoints.sol.x.toFixed(3));
      elements.horizonSolBody.setAttribute("data-world-y", worldPoints.sol.y.toFixed(3));
      elements.horizonSolBody.setAttribute("data-forward", horizonProjection.sol.forward.toFixed(6));
      elements.horizonSolBody.setAttribute("data-latitude-lift", horizonProjection.sol.latitudeLift.toFixed(3));
    }
    if (elements.horizonYolBody) {
      elements.horizonYolBody.setAttribute("data-world-x", worldPoints.yol.x.toFixed(3));
      elements.horizonYolBody.setAttribute("data-world-y", worldPoints.yol.y.toFixed(3));
      elements.horizonYolBody.setAttribute("data-forward", horizonProjection.yol.forward.toFixed(6));
      elements.horizonYolBody.setAttribute("data-latitude-lift", horizonProjection.yol.latitudeLift.toFixed(3));
    }
    if (elements.horizonZehsStar) {
      elements.horizonZehsStar.setAttribute("data-world-x", worldPoints.zehs.x.toFixed(3));
      elements.horizonZehsStar.setAttribute("data-world-y", worldPoints.zehs.y.toFixed(3));
      elements.horizonZehsStar.setAttribute("data-forward", horizonProjection.zehs.forward.toFixed(6));
      elements.horizonZehsStar.setAttribute("data-latitude-lift", horizonProjection.zehs.latitudeLift.toFixed(3));
    }
    if (elements.zehsVisibility) {
      elements.zehsVisibility.textContent = zehsVisible
        ? `sichtbar · ${Math.round(horizonProjection.zehs.height)} px über Horizont`
        : "unter dem Horizont";
      elements.zehsVisibility.setAttribute("data-visible", String(zehsVisible));
    }
    if (elements.zehsPosition) {
      const side = horizonProjection.zehs.right < -0.08
        ? "links"
        : horizonProjection.zehs.right > 0.08
          ? "rechts"
          : "mittig";
      elements.zehsPosition.textContent = zehsVisible
        ? `x ${Math.round(horizonProjection.zehs.x)} · y ${Math.round(horizonProjection.zehs.y)} · ${side}`
        : `x ${Math.round(horizonProjection.zehs.x)} · unter Horizont`;
    }
    if (elements.horizonView) {
      elements.horizonView.classList.toggle("is-convection", isConvection);
      elements.horizonView.setAttribute(
        "data-era-rotation",
        frame.eraRotationDegrees.toFixed(3),
      );
      elements.horizonView.setAttribute("data-direction", state.horizonDirection);
      elements.horizonView.setAttribute("data-latitude-degrees", String(state.horizonLatitude));
      elements.horizonView.setAttribute("data-biome", HORIZON_LATITUDES[state.horizonLatitude].biome);
    }
    if (elements.horizonConvectionField) {
      elements.horizonConvectionField.classList.toggle("is-visible", isConvection);
      elements.horizonConvectionField.setAttribute("aria-hidden", String(!isConvection));
    }
    if (elements.horizonDescription) {
      const direction = HORIZON_DIRECTIONS[state.horizonDirection];
      const latitude = HORIZON_LATITUDES[state.horizonLatitude];
      const visibilityText = isConvection
        ? "Sol und Yol sind nicht sichtbar."
        : `Sol ist ${solVisible ? "vor" : "hinter"} dem lokalen Horizont, Yol ist ${
            yolVisible ? "vor" : "hinter"
          } dem lokalen Horizont.`;
      const zehsText = `ZEHS liegt ${zehsVisible ? "als heller Punkt über" : "unter"} dem lokalen Horizont und sinkt als nordsternartiger Referenzpunkt von 0° nach 60° flacher.`;
      elements.horizonDescription.textContent = `Schematischer Horizont durch die ${latitude.name} bei Blick nach ${direction.name} und ${latitude.degrees} Grad Versatz vom Nordpol in Richtung Äquator. ${visibilityText} ${zehsText} Die Projektion verwendet dieselben Weltpositionen wie die Nordpol-Draufsicht; der Äquator bei 90 Grad bleibt ausgeschlossen.`;
    }
  }

  function updateTimelineProgress(snapshot) {
    const buttons = elements.phaseTrack.querySelectorAll(".phase-segment");
    buttons.forEach((button, index) => {
      const segment = state.scenario.segments[index];
      let progress = 0;
      if (snapshot.ms >= segment.displayEnd) progress = 100;
      else if (snapshot.ms > segment.displayStart) {
        progress =
          ((snapshot.ms - segment.displayStart) / (segment.displayEnd - segment.displayStart)) * 100;
      }
      button.style.setProperty("--segment-progress", `${clamp(progress, 0, 100)}%`);
      button.classList.toggle("is-active", index === snapshot.segment.index);
      button.setAttribute("aria-current", index === snapshot.segment.index ? "step" : "false");
    });
  }

  function announce(message) {
    elements.liveRegion.textContent = "";
    window.setTimeout(() => {
      elements.liveRegion.textContent = message;
    }, 20);
  }

  function updatePhaseDetails(snapshot) {
    const { segment, template } = snapshot;
    const category = categoryById.get(template.category);
    elements.activeCategory.textContent = category.label;
    elements.activeCategory.style.color = category.color;
    elements.activeCategory.style.setProperty("--category-color", category.color);
    elements.activePhaseSigil.style.color = category.color;
    elements.activePhaseSigil.style.setProperty("--category-color", category.color);
    setUseHref(elements.activePhaseIconUse, template.icon);
    elements.activePhaseName.textContent = template.label;
    elements.activePhaseDescription.textContent = template.description;
    elements.activeDirection.textContent = template.direction;
    const displaySeconds = (segment.displayEnd - segment.displayStart) / 1000;
    elements.activeSpan.textContent = `${displaySeconds.toFixed(1).replace(".", ",")} s Darstellung`;
    elements.stateBadge.textContent = category.label;
    elements.stateBadge.style.color = category.color;
    elements.stateBadgeShell.style.color = category.color;
    elements.stateBadgeShell.style.setProperty("--category-color", category.color);
    setUseHref(elements.stateCategoryIconUse, category.icon);

    for (const [templateId, button] of sigilButtonsById) {
      const active = templateId === template.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "true" : "false");
    }

    const occurrences = state.scenario.occurrences.get(template.id) || [segment.index];
    const occurrence = occurrences.indexOf(segment.index) + 1;
    elements.phaseOccurrence.textContent = `${occurrence} / ${occurrences.length}`;
    if (document.activeElement !== elements.phaseSelect) {
      elements.phaseSelect.value = template.id;
    }

    if (state.lastRenderedSegment !== segment.index) {
      state.lastRenderedSegment = segment.index;
      announce(`${template.label}. Abschnitt ${segment.index + 1} von ${state.scenario.segments.length}.`);
    }
  }

  function render(ms = state.currentMs) {
    const snapshot = getSnapshot(ms);
    lastRenderFrame = createRenderFrame(snapshot);
    const isConvection = snapshot.template.motion === "convection";
    const solSpeedText = `${snapshot.sol.speed.toFixed(1).replace(".", ",")}°/s`;
    const yolSpeedText = `${snapshot.yol.speed.toFixed(1).replace(".", ",")}°/s`;

    updateDirectionControls();
    updateLatitudeControls();
    updateEraOrientation(lastRenderFrame);
    updateOrbitGeometry(lastRenderFrame);
    updateHorizonGeometry(lastRenderFrame);

    elements.eraTime.textContent = formatEraTime(snapshot.cycleUm);
    elements.solIntensity.textContent = snapshot.sol.intensity !== null
      ? `S-Int ${snapshot.sol.intensity.toFixed(1).replace(".", ",")}`
      : "nicht sichtbar";
    elements.yolIntensity.textContent = snapshot.yol.intensity !== null
      ? `S-Int ${snapshot.yol.intensity.toFixed(1).replace(".", ",")}`
      : "nicht sichtbar";
    elements.solSpeed.textContent = isConvection ? "—" : solSpeedText;
    elements.yolSpeed.textContent = isConvection ? "—" : yolSpeedText;
    const totalClock = formatClock(state.presentationMs);
    elements.presentationTime.textContent = `${formatClock(ms)} / ${totalClock}`;
    elements.timelineNow.textContent = formatClock(ms);
    elements.timelineTotal.textContent = totalClock;
    elements.timeSlider.value = String(Math.round(ms));
    elements.timeSlider.setAttribute(
      "aria-valuetext",
      `${formatClock(ms)} von ${totalClock}, ${snapshot.template.label}`,
    );
    elements.segmentRange.textContent = formatRange(snapshot.segment);
    elements.solSpeedMeterLabel.textContent = isConvection ? "nicht sichtbar" : solSpeedText;
    elements.yolSpeedMeterLabel.textContent = isConvection ? "nicht sichtbar" : yolSpeedText;
    elements.solSpeedMeter.style.width = `${isConvection ? 0 : clamp(snapshot.sol.speed / 14, 0, 1) * 100}%`;
    elements.yolSpeedMeter.style.width = `${isConvection ? 0 : clamp(snapshot.yol.speed / 14, 0, 1) * 100}%`;

    updatePhaseDetails(snapshot);
    updateTimelineProgress(snapshot);
  }

  function buildPhaseSelect() {
    elements.phaseSelect.replaceChildren();
    for (const category of categories) {
      const groupTemplates = templates.filter((template) => template.category === category.id);
      if (!groupTemplates.length) continue;
      const group = document.createElement("optgroup");
      group.label = category.label;
      groupTemplates.forEach((template) => {
        const option = document.createElement("option");
        option.value = template.id;
        option.textContent = template.label;
        group.append(option);
      });
      elements.phaseSelect.append(group);
    }
  }

  function buildPhaseSigils() {
    elements.phaseSigils.replaceChildren();
    sigilButtonsById.clear();
    for (const template of templates) {
      const category = categoryById.get(template.category);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "phase-sigil";
      button.style.setProperty("--category-color", category.color);
      button.setAttribute("aria-label", `Zu ${template.label} springen`);
      button.setAttribute("title", `${template.label} · ${category.label}`);
      button.append(createIcon(template.icon, "phase-sigil-icon"));
      const label = document.createElement("span");
      label.textContent = template.shortLabel;
      button.append(label);
      button.addEventListener("click", () => jumpToTemplate(template.id));
      sigilButtonsById.set(template.id, button);
      elements.phaseSigils.append(button);
    }
  }

  function buildTimeline() {
    elements.phaseTrack.replaceChildren();
    state.scenario.segments.forEach((segment) => {
      const category = categoryById.get(segment.template.category);
      const button = document.createElement("button");
      const duration = segment.displayEnd - segment.displayStart;
      button.type = "button";
      button.className = "phase-segment";
      button.style.setProperty("--segment-grow", String(duration));
      button.style.setProperty("--segment-color", category.color);
      button.setAttribute(
        "aria-label",
        `${segment.template.label}, ${formatClock(segment.displayStart)} bis ${formatClock(segment.displayEnd)}, ${formatRange(segment)}`,
      );
      button.setAttribute("title", segment.template.label);
      button.append(createIcon(segment.template.icon, "segment-icon"));
      const label = document.createElement("span");
      label.className = "segment-label";
      label.textContent = segment.template.shortLabel;
      button.append(label);
      button.addEventListener("click", () => {
        seekTo(segment.displayStart + Math.min(80, duration / 10), true);
      });
      elements.phaseTrack.append(button);
    });
  }

  function loadScenario(seed, options = {}) {
    const normalized = normalizeSeed(seed);
    state.seed = normalized;
    state.scenario = buildScenario(normalized);
    state.lastRenderedSegment = -1;
    elements.seedInput.value = normalized;
    elements.phaseCount.textContent = String(state.scenario.segments.length);
    elements.repeatCount.textContent = String(state.scenario.repeatTotal);
    elements.timeSlider.setAttribute("max", String(state.presentationMs));
    elements.timelineTitle.textContent = "Sechs-Minuten-Zeitpfad";
    buildTimeline();
    updatePlaybackLabels();
    render(state.currentMs);
    if (options.announce !== false) {
      announce(`Szenario ${normalized} erzeugt. ${state.scenario.segments.length} Abschnitte.`);
    }
  }

  function seekTo(ms, shouldAnnounce = false) {
    state.currentMs = clamp(ms, 0, state.presentationMs);
    state.lastFrameAt = performance.now();
    render(state.currentMs);
    if (shouldAnnounce) {
      const snapshot = getSnapshot(state.currentMs);
      announce(`Gesprungen zu ${snapshot.template.label}, ${formatClock(state.currentMs)}.`);
    }
  }

  function jumpToTemplate(templateId) {
    const occurrences = state.scenario.occurrences.get(templateId);
    if (!occurrences || occurrences.length === 0) return;
    const nextIndex =
      occurrences.find(
        (segmentIndex) =>
          state.scenario.segments[segmentIndex].displayStart > state.currentMs + 120,
      ) ?? occurrences[0];
    const segment = state.scenario.segments[nextIndex];
    seekTo(segment.displayStart + Math.min(80, (segment.displayEnd - segment.displayStart) / 10), true);
  }

  function jumpBySegment(offset) {
    const current = findSegment(state.currentMs);
    const length = state.scenario.segments.length;
    const index = (current.index + offset + length) % length;
    const segment = state.scenario.segments[index];
    seekTo(segment.displayStart + Math.min(80, (segment.displayEnd - segment.displayStart) / 10), true);
  }

  function updatePlayButton() {
    elements.playToggle.setAttribute("aria-pressed", String(state.playing));
    setUseHref(elements.playIconUse, state.playing ? "icon-pause" : "icon-play");
    elements.playLabel.textContent = state.playing ? "Pausieren" : "Abspielen";
  }

  function updateAutoCycleButton() {
    const enabled = state.autoCycle;
    elements.autoCycle.setAttribute("aria-pressed", String(enabled));
    elements.autoCycle.classList.toggle("is-active", enabled);
    elements.autoCycle.setAttribute(
      "title",
      enabled
        ? "Automatisches Neuwürfeln nach der Konvektion ist aktiv"
        : "Automatisches Neuwürfeln nach der Konvektion einschalten",
    );
  }

  function updatePlaybackLabels() {
    const options = elements.playbackRate.querySelectorAll("option");
    options.forEach((option) => {
      const rate = Number(option.value) || 1;
      const rateLabel = String(rate).replace(".", ",");
      option.textContent = `${rateLabel}× · ${formatClock(state.presentationMs / rate)}`;
    });
  }

  function setPlaying(playing) {
    if (playing && state.currentMs >= state.presentationMs) {
      seekTo(0);
    }
    state.playing = playing;
    state.lastFrameAt = performance.now();
    updatePlayButton();
    if (state.playing && state.animationFrame === null) {
      state.animationFrame = requestAnimationFrame(tick);
    }
    announce(state.playing ? "Simulation läuft." : "Simulation pausiert.");
  }

  function tick(timestamp) {
    state.animationFrame = null;
    if (!state.playing) return;
    const elapsed = state.lastFrameAt === null ? 0 : clamp(timestamp - state.lastFrameAt, 0, 120);
    state.lastFrameAt = timestamp;
    state.currentMs += elapsed * state.playbackRate;
    if (state.currentMs >= state.presentationMs) {
      state.currentMs = state.presentationMs;
      render(state.currentMs);
      if (state.autoCycle) {
        const completedSeed = state.seed;
        state.currentMs = 0;
        loadScenario(createNewSeed(), { announce: false });
        state.lastFrameAt = timestamp;
        state.animationFrame = requestAnimationFrame(tick);
        announce(`Konvektionszyklus ${completedSeed} beendet. Neuer Zyklus ${state.seed} läuft.`);
        return;
      }
      setPlaying(false);
      announce("Konvektionszyklus beendet. Die nächste Konvektion beginnt nach dem Neustart des Zyklus.");
      return;
    }
    render(state.currentMs);
    state.animationFrame = requestAnimationFrame(tick);
  }

  function createNewSeed() {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);
    return `ERA-${values[0].toString(36).toUpperCase()}-${values[1]
      .toString(36)
      .toUpperCase()
      .slice(0, 4)}`;
  }

  function persistHorizonDirection(directionId) {
    try {
      localStorage.setItem("era-horizon-direction", directionId);
    } catch (_) {
      // Die Blickrichtung bleibt auch ohne verfügbaren lokalen Speicher bedienbar.
    }
  }

  function persistHorizonLatitude(latitudeDegrees) {
    try {
      localStorage.setItem("era-horizon-latitude", String(latitudeDegrees));
    } catch (_) {
      // Die Breitenstufe bleibt auch ohne verfügbaren lokalen Speicher bedienbar.
    }
  }

  function setHorizonDirection(directionId, options = {}) {
    const normalizedDirection = HORIZON_DIRECTIONS[directionId] ? directionId : "north";
    const changed = normalizedDirection !== state.horizonDirection;
    state.horizonDirection = normalizedDirection;
    if (options.persist !== false) persistHorizonDirection(normalizedDirection);
    updateDirectionControls();

    if (lastRenderFrame) {
      lastRenderFrame = reprojectRenderFrame(lastRenderFrame);
      updateEraOrientation(lastRenderFrame);
      updateHorizonGeometry(lastRenderFrame);
      elements.orbitView.setAttribute("data-horizon-direction", normalizedDirection);
    }

    const activeButton = elements.horizonDirectionButtons[normalizedDirection];
    if (options.focus && typeof activeButton?.focus === "function") activeButton.focus();
    if (changed && options.announce !== false) {
      announce(`Horizontblick nach ${HORIZON_DIRECTIONS[normalizedDirection].name}.`);
    }
  }

  function moveHorizonDirection(directionId, offset) {
    const currentIndex = HORIZON_DIRECTION_ORDER.indexOf(directionId);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex =
      (safeIndex + offset + HORIZON_DIRECTION_ORDER.length) % HORIZON_DIRECTION_ORDER.length;
    setHorizonDirection(HORIZON_DIRECTION_ORDER[nextIndex], { focus: true });
  }

  function setHorizonLatitude(latitudeDegrees, options = {}) {
    const normalizedLatitude = normalizeHorizonLatitude(latitudeDegrees);
    const changed = normalizedLatitude !== state.horizonLatitude;
    state.horizonLatitude = normalizedLatitude;
    if (options.persist !== false) persistHorizonLatitude(normalizedLatitude);
    updateDirectionControls();
    updateLatitudeControls();

    if (lastRenderFrame) {
      lastRenderFrame = reprojectRenderFrame(lastRenderFrame);
      updateEraOrientation(lastRenderFrame);
      updateHorizonGeometry(lastRenderFrame);
      elements.orbitView.setAttribute("data-horizon-latitude", String(normalizedLatitude));
      elements.orbitView.setAttribute(
        "data-horizon-biome",
        HORIZON_LATITUDES[normalizedLatitude].biome,
      );
    }

    const activeButton = elements.horizonLatitudeButtons[normalizedLatitude];
    if (options.focus && typeof activeButton?.focus === "function") activeButton.focus();
    if (changed && options.announce !== false) {
      const latitude = HORIZON_LATITUDES[normalizedLatitude];
      announce(`${latitude.degrees} Grad äquatorwärts: ${latitude.name}. Sol und Yol steigen mit der Breite, ZEHS sinkt nordsternartig zum Horizont.`);
    }
  }

  function moveHorizonLatitude(latitudeDegrees, offset) {
    const currentIndex = HORIZON_LATITUDE_ORDER.indexOf(normalizeHorizonLatitude(latitudeDegrees));
    const nextIndex =
      (currentIndex + offset + HORIZON_LATITUDE_ORDER.length) % HORIZON_LATITUDE_ORDER.length;
    setHorizonLatitude(HORIZON_LATITUDE_ORDER[nextIndex], { focus: true });
  }

  function getLastRenderFrame() {
    return lastRenderFrame;
  }

  function getState() {
    return Object.freeze({
      seed: state.seed,
      currentMs: state.currentMs,
      presentationMs: state.presentationMs,
      horizonDirection: state.horizonDirection,
      horizonLatitude: state.horizonLatitude,
      playing: state.playing,
      autoCycle: state.autoCycle,
      playbackRate: state.playbackRate,
      reducedMotion: state.reducedMotion,
      theme: state.theme,
      scenario: state.scenario,
    });
  }

  function attachEvents() {
    for (const directionId of HORIZON_DIRECTION_ORDER) {
      const button = elements.horizonDirectionButtons[directionId];
      if (!button) continue;
      button.addEventListener("click", () => setHorizonDirection(directionId));
      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault?.();
          moveHorizonDirection(directionId, 1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault?.();
          moveHorizonDirection(directionId, -1);
        } else if (event.key === "Home") {
          event.preventDefault?.();
          setHorizonDirection(HORIZON_DIRECTION_ORDER[0], { focus: true });
        } else if (event.key === "End") {
          event.preventDefault?.();
          setHorizonDirection(HORIZON_DIRECTION_ORDER.at(-1), { focus: true });
        }
      });
    }
    for (const latitudeDegrees of HORIZON_LATITUDE_ORDER) {
      const button = elements.horizonLatitudeButtons[latitudeDegrees];
      if (!button) continue;
      button.addEventListener("click", () => setHorizonLatitude(latitudeDegrees));
      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault?.();
          moveHorizonLatitude(latitudeDegrees, 1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault?.();
          moveHorizonLatitude(latitudeDegrees, -1);
        } else if (event.key === "Home") {
          event.preventDefault?.();
          setHorizonLatitude(HORIZON_LATITUDE_ORDER[0], { focus: true });
        } else if (event.key === "End") {
          event.preventDefault?.();
          setHorizonLatitude(HORIZON_LATITUDE_ORDER.at(-1), { focus: true });
        }
      });
    }
    elements.phaseSelect.addEventListener("change", () => {
      jumpToTemplate(elements.phaseSelect.value);
    });
    elements.jumpPhase.addEventListener("click", () => jumpToTemplate(elements.phaseSelect.value));
    elements.previousPhase.addEventListener("click", () => jumpBySegment(-1));
    elements.nextPhase.addEventListener("click", () => jumpBySegment(1));
    elements.applySeed.addEventListener("click", () => loadScenario(elements.seedInput.value));
    elements.seedInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") loadScenario(elements.seedInput.value);
    });
    elements.newSeed.addEventListener("click", () => loadScenario(createNewSeed()));
    elements.timeSlider.addEventListener("input", () => seekTo(Number(elements.timeSlider.value)));
    elements.timeSlider.addEventListener("change", () => {
      const snapshot = getSnapshot(state.currentMs);
      announce(`${formatClock(state.currentMs)}. ${snapshot.template.label}.`);
    });
    elements.playToggle.addEventListener("click", () => setPlaying(!state.playing));
    elements.autoCycle.addEventListener("click", () => {
      state.autoCycle = !state.autoCycle;
      updateAutoCycleButton();
      announce(
        state.autoCycle
          ? "Automatisches Neuwürfeln nach der Konvektion aktiviert."
          : "Automatisches Neuwürfeln deaktiviert.",
      );
    });
    elements.restart.addEventListener("click", () => {
      seekTo(0, true);
    });
    elements.playbackRate.addEventListener("change", () => {
      state.playbackRate = Number(elements.playbackRate.value) || 1;
      state.lastFrameAt = performance.now();
      announce(`Wiedergabetempo ${String(state.playbackRate).replace(".", ",")} fach.`);
    });
    elements.themeToggle.addEventListener("click", () => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      announce(nextTheme === "dark" ? "Dunkle Chronik aktiviert." : "Helles Pergament aktiviert.");
    });
    document.addEventListener("visibilitychange", () => {
      state.lastFrameAt = performance.now();
    });
    const onReducedMotionChange = (event) => {
      state.reducedMotion = event.matches;
      state.lastFrameAt = performance.now();
      render(state.currentMs);
      announce(event.matches ? "Reduzierte Bewegung aktiv." : "Normale Bewegung aktiv.");
    };
    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", onReducedMotionChange);
    } else {
      reducedMotionQuery.addListener(onReducedMotionChange);
    }
  }

  window.ERA_CYCLE_CONTRACT = Object.freeze({
    ORBIT_GEOMETRY,
    HORIZON_GEOMETRY,
    HORIZON_DIRECTIONS,
    HORIZON_LATITUDES,
    ZEHS_PARAMETERS,
    normalizeDegrees,
    normalizeHorizonLatitude,
    getLatitudeLift,
    getEraRotationDegrees,
    getOrbitPoint,
    getBodyVisualRadius,
    ensureOrbitClearance,
    getViewBasis,
    projectOrbitPointToHorizon,
    getSnapshot,
    formatEraTime,
    getLastRenderFrame,
    getState,
  });

  applyTheme(state.theme, { persist: false });
  buildPhaseSelect();
  buildPhaseSigils();
  attachEvents();
  loadScenario(state.seed, { announce: false });
  updatePlayButton();
  updateAutoCycleButton();
})();
