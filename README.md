# Era – Zeitzyklen von Sol und Yol

Eine eigenständige HTML/CSS/JavaScript-Visualisierung der Zeitzyklen auf Era als modernes
Pixel-Fantasy-Observatorium. Zwei hochauflösende, motivgleiche Astronomie-Wallpaper zeigen die
Welt im tiefen Sternenlicht beziehungsweise im hellen Astralmorgen. Harte Pixelrahmen,
versetzte Schatten, Messingakzente und klare Instrumentenflächen halten beide Fassungen lesbar.

Die kosmologische Hauptansicht zeigt Era exakt von oben auf den Nordpol. Sol und Yol bewegen
sich auf vollständig sichtbaren, schematisch elliptischen Bahnen. Ein zweites Pixelpanorama
projiziert denselben Zustand als lokalen Horizontverlauf nach Norden, Osten, Süden oder Westen.
Beide Ansichten stammen aus demselben deterministischen Simulationssnapshot.

Der 46.080-Um-Konvektionszyklus wird auf sechs Minuten verdichtet. Alle 18
dokumentierten Phasenvorlagen kommen in jedem erzeugten Szenario mindestens einmal vor;
weitere Wiederholungen, Reihenfolge, nicht synchrone Geschwindigkeiten und S-Int-Verläufe werden
aus einem reproduzierbaren Seed erzeugt.

## Start

