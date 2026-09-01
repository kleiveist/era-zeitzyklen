---
title: Technische Umsetzung der Zeitmodi
status: implemented
updated: 2026-09-01
---

<!-- AUTO-GENERATED:backlink START -->
[← Zurück](index.md)
<!-- AUTO-GENERATED:backlink END -->

# Technische Umsetzung der Zeitmodi

Dieses Dokument beschreibt die bereits implementierte Abbildung des linearen
[5-s/Um-Prüfmodus](pruefmodus-5-sekunden-pro-um.md) und der schematischen
[Sechs-Minuten-Zeitfahrt](erklaermodus-sechs-minuten.md). Es definiert keine
neue kanonische Orbitalphysik.

## 1. Zuständige Dateien

| Datei | Verantwortung |
|---|---|
| [`phases.js`](../../phases.js) | Kanonische Einheiten, Zeitmodus-Konstanten und illustrative Phasenvorlagen |
| [`app.js`](../../app.js) | Szenarioerzeugung, Zeitkonvertierung, Snapshots, Kontinuität, Animation und Bedienung |
| [`index.html`](../../index.html) | Zeitmodus-Dropdown, Anzeigen und Timeline-Navigation |
| [`tests/time-mode-contract.cjs`](../../tests/time-mode-contract.cjs) | Linearitäts-, Synchronitäts-, Grenz- und Zoomvertrag |
| [`tests/smoke.cjs`](../../tests/smoke.cjs) | Sechs-Minuten-Modus, Seed-Reproduktion und gemeinsame Geometrie |
| [`tests/moon-contract.cjs`](../../tests/moon-contract.cjs) | zwei Sichtpassagen, getrennte 3D-Polbahnen und 300er-Ausrichtung |

## 2. Kanonische Konstanten

`phases.js` berechnet die Zyklusgröße aus den festen Faktoren und vermeidet
eine zweite handgeschriebene Gesamtsumme:

```js
const UM_PER_TAN = 16;
const TAN_PER_DIR = 8;
const DIR_PER_MOHN = 36;
const MOHN_PER_CYCLE = 10;
const CONVECTION_DURATION_UM = 400;
const TOTAL_UM = UM_PER_TAN * TAN_PER_DIR * DIR_PER_MOHN * MOHN_PER_CYCLE;
```

Daraus folgen `TOTAL_UM = 46_080` und `regularUm = 45_680`. Die
Konvektionsdauer ist Teil dieser Gesamtsumme.

## 3. Zwei unveränderliche Zeitprofile

Die Modi stehen in `TIME_MODES` und werden eingefroren. Der Erklärmodus bleibt
Standard.

| Feld | `chronicle` | `inspection` |
|---|---:|---:|
| Art | `semantic-preview` | `linear-world-time` |
| Gesamtdauer | 360.000 ms | 230.400.000 ms |
| Konvektionsdauer | 32.000 ms | 2.000.000 ms |
| Millisekunden pro Um | abschnittsabhängig | 5.000 ms |
| Era-Rotation | 5,6°/s | 360°/Um = 72°/s bei 1× |

Die lokale Auswahl wird unter `era-time-mode` gespeichert. Unbekannte Werte
fallen auf `chronicle` zurück.

## 4. Weltzeit und Moduszeit

Die zentrale Austauschgröße ist `cycleUm`. Sie bezeichnet den Um-Stand im
aktiven Zyklus und liegt zwischen 0 und 46.080.

### Prüfmodus

Die Konvertierung ist überall linear:

```text
cycleUm = modeMs / 5.000
modeMs  = cycleUm × 5.000
```

Abschnittsgrenzen ergeben sich direkt aus `umStart × 5.000` und
`umEnd × 5.000`.

### Erklärmodus

`modeMsToCycleUm()` sucht zuerst den aktiven Erklärabschnitt. Anschließend
interpoliert die Funktion innerhalb dieses Abschnitts zwischen `umStart` und
`umEnd`. `cycleUmToModeMs()` führt die Umkehrung durch.

