(function runEraCycle() {
  "use strict";

  const source = window.ERA_PHASES;
  if (!source) {
    throw new Error("ERA_PHASES wurde nicht geladen.");
  }

  const { config, categories, templates } = source;
  const TIME_MODES = config.timeModes;
  const TIME_MODE_ORDER = Object.freeze(["chronicle", "inspection"]);
  const TIMELINE_ZOOM_ORDER = Object.freeze(["series", "cycle", "detail"]);
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
  const IRRADIANCE_MODEL = Object.freeze({
    latitudeStrength: Object.freeze({ 0: 0, 30: 0.64, 60: 1 }),
    delayMs: 2200,
    buildupMs: 12000,
    decayMs: 9000,
    sampleMs: 200,
    relativeSpeedScale: 4,
    minimumStability: 0.18,
  });
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
  const HORIZON_PROJECTION_SCALE = Object.freeze({
    celestial: 0.76,
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
    orbitSolTracks: document.querySelectorAll(".orbit-sol-track"),
    orbitYolTracks: document.querySelectorAll(".orbit-yol-track"),
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
    timeMode: document.querySelector("#time-mode"),
    solIntensity: document.querySelector("#sol-intensity"),
    yolIntensity: document.querySelector("#yol-intensity"),
    solSpeed: document.querySelector("#sol-speed"),
    yolSpeed: document.querySelector("#yol-speed"),
    presentationLabel: document.querySelector("#presentation-label"),
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
    cycleProgress: document.querySelector("#cycle-progress"),
    timeMapping: document.querySelector("#time-mapping"),
    phaseTrack: document.querySelector("#phase-track"),
    timelineTitle: document.querySelector("#timeline-title"),
    timelineSummary: document.querySelector("#timeline-summary"),
    timelineZoomControls: document.querySelector("#timeline-zoom-controls"),
    timelineZoomOut: document.querySelector("#timeline-zoom-out"),
    timelineZoomIn: document.querySelector("#timeline-zoom-in"),
    timelineZoomLevel: document.querySelector("#timeline-zoom-level"),
    previousCycle: document.querySelector("#previous-cycle"),
    nextCycle: document.querySelector("#next-cycle"),
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
    rootSeed: normalizeSeed(elements.seedInput.value),
    seed: normalizeSeed(elements.seedInput.value),
    scenario: null,
    cycles: new Map(),
    cycleIndex: 0,
    currentMs: 0,
    playing: false,
    autoCycle: false,
    playbackRate: 1,
    timeMode: readStoredTimeMode(),
    presentationMs: getTimeMode(readStoredTimeMode()).presentationMs,
    timelineZoom: "cycle",
    timelineDetailSegmentIndex: 0,
    eraRotationOffsetDegrees: 0,
    animationFrame: null,
    lastFrameAt: null,
    playbackAnchorAt: null,
    playbackAnchorMs: 0,
    lastRenderedSegment: -1,
    reducedMotion: reducedMotionQuery.matches,
    theme: document.documentElement?.dataset?.theme === "light" ? "light" : "dark",
    horizonDirection: readStoredHorizonDirection(),
    horizonLatitude: readStoredHorizonLatitude(),
    irradianceTimelines: new Map(),
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

  function normalizeTimeMode(value) {
    return TIME_MODES[value] ? value : config.defaultTimeMode;
  }

  function getTimeMode(modeId = state?.timeMode) {
    return TIME_MODES[normalizeTimeMode(modeId)];
  }

  function readStoredTimeMode() {
    try {
      return normalizeTimeMode(localStorage.getItem("era-time-mode"));
    } catch (_) {
      return config.defaultTimeMode;
    }
  }

  function persistTimeMode(modeId) {
    try {
      localStorage.setItem("era-time-mode", normalizeTimeMode(modeId));
    } catch (_) {
      // Der Zeitmodus bleibt auch ohne verfügbaren lokalen Speicher bedienbar.
    }
  }

  function isInspectionMode(modeId = state.timeMode) {
    return normalizeTimeMode(modeId) === "inspection";
  }

  function modeMsToCycleUm(ms, modeId = state.timeMode, scenario = state.scenario) {
    const mode = getTimeMode(modeId);
    const boundedMs = clamp(Number(ms) || 0, 0, mode.presentationMs);
    if (mode.kind === "linear-world-time") {
      return clamp(boundedMs / mode.millisecondsPerUm, 0, config.totalUm);
    }
    const activeScenario = scenario || state.scenario;
    if (!activeScenario) return 0;
    const segment = findSegment(boundedMs, {
      timeMode: mode.id,
      scenario: activeScenario,
    });
    const duration = Math.max(1, segment.displayEnd - segment.displayStart);
    const progress = clamp((boundedMs - segment.displayStart) / duration, 0, 1);
    return segment.umStart + (segment.umEnd - segment.umStart) * progress;
  }

  function cycleUmToModeMs(cycleUm, modeId = state.timeMode, scenario = state.scenario) {
    const mode = getTimeMode(modeId);
    const boundedUm = clamp(Number(cycleUm) || 0, 0, config.totalUm);
    if (mode.kind === "linear-world-time") {
      return boundedUm * mode.millisecondsPerUm;
    }
    const activeScenario = scenario || state.scenario;
    if (!activeScenario) return 0;
    if (boundedUm === config.totalUm) return mode.presentationMs;
    const segment = activeScenario.segments.find(
      (candidate) => boundedUm >= candidate.umStart && boundedUm < candidate.umEnd,
    ) || activeScenario.segments[0];
    const durationUm = Math.max(1, segment.umEnd - segment.umStart);
    const progress = clamp((boundedUm - segment.umStart) / durationUm, 0, 1);
    return segment.displayStart + (segment.displayEnd - segment.displayStart) * progress;
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

  function smoothstep(value) {
    const progress = clamp(Number(value) || 0, 0, 1);
    return progress * progress * (3 - 2 * progress);
  }

  function interpolate(start, end, progress) {
    return start + (end - start) * progress;
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

  function getEraRotationUnwrappedDegrees(ms, motion, options = {}) {
    const timeMode = normalizeTimeMode(options.timeMode || state.timeMode);
    const mode = getTimeMode(timeMode);
    const scenario = options.scenario || state.scenario;
    const cycleIndex = Number.isInteger(options.cycleIndex)
      ? options.cycleIndex
      : state.cycleIndex;
    const safeMs = Number.isFinite(Number(ms)) ? Number(ms) : 0;
    const sampledMs = options.exact || !state.reducedMotion
      ? safeMs
      : Math.round(safeMs / 1000) * 1000;
    if (mode.kind === "linear-world-time") {
      const absoluteWorldUm =
        cycleIndex * config.totalUm +
        clamp(sampledMs, 0, mode.presentationMs) / mode.millisecondsPerUm;
      const initialDegrees = Number(scenario?.eraRotationStartDegrees?.inspection) || 0;
      return initialDegrees + absoluteWorldUm * mode.eraRotationDegreesPerUm;
    }
    const initialDegrees = Number(scenario?.eraRotationStartDegrees?.chronicle);
    return (Number.isFinite(initialDegrees) ? initialDegrees : state.eraRotationOffsetDegrees) +
      (sampledMs / 1000) * mode.eraRotationDegreesPerSecond;
  }

  function getEraRotationDegrees(ms, motion, options = {}) {
    return normalizeDegrees(getEraRotationUnwrappedDegrees(ms, motion, options));
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
    let baseX;
    let baseY;
    if (bodySnapshot.angleKind === "polar") {
      const cosine = Math.cos(radians);
      const sine = Math.sin(radians);
      const rayRadius = 1 / Math.sqrt(
        (cosine * cosine) / (orbit.radiusX * orbit.radiusX) +
          (sine * sine) / (orbit.radiusY * orbit.radiusY),
      );
      baseX = rayRadius * cosine;
      baseY = rayRadius * sine;
    } else {
      baseX = orbit.radiusX * Math.cos(radians);
      baseY = orbit.radiusY * Math.sin(radians);
    }
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

  function projectOrbitPointToHorizon(point, viewBasis, projectionKind, latitudeDegrees = 0) {
    const basis = viewBasis || getViewBasis("north", 0);
    const deltaX = Number(point?.x) - ORBIT_GEOMETRY.centerX;
    const deltaY = Number(point?.y) - ORBIT_GEOMETRY.centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const unitX = distance > 0.000001 && Number.isFinite(distance) ? deltaX / distance : 0;
    const unitY = distance > 0.000001 && Number.isFinite(distance) ? deltaY / distance : -1;
    const forwardAmount = clamp(unitX * basis.forward.x + unitY * basis.forward.y, -1, 1);
    const rightAmount = clamp(unitX * basis.right.x + unitY * basis.right.y, -1, 1);
    const normalizedKind = projectionKind === "zehs"
      ? "zehs"
      : projectionKind === "convection"
        ? "convection"
        : "celestial";
    const heightScale = HORIZON_PROJECTION_SCALE[normalizedKind];
    const visible = normalizedKind !== "convection" && forwardAmount >= -0.000001;
    const baseHeight =
      Math.pow(Math.max(0, forwardAmount), 0.8) * HORIZON_GEOMETRY.maxSkyHeight * heightScale;
    const latitudeLift = visible ? getLatitudeLift(latitudeDegrees, normalizedKind) : 0;
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

  function buildIrradianceTimeline(directionId, latitudeDegrees) {
    const direction = HORIZON_DIRECTIONS[directionId] ? directionId : "north";
    const latitude = normalizeHorizonLatitude(latitudeDegrees);
    const samples = [];
    let previous = {
      sol: { visible: false, dwellMs: 0, envelope: 0 },
      yol: { visible: false, dwellMs: 0, envelope: 0 },
    };
    let previousMs = 0;

    for (let ms = 0; ms <= state.presentationMs; ms += IRRADIANCE_MODEL.sampleMs) {
      const sampleMs = Math.min(ms, state.presentationMs);
      const elapsedMs = samples.length === 0 ? 0 : Math.max(0, sampleMs - previousMs);
      const snapshot = getSnapshot(sampleMs, { exact: true });
      const isConvection = snapshot.template.motion === "convection";
      const viewBasis = getViewBasis(
        direction,
        getEraRotationDegrees(sampleMs, snapshot.template.motion, {
          timeMode: snapshot.timeMode,
          scenario: snapshot.scenario,
          cycleIndex: snapshot.cycleIndex,
          exact: true,
        }),
      );
      const next = {};
      for (const bodyName of ["sol", "yol"]) {
        const point = getOrbitPoint(snapshot, bodyName);
        const projection = projectOrbitPointToHorizon(
          point,
          viewBasis,
          isConvection ? "convection" : "celestial",
          latitude,
        );
        const visible = Boolean(!isConvection && snapshot[bodyName].visible && projection.visible);
        const dwellMs = visible
          ? previous[bodyName].visible
            ? previous[bodyName].dwellMs + elapsedMs
            : 0
          : 0;
        let envelope = previous[bodyName].envelope;
        if (visible && dwellMs >= IRRADIANCE_MODEL.delayMs) {
          const buildupRetention = Math.exp(-elapsedMs / IRRADIANCE_MODEL.buildupMs);
          envelope = 1 - (1 - envelope) * buildupRetention;
        } else if (!visible) {
          envelope *= Math.exp(-elapsedMs / IRRADIANCE_MODEL.decayMs);
        }
        if (envelope < 0.000001) envelope = 0;
        next[bodyName] = {
          visible,
          dwellMs,
          envelope: clamp(envelope, 0, 1),
        };
      }
      samples.push(Object.freeze({
        ms: sampleMs,
        solDwellMs: next.sol.dwellMs,
        yolDwellMs: next.yol.dwellMs,
        solEnvelope: next.sol.envelope,
        yolEnvelope: next.yol.envelope,
      }));
      previous = next;
      previousMs = sampleMs;
      if (sampleMs === state.presentationMs) break;
    }
    return Object.freeze(samples);
  }

  function getIrradianceVisibilityState(
    ms,
    direction,
    latitude,
    scenario = state.scenario,
    cycleIndex = state.cycleIndex,
  ) {
    const snapshot = getSnapshot(ms, {
      exact: true,
      timeMode: "inspection",
      scenario,
      cycleIndex,
    });
    const isConvection = snapshot.template.motion === "convection";
    const viewBasis = getViewBasis(
      direction,
      getEraRotationDegrees(ms, snapshot.template.motion, {
        timeMode: "inspection",
        scenario,
        cycleIndex,
        exact: true,
      }),
    );
    const visibility = {};
    for (const bodyName of ["sol", "yol"]) {
      const projection = projectOrbitPointToHorizon(
        getOrbitPoint(snapshot, bodyName),
        viewBasis,
        isConvection ? "convection" : "celestial",
        latitude,
      );
      visibility[bodyName] = Boolean(
        !isConvection && snapshot[bodyName].visible && projection.visible,
      );
    }
    return visibility;
  }

  function buildInspectionIrradianceState(
    targetMs,
    direction,
    latitude,
    cachedState = null,
  ) {
    const boundedTarget = clamp(
      Number(targetMs) || 0,
      0,
      TIME_MODES.inspection.presentationMs,
    );
    const lookbackMs = Math.max(
      120000,
      IRRADIANCE_MODEL.delayMs +
        Math.max(IRRADIANCE_MODEL.buildupMs, IRRADIANCE_MODEL.decayMs) * 8,
    );
    const canContinue = cachedState &&
      cachedState.kind === "inspection" &&
      boundedTarget >= cachedState.ms &&
      boundedTarget - cachedState.ms <= lookbackMs;
    const startMs = canContinue
      ? cachedState.ms
      : Math.max(0, boundedTarget - lookbackMs);
    let previous = canContinue
      ? {
          sol: {
            visible: cachedState.solVisible,
            dwellMs: cachedState.solDwellMs,
            envelope: cachedState.solEnvelope,
          },
          yol: {
            visible: cachedState.yolVisible,
            dwellMs: cachedState.yolDwellMs,
            envelope: cachedState.yolEnvelope,
          },
        }
      : (() => {
          const visibility = getIrradianceVisibilityState(
            startMs,
            direction,
            latitude,
          );
          return {
            sol: { visible: visibility.sol, dwellMs: 0, envelope: 0 },
            yol: { visible: visibility.yol, dwellMs: 0, envelope: 0 },
          };
        })();
    let previousMs = startMs;

    while (previousMs < boundedTarget) {
      const sampleMs = Math.min(
        boundedTarget,
        previousMs + IRRADIANCE_MODEL.sampleMs,
      );
      const elapsedMs = sampleMs - previousMs;
      const visibility = getIrradianceVisibilityState(
        sampleMs,
        direction,
        latitude,
      );
      const next = {};
      for (const bodyName of ["sol", "yol"]) {
        const visible = visibility[bodyName];
        const dwellMs = visible
          ? previous[bodyName].visible
            ? previous[bodyName].dwellMs + elapsedMs
            : 0
          : 0;
        let envelope = previous[bodyName].envelope;
        if (visible && dwellMs >= IRRADIANCE_MODEL.delayMs) {
          const buildupRetention = Math.exp(-elapsedMs / IRRADIANCE_MODEL.buildupMs);
          envelope = 1 - (1 - envelope) * buildupRetention;
        } else if (!visible) {
          envelope *= Math.exp(-elapsedMs / IRRADIANCE_MODEL.decayMs);
        }
        if (envelope < 0.000001) envelope = 0;
        next[bodyName] = {
          visible,
          dwellMs,
          envelope: clamp(envelope, 0, 1),
        };
      }
      previous = next;
      previousMs = sampleMs;
    }

    return Object.freeze({
      kind: "inspection",
      ms: boundedTarget,
      solVisible: previous.sol.visible,
      yolVisible: previous.yol.visible,
      solDwellMs: previous.sol.dwellMs,
      yolDwellMs: previous.yol.dwellMs,
      solEnvelope: previous.sol.envelope,
      yolEnvelope: previous.yol.envelope,
    });
  }

  function getIrradianceDwellAt(
    ms,
    directionId = state.horizonDirection,
    latitudeDegrees = state.horizonLatitude,
  ) {
    const latitude = normalizeHorizonLatitude(latitudeDegrees);
    if (!state.scenario || latitude === 0) {
      return Object.freeze({
        solDwellMs: 0,
        yolDwellMs: 0,
        solEnvelope: 0,
        yolEnvelope: 0,
      });
    }
    const direction = HORIZON_DIRECTIONS[directionId] ? directionId : "north";
    const key = `${state.timeMode}|${state.cycleIndex}|${direction}|${latitude}`;
    if (isInspectionMode()) {
      const nextState = buildInspectionIrradianceState(
        ms,
        direction,
        latitude,
        state.irradianceTimelines.get(key),
      );
      state.irradianceTimelines.set(key, nextState);
      return Object.freeze({
        solDwellMs: nextState.solDwellMs,
        yolDwellMs: nextState.yolDwellMs,
        solEnvelope: nextState.solEnvelope,
        yolEnvelope: nextState.yolEnvelope,
      });
    }
    if (!state.irradianceTimelines.has(key)) {
      state.irradianceTimelines.set(key, buildIrradianceTimeline(direction, latitude));
    }
    const timeline = state.irradianceTimelines.get(key);
    const boundedMs = clamp(Number(ms) || 0, 0, state.presentationMs);
    const exactIndex = boundedMs / IRRADIANCE_MODEL.sampleMs;
    const lowerIndex = Math.min(Math.floor(exactIndex), timeline.length - 1);
    const upperIndex = Math.min(lowerIndex + 1, timeline.length - 1);
    const lower = timeline[lowerIndex];
    const upper = timeline[upperIndex];
    const span = Math.max(1, upper.ms - lower.ms);
    const progress = clamp((boundedMs - lower.ms) / span, 0, 1);
    return Object.freeze({
      solDwellMs: interpolate(lower.solDwellMs, upper.solDwellMs, progress),
      yolDwellMs: interpolate(lower.yolDwellMs, upper.yolDwellMs, progress),
      solEnvelope: interpolate(lower.solEnvelope, upper.solEnvelope, progress),
      yolEnvelope: interpolate(lower.yolEnvelope, upper.yolEnvelope, progress),
    });
  }

  function getHorizonIrradiance(
    snapshot,
    horizonProjection,
    latitudeDegrees = state.horizonLatitude,
    dwellHistory = null,
  ) {
    const latitude = normalizeHorizonLatitude(latitudeDegrees);
    const latitudeStrength = IRRADIANCE_MODEL.latitudeStrength[latitude] || 0;
    const isConvection = snapshot?.template?.motion === "convection";
    const sampledMs = Number(snapshot?.positionMs ?? snapshot?.ms);
    const segmentStart = snapshot?.segment
      ? segmentStartMs(snapshot.segment, snapshot.timeMode)
      : 0;
    const fallbackDwellMs = Number.isFinite(sampledMs)
      ? Math.max(0, sampledMs - segmentStart)
      : 0;
    const belongsToScenario = Boolean(
      state.scenario && state.scenario.segments[snapshot?.segment?.index] === snapshot?.segment,
    );
    const resolvedDwell = dwellHistory || (belongsToScenario
      ? getIrradianceDwellAt(snapshot.ms, state.horizonDirection, latitude)
      : { solDwellMs: fallbackDwellMs, yolDwellMs: fallbackDwellMs });

    function bodyExposure(bodyName) {
      const body = snapshot?.[bodyName];
      const projection = horizonProjection?.[bodyName];
      const visible = Boolean(
        latitudeStrength > 0 &&
          !isConvection &&
          body?.visible &&
          projection?.visible,
      );
      const dwellMs = Math.max(0, Number(resolvedDwell?.[`${bodyName}DwellMs`]) || 0);
      const effectiveDwellMs = Math.max(0, dwellMs - IRRADIANCE_MODEL.delayMs);
      const fallbackBuildup = visible && effectiveDwellMs > 0
        ? 1 - Math.exp(-effectiveDwellMs / IRRADIANCE_MODEL.buildupMs)
        : 0;
      const storedEnvelope = Number(resolvedDwell?.[`${bodyName}Envelope`]);
      const buildup = clamp(
        Number.isFinite(storedEnvelope) ? storedEnvelope : fallbackBuildup,
        0,
        1,
      );
      if (buildup <= 0) {
        return { value: 0, dwellMs, buildup: 0, stability: 0 };
      }

      const intensity = clamp((Number(body.intensity) || 1) / 10, 0.1, 1);
      const angularVelocity = Number(body.angularVelocity);
      const eraAngularVelocity = Number(snapshot?.mode?.eraRotationDegreesPerSecond) ||
        config.eraRotationDegreesPerSecond;
      const relativeSpeed = Number.isFinite(angularVelocity)
        ? Math.abs(angularVelocity - eraAngularVelocity)
        : eraAngularVelocity;
      const stability = clamp(
        1 / (1 + relativeSpeed / IRRADIANCE_MODEL.relativeSpeedScale),
        IRRADIANCE_MODEL.minimumStability,
        1,
      );
      return {
        value: clamp(
          latitudeStrength * buildup * stability * (0.35 + intensity * 0.65),
          0,
          1,
        ),
        dwellMs,
        buildup,
        stability,
      };
    }

    const solExposure = bodyExposure("sol");
    const yolExposure = bodyExposure("yol");
    const sol = solExposure.value;
    const yol = yolExposure.value;
    const solActive = sol > 0.0001;
    const yolActive = yol > 0.0001;
    const mode = solActive && yolActive
      ? "dual"
      : solActive
        ? "sol"
        : yolActive
          ? "yol"
          : "none";
    const warm = sol * (mode === "dual" ? 0.82 : 1);
    const cool = yol * (mode === "dual" ? 0.9 : 1);
    const shimmer = mode === "dual"
      ? clamp(
          Math.max(sol * 0.28, yol * 0.68) + Math.min(sol, yol) * 0.5,
          0,
          1,
        )
      : mode === "yol"
        ? yol * 0.68
        : mode === "sol"
          ? sol * 0.28
          : 0;

    return Object.freeze({
      mode,
      latitude,
      latitudeStrength,
      buildup: Math.max(solExposure.buildup, yolExposure.buildup),
      solBuildup: solExposure.buildup,
      yolBuildup: yolExposure.buildup,
      solDwellMs: solExposure.dwellMs,
      yolDwellMs: yolExposure.dwellMs,
      sol,
      yol,
      warm,
      cool,
      shimmer,
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

  function createMotionParameters(
    seed,
    segment,
    bodyName,
    continuity = {},
    timeMode = "chronicle",
  ) {
    const template = segment.template;
    const bodyConfig = template[bodyName];
    const normalizedMode = normalizeTimeMode(timeMode);
    const mode = getTimeMode(normalizedMode);
    const inspection = mode.kind === "linear-world-time";
    const prefix = `${normalizedMode}|${segment.index}|${template.id}|${bodyName}`;
    const speedScale = inspection
      ? mode.eraRotationDegreesPerUm / config.eraRotationDegreesPerSecond
      : 1;
    let minSpeed = bodyConfig.speed[0] * speedScale;
    let maxSpeed = bodyConfig.speed[1] * speedScale;
    const speedRange = maxSpeed - minSpeed;
    const baseSpeed = minSpeed + speedRange * unitFor(seed, `${prefix}|base-speed`);
    const direction = directionFor(template);
    const phase = unitFor(seed, `${prefix}|phase`) * Math.PI * 2;
    const frequency = 0.45 + unitFor(seed, `${prefix}|frequency`) * 1.25;
    let drift = direction * baseSpeed;
    let amplitude = Math.max(0.06, baseSpeed * (0.08 + unitFor(seed, `${prefix}|noise`) * 0.16));

    if (template.motion === "convection") {
      drift = 0;
      amplitude = 0;
      minSpeed = 0;
      maxSpeed = 0;
    } else if (template.category === "synchron") {
      drift = inspection
        ? mode.eraRotationDegreesPerUm
        : mode.eraRotationDegreesPerSecond;
      minSpeed = drift;
      maxSpeed = drift;
      amplitude = 0;
    } else if (template.motion === "switching") {
      drift = (unitFor(seed, `${prefix}|drift`) - 0.5) * 1.4 * speedScale;
      amplitude = (13 + unitFor(seed, `${prefix}|switch-amplitude`) * 24) * speedScale;
    } else if (template.motion === "oscillate") {
      drift *= 0.18;
      amplitude = (9 + unitFor(seed, `${prefix}|osc-amplitude`) * 16) * speedScale;
    } else if (template.motion === "fixed-orbit") {
      if (inspection) {
        drift = 0;
        amplitude = 0;
        minSpeed = 0;
        maxSpeed = 0;
      } else {
        drift *= 0.15;
        amplitude = 0.8 * speedScale;
      }
    } else if (template.motion === "hold") {
      drift *= 0.25;
      amplitude = 1.2 * speedScale;
    }

    const radialAmplitude = Number(bodyConfig.radialAmplitude) || 0;
    const requestedRadialStart = Number(continuity.radialOffset);
    const startRadialOffset = Number.isFinite(requestedRadialStart)
      ? requestedRadialStart
      : radialAmplitude * (unitFor(seed, `${prefix}|radial-start`) * 1.2 - 0.6);
    let endRadialOffset = radialAmplitude *
      (unitFor(seed, `${prefix}|radial-end`) * 1.2 - 0.6);
    let radialSwing = radialAmplitude *
      (unitFor(seed, `${prefix}|radial-swing`) * 0.5 - 0.25);
    if (inspection && template.motion === "fixed-orbit") {
      endRadialOffset = startRadialOffset;
      radialSwing = 0;
    }
    const intensityRange = bodyConfig.intensity;
    const requestedIntensityStart = Number(continuity.intensity);
    const startIntensity = intensityRange
      ? Number.isFinite(requestedIntensityStart)
        ? clamp(requestedIntensityStart, 1, 10)
        : interpolate(
            intensityRange[0],
            intensityRange[1],
            unitFor(seed, `${prefix}|intensity-start`),
          )
      : null;
    const endIntensity = intensityRange
      ? interpolate(
          intensityRange[0],
          intensityRange[1],
          unitFor(seed, `${prefix}|intensity-end`),
        )
      : null;
    const intensitySwing = intensityRange
      ? (intensityRange[1] - intensityRange[0]) *
        (unitFor(seed, `${prefix}|intensity-swing`) * 0.4 - 0.2)
      : 0;

    return {
      startAngle: Number(continuity.angle) || 0,
      baseSpeed,
      minSpeed,
      maxSpeed,
      drift,
      amplitude,
      frequency,
      phase,
      startRadialOffset,
      endRadialOffset,
      radialSwing,
      startIntensity,
      endIntensity,
      intensitySwing,
      timeMode: normalizedMode,
      angleKind: inspection ? "polar" : "eccentric",
      rateUnit: inspection ? "degrees-per-um" : "degrees-per-second",
    };
  }

  function rawAngle(parameters, localSeconds) {
    const wave =
      parameters.amplitude *
      (Math.sin(parameters.frequency * localSeconds + parameters.phase) -
        Math.sin(parameters.phase));
    return parameters.startAngle + parameters.drift * localSeconds + wave;
  }

  function buildScenario(seed, options = {}) {
    const initialCelestialStates = options.initialCelestialStates ||
      (options.initialCelestialState
        ? {
            chronicle: options.initialCelestialState,
            inspection: options.initialCelestialState,
          }
        : null);
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
    const convectionPresentationMs = TIME_MODES.chronicle.convectionPresentationMs;
    const displayDurations = allocateIntegerDurations(
      displayWeights,
      TIME_MODES.chronicle.presentationMs - convectionPresentationMs,
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
      displayStart: TIME_MODES.chronicle.presentationMs - convectionPresentationMs,
      displayEnd: TIME_MODES.chronicle.presentationMs,
      motion: {},
    });

    const finalCelestialStates = {};
    for (const timeMode of TIME_MODE_ORDER) {
      const requestedState = initialCelestialStates?.[timeMode];
      const celestialState = {
        sol: {
          angle: Number.isFinite(Number(requestedState?.sol?.angle))
            ? Number(requestedState.sol.angle)
            : unitFor(seed, "initial|sol-angle") * 360,
          radialOffset: Number(requestedState?.sol?.radialOffset),
          intensity: Number(requestedState?.sol?.intensity),
        },
        yol: {
          angle: Number.isFinite(Number(requestedState?.yol?.angle))
            ? Number(requestedState.yol.angle)
            : unitFor(seed, "initial|yol-angle") * 360 + 140,
          radialOffset: Number(requestedState?.yol?.radialOffset),
          intensity: Number(requestedState?.yol?.intensity),
        },
      };
      for (const segment of segments) {
        segment.motion[timeMode] = {};
        const durationUnits = timeMode === "inspection"
          ? segment.umEnd - segment.umStart
          : (segment.displayEnd - segment.displayStart) / 1000;
        for (const bodyName of ["sol", "yol"]) {
          const previousIntensity = celestialState[bodyName].intensity;
          segment.motion[timeMode][bodyName] = createMotionParameters(
            seed,
            segment,
            bodyName,
            celestialState[bodyName],
            timeMode,
          );
          const parameters = segment.motion[timeMode][bodyName];
          celestialState[bodyName] = {
            angle: rawAngle(parameters, durationUnits),
            radialOffset: parameters.endRadialOffset,
            intensity: parameters.endIntensity ?? previousIntensity,
          };
        }
      }
      finalCelestialStates[timeMode] = Object.freeze({
        sol: Object.freeze({ ...celestialState.sol }),
        yol: Object.freeze({ ...celestialState.yol }),
      });
    }

    const requestedEraStarts = options.eraRotationStartDegrees || {};
    const eraRotationStartDegrees = Object.freeze({
      chronicle: Number.isFinite(Number(requestedEraStarts.chronicle))
        ? Number(requestedEraStarts.chronicle)
        : 0,
      inspection: Number.isFinite(Number(requestedEraStarts.inspection))
        ? Number(requestedEraStarts.inspection)
        : 0,
    });

    return {
      seed,
      repeatTotal,
      presentationMs: TIME_MODES.chronicle.presentationMs,
      convectionPresentationMs,
      segments,
      eraRotationStartDegrees,
      eraRotationEndDegrees: Object.freeze({
        chronicle: eraRotationStartDegrees.chronicle +
          (TIME_MODES.chronicle.presentationMs / 1000) *
            TIME_MODES.chronicle.eraRotationDegreesPerSecond,
        inspection: eraRotationStartDegrees.inspection +
          config.totalUm * TIME_MODES.inspection.eraRotationDegreesPerUm,
      }),
      finalCelestialStates: Object.freeze(finalCelestialStates),
      finalCelestialState: finalCelestialStates.chronicle,
      occurrences: segments.reduce((map, segment) => {
        const list = map.get(segment.template.id) || [];
        list.push(segment.index);
        map.set(segment.template.id, list);
        return map;
      }, new Map()),
    };
  }

  function segmentStartMs(segment, timeMode = state.timeMode) {
    const mode = getTimeMode(timeMode);
    return mode.kind === "linear-world-time"
      ? segment.umStart * mode.millisecondsPerUm
      : segment.displayStart;
  }

  function segmentEndMs(segment, timeMode = state.timeMode) {
    const mode = getTimeMode(timeMode);
    return mode.kind === "linear-world-time"
      ? segment.umEnd * mode.millisecondsPerUm
      : segment.displayEnd;
  }

  function findSegment(ms, options = {}) {
    const timeMode = normalizeTimeMode(options.timeMode || state.timeMode);
    const mode = getTimeMode(timeMode);
    const scenario = options.scenario || state.scenario;
    if (!scenario) return null;
    const bounded = clamp(Number(ms) || 0, 0, mode.presentationMs);
    if (bounded === mode.presentationMs) {
      return scenario.segments[scenario.segments.length - 1];
    }
    return (
      scenario.segments.find(
        (segment) =>
          bounded >= segmentStartMs(segment, timeMode) &&
          bounded < segmentEndMs(segment, timeMode),
      ) || scenario.segments[0]
    );
  }

  function getSnapshot(ms, options = {}) {
    const timeMode = normalizeTimeMode(options.timeMode || state.timeMode);
    const mode = getTimeMode(timeMode);
    const scenario = options.scenario || state.scenario;
    const cycleIndex = Number.isInteger(options.cycleIndex)
      ? options.cycleIndex
      : state.cycleIndex;
    const boundedMs = clamp(Number(ms) || 0, 0, mode.presentationMs);
    const segment = findSegment(boundedMs, { timeMode, scenario });
    if (!segment) throw new Error("Kein aktiver Zyklus für den Snapshot vorhanden.");
    const startMs = segmentStartMs(segment, timeMode);
    const endMs = segmentEndMs(segment, timeMode);
    const durationMs = Math.max(1, endMs - startMs);
    const progress = clamp((boundedMs - startMs) / durationMs, 0, 1);
    const cycleUm = mode.kind === "linear-world-time"
      ? clamp(boundedMs / mode.millisecondsPerUm, 0, config.totalUm)
      : segment.umStart + (segment.umEnd - segment.umStart) * progress;
    const positionMs = options.exact
      ? boundedMs
      : state.reducedMotion
        ? Math.round(boundedMs / 1000) * 1000
        : boundedMs;
    const positionProgress = clamp((positionMs - startMs) / durationMs, 0, 1);
    const localUnits = mode.kind === "linear-world-time"
      ? positionProgress * (segment.umEnd - segment.umStart)
      : (positionProgress * durationMs) / 1000;
    const template = segment.template;

    function bodySnapshot(bodyName) {
      const bodyConfig = template[bodyName];
      const parameters = segment.motion[timeMode][bodyName];
      const angle = rawAngle(parameters, localUnits);
      const derivativeInModelUnits =
        parameters.drift +
        parameters.amplitude *
          parameters.frequency *
          Math.cos(parameters.frequency * localUnits + parameters.phase);
      const speedInModelUnits = mode.kind === "linear-world-time"
        ? Math.abs(derivativeInModelUnits)
        : clamp(
            Math.abs(derivativeInModelUnits),
            parameters.minSpeed,
            parameters.maxSpeed,
          );
      const realTimeScale = mode.kind === "linear-world-time" ? mode.umPerSecond : 1;
      const angularVelocity = derivativeInModelUnits * realTimeScale;
      const speed = speedInModelUnits * realTimeScale;
      const directionSign = Math.abs(angularVelocity) < 0.0001
        ? 0
        : angularVelocity > 0
          ? 1
          : -1;
      const transitionProgress = smoothstep(positionProgress);
      const transitionArc = Math.sin(positionProgress * Math.PI);
      const intensity = bodyConfig.intensity
        ? clamp(
            interpolate(
              parameters.startIntensity,
              parameters.endIntensity,
              transitionProgress,
            ) + parameters.intensitySwing * transitionArc,
            1,
            10,
          )
        : null;
      const radialOffset = interpolate(
        parameters.startRadialOffset,
        parameters.endRadialOffset,
        transitionProgress,
      ) + parameters.radialSwing * transitionArc;
      return {
        angle,
        angleKind: parameters.angleKind,
        angularVelocity,
        angularVelocityPerUm: mode.kind === "linear-world-time"
          ? derivativeInModelUnits
          : derivativeInModelUnits /
            (TIME_MODES.chronicle.eraRotationDegreesPerSecond / 360),
        directionSign,
        speed,
        intensity,
        radialOffset,
        visible: bodyConfig.visible,
      };
    }

    return {
      ms: boundedMs,
      timeMode,
      mode,
      scenario,
      cycleIndex,
      segment,
      template,
      progress,
      cycleUm,
      absoluteWorldUm: cycleIndex * config.totalUm + cycleUm,
      cycleProgress: cycleUm / config.totalUm,
      positionMs,
      sol: bodySnapshot("sol"),
      yol: bodySnapshot("yol"),
    };
  }

  function formatClock(ms, maximumMs = state.presentationMs) {
    const numericMs = Number(ms) || 0;
    const boundedMs = Number.isFinite(Number(maximumMs))
      ? clamp(numericMs, 0, Number(maximumMs))
      : Math.max(0, numericMs);
    const totalSeconds = Math.round(boundedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function formatEraTime(worldUm) {
    const safeUm = Math.max(0, Math.floor(Number(worldUm) || 0));
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

  function createFrameProjection(point, viewBasis, snapshot, bodyName) {
    const projection = projectOrbitPointToHorizon(
      point,
      viewBasis,
      snapshot.template.motion === "convection" ? "convection" : "celestial",
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
    const eraRotationDegrees = getEraRotationDegrees(
      snapshot.ms,
      snapshot.template.motion,
      {
        timeMode: snapshot.timeMode,
        scenario: snapshot.scenario,
        cycleIndex: snapshot.cycleIndex,
      },
    );
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
    const horizonIrradiance = getHorizonIrradiance(
      snapshot,
      horizonProjection,
      state.horizonLatitude,
    );
    return Object.freeze({
      snapshot,
      worldPoints,
      eraRotationDegrees,
      viewBasis,
      horizonLatitude: state.horizonLatitude,
      horizonProjection,
      horizonIrradiance,
    });
  }

  function reprojectRenderFrame(frame) {
    const viewBasis = getViewBasis(state.horizonDirection, frame.eraRotationDegrees);
    const horizonProjection = Object.freeze({
      sol: createFrameProjection(frame.worldPoints.sol, viewBasis, frame.snapshot, "sol"),
      yol: createFrameProjection(frame.worldPoints.yol, viewBasis, frame.snapshot, "yol"),
      zehs: projectOrbitPointToHorizon(
        frame.worldPoints.zehs,
        viewBasis,
        "zehs",
        state.horizonLatitude,
      ),
    });
    return Object.freeze({
      snapshot: frame.snapshot,
      worldPoints: frame.worldPoints,
      eraRotationDegrees: frame.eraRotationDegrees,
      viewBasis,
      horizonLatitude: state.horizonLatitude,
      horizonProjection,
      horizonIrradiance: getHorizonIrradiance(
        frame.snapshot,
        horizonProjection,
        state.horizonLatitude,
      ),
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
    elements.orbitSolTracks.forEach((track) => {
      track.setAttribute("cx", String(ORBIT_GEOMETRY.centerX));
      track.setAttribute("cy", String(ORBIT_GEOMETRY.centerY));
      track.setAttribute("rx", String(ORBIT_GEOMETRY.sol.radiusX));
      track.setAttribute("ry", String(ORBIT_GEOMETRY.sol.radiusY));
    });
    elements.orbitYolTracks.forEach((track) => {
      track.setAttribute("cx", String(ORBIT_GEOMETRY.centerX));
      track.setAttribute("cy", String(ORBIT_GEOMETRY.centerY));
      track.setAttribute("rx", String(ORBIT_GEOMETRY.yol.radiusX));
      track.setAttribute("ry", String(ORBIT_GEOMETRY.yol.radiusY));
    });
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
    const { snapshot, worldPoints, horizonProjection, horizonIrradiance } = frame;
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
      elements.horizonView.setAttribute(
        "data-panorama",
        `${HORIZON_LATITUDES[state.horizonLatitude].biome}-${state.horizonDirection}`,
      );
      elements.horizonView.setAttribute("data-irradiance-mode", horizonIrradiance.mode);
      elements.horizonView.setAttribute("data-sol-exposure", horizonIrradiance.sol.toFixed(3));
      elements.horizonView.setAttribute("data-yol-exposure", horizonIrradiance.yol.toFixed(3));
      elements.horizonView.style.setProperty(
        "--irradiance-warm",
        (horizonIrradiance.warm * 0.34).toFixed(3),
      );
      elements.horizonView.style.setProperty(
        "--irradiance-cool",
        (horizonIrradiance.cool * 0.42).toFixed(3),
      );
      elements.horizonView.style.setProperty(
        "--irradiance-shimmer",
        horizonIrradiance.shimmer.toFixed(3),
      );
      elements.horizonView.style.setProperty(
        "--irradiance-shimmer-low",
        (horizonIrradiance.shimmer * 0.48).toFixed(3),
      );
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
      const irradianceText = horizonIrradiance.mode === "dual"
        ? "Die länger anhaltende gemeinsame Einstrahlung mischt warmes Sol- und kühles Yol-Licht mit starkem Schimmer."
        : horizonIrradiance.mode === "sol"
          ? "Die länger anhaltende Sol-Einstrahlung hellt die Landschaft warm auf."
          : horizonIrradiance.mode === "yol"
            ? "Die länger anhaltende Yol-Einstrahlung färbt die Landschaft klarer blau und verstärkt den magischen Schimmer."
            : latitude.degrees === 0
              ? "Am Polstand entsteht kein zusätzlicher Einstrahlungseffekt."
              : "Noch hat sich keine anhaltende Einstrahlung aufgebaut.";
      elements.horizonDescription.textContent = `Schematischer Horizont durch die ${latitude.name} bei Blick nach ${direction.name} und ${latitude.degrees} Grad Versatz vom Nordpol in Richtung Äquator. ${visibilityText} ${zehsText} ${irradianceText} Die Projektion verwendet dieselben Weltpositionen wie die Nordpol-Draufsicht; der Äquator bei 90 Grad bleibt ausgeschlossen.`;
    }
  }

  function updateTimelineProgress(snapshot) {
    const buttons = elements.phaseTrack.querySelectorAll(".phase-segment");
    buttons.forEach((button) => {
      const index = Number(button.dataset.segmentIndex);
      const segment = state.scenario.segments[index];
      if (!segment) return;
      let progress = 0;
      if (snapshot.cycleUm >= segment.umEnd) progress = 100;
      else if (snapshot.cycleUm > segment.umStart) {
        progress = ((snapshot.cycleUm - segment.umStart) /
          (segment.umEnd - segment.umStart)) * 100;
      }
      button.style.setProperty("--segment-progress", `${clamp(progress, 0, 100)}%`);
      const detailProgress = button.querySelector(".segment-detail-progress");
      if (detailProgress) {
        detailProgress.textContent =
          `${clamp(progress, 0, 100).toFixed(2).replace(".", ",")} % Abschnittsfortschritt`;
      }
      button.classList.toggle("is-active", index === snapshot.segment.index);
      button.setAttribute("aria-current", index === snapshot.segment.index ? "step" : "false");
    });

    const cycleButtons = elements.phaseTrack.querySelectorAll(".cycle-segment");
    cycleButtons.forEach((button) => {
      const cycleIndex = Number(button.dataset.cycleIndex);
      const progress = cycleIndex < state.cycleIndex
        ? 100
        : cycleIndex > state.cycleIndex
          ? 0
          : snapshot.cycleProgress * 100;
      button.style.setProperty("--cycle-progress", `${clamp(progress, 0, 100)}%`);
      button.classList.toggle("is-active", cycleIndex === state.cycleIndex);
      button.setAttribute("aria-current", cycleIndex === state.cycleIndex ? "step" : "false");
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
    const segmentUm = segment.umEnd - segment.umStart;
    if (isInspectionMode(snapshot.timeMode)) {
      const inspectionDurationMs = segmentUm * TIME_MODES.inspection.millisecondsPerUm;
      elements.activeSpan.textContent =
        `${segmentUm.toLocaleString("de-DE")} Um · ${formatClock(inspectionDurationMs, Infinity)} Prüfzeit`;
    } else {
      const displaySeconds = (segment.displayEnd - segment.displayStart) / 1000;
      elements.activeSpan.textContent = `${displaySeconds.toFixed(1).replace(".", ",")} s Darstellung`;
    }
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

    const renderedSegmentKey = `${snapshot.cycleIndex}:${segment.index}`;
    if (state.lastRenderedSegment !== renderedSegmentKey) {
      state.lastRenderedSegment = renderedSegmentKey;
      announce(`Zyklus ${snapshot.cycleIndex + 1}, ${template.label}. Abschnitt ${segment.index + 1} von ${state.scenario.segments.length}.`);
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

    elements.eraTime.textContent = formatEraTime(snapshot.absoluteWorldUm);
    elements.solIntensity.textContent = snapshot.sol.intensity !== null
      ? `S-Int ${snapshot.sol.intensity.toFixed(1).replace(".", ",")}`
      : "nicht sichtbar";
    elements.yolIntensity.textContent = snapshot.yol.intensity !== null
      ? `S-Int ${snapshot.yol.intensity.toFixed(1).replace(".", ",")}`
      : "nicht sichtbar";
    elements.solSpeed.textContent = isConvection ? "—" : solSpeedText;
    elements.yolSpeed.textContent = isConvection ? "—" : yolSpeedText;
    const totalClock = formatClock(state.presentationMs, state.presentationMs);
    const currentClock = formatClock(ms, state.presentationMs);
    elements.presentationLabel.textContent = isInspectionMode()
      ? "Prüflaufzeit"
      : "Darstellungszeit";
    elements.presentationTime.textContent = `${currentClock} / ${totalClock}`;
    elements.timelineNow.textContent = currentClock;
    elements.timelineTotal.textContent = totalClock;
    elements.timeSlider.value = String(Math.round(ms));
    elements.timeSlider.setAttribute(
      "aria-valuetext",
      `${currentClock} von ${totalClock}, Zyklus ${snapshot.cycleIndex + 1}, ${snapshot.template.label}`,
    );
    elements.segmentRange.textContent = formatRange(snapshot.segment);
    const cyclePercent = snapshot.cycleProgress * 100;
    const percentDigits = cyclePercent < 1 ? 5 : 2;
    elements.cycleProgress.textContent =
      `${cyclePercent.toFixed(percentDigits).replace(".", ",")} %`;
    elements.timeMapping.textContent = isInspectionMode()
      ? "linear · 5 s/Um"
      : "semantisch komprimiert";
    elements.solSpeedMeterLabel.textContent = isConvection ? "nicht sichtbar" : solSpeedText;
    elements.yolSpeedMeterLabel.textContent = isConvection ? "nicht sichtbar" : yolSpeedText;
    const speedMeterMaximum = isInspectionMode() ? 160 : 14;
    elements.solSpeedMeter.style.width = `${isConvection ? 0 : clamp(snapshot.sol.speed / speedMeterMaximum, 0, 1) * 100}%`;
    elements.yolSpeedMeter.style.width = `${isConvection ? 0 : clamp(snapshot.yol.speed / speedMeterMaximum, 0, 1) * 100}%`;

    elements.phaseTrack.setAttribute("data-time-mode", state.timeMode);
    elements.phaseTrack.setAttribute("data-zoom", state.timelineZoom);
    elements.phaseTrack.setAttribute("data-cycle-index", String(state.cycleIndex));

    if (
      isInspectionMode() &&
      state.timelineZoom === "detail" &&
      state.timelineDetailSegmentIndex !== snapshot.segment.index
    ) {
      state.timelineDetailSegmentIndex = snapshot.segment.index;
      buildTimeline();
    }

    updatePhaseDetails(snapshot);
    updateTimelineProgress(snapshot);
    updateTimelineControls();
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

  function createPhaseSegmentButton(segment, options = {}) {
    const category = categoryById.get(segment.template.category);
    const button = document.createElement("button");
    const startMs = segmentStartMs(segment);
    const endMs = segmentEndMs(segment);
    const duration = isInspectionMode()
      ? segment.umEnd - segment.umStart
      : endMs - startMs;
    button.type = "button";
    button.className = options.detail
      ? "phase-segment phase-segment-detail"
      : "phase-segment";
    button.setAttribute("data-segment-index", String(segment.index));
    button.style.setProperty("--segment-grow", String(duration));
    button.style.setProperty("--segment-color", category.color);
    button.setAttribute(
      "aria-label",
      `${segment.template.label}, ${formatClock(startMs, state.presentationMs)} bis ${formatClock(endMs, state.presentationMs)}, ${formatRange(segment)}`,
    );
    button.setAttribute("title", segment.template.label);
    button.append(createIcon(segment.template.icon, "segment-icon"));
    const label = document.createElement("span");
    label.className = "segment-label";
    label.textContent = options.detail
      ? segment.template.label
      : segment.template.shortLabel;
    button.append(label);
    if (options.detail) {
      const metadata = document.createElement("small");
      metadata.className = "segment-detail-meta";
      const durationMs = (segment.umEnd - segment.umStart) *
        TIME_MODES.inspection.millisecondsPerUm;
      metadata.textContent =
        `${formatRange(segment)} · ${formatClock(durationMs, Infinity)} bei 1×`;
      button.append(metadata);
      const progressLabel = document.createElement("strong");
      progressLabel.className = "segment-detail-progress";
      progressLabel.textContent = "0,00 % Abschnittsfortschritt";
      button.append(progressLabel);
    }
    button.addEventListener("click", () => {
      const modeDuration = endMs - startMs;
      if (isInspectionMode() && !options.detail) {
        state.timelineZoom = "detail";
        state.timelineDetailSegmentIndex = segment.index;
        seekTo(startMs + Math.min(100, modeDuration / 10), true);
        buildTimeline();
        render(state.currentMs);
        return;
      }
      seekTo(startMs + Math.min(80, modeDuration / 10), true);
    });
    return button;
  }

  function createCycleSegmentButton(scenario, cycleIndex) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cycle-segment";
    button.setAttribute("data-cycle-index", String(cycleIndex));
    button.style.setProperty("--cycle-color", categoryById.get("konvektion").color);
    button.setAttribute(
      "aria-label",
      `Zyklus ${cycleIndex + 1}, Seed ${scenario.seed}, 46.080 Um. Zyklus öffnen`,
    );
    button.setAttribute("title", `Zyklus ${cycleIndex + 1} · ${scenario.seed}`);
    button.append(createIcon("icon-grand-cycle", "cycle-segment-icon"));
    const label = document.createElement("span");
    label.className = "cycle-segment-label";
    label.textContent = `ZYKLUS ${cycleIndex + 1}`;
    button.append(label);
    const seedLabel = document.createElement("small");
    seedLabel.textContent = scenario.seed;
    button.append(seedLabel);
    const convectionMark = document.createElement("i");
    convectionMark.className = "cycle-convection-mark";
    convectionMark.setAttribute("aria-hidden", "true");
    button.append(convectionMark);
    button.addEventListener("click", () => {
      state.timelineZoom = "cycle";
      selectCycle(cycleIndex, {
        cycleUm: cycleIndex === state.cycleIndex
          ? modeMsToCycleUm(state.currentMs)
          : 0,
        rebuildTimeline: false,
        render: false,
      });
      buildTimeline();
      render(state.currentMs);
      announce(`Zyklus ${cycleIndex + 1} geöffnet.`);
    });
    return button;
  }

  function buildTimeline() {
    elements.phaseTrack.replaceChildren();
    if (!state.scenario) return;

    if (!isInspectionMode()) {
      state.scenario.segments.forEach((segment) => {
        elements.phaseTrack.append(createPhaseSegmentButton(segment));
      });
      return;
    }

    if (state.timelineZoom === "series") {
      [...state.cycles.entries()]
        .sort(([left], [right]) => left - right)
        .forEach(([cycleIndex, scenario]) => {
          elements.phaseTrack.append(createCycleSegmentButton(scenario, cycleIndex));
        });
      return;
    }

    if (state.timelineZoom === "detail") {
      const segment = state.scenario.segments[state.timelineDetailSegmentIndex] ||
        findSegment(state.currentMs);
      state.timelineDetailSegmentIndex = segment.index;
      elements.phaseTrack.append(createPhaseSegmentButton(segment, { detail: true }));
      return;
    }

    state.scenario.segments.forEach((segment) => {
      elements.phaseTrack.append(createPhaseSegmentButton(segment));
    });
  }

  function updateTimelineControls() {
    const inspection = isInspectionMode();
    elements.timelineZoomControls.hidden = !inspection;
    if (!inspection) return;

    const zoomIndex = TIMELINE_ZOOM_ORDER.indexOf(state.timelineZoom);
    const safeZoomIndex = zoomIndex === -1 ? 1 : zoomIndex;
    const labels = Object.freeze({
      series: "Zyklusfolge",
      cycle: `Zyklus ${state.cycleIndex + 1}`,
      detail: `Abschnitt ${state.timelineDetailSegmentIndex + 1}`,
    });
    elements.timelineZoomLevel.textContent = labels[state.timelineZoom] || labels.cycle;
    elements.timelineZoomOut.disabled = safeZoomIndex === 0;
    elements.timelineZoomIn.disabled = safeZoomIndex === TIMELINE_ZOOM_ORDER.length - 1;
    elements.previousCycle.disabled = state.cycleIndex === 0;
    elements.previousCycle.setAttribute(
      "aria-label",
      state.cycleIndex === 0
        ? "Kein voriger Zyklus vorhanden"
        : `Zyklus ${state.cycleIndex} öffnen`,
    );
    elements.nextCycle.setAttribute("aria-label", `Zyklus ${state.cycleIndex + 2} öffnen`);
  }

  function setTimelineZoom(zoomId, options = {}) {
    if (!isInspectionMode()) return;
    const normalizedZoom = TIMELINE_ZOOM_ORDER.includes(zoomId) ? zoomId : "cycle";
    if (normalizedZoom === "detail") {
      state.timelineDetailSegmentIndex = findSegment(state.currentMs).index;
    }
    state.timelineZoom = normalizedZoom;
    buildTimeline();
    render(state.currentMs);
    if (options.announce !== false) {
      const labels = {
        series: "Zyklusfolge",
        cycle: `Zyklus ${state.cycleIndex + 1}`,
        detail: `Abschnitt ${state.timelineDetailSegmentIndex + 1}`,
      };
      announce(`${labels[normalizedZoom]} im Zeitpfad geöffnet.`);
    }
  }

  function shiftTimelineZoom(offset) {
    const currentIndex = Math.max(0, TIMELINE_ZOOM_ORDER.indexOf(state.timelineZoom));
    const targetIndex = clamp(
      currentIndex + offset,
      0,
      TIMELINE_ZOOM_ORDER.length - 1,
    );
    setTimelineZoom(TIMELINE_ZOOM_ORDER[targetIndex]);
  }

  function moveCycle(offset) {
    if (!isInspectionMode()) return;
    const targetIndex = Math.max(0, state.cycleIndex + offset);
    if (targetIndex === state.cycleIndex) return;
    selectCycle(targetIndex, {
      cycleUm: 0,
      rebuildTimeline: false,
      render: false,
    });
    if (state.timelineZoom === "detail") state.timelineDetailSegmentIndex = 0;
    buildTimeline();
    render(state.currentMs);
    announce(`Zyklus ${targetIndex + 1} geöffnet.`);
  }

  function deriveCycleSeed(rootSeed, cycleIndex) {
    const normalizedRoot = normalizeSeed(rootSeed);
    if (cycleIndex <= 0) return normalizedRoot;
    const digest = hashString(
      `${config.schemaVersion}|${normalizedRoot}|cycle|${cycleIndex}`,
    ).toString(36).toUpperCase();
    const suffix = `${(cycleIndex + 1).toString(36).toUpperCase()}-${digest}`;
    return `${normalizedRoot.slice(0, Math.max(1, 63 - suffix.length))}-${suffix}`.slice(0, 64);
  }

  function ensureCycle(cycleIndex) {
    const normalizedIndex = Math.max(0, Math.floor(Number(cycleIndex) || 0));
    if (state.cycles.has(normalizedIndex)) return state.cycles.get(normalizedIndex);
    for (let index = 0; index <= normalizedIndex; index += 1) {
      if (state.cycles.has(index)) continue;
      let scenario;
      if (index === 0) {
        scenario = buildScenario(deriveCycleSeed(state.rootSeed, 0), {
          eraRotationStartDegrees: { chronicle: 0, inspection: 0 },
        });
      } else {
        const previous = state.cycles.get(index - 1);
        scenario = buildScenario(deriveCycleSeed(state.rootSeed, index), {
          initialCelestialStates: previous.finalCelestialStates,
          eraRotationStartDegrees: {
            chronicle: previous.eraRotationEndDegrees.chronicle,
            inspection: 0,
          },
        });
      }
      scenario.cycleIndex = index;
      state.cycles.set(index, scenario);
    }
    return state.cycles.get(normalizedIndex);
  }

  function selectCycle(cycleIndex, options = {}) {
    const normalizedIndex = Math.max(0, Math.floor(Number(cycleIndex) || 0));
    const scenario = ensureCycle(normalizedIndex);
    state.cycleIndex = normalizedIndex;
    state.scenario = scenario;
    state.seed = scenario.seed;
    const cycleUm = clamp(Number(options.cycleUm) || 0, 0, config.totalUm);
    state.currentMs = cycleUmToModeMs(cycleUm, state.timeMode, scenario);
    state.playbackAnchorMs = state.currentMs;
    state.playbackAnchorAt = performance.now();
    state.irradianceTimelines.clear();
    state.lastRenderedSegment = -1;
    elements.phaseCount.textContent = String(scenario.segments.length);
    elements.repeatCount.textContent = String(scenario.repeatTotal);
    if (options.rebuildTimeline !== false) buildTimeline();
    if (options.render !== false) render(state.currentMs);
  }

  function updateTimeModePresentation() {
    const mode = getTimeMode();
    state.presentationMs = mode.presentationMs;
    elements.timeMode.value = state.timeMode;
    elements.timeSlider.setAttribute("max", String(state.presentationMs));
    elements.timeSlider.setAttribute("step", isInspectionMode() ? "100" : "50");
    elements.timelineZoomControls.hidden = !isInspectionMode();
    if (isInspectionMode()) {
      elements.timelineTitle.textContent = "Linearer 5-s/Um-Prüfpfad";
      elements.timelineSummary.textContent =
        "Ein Um dauert bei 1× exakt fünf Sekunden. Die Konvektion beginnt bei 63:26:40 und endet mit dem Zyklus bei 64:00:00.";
      elements.phaseTrack.setAttribute(
        "aria-label",
        "Lineare Abschnitte und Zyklen des 5-Sekunden-pro-Um-Prüfmodus",
      );
    } else {
      state.timelineZoom = "cycle";
      elements.timelineTitle.textContent = "Sechs-Minuten-Zeitpfad · Erklärmodus";
      elements.timelineSummary.textContent =
        "Abschnittsbreiten zeigen die Erklärzeit, nicht das lineare Verhältnis der Um. Die Konvektion erhält 32 Sekunden.";
      elements.phaseTrack.setAttribute(
        "aria-label",
        "Klickbare Abschnitte des sechsminütigen Erklärmodus",
      );
    }
    updatePlaybackLabels();
    updateTimelineControls();
  }

  function setTimeMode(modeId, options = {}) {
    const normalizedMode = normalizeTimeMode(modeId);
    if (normalizedMode === state.timeMode && !options.force) return;
    const cycleUm = state.scenario ? modeMsToCycleUm(state.currentMs) : 0;
    if (state.playing) setPlaying(false, { announce: false });
    state.timeMode = normalizedMode;
    state.presentationMs = getTimeMode(normalizedMode).presentationMs;
    state.currentMs = cycleUmToModeMs(cycleUm, normalizedMode, state.scenario);
    state.playbackAnchorMs = state.currentMs;
    state.playbackAnchorAt = performance.now();
    state.irradianceTimelines.clear();
    state.lastRenderedSegment = -1;
    if (isInspectionMode()) {
      state.timelineZoom = "cycle";
      state.timelineDetailSegmentIndex = findSegment(state.currentMs, {
        timeMode: normalizedMode,
      }).index;
    }
    if (options.persist !== false) persistTimeMode(normalizedMode);
    updateTimeModePresentation();
    buildTimeline();
    render(state.currentMs);
    if (options.announce !== false) {
      announce(isInspectionMode()
        ? "Prüfmodus aktiviert. Fünf Sekunden entsprechen einem Um; ein Zyklus dauert 64 Stunden."
        : "Sechs-Minuten-Zeitfahrt als schematischer Erklärmodus aktiviert.");
    }
  }

  function loadScenario(seed, options = {}) {
    const normalized = normalizeSeed(seed);
    state.rootSeed = normalized;
    state.seed = normalized;
    state.cycles.clear();
    state.cycleIndex = 0;
    state.currentMs = 0;
    state.playbackAnchorMs = 0;
    state.playbackAnchorAt = performance.now();
    state.scenario = ensureCycle(0);
    state.irradianceTimelines.clear();
    state.lastRenderedSegment = -1;
    state.timelineDetailSegmentIndex = 0;
    elements.seedInput.value = normalized;
    updateTimeModePresentation();
    elements.phaseCount.textContent = String(state.scenario.segments.length);
    elements.repeatCount.textContent = String(state.scenario.repeatTotal);
    buildTimeline();
    render(state.currentMs);
    if (options.announce !== false) {
      announce(`Szenariofolge ${normalized} erzeugt. Zyklus 1 enthält ${state.scenario.segments.length} Abschnitte.`);
    }
  }

  function seekTo(ms, shouldAnnounce = false) {
    state.currentMs = clamp(ms, 0, state.presentationMs);
    state.lastFrameAt = performance.now();
    state.playbackAnchorAt = state.lastFrameAt;
    state.playbackAnchorMs = state.currentMs;
    state.irradianceTimelines.clear();
    render(state.currentMs);
    if (shouldAnnounce) {
      const snapshot = getSnapshot(state.currentMs);
      announce(`Gesprungen zu Zyklus ${state.cycleIndex + 1}, ${snapshot.template.label}, ${formatClock(state.currentMs, state.presentationMs)}.`);
    }
  }

  function jumpToTemplate(templateId) {
    const occurrences = state.scenario.occurrences.get(templateId);
    if (!occurrences || occurrences.length === 0) return;
    const nextIndex =
      occurrences.find(
        (segmentIndex) =>
          segmentStartMs(state.scenario.segments[segmentIndex]) > state.currentMs + 120,
      ) ?? occurrences[0];
    const segment = state.scenario.segments[nextIndex];
    const startMs = segmentStartMs(segment);
    const durationMs = segmentEndMs(segment) - startMs;
    if (isInspectionMode() && state.timelineZoom === "detail") {
      state.timelineDetailSegmentIndex = segment.index;
      buildTimeline();
    }
    seekTo(startMs + Math.min(80, durationMs / 10), true);
  }

  function jumpBySegment(offset) {
    const current = findSegment(state.currentMs);
    const length = state.scenario.segments.length;
    let targetCycleIndex = state.cycleIndex;
    let index = current.index + offset;
    if (isInspectionMode() && index >= length) {
      targetCycleIndex += 1;
      index = 0;
    } else if (isInspectionMode() && index < 0 && state.cycleIndex > 0) {
      targetCycleIndex -= 1;
      index = ensureCycle(targetCycleIndex).segments.length - 1;
    } else {
      index = (index + length) % length;
    }
    if (targetCycleIndex !== state.cycleIndex) {
      selectCycle(targetCycleIndex);
    }
    const segment = state.scenario.segments[index];
    state.timelineDetailSegmentIndex = segment.index;
    const startMs = segmentStartMs(segment);
    seekTo(startMs + Math.min(80, (segmentEndMs(segment) - startMs) / 10), true);
    if (isInspectionMode() && state.timelineZoom === "detail") buildTimeline();
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
        ? "Automatischer Anschlusszyklus ist aktiv"
        : "Automatischen Anschlusszyklus einschalten",
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

  function setPlaying(playing, options = {}) {
    if (playing && state.currentMs >= state.presentationMs) {
      seekTo(0);
    }
    state.playing = Boolean(playing);
    const now = performance.now();
    state.lastFrameAt = now;
    state.playbackAnchorAt = now;
    state.playbackAnchorMs = state.currentMs;
    if (!state.playing && state.animationFrame !== null) {
      cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
    }
    updatePlayButton();
    if (state.playing && state.animationFrame === null) {
      state.animationFrame = requestAnimationFrame(tick);
    }
    if (options.announce !== false) {
      announce(state.playing ? "Simulation läuft." : "Simulation pausiert.");
    }
  }

  function tick(timestamp) {
    state.animationFrame = null;
    if (!state.playing) return;
    if (state.playbackAnchorAt === null) {
      state.playbackAnchorAt = timestamp;
      state.playbackAnchorMs = state.currentMs;
    }
    const elapsed = Math.max(0, timestamp - state.playbackAnchorAt);
    state.lastFrameAt = timestamp;
    state.currentMs = state.playbackAnchorMs + elapsed * state.playbackRate;
    if (state.currentMs >= state.presentationMs) {
      if (state.autoCycle) {
        const completedCycleIndex = state.cycleIndex;
        const completedSeed = state.seed;
        const elapsedCycles = Math.floor(state.currentMs / state.presentationMs);
        const targetCycleIndex = state.cycleIndex + elapsedCycles;
        const localMs = state.currentMs % state.presentationMs;
        state.scenario = ensureCycle(targetCycleIndex);
        state.cycleIndex = targetCycleIndex;
        state.seed = state.scenario.seed;
        state.currentMs = localMs;
        state.playbackAnchorAt = timestamp;
        state.playbackAnchorMs = localMs;
        state.irradianceTimelines.clear();
        state.lastRenderedSegment = -1;
        elements.phaseCount.textContent = String(state.scenario.segments.length);
        elements.repeatCount.textContent = String(state.scenario.repeatTotal);
        buildTimeline();
        render(localMs);
        state.animationFrame = requestAnimationFrame(tick);
        announce(
          `Zyklus ${completedCycleIndex + 1} (${completedSeed}) beendet. ` +
          `Zyklus ${targetCycleIndex + 1} läuft ohne Positionssprung weiter.`,
        );
        return;
      }
      state.currentMs = state.presentationMs;
      render(state.currentMs);
      setPlaying(false, { announce: false });
      announce("Konvektionszyklus beendet. Der abgeschlossene Zyklus bleibt am Endpunkt stehen.");
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
    const localWorldUm = state.scenario ? modeMsToCycleUm(state.currentMs) : 0;
    return Object.freeze({
      rootSeed: state.rootSeed,
      seed: state.seed,
      timeMode: state.timeMode,
      cycleIndex: state.cycleIndex,
      cycleCount: state.cycles.size,
      timelineZoom: state.timelineZoom,
      currentMs: state.currentMs,
      presentationMs: state.presentationMs,
      absoluteWorldUm: state.cycleIndex * config.totalUm + localWorldUm,
      horizonDirection: state.horizonDirection,
      horizonLatitude: state.horizonLatitude,
      playing: state.playing,
      autoCycle: state.autoCycle,
      playbackRate: state.playbackRate,
      reducedMotion: state.reducedMotion,
      theme: state.theme,
      eraRotationOffsetDegrees: state.eraRotationOffsetDegrees,
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
    elements.timeMode.addEventListener("change", () => setTimeMode(elements.timeMode.value));
    elements.timelineZoomOut.addEventListener("click", () => shiftTimelineZoom(-1));
    elements.timelineZoomIn.addEventListener("click", () => shiftTimelineZoom(1));
    elements.previousCycle.addEventListener("click", () => moveCycle(-1));
    elements.nextCycle.addEventListener("click", () => moveCycle(1));
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
          ? "Automatischer Anschluss an den nächsten Zyklus aktiviert."
          : "Automatischer Anschlusszyklus deaktiviert.",
      );
    });
    elements.restart.addEventListener("click", () => {
      seekTo(0, true);
    });
    elements.playbackRate.addEventListener("change", () => {
      const now = performance.now();
      if (state.playing && state.playbackAnchorAt !== null) {
        state.currentMs = state.playbackAnchorMs +
          Math.max(0, now - state.playbackAnchorAt) * state.playbackRate;
      }
      state.playbackRate = Number(elements.playbackRate.value) || 1;
      state.lastFrameAt = now;
      state.playbackAnchorAt = now;
      state.playbackAnchorMs = state.currentMs;
      announce(`Wiedergabetempo ${String(state.playbackRate).replace(".", ",")} fach.`);
    });
    elements.themeToggle.addEventListener("click", () => {
      const nextTheme = state.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      announce(nextTheme === "dark" ? "Dunkle Chronik aktiviert." : "Helles Pergament aktiviert.");
    });
    const onReducedMotionChange = (event) => {
      state.reducedMotion = event.matches;
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
    TIME_MODES,
    ORBIT_GEOMETRY,
    HORIZON_GEOMETRY,
    HORIZON_DIRECTIONS,
    HORIZON_LATITUDES,
    HORIZON_PROJECTION_SCALE,
    IRRADIANCE_MODEL,
    ZEHS_PARAMETERS,
    normalizeTimeMode,
    modeMsToCycleUm,
    cycleUmToModeMs,
    normalizeDegrees,
    normalizeHorizonLatitude,
    getLatitudeLift,
    getEraRotationDegrees,
    getEraRotationUnwrappedDegrees,
    getOrbitPoint,
    getBodyVisualRadius,
    ensureOrbitClearance,
    getViewBasis,
    projectOrbitPointToHorizon,
    getIrradianceDwellAt,
    getHorizonIrradiance,
    getSnapshot,
    formatEraTime,
    deriveCycleSeed,
    setTimeMode,
    setTimelineZoom,
    selectCycle,
    setPlaying,
    tick,
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