`index.html` kann direkt im Browser geöffnet werden. Für eine lokale HTTP-Vorschau:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` öffnen. Es gibt keinen Build-Schritt und keine externen
Laufzeitabhängigkeiten.

## Bedienung

- Mit **Abspielen** läuft der vollständige Erklärzyklus in 6:00 Minuten.
- Das **Archiv der Phasen** springt zur nächsten Instanz einer ausgewählten Vorlage.
- Die 18 **Zyklus-Runen** erlauben denselben Sprung direkt über ein Siegel.
- Das klickbare Chronikband und der Zeitregler erlauben direkte Zeitsprünge.
- Ein **Seed** erzeugt immer wieder dieselbe Phasenfolge und dieselben Bewegungswerte.
- **Neu würfeln** erzeugt einen anderen Seed.
- Der kleine **Doppelkreis-Schalter** neben Abspielen/Pause würfelt nach jeder vollständig
  beendeten Konvektion automatisch einen neuen Seed und startet den nächsten Zyklus.
- 1×, 1,5×, 2× und 4× verändern nur das Wiedergabetempo; das Zeitmodell bleibt gleich.
- **Helles Pergament / Dunkle Chronik** wechselt das vollständige Pixel-Fantasy-Farbsystem.
- Der Pixelkompass schaltet den Horizontblick zwischen **N**, **O**, **S** und **W** um.
- Die Breitensteuerung verschiebt den Beobachter um **0°**, **30°** oder **60°** vom Nordpol in Richtung Äquator.

Die Kompassfelder sind echte Schaltflächen in einer zugänglichen Auswahlgruppe. Rechts und
Runter wechseln zur nächsten Richtung im Uhrzeigersinn, Links und Hoch zur vorherigen; der
Tastaturfokus folgt der Auswahl. Standard ist Norden. Die Auswahl wird unter
`era-horizon-direction` lokal gespeichert und bleibt bei Phasen-, Seed- und Zeitsprüngen
erhalten. Die Breitenstufe wird unabhängig davon unter `era-horizon-latitude` gespeichert. Das
Theme wird weiterhin unter `era-theme` gespeichert.

## Nordpol-Orbitansicht

Era liegt als kreisförmige, pixelig abgestufte Polansicht im Mittelpunkt. Der Mittelpunkt ist
der Nordpol, der äußere Rand entspricht dem Äquator. Nur die Runen- und Oberflächenstruktur
rotiert; Era selbst wird weder gekippt noch perspektivisch gestaucht.

Eras illustrative Eigenrotation läuft mit 5,6°/s und damit doppelt so schnell wie zuvor. Alle
synchronen Sol-/Yol-Phasen verwenden exakt dieselbe Winkelgeschwindigkeit; ihre Kopplung an Era
bleibt deshalb trotz der Verdopplung erhalten.

Die hochauflösende Himmelskarte kombiniert Sternenstaub, Tiefenwolken, entfernte Ringwelten,
Kartengitter und Sektormarkierungen mit Eras Flüssen, Eisfeldern, Gebirgsketten und kleinen
Observatorien. Dunkle Chronik und Helles Pergament verwenden dafür jeweils eigenständige
Himmels-, Planeten- und Instrumentenfarben.

Ein cyanfarbener Breitenring zeigt den gewählten Beobachterkreis direkt auf Era. Beim bisherigen
Polstand bleibt er als kleiner Polring sichtbar; bei 30° und 60° wächst er entsprechend nach
außen. Eine blockige Beobachtermarke verbindet Ring und gewählte Blickrichtung.

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

## ZEHS-Referenzstern

ZEHS ist in der Nordpolkarte als eigenständiger, mehrlagiger Pixelpunkt und im lokalen Horizont
als projizierter Fixpunkt sichtbar. Eine Messkarte hält alle freigegebenen Angaben zusammen:

| Parameter | Wert |
| --- | --- |
| Klasse | Referenzstern |
| Entfernung | ungefähr 40 AU |
| Helligkeit | sehr hell |
| Eigenbewegung | annähernd fest |
| Rotationsbezug | Untergang und erneuter Aufgang markieren eine vollständige Rotation Eras; 1 Rotation = 1 Um |
| lokale Umlaufbahn | keine |
| S-Int | nicht definiert; diese Skala gehört hier nur zu Sol und Yol |
| Namensbezug | Zehsen |
| Modellstatus | Weltenlogik, schematische und nicht physikalisch exakte Darstellung |

Der Kartenpunkt bleibt außerhalb der lokalen Sol-/Yol-Orbits fest. Für den Horizont wird derselbe
Punkt durch Blickrichtung, illustrative Era-Rotation und gewählte Breitenstufe projiziert. Deshalb
kann ZEHS auf- und untergehen, ohne dass der Referenzstern selbst eine lokale Bahn erhält. Die
Messkarte meldet Sichtbarkeit, schematische Pixelkoordinate und Höhe. Eine vollständige
Era-Rotation ist als 1 Um beziehungsweise 90 irdische Vergleichsminuten definiert.

## Horizontverlauf

Der Horizontverlauf ist eine getrennte, hochauflösende Pixelart-Grafik mit echter Tiefenstaffelung.
Für jedes Biom liegt `hd1` hinter den Himmelskörpern und `hd2` davor. Sterne werden transparent
vor `hd1`, Sol, Yol und ZEHS in der Mitte und eine sehr transparente Wolkenebene vor den
Himmelskörpern gezeichnet. Dadurch verschwinden die bewegten Körper sichtbar hinter Bergen,
Gebäuden und Gelände von `hd2`, statt nur über einem flachen Panorama zu schweben. Die
Seitenbezeichnungen lauten:

| Blickrichtung | links | rechts |
| --- | --- | --- |
| Norden | Westen | Osten |
| Osten | Norden | Süden |
| Süden | Osten | Westen |
| Westen | Süden | Norden |

Ein Blickpfeil auf Era kennzeichnet die gewählte lokale Richtung. Eine dazu senkrechte
Horizontschnittlinie trennt die vordere von der hinteren Hälfte. Beide Markierungen drehen sich
mit derselben Era-Rotation, die auch für die Projektion verwendet wird.

Die drei äquatorwärtigen Polversätze sind bewusst auf 0°, 30° und 60° begrenzt. 0° entspricht
der bisherigen Darstellung. Jede weitere Stufe hebt sichtbare Sol- und Yol-Positionen um einen
festen sphärischen Projektionsanteil an. Der Äquator bei 90° ist weder über Schaltflächen noch
über Tastatursteuerung erreichbar, damit der illustrative Himmel nicht bis zum Zenit kippt.
ZEHS verhält sich als nordsternartiger Gegenpol: Er steht bei 0° am höchsten und sinkt über 30°
bis zur flachsten Stellung bei 60°.

Jede Breitenstufe besitzt ein vollständiges, zur Auswahl passendes Pixelpanorama:

| Breite | Landschaft | sichtbare Details |
| --- | --- | --- |
| 0° | Polare Eiswelt | Gletscher, Schneefelder, Eisspitzen und Polarobservatorium |
| 30° | Gemäßigtes Tannenland | Bergketten, Tannenwald, Fluss und Waldhütte |
| 60° | Heiße Wüstenlandschaft | Dünen, Mesas, Kakteen und Wüstenruinen |

Die Biome wechseln Gelände, Himmel und Horizontfarben. Die gemeinsamen Stern- und Wolkenebenen
werden per Screen-Compositing ohne Blur eingeblendet und bleiben in beiden Themes bewusst
zurückhaltend; die astronomischen Positionen und Messwerte bleiben beim rein visuellen Wechsel
unverändert.

Die Daten fließen in einer festen Reihenfolge:

```text
getSnapshot(ms)
  → gemeinsame Weltpositionen von Sol und Yol
  → unveränderte Nordpol-Orbitansicht
  → Projektion derselben Punkte in den gewählten Horizontblick
  → additive Höhenkorrektur für Sol/Yol, invertierte Breitenkorrektur für ZEHS