Die regulären Erklärzeiten werden aus abgeflachten Weltzeitgewichten erzeugt.
Das Gewicht eines Abschnitts basiert auf der Quadratwurzel seiner Um-Dauer;
wechselnde Phasen erhalten den Faktor 1,12. Jeder reguläre Abschnitt bekommt
mindestens 2.200 ms. Alle regulären Zeiten summieren sich auf 328.000 ms, die
Konvektion belegt fest die letzten 32.000 ms.

### Moduswechsel

`setTimeMode()` führt den Wechsel über `cycleUm` aus:

1. aktuellen Moduszeitpunkt in `cycleUm` umrechnen;
2. laufende Wiedergabe pausieren;
3. Zielmodus aktivieren;
4. denselben `cycleUm` in die Zielmoduszeit umrechnen;
5. Timeline und gemeinsamen Snapshot neu rendern.

Dadurch bleiben Zyklusnummer, Phase und Weltzeitstand erhalten, obwohl beide
Modi unterschiedliche Echtzeitachsen verwenden.

## 5. Ein gemeinsamer Snapshot

`getSnapshot()` berechnet für einen Renderzeitpunkt unter anderem:

```text
cycleUm
absoluteWorldUm = cycleIndex × 46.080 + cycleUm
cycleProgress   = cycleUm / 46.080
aktiver Abschnitt und Abschnittsfortschritt
Sol-/Yol-Winkel, -Geschwindigkeit, -Intensität und -Sichtbarkeit
getrennte Kor-/Kor’s-Shard-Zustände mit 3D-Position und Entfernung
```

Kalenderanzeige, Era-Rotation, Orbit und Horizont verwenden diesen Zustand.
Orbit- und Horizontansicht erzeugen keine unabhängigen Sonnenpositionen. Sie
projizieren denselben Weltpunkt lediglich in unterschiedliche
Koordinatensysteme und Blickrichtungen.

Kor und Kor’s Shard erweitern denselben Snapshot um absolute 3D-Weltpunkte.
Die Nordpolkarte verwendet deren `{x, y}`-Anteil und Bahntiefe; der Horizont
projiziert `{x, y, z}` gegen Oberflächennormale, Blickrichtung und Breitenstufe.
Keine Ansicht berechnet einen zweiten, von der gemeinsamen Weltzeit gelösten Zustand.

`Zyklusfortschritt` wird nur aus Um berechnet. Er wird nicht aus
Darstellungssekunden, Sonnenwinkel oder `S-Int` abgeleitet.

## 6. Era-Rotation

Im Prüfmodus gilt für den nicht normalisierten Winkel:

```text
absoluteWorldUm = cycleIndex × 46.080 + modeMs / 5.000
eraDegrees      = startDegrees + absoluteWorldUm × 360°
```

Die absolute Weltzeit verhindert eine Rücksetzung am Zykluswechsel. Für die
Grafik wird der Winkel anschließend auf den benötigten Bereich normalisiert.

Im Erklärmodus wird die Rotation dagegen aus Erklärsekunden und 5,6°/s
berechnet. Dieser Pfad bleibt absichtlich illustrativ.

## 7. Sol- und Yol-Bewegung

Jeder Abschnitt besitzt für beide Modi getrennte, seedgebundene
Bewegungsparameter. Der Endzustand eines Abschnitts wird als Anfangszustand
des Nachfolgers übernommen.

Im Prüfmodus gelten zusätzliche Semantiken:

- synchrone Kategorien erhalten exakt 360°/Um und keine zusätzliche
  Winkelschwingung;
- auf der Umlaufbahn stehende Sonnen erhalten 0°/Um und behalten ihren
  radialen Zustand;
- langsame und asynchrone Läufe behalten ihr illustratives Verhältnis und
  ihren vorgesehenen Drehsinn;
- wechselnde Phasen bleiben seedgebunden und können reproduzierbaren Hin- und
  Gegenlauf enthalten;
