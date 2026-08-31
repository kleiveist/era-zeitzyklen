# Era – Zeitzyklen von Sol und Yol

Eine eigenständige HTML/CSS/JavaScript-Visualisierung der Zeitzyklen auf Era als modernes
Pixel-Fantasy-Observatorium. Zwei hochauflösende, motivgleiche Astronomie-Wallpaper zeigen die
Welt im tiefen Sternenlicht beziehungsweise im hellen Astralmorgen. Harte Pixelrahmen,
versetzte Schatten, Messingakzente und klare Instrumentenflächen halten beide Fassungen lesbar.

Die kosmologische Hauptansicht zeigt Era exakt von oben auf den Nordpol. Sol und Yol bewegen
sich auf vollständig sichtbaren, schematisch elliptischen Bahnen. Ein zweites Pixelpanorama
projiziert denselben Zustand als lokalen Horizontverlauf nach Norden, Osten, Süden oder Westen.
Beide Ansichten stammen aus demselben deterministischen Simulationssnapshot.

Der 70.000-Um-Großzyklus kann auf drei oder sechs Minuten verdichtet werden. Alle 18
dokumentierten Phasenvorlagen kommen in jedem erzeugten Szenario mindestens einmal vor;
weitere Wiederholungen, Reihenfolge, Geschwindigkeiten und S-Int-Verläufe werden aus einem
reproduzierbaren Seed erzeugt.

## Start

`index.html` kann direkt im Browser geöffnet werden. Für eine lokale HTTP-Vorschau:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` öffnen. Es gibt keinen Build-Schritt und keine externen
Laufzeitabhängigkeiten.

## Bedienung

- Mit **Abspielen** läuft der vollständige Erklärzyklus wahlweise in 3:00 oder 6:00 Minuten.
- Das **Archiv der Phasen** springt zur nächsten Instanz einer ausgewählten Vorlage.
- Die 18 **Zyklus-Runen** erlauben denselben Sprung direkt über ein Siegel.
- Das klickbare Chronikband und der Zeitregler erlauben direkte Zeitsprünge.
- Ein **Seed** erzeugt immer wieder dieselbe Phasenfolge und dieselben Bewegungswerte.
- **Neu würfeln** erzeugt einen anderen Seed.
- 1×, 1,5×, 2× und 4× verändern nur das Wiedergabetempo; das Zeitmodell bleibt gleich.
- **Helles Pergament / Dunkle Chronik** wechselt das vollständige Pixel-Fantasy-Farbsystem.
- Der Pixelkompass schaltet den Horizontblick zwischen **N**, **O**, **S** und **W** um.

Die Kompassfelder sind echte Schaltflächen in einer zugänglichen Auswahlgruppe. Rechts und
Runter wechseln zur nächsten Richtung im Uhrzeigersinn, Links und Hoch zur vorherigen; der
Tastaturfokus folgt der Auswahl. Standard ist Norden. Die Auswahl wird unter
`era-horizon-direction` lokal gespeichert und bleibt bei Phasen-, Seed- und Zeitsprüngen
erhalten. Das Theme wird weiterhin unter `era-theme` gespeichert.

## Nordpol-Orbitansicht

Era liegt als kreisförmige, pixelig abgestufte Polansicht im Mittelpunkt. Der Mittelpunkt ist
der Nordpol, der äußere Rand entspricht dem Äquator. Nur die Runen- und Oberflächenstruktur
rotiert; Era selbst wird weder gekippt noch perspektivisch gestaucht.

Die Ellipsen von Sol und Yol sind schematische Bahnformen in einer gemeinsamen zweidimensionalen
Ebene. Sie sind kein perspektivischer Effekt. Eine Horizontphase verändert daher niemals Höhe
oder Form der Orbits. Phasen beeinflussen Bewegungsrichtung, Geschwindigkeit, Intensität und die
separate Horizontprojektion. Blockige Bahnpfeile zeigen die aktuelle Laufrichtung, einschließlich
der Umkehr in asynchronen und wechselnden Phasen.

Die orbitale Geometrie liegt zentral in `ORBIT_GEOMETRY`. Für jeden dargestellten Körper gilt:

```text
Abstand zum Era-Mittelpunkt
>= Era-Radius + visueller Körperradius + Sicherheitsabstand
```

Der visuelle Radius berücksichtigt S-Int, harte Pixelringe beziehungsweise Strahlen und den
Pixelhalo. Auch radiale Phasenabweichungen werden vor dem Rendern abgesichert. Die Beschriftungen
SOL und YOL werden entlang des Vektors vom Era-Mittelpunkt nach außen gesetzt und können dadurch
nicht in Era hineinragen.

ZEHS bleibt ein weit entfernter Referenzstern und ist deutlich als `ZEHS · REFERENZ` markiert.
Er wird nicht wie Sol oder Yol als umlaufender Körper behandelt.

## Horizontverlauf

Der Horizontverlauf ist eine getrennte Pixelart-Grafik mit harten Himmelsbändern,
Dithering, Landschaftssilhouetten und Kompassbeschriftungen. Die Seitenbezeichnungen lauten:

| Blickrichtung | links | rechts |
| --- | --- | --- |
| Norden | Westen | Osten |
| Osten | Norden | Süden |
| Süden | Osten | Westen |
| Westen | Süden | Norden |

Ein Blickpfeil auf Era kennzeichnet die gewählte lokale Richtung. Eine dazu senkrechte
Horizontschnittlinie trennt die vordere von der hinteren Hälfte. Beide Markierungen drehen sich
mit derselben Era-Rotation, die auch für die Projektion verwendet wird.

Die Daten fließen in einer festen Reihenfolge:

```text
getSnapshot(ms)
  → gemeinsame Weltpositionen von Sol und Yol
  → unveränderte Nordpol-Orbitansicht
  → Projektion derselben Punkte in den gewählten Horizontblick