```

Der Vorwärtsanteil eines Weltpunkts bestimmt Sichtbarkeit und Höhe, sein Rechtsanteil die
horizontale Position. Ein Körper hinter der lokalen Horizontebene ist in dieser Blickrichtung
nicht sichtbar; ein Punkt auf der Schnittlinie liegt am Horizont. Horizontläufe bleiben flach,
der Parabellauf steigt deutlich höher. Diese Höhenfaktoren sind ausschließlich illustrative
Präsentationswerte und verändern weder `phases.js` noch kanonische Lore-Werte.

Ein Richtungs- oder Breitenwechsel berechnet keine neue Simulation: Zeitpunkt, Seed, Phase,
Sol-/Yol-Winkel, Geschwindigkeit, Intensität und Körpergröße bleiben unverändert. Nur Blickbasis,
Projektionshöhe sowie die zugehörigen Kompass- und Breitenmarkierungen ändern sich.

Während der Konvektion sind Sol und Yol in beiden Grafiken unsichtbar. Zwei transparente
HD-Texturen zeigen den verdichteten Dunkelzustand mit verschlungenen Energieströmen,
Kristallsplittern und fernen Splitterwelten. Eine eigene 3:1-Panoramaebene liegt über dem Horizont;
die Orbitkarte verwendet eine zweite, um Era herum freigestellte Fassung.

## Zeitmodell

Kanonische Eckwerte:

```text
1 Um = 1 vollständige Eigenrotation Eras = 90 irdische Vergleichsminuten
1 Tan = 16 Um
1 Dir = 8 Tan = 128 Um
1 Mohn = 36 Dir = 288 Tan = 4.608 Um
1 Konvektionszyklus = 10 Mohn = 360 Dir = 2.880 Tan = 46.080 Um
1 Konvektion = 400 Um
```

Ein idealisiertes Um teilt sich in durchschnittlich 45 Vergleichsminuten Hellphase und 45
Vergleichsminuten Dunkelphase. Die tatsächliche Dauer und Intensität beider Phasen kann durch die
wechselnden Positionen von Sol und Yol abweichen. Ein Konvektionszyklus entspricht 69.120
irdischen Vergleichsstunden beziehungsweise 2.880 Tagen (ungefähr 7,9 Jahre).

Eine lineare Abbildung würde der Konvektion selbst in einer sechsminütigen Chronik nur rund zwei
Sekunden geben. Die Simulation nutzt deshalb eine semantische, stückweise Zeitabbildung und
reserviert 32 Sekunden für die Konvektion. Die aktuelle Era-Zeit wird innerhalb jedes Abschnitts
weiterhin korrekt zwischen dessen Um-Grenzen interpoliert.

Die konkrete Phasenfolge ist kein kanonisches historisches Datum. Sie dient als deterministische
Beispielsimulation.

## Zufallsalgorithmus

`app.js` normalisiert den Seed und bildet ihn mit FNV-1a auf einen 32-Bit-Wert ab. Ein
Mulberry32-Generator erzeugt den Ereignisplan. Separate gehashte Zufallsströme bestimmen
Bewegungsparameter und S-Int, sodass derselbe Seed und dieselbe Darstellungszeit denselben
Zustand liefern. Blickrichtung und Breitenstufe sind kein Bestandteil dieser Zufallsströme.
Synchrone Vorlagen bilden die Ausnahme bei der Geschwindigkeit: Sol und Yol übernehmen dort
deterministisch Eras feste 5,6°/s, statt einen zufälligen Geschwindigkeitswert zu erhalten.

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
ganzzahligen Strichstärken, quadratischen Linecaps und Miter-Verbindungen. Hochauflösende
Himmelskarten, Landschaftsebenen und Himmelsobjekte werden lokal als Rastergrafiken geladen;
jede Theme-Fassung referenziert nur ihr zugehöriges Motiv. Sanfte, gemeinsame Radientokens runden
Instrumente, Icons und Eingabefelder ab, ohne die Pixelästhetik in Pillenformen aufzulösen.

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
assets/images/              Astral-Wallpaper, Himmelskörper und gestaffelte HD-Horizontebenen
tests/smoke.cjs             Fake-DOM-, Interaktions-, Zustands- und Geometrievertrag
tests/visual-contract.cjs   statischer Vertrag gegen moderne/unscharfe Gestaltungseffekte
tests/zehs-latitude-contract.cjs eigener Regressionstest für die umgekehrte ZEHS-Breitenkurve
```

