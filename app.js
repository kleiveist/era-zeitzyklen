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
    solBody: document.querySelector("#sol-body"),
    yolBody: document.querySelector("#yol-body"),
    solDisc: document.querySelector("#sol-disc"),
    yolDisc: document.querySelector("#yol-disc"),
    solHalo: document.querySelector("#sol-halo"),
    yolHalo: document.querySelector("#yol-halo"),
    eraMeridian: document.querySelector("#era-meridian"),
    directionPathSol: document.querySelector("#direction-path-sol"),
    directionPathYol: document.querySelector("#direction-path-yol"),
    convectionMessage: document.querySelector("#convection-message"),
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
    restart: document.querySelector("#restart"),
    playbackRate: document.querySelector("#playback-rate"),
    durationMode: document.querySelector("#duration-mode"),
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
    playbackRate: 1,
    presentationMs: config.presentationMs,
    animationFrame: null,
    lastFrameAt: null,
    lastRenderedSegment: -1,
    reducedMotion: reducedMotionQuery.matches,
    theme: document.documentElement?.dataset?.theme === "light" ? "light" : "dark",
  };

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
    elements.themeColor.setAttribute("content", normalized === "dark" ? "#120e18" : "#ead9b8");
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
    return normalized || "ERA-3500";
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

    if (template.motion === "switching") {
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
      return { angle, speed, intensity, radialOffset, visible: bodyConfig.visible };
    }

    return {
      ms,
      segment,
      template,
      progress,
      cycleUm,
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
    const mohn = Math.floor(safeUm / 7000);
    let remainder = safeUm % 7000;
    const dir = Math.floor(remainder / 200);
    remainder %= 200;
    const tan = Math.floor(remainder / 20);
    const um = remainder % 20;
    return `Mohn ${mohn} · Dir ${dir} · Tan ${tan} · Um ${um}`;
  }

  function formatRange(segment) {
    const duration = segment.umEnd - segment.umStart;
    return `${segment.umStart.toLocaleString("de-DE")}–${segment.umEnd.toLocaleString("de-DE")} Um · ${duration.toLocaleString("de-DE")} Um`;
  }

  function bodyPoint(angleDegrees, radiusX, radiusY, radialOffset) {
    const radians = (angleDegrees * Math.PI) / 180;
    return {
      x: 420 + (radiusX + radialOffset) * Math.cos(radians),
      y: 268 + (radiusY + radialOffset * 0.35) * Math.sin(radians),
    };
  }

  function verticalScaleFor(motion) {
    if (motion === "horizon" || motion === "reverse-horizon") return 0.46;
    if (motion === "parabola") return 1.12;
    return 1;
  }

  function updateBodyElement(element, disc, halo, snapshot, bodyName, motion) {
    const radiusX = bodyName === "sol" ? 300 : 244;
    const baseRadiusY = bodyName === "sol" ? 178 : 142;
    const radiusY = baseRadiusY * verticalScaleFor(motion);
    const point = bodyPoint(snapshot.angle, radiusX, radiusY, snapshot.radialOffset);
    element.setAttribute("transform", `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
    element.style.opacity = snapshot.visible ? "1" : "0";
    if (snapshot.intensity !== null) {
      const base = bodyName === "sol" ? 10.5 : 9.5;
      const radius = base + snapshot.intensity * 0.75;
      const haloRadius = radius + 11 + snapshot.intensity * 1.15;
      disc.setAttribute("r", radius.toFixed(2));
      halo.setAttribute("r", haloRadius.toFixed(2));
      halo.style.opacity = String(0.08 + snapshot.intensity * 0.018);
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
    const isConvection = snapshot.template.id === "convection";
    const solSpeedText = `${snapshot.sol.speed.toFixed(1).replace(".", ",")}°/s`;
    const yolSpeedText = `${snapshot.yol.speed.toFixed(1).replace(".", ",")}°/s`;

    updateBodyElement(
      elements.solBody,
      elements.solDisc,
      elements.solHalo,
      snapshot.sol,
      "sol",
      snapshot.template.motion,
    );
    updateBodyElement(
      elements.yolBody,
      elements.yolDisc,
      elements.yolHalo,
      snapshot.yol,
      "yol",
      snapshot.template.motion,
    );

    elements.orbitView.classList.toggle("is-convection", isConvection);
    elements.convectionMessage.hidden = !isConvection;
    elements.solBody.setAttribute("aria-hidden", String(!snapshot.sol.visible));
    elements.yolBody.setAttribute("aria-hidden", String(!snapshot.yol.visible));
    elements.eraMeridian.style.transformOrigin = "420px 268px";
    const eraRotationSpeed = snapshot.template.motion === "fixed-orbit" ? 9 : 2.8;
    elements.eraMeridian.style.transform = `rotate(${((ms / 1000) * eraRotationSpeed).toFixed(2)}deg)`;
    elements.directionPathSol.setAttribute("d", "M 132 250 A 300 178 0 0 1 699 210");
    elements.directionPathYol.setAttribute("d", "M 188 286 A 244 142 0 0 0 645 316");
    elements.directionPathSol.style.strokeDashoffset = `${(-snapshot.sol.angle / 7).toFixed(1)}`;
    elements.directionPathYol.style.strokeDashoffset = `${(-snapshot.yol.angle / 7).toFixed(1)}`;

    elements.eraTime.textContent = formatEraTime(snapshot.cycleUm);
    elements.solIntensity.textContent = snapshot.sol.intensity
      ? `S-Int ${snapshot.sol.intensity.toFixed(1).replace(".", ",")}`
      : "nicht sichtbar";
    elements.yolIntensity.textContent = snapshot.yol.intensity
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
    elements.orbitDescription.textContent = isConvection
      ? "Konvektion: Sol und Yol sind nicht sichtbar. Die Darstellung zeigt den verdichteten Dunkelzustand."
      : `${snapshot.template.label}: Sol und Yol bewegen sich schematisch mit seed-basierten Geschwindigkeiten. Keine astronomisch exakte Umlaufbahn.`;

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
    elements.durationMode.value = String(state.presentationMs);
    elements.timelineTitle.textContent = state.presentationMs === config.longPresentationMs
      ? "Sechs-Minuten-Zeitlinie"
      : "Drei-Minuten-Zeitlinie";
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
      setPlaying(false);
      announce("Großzyklus beendet. Die nächste Konvektion beginnt nach dem Neustart des Zyklus.");
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

  function attachEvents() {
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
    elements.restart.addEventListener("click", () => {
      seekTo(0, true);
    });
    elements.playbackRate.addEventListener("change", () => {
      state.playbackRate = Number(elements.playbackRate.value) || 1;
      state.lastFrameAt = performance.now();
      announce(`Wiedergabetempo ${String(state.playbackRate).replace(".", ",")} fach.`);
    });
    elements.durationMode.addEventListener("change", () => {
      const requested = Number(elements.durationMode.value);
      const nextDuration = requested === config.longPresentationMs ? requested : config.presentationMs;
      const relativePosition = state.presentationMs > 0 ? state.currentMs / state.presentationMs : 0;
      state.presentationMs = nextDuration;
      state.currentMs = relativePosition * nextDuration;
      state.lastRenderedSegment = -1;
      loadScenario(state.seed, { announce: false });
      announce(`${nextDuration / 60000}-Minuten-Zeitfassung aktiviert.`);
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

  applyTheme(state.theme, { persist: false });
  buildPhaseSelect();
  buildPhaseSigils();
  attachEvents();
  loadScenario(state.seed, { announce: false });
  updatePlayButton();
})();