- während der Konvektion werden beide Sonnen unsichtbar, ohne ihre
  Anschlusszustände willkürlich neu zu würfeln.

Für elliptische Bahnen verwendet der Prüfmodus einen polaren Richtungswinkel.
Der Strahl dieses Winkels wird mit der Ellipse geschnitten. Dadurch bedeutet
`360°/Um` tatsächlich denselben Welt-Richtungswinkel wie Eras Rotation und
nicht bloß denselben Fortschritt eines ungeeigneten Ellipsenparameters.

### 7.1 Kor und Kor’s Shard

`getMoonOrbitState()` löst für beide Welten getrennt eine stark elliptische
Kepler-Bahn aus `absoluteWorldUm`. Die Hauptachse liegt auf Eras Nord-Süd-
Achse. Daher besitzt der Zustand echte Koordinaten `{x, y, z}`, während die
direkte Nordpolkarte nur eine schmale, nahezu kantenständige Bahn zeigt.

Das Webmodell nutzt zwei vollständige Sichtpassagen pro Konvektionszyklus.
Jeder Körper taucht dadurch im Horizontverlauf zweimal auf und verschwindet
zweimal; in der Draufsicht durchquert er entsprechend innerhalb eines Zyklus
zweimal den vorderen und zweimal den verdeckten Bahnabschnitt. Getrennte
Halbachsen, Exzentrizitäten, Bahnknoten und
deterministische Phasenversätze verhindern eine dauerhafte Synchronisierung.
Beide Pläne erreichen erst im 300. Zyklus gemeinsam die Nordpolausrichtung. Der
gewählte Modellpunkt Um 45.880 liegt innerhalb der Konvektion, ist jedoch kein
neu festgelegter kanonischer Einzelzeitpunkt. Auch die Zweifachpassage ist eine
Darstellungsregel und keine neue kanonische Umlaufzeit.

Die scheinbare Größe folgt der Entfernung. Im Horizont kommt ein stetiger
Höhenfaktor hinzu, sodass die Weltkörper schon beim Untergang fast punktklein und
transparent werden. Sol und Yol erhalten dort ebenfalls einen Größenfaktor
aus ihrem vorhandenen Ellipsenabstand. Keiner dieser Faktoren verändert
Weltposition, Kalender oder `S-Int`.

Die Konvektion blendet nur Sol und Yol aus. Beide Kor-Welten werden normal
weiterberechnet und bleiben sichtbar, sofern Entfernung, Era-Verdeckung und
lokale Horizontebene dies zulassen.

## 8. Timestampbasierte Animation

`requestAnimationFrame` entscheidet nur, wann neu gerendert wird. `tick()`
berechnet den Zeitstand aus einem monotonen Anker:

```text
elapsed   = frameTimestamp - playbackAnchorAt
currentMs = playbackAnchorMs + elapsed × playbackRate
```