## Tests

Die drei Tests benötigen nur eine vorhandene Node.js-Laufzeit und keine zusätzlichen Pakete:

```bash
node tests/smoke.cjs
node tests/visual-contract.cjs
node tests/zehs-latitude-contract.cjs
```

Der Smoke-Test prüft unter anderem alle 18 Vorlagen, Seed-Reproduzierbarkeit, die sechsminütige
Zeitfassung, Theme-Speicherung, Auto-Neuwürfeln, Kompass- und Breitensteuerung per Maus und
Tastatur, Zustandsinvarianz bei Projektionswechseln, die invertierte ZEHS-Breitenhöhe, die
synchrone 5,6°/s-Kopplung sowie mindestens 200 Geometriesnapshots. Dabei werden endliche
Koordinaten, S-Int-Grenzen, SVG-Grenzen und der Sicherheitsabstand zu Era kontrolliert.

Der eigenständige ZEHS-Vertrag prüft die exakte Gegenkurve zu Sol und Yol sowie die Reihenfolge
0° am höchsten, 30° mittig und 60° am flachsten in allen vier Horizontblickrichtungen.

Der visuelle Vertrag liest HTML, CSS und JavaScript statisch. Er untersagt unter anderem
`backdrop-filter`, Gauß-Weichzeichnung, Pillenradien, alte SVG-Verläufe und die frühere
horizontabhängige Skalierung orbitaler Y-Radien. Außerdem prüft er die Pixel-SVG-Einstellungen,
die vier zugänglichen Richtungsbuttons, die drei Breitenstufen, den ZEHS-Pixelpunkt, die feste
Horizontebenen-Reihenfolge, transparente Atmosphärenebenen und den gemeinsamen Geometrievertrag.

## Grenzen der Darstellung

- Orbit- und Horizontansicht sind schematisch und keine naturwissenschaftlich exakte Astronomie.
- Die Horizontprojektion erklärt relative Sichtbarkeit; sie ist kein geografisches Geländemodell.
- Die Breitenstufen sind illustrative Polversätze; 90° und damit der Äquator bleiben ausgeschlossen.
- ZEHS bleibt ein visueller Referenzpunkt; 1 Um bezeichnet eine vollständige Era-Rotation.
- Während der Konvektion sind Sol und Yol unsichtbar. `S-Int 0` wird nicht verwendet, da die
  dokumentierte Skala bei 1 beginnt.
- Polare Besonderheiten sind Lore-Kontext, aber kein eigener Sonnenlauf und daher nicht als
  zusätzliche Phasenvorlage modelliert.