```

Der Vorwärtsanteil eines Weltpunkts bestimmt Sichtbarkeit und Höhe, sein Rechtsanteil die
horizontale Position. Ein Körper hinter der lokalen Horizontebene ist in dieser Blickrichtung
nicht sichtbar; ein Punkt auf der Schnittlinie liegt am Horizont. Horizontläufe bleiben flach,
der Parabellauf steigt deutlich höher. Diese Höhenfaktoren sind ausschließlich illustrative
Präsentationswerte und verändern weder `phases.js` noch kanonische Lore-Werte.

Ein Richtungswechsel berechnet keine neue Simulation: Zeitpunkt, Seed, Phase, Sol-/Yol-Winkel,
Geschwindigkeit, Intensität und Körpergröße bleiben unverändert. Nur Blickbasis, Projektion und
die zugehörigen Kompassmarkierungen ändern sich.

Während der Konvektion sind Sol und Yol in beiden Grafiken unsichtbar. Das Panorama zeigt den
verdichteten Dunkelzustand mit harten Pixelbändern und fernen Splitterwelten statt weicher
Aurora- oder Glow-Effekte.

## Zeitmodell

Kanonische Eckwerte:

```text
1 Tan  = 20 Um
1 Dir  = 200 Um
1 Mohn = 7.000 Um
1 Großzyklus = 70.000 Um = 10 Mohn
1 Konvektion = 400 Um
```

Eine lineare Abbildung würde der Konvektion in einem dreiminütigen Film nur rund eine Sekunde
geben. Die Simulation nutzt deshalb eine semantische, stückweise Zeitabbildung: In der
3-Minuten-Fassung sind 16 Sekunden, in der 6-Minuten-Fassung 32 Sekunden für die Konvektion
reserviert. Die aktuelle Era-Zeit wird innerhalb jedes Abschnitts weiterhin korrekt zwischen
dessen Um-Grenzen interpoliert.

Die konkrete Phasenfolge ist kein kanonisches historisches Datum. Sie dient als deterministische
Beispielsimulation.

## Zufallsalgorithmus

`app.js` normalisiert den Seed und bildet ihn mit FNV-1a auf einen 32-Bit-Wert ab. Ein
Mulberry32-Generator erzeugt den Ereignisplan. Separate gehashte Zufallsströme bestimmen
Bewegungsparameter und S-Int, sodass derselbe Seed und dieselbe Darstellungszeit denselben
Zustand liefern. Die Blickrichtung ist kein Bestandteil dieser Zufallsströme.

Der Ereignisplan enthält:

1. jede reguläre Vorlage mindestens einmal;
2. 12 bis 18 zusätzliche, gewichtete Wiederholungen;
3. besonders häufig wechselnde Phasen als Meta-Regime;
4. eine feste Konvektion über die letzten 400 Um.

Die Bewegung wird analytisch aus `Seed + Abschnitt + Darstellungszeit` berechnet. Sie hängt
nicht von der Bildrate, der Blickrichtung oder dem vorherigen Navigationsweg ab.

## Pixeltechnik und Barrierefreiheit

Das Interface verwendet ein konsequentes Pixelraster, harte Rahmen und versetzte Schatten ohne
Blur. Die lokalen Chronikschriften bleiben großen Überschriften vorbehalten; Bedienelemente und
Messwerte verwenden blockige Monospace-Fallbacks. Die SVG-Grafiken arbeiten mit `crispEdges`,
ganzzahligen Strichstärken, quadratischen Linecaps und Miter-Verbindungen. Die Wallpaper liegen
als 3344 × 1882 Pixel große Nearest-Neighbor-Exporte vor; jede Theme-Fassung referenziert nur ihr
zugehöriges Motiv.

Beide Themes besitzen eine vollständige Materialpalette. Fokuszustände sind deutlich sichtbar,
Slider und Chronikband bleiben per Tastatur bedienbar und `prefers-reduced-motion` wird
respektiert. Das Layout ordnet Phasenbibliothek, Kosmologie und Instrumententafel auf großen
Bildschirmen nebeneinander und auf kleinen Displays ohne horizontalen Seiten-Scroll logisch
untereinander an.

## Dateien

```text
index.html                  Semantik, Pixel-SVGs, Nordpolansicht und Horizontpanorama
styles.css                  Themes, Pixelraster, Panels, Bedienelemente und Responsive Layout
favicon.svg                 lokales Pixel-Siegel für den Browser-Tab
phases.js                   kanonische Phasenvorlagen plus illustrative Wertebereiche
app.js                      Seed, Zeitmodell, Geometrie, Projektion, Animation und Interaktion
Textdatei.txt               kanonische Lore- und Zeitreferenz
assets/fonts/               lokal eingebettete, offen lizenzierte Chronikschrift
assets/images/              helle/dunkle Astral-Wallpaper plus hochauflösende 2×-Exporte
tests/smoke.cjs             Fake-DOM-, Interaktions-, Zustands- und Geometrievertrag
tests/visual-contract.cjs   statischer Vertrag gegen moderne/unscharfe Gestaltungseffekte
```

## Tests

Beide Tests benötigen nur eine vorhandene Node.js-Laufzeit und keine zusätzlichen Pakete:

```bash
node tests/smoke.cjs
node tests/visual-contract.cjs
```

Der Smoke-Test prüft unter anderem alle 18 Vorlagen, Seed-Reproduzierbarkeit, beide
Zeitfassungen, Theme-Speicherung, Kompassklicks und -tastatursteuerung, Zustandsinvarianz bei
Richtungswechseln sowie mindestens 200 Geometriesnapshots je Zeitfassung. Dabei werden endliche
Koordinaten, S-Int-Grenzen, SVG-Grenzen und der Sicherheitsabstand zu Era kontrolliert.

Der visuelle Vertrag liest HTML, CSS und JavaScript statisch. Er untersagt unter anderem
`backdrop-filter`, Gauß-Weichzeichnung, Pillenradien, alte SVG-Verläufe und die frühere
horizontabhängige Skalierung orbitaler Y-Radien. Außerdem prüft er die Pixel-SVG-Einstellungen,
die vier zugänglichen Richtungsbuttons und den gemeinsamen Geometrievertrag.

## Grenzen der Darstellung

- Orbit- und Horizontansicht sind schematisch und keine naturwissenschaftlich exakte Astronomie.
- Die Horizontprojektion erklärt relative Sichtbarkeit; sie ist kein geografisches Geländemodell.
- ZEHS bleibt ein visueller Referenzpunkt; eine numerische Era-Rotationsdauer wird nicht erfunden.
- Während der Konvektion sind Sol und Yol unsichtbar. `S-Int 0` wird nicht verwendet, da die
  dokumentierte Skala bei 1 beginnt.
- Polare Besonderheiten sind Lore-Kontext, aber kein eigener Sonnenlauf und daher nicht als
  zusätzliche Phasenvorlage modelliert.