Es wird kein fester Winkel und keine feste Millisekundenzahl pro Bild addiert.
Damit hängt der Weltfortschritt nicht von 60, 120 oder 144 Bildern pro Sekunde
ab. Dieses Vorgehen entspricht der Web-API-Empfehlung, den übergebenen
Zeitstempel für den Animationsfortschritt zu verwenden; andernfalls laufen
Animationen auf Displays mit hoher Bildrate zu schnell. Siehe
[MDN: `requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

Ein pausierter Zustand verwirft den Frame-Anker. Beim Fortsetzen werden
aktuelle Moduszeit und ein neuer monotoner Zeitstempel gemeinsam verankert.

## 9. Zyklusende und Anschlusszyklen

Ohne Autozyklus wird exakt am Ende der Moduszeit pausiert. Mit Autozyklus
ermittelt `tick()` die Anzahl vollständig überschrittener Zyklen, lädt den
Zielzyklus und übernimmt den Zeitüberhang.

`deriveCycleSeed()` bildet aus Root-Seed, Schema-Version und Zyklusindex einen
reproduzierbaren Folgeseed. `ensureCycle()` erzeugt jeden benötigten Zyklus
höchstens einmal und speichert ihn im In-Memory-Register.

Der Anschluss übernimmt die letzten Sol-/Yol-Zustände beider Modi. Im
Prüfmodus sorgt zusätzlich `absoluteWorldUm` für Eras durchgehenden Winkel.
Nur `cycleUm` beginnt im neuen Zyklus wieder bei null.

## 10. Zeitpfad

Der Erklärmodus baut immer die kompakte Liste seiner Phasenabschnitte. Der
Prüfmodus aktiviert `TIMELINE_ZOOM_ORDER` mit:

```text
series → cycle → detail
```

- `series` zeigt alle bereits materialisierten Zyklen;
- `cycle` zeigt genau den aktiven 46.080-Um-Zyklus;
- `detail` zeigt genau ein großes Abschnittssiegel mit Text- und
  Füllfortschritt.

Ein Klick auf einen Zyklus oder Abschnitt verwendet wiederum die zentrale
Um-/Moduszeit-Konvertierung.

Eine Zahleneingabe öffnet im Prüfmodus direkt Zyklus 1 bis 300. Der separate
Schalter **300er-Nordpolausrichtung** springt zu Zyklus 300, Um 45.880 und
öffnet das zugehörige Konvektionsdetail. Damit bleibt das 800 Tage lange
lineare Warten für die Abnahme unnötig.

## 11. Automatisierte Verträge

`tests/time-mode-contract.cjs` prüft insbesondere:

- 5.000 ms = 1 Um = 360° Era-Rotation;
- 360.000 ms = 72 Um im Prüfmodus;
- Konvektionsbeginn bei 45.680 Um beziehungsweise `63:26:40`;
- Zyklusende bei 46.080 Um beziehungsweise `64:00:00`;
- Unsichtbarkeit beider Sonnen während der Konvektion;
- timestampbasierten Fortschritt unabhängig von der Anzahl gerenderter
  Bilder;
- tatsächlichen Gleichlauf auf der Ellipse;
- weltfest stehende Sonnen;
- stetige Phasen- und Zyklusanschlüsse;
- reproduzierbare Folgeseeds;
- Erhalt des Um-Stands beim Moduswechsel;
- alle drei Prüfmodus-Zoomstufen;
- Rückkehr zur sechsminütigen Standardzeitfahrt.

`tests/smoke.cjs` ergänzt den Vertrag um die sechsminütige Phasenfolge,
Interaktionen, gemeinsame Orbit-/Horizontgeometrie und seedstabile
Szenarioerzeugung.

`tests/moon-contract.cjs` prüft zusätzlich getrennte 3D-Zustände,
Phasen und Bahnformen, je zwei Sicht-, Nähe-, Horizont- und
Verdeckungsintervalle pro Zyklus, Kepler-Geschwindigkeit,
entfernungsabhängige Größe und Deckkraft, den fast unsichtbaren Untergang,
stetige Zyklusgrenzen und die 300er-Ausrichtung während der Konvektion.

## 12. Technische Grenzen

- Die numerischen Sol-/Yol-Bewegungsbereiche bleiben ein illustratives Modell.
- Sämtliche numerischen Kor-/Kor’s-Shard-Bahnparameter bleiben ebenfalls
  illustrativ; kanonisch sind nur die im eigenen Kosmologiedokument
  freigegebenen Beziehungen.
- Tan- oder Dir-Namen legen keine unbestätigte exakte Sonnenumlaufdauer fest.
- Die Webseite ist eine reproduzierbare Beispielsimulation und kein
  kanonischer historischer Kalender.
- Der Erklärmodus darf nicht zur Messung der 5-Sekunden-Regel verwendet
  werden.
- Der Prüfmodus darf seine lineare Weltzeit nicht zugunsten einer kürzeren
  Vorschau heimlich komprimieren.
