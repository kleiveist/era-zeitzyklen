# Era – Zeitzyklen von Sol, Yol, Kor und Kor’s Shard

Eine eigenständige HTML/CSS/JavaScript-Visualisierung der Zeitzyklen auf Era als modernes
Pixel-Fantasy-Observatorium. Zwei hochauflösende, motivgleiche Astronomie-Wallpaper zeigen die
Welt im tiefen Sternenlicht beziehungsweise im hellen Astralmorgen. Harte Pixelrahmen,
versetzte Schatten, Messingakzente und klare Instrumentenflächen halten beide Fassungen lesbar.

Die kosmologische Hauptansicht zeigt Era exakt von oben auf den Nordpol. Sol und Yol bewegen
sich auf vollständig sichtbaren, schematisch elliptischen Bahnen. Kor und Kor’s Shard bleiben
als getrennt berechnetes Mondpaar auf großen, stark elliptischen Polbahnen eng beieinander.
Ein zweites Pixelpanorama projiziert denselben 3D-Zustand als lokalen Horizontverlauf nach
Norden, Osten, Süden oder Westen. Beide Ansichten stammen aus demselben deterministischen
Simulationssnapshot.

Der 46.080-Um-Konvektionszyklus kann entweder als sechsminütige Zeitfahrt erklärt oder mit
exakt fünf realen Sekunden pro Um über 64 Stunden linear geprüft werden. Alle 18
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

- Das anklickbare Feld **Zeitmodus** im Kopf schaltet zwischen
  **6:00 · Erklärmodus** und **5 s/Um · 64 Stunden** um. Die Auswahl bleibt lokal gespeichert.
- Mit **Abspielen** läuft der gewählte Zeitmodus timestampbasiert; bei 1× dauert der schnelle
  Erklärzyklus 6:00 Minuten, der lineare Prüfzyklus 64:00:00 Stunden.
- Das **Archiv der Phasen** springt zur nächsten Instanz einer ausgewählten Vorlage.
- Die 18 **Zyklus-Runen** erlauben denselben Sprung direkt über ein Siegel.
- Das klickbare Chronikband und der Zeitregler erlauben direkte Zeitsprünge.
- Ein **Seed** erzeugt immer wieder dieselbe Phasenfolge und dieselben Bewegungswerte.
- **Neu würfeln** erzeugt einen anderen Seed.
- Der kleine **Doppelkreis-Schalter** neben Abspielen/Pause schließt nach jeder vollständig
  beendeten Konvektion automatisch den nächsten Zyklus an. Sein Folgeseed wird einmalig und
  reproduzierbar aus Root-Seed und Zyklusnummer abgeleitet; Sol, Yol, Era und die absolute
  Weltzeit laufen ohne Positionssprung weiter.
- Nur im Prüfmodus besitzt das Chronikband die Zoomstufen **Zyklusfolge**, **Zyklus** und
  **Abschnitt**. Rauszoomen zeigt alle bereits geladenen Zyklen, die Zyklusansicht zeigt genau
  einen linearen 46.080-Um-Zyklus und die Detailansicht ein großes, fortschreitend gefülltes
  Phasen- oder Konvektionssiegel.
- Ebenfalls nur im Prüfmodus öffnet die **Zyklusnummer** direkt einen der ersten 300 Zyklen.
  **300er-Nordpolausrichtung** springt ohne Wartezeit in die gemeinsame Kor-/Kor’s-Shard-
  Ausrichtung innerhalb der Konvektion des 300. Zyklus.
- 1×, 1,5×, 2× und 4× verändern nur das Wiedergabetempo; das Zeitmodell bleibt gleich.
- **Helles Pergament / Dunkle Chronik** wechselt das vollständige Pixel-Fantasy-Farbsystem. Jede
  der zwölf Biom-/Richtungsszenen besitzt eine eigene Tag- und Nachtpalette als verlustfrei
  getrenntes 3:1-Panorama.
- Der Pixelkompass schaltet den Horizontblick zwischen **N**, **O**, **S** und **W** um.
- Die Breitensteuerung verschiebt den Beobachter um **0°**, **30°** oder **60°** vom Nordpol in Richtung Äquator.

Die Kompassfelder sind echte Schaltflächen in einer zugänglichen Auswahlgruppe. Rechts und
Runter wechseln zur nächsten Richtung im Uhrzeigersinn, Links und Hoch zur vorherigen; der
Tastaturfokus folgt der Auswahl. Standard ist Norden. Die Auswahl wird unter
`era-horizon-direction` lokal gespeichert und bleibt bei Phasen-, Seed- und Zeitsprüngen
erhalten. Die Breitenstufe wird unabhängig davon unter `era-horizon-latitude` gespeichert. Das
Theme wird weiterhin unter `era-theme`, der Zeitmodus unter `era-time-mode` gespeichert.

## Nordpol-Orbitansicht

Era liegt als kreisförmige, pixelig abgestufte Polansicht im Mittelpunkt. Der Mittelpunkt ist
der Nordpol, der äußere Rand entspricht dem Äquator. Nur die Runen- und Oberflächenstruktur
rotiert; Era selbst wird weder gekippt noch perspektivisch gestaucht.

Im sechsminütigen Erklärmodus läuft Eras illustrative Eigenrotation mit 5,6°/s. Im linearen
Prüfmodus dreht sich Era dagegen kanonisch exakt 360° pro Um, also bei 1× um 72° pro realer
Sekunde. Alle synchronen Sol-/Yol-Phasen verwenden dort exakt 360°/Um; ihr tatsächlicher polarer
Richtungswinkel bleibt relativ zur rotierenden Oberfläche konstant. Eine auf der Umlaufbahn
stehende Sonne erhält dagegen 0°/Um im Weltkoordinatensystem. Gleichlauf und weltfester
Stillstand sind damit getrennte Zustände.

Die hochauflösende Himmelskarte kombiniert Sternenstaub, Tiefenwolken, entfernte Ringwelten,
Kartengitter und Sektormarkierungen mit Eras Flüssen, Eisfeldern, Gebirgsketten und kleinen
Observatorien. Dunkle Chronik und Helles Pergament verwenden dafür jeweils eigenständige
Himmels-, Planeten- und Instrumentenfarben.

Kor und Kor’s Shard verwenden getrennte 3D-Zustände `{x, y, z}`, unterschiedliche illustrative
Halbachsen, Exzentrizitäten und leicht versetzte Bahnknoten. Sie werden dennoch als enges Paar
geführt. Die polare Bahn liegt ungefähr 90° zur Sol-/Yol-Ebene und erscheint in der direkten
Nordpolansicht deshalb als schmale Durchmesserbahn statt als zusätzlicher breiter Ring. Volle
Linien markieren den nordwärts vor Era liegenden Abschnitt; gestrichelte Linien den rückwärtigen
Abschnitt. Rückwärtige Mondkörper werden hinter Era verdeckt. Die konkrete Bahnparametrisierung
ist ein reproduzierbares Anschauungsmodell und kein neuer Kanonwert.

Die analytische Kepler-Lösung macht beide Körper nahe Era schneller und in großer Entfernung
langsamer. Ein 301-zu-300-Modell verschiebt ihre Nähefenster von Zyklus zu Zyklus und richtet
beide im 300. Zyklus bei Um 45.880 gleichzeitig nordwärts aus. Diese Lage ist eine
Darstellungsentscheidung innerhalb der bestätigten 400-Um-Konvektion, kein festgeschriebener
kanonischer Einzelzeitpunkt.

Ein cyanfarbener Breitenring zeigt den gewählten Beobachterkreis direkt auf Era. Beim bisherigen
Polstand bleibt er als kleiner Polring sichtbar; bei 30° und 60° wächst er entsprechend nach
außen. Eine blockige Beobachtermarke verbindet Ring und gewählte Blickrichtung.

Die Ellipsen von Sol und Yol sind schematische Bahnformen in einer gemeinsamen zweidimensionalen
Ebene. Sie sind kein perspektivischer Effekt. Im Prüfmodus bezeichnet der Sonnenwinkel den
tatsächlichen Richtungsstrahl; der Schnitt dieses Strahls mit der Ellipse liefert den Weltpunkt.
Eine Horizontphase verändert daher niemals Höhe
oder Form der Orbits. Phasen beeinflussen Bewegungsrichtung, Geschwindigkeit und Intensität;
derselbe Weltpunkt behält beim reinen Phasenwechsel dieselbe Horizontprojektion. Jede Bahn besteht
aus drei mit `geometricPrecision` gerenderten
Vektorlagen: dunkle Trennkontur, farbiger Kern und feine Messmarkierungen. Dadurch bleibt sie bei
jeder Displayauflösung scharf. Die früheren orbitalen Richtungspfeile wurden entfernt, weil sie
keinen zusätzlichen geometrischen Wert lieferten.

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
Für Polar, Gemäßigt und Wüste liegen in Norden, Osten, Süden und Westen zwölf nativ
2172 × 724 Pixel große 3:1-Szenen vor. Auch Norden wurde vollständig neu aufgebaut. Jede Szene
besitzt eine eigenständige Tag- und Nachtpalette; jede Palette besteht exakt aus diesen drei
Dateien:

```text
horizon-<landschaft>[-<richtung>][-day]-hd.png   vollständiges Original
horizon-<landschaft>[-<richtung>][-day]-hd1.png  Horizont und Fernsicht hinter Sol/Yol
horizon-<landschaft>[-<richtung>][-day]-hd2.png  transparenter Vordergrund vor Sol/Yol
```

Bei Norden entfällt der Richtungszusatz, bei der Nachtpalette der Zusatz `-day`. Damit umfasst der
Horizontbestand 12 Szenen × 2 Paletten × 3 Dateien, also 72 PNGs. `hd1` und `hd2` enthalten
ausschließlich Pixel ihres jeweiligen Originals; ihre harten, komplementären Alphamasken setzen
das Gesamtbild ohne eine einzige Pixelabweichung wieder zusammen. Tag und Nacht derselben Szene
verwenden exakt dieselbe Alphamaske, sodass beim Themewechsel keine Kulissenkante springt. Alle
Motive besitzen einen breiten, flachen Fernhorizont ohne falsche Gebirgswand. In der Nacht werden
Sterne transparent vor `hd1`, Sol, Yol und ZEHS
in der Mitte und eine sehr transparente Wolkenebene vor den Himmelskörpern gezeichnet. Zusätzlich
zu den 72 Panorama-PNGs liegen acht richtungsgenaue Wolken-Overlays vor: vier sparsame Varianten
für die polare Eiswelt und vier etwas dichtere Varianten für das gemäßigte Biom. Die Wüste besitzt
bewusst keine Wolkenebene. Im hellen
Theme sind sämtliche dekorativen Sterne und Konstellationen vollständig ausgeblendet. Dadurch
verschwinden die bewegten Körper sichtbar hinter nahen Gebäuden, Bögen und Gelände von `hd2`, statt
nur über einem flachen Panorama zu schweben. Im Horizontbild selbst bleiben Sol, Yol, Kor,
Kor’s Shard und ZEHS
unbeschriftet; ihre Namen sind bereits im astralen Weltzustand zu sehen. Die drei Nordpanoramen
erhalten ausschließlich im dunklen Theme einen eigenen Helligkeitsausgleich, damit Polar,
Gemäßigt und Wüste zu den übrigen Blickrichtungen passen. Die Seitenbezeichnungen lauten:

| Blickrichtung | links | rechts |
| --- | --- | --- |
| Norden | Westen | Osten |
| Osten | Norden | Süden |
| Süden | Osten | Westen |
| Westen | Süden | Norden |

Die Kompass-Trennlinie und die drei Richtungsangaben bleiben sichtbar. Zusätzliche dekorative
Pixelrunen oberhalb dieser Leiste werden nicht eingeblendet.

Ein Blickpfeil auf Era kennzeichnet die gewählte lokale Richtung. Eine dazu senkrechte
Horizontschnittlinie trennt die vordere von der hinteren Hälfte. Beide Markierungen drehen sich
mit derselben Era-Rotation, die auch für die Projektion verwendet wird.

Die drei äquatorwärtigen Polversätze sind bewusst auf 0°, 30° und 60° begrenzt. 0° entspricht
der bisherigen Darstellung. Jede weitere Stufe hebt sichtbare Sol- und Yol-Positionen um einen
festen sphärischen Projektionsanteil an. Der Äquator bei 90° ist weder über Schaltflächen noch
über Tastatursteuerung erreichbar, damit der illustrative Himmel nicht bis zum Zenit kippt.
ZEHS verhält sich als nordsternartiger Gegenpol: Er steht bei 0° am höchsten und sinkt über 30°
bis zur flachsten Stellung bei 60°.

Jede Breitenstufe besitzt vier vollständige, zur Auswahl passende Pixelpanoramen:

| Breite | Norden | Osten | Süden | Westen |
| --- | --- | --- | --- | --- |
| 0° · Polare Eiswelt | Polarobservatorium | gefrorener Hafen | Gletschersiedlung | Basaltbögen und Expeditionsruinen |
| 30° · Gemäßigtes | Tannenland und Sternwarte | Flussstadt und Brücken | weite Waldsenke und Ruinen | Aquädukt- und Wasserfallschlucht |
| 60° · Wüste | Dünen und Observatoriumsruinen | Oase und Sandsteinstadt | Salzebene und Stufenruinen | Canyon und Felsenstadt |

Die Biome wechseln Gelände, Himmel und Horizontfarben. Das Nacht-Theme blendet die gemeinsame
Sternenebene ein. In Polar und Gemäßigt wählen beide Themes zusätzlich anhand von Biom und
Blickrichtung eines von acht unterschiedlichen Wolkenmustern per Screen-Compositing ohne Blur;
Polar bleibt dabei deutlich wolkenärmer als Gemäßigt. Bei 60° Wüste bleibt der Himmel wolkenfrei.
Die astronomischen Positionen und Messwerte bleiben beim Themewechsel unverändert.

Bei 30° und 60° baut sich nach einer kurzen sichtbaren Verweildauer ein zusätzlicher
Einstrahlungseffekt auf; am Polstand bei 0° bleibt er immer aus. Sol allein hellt das Panorama
zunehmend warm auf. Yol allein färbt es in einem klareren Blau und erhält einen magischen Schimmer. Sind
beide sichtbar, mischen sich warme und kalte Farbe mit einem stärkeren Glitzern. S-Intensität,
Verweildauer und die relative Bewegung zu Era bestimmen die Stärke: exakt synchrone, scheinbar
ortsfeste Läufe wirken am stärksten. 60° verwendet eine höhere Breitenverstärkung als 30°. Diese
Regel gilt unverändert im Tag- und Nacht-Theme. Im Erklärmodus wird die Hüllkurve weiterhin in
200-ms-Schritten vorbereitet. Der 64-Stunden-Prüfmodus schreibt sie während der Wiedergabe
inkrementell fort und rekonstruiert sie nach einem Sprung nur aus einem begrenzten, deterministischen
Rückblickfenster; dadurch entstehen nicht mehr als eine Million Vorberechnungsschritte pro Ansicht.
Die Hüllkurve läuft über jede Phasengrenze weiter, solange der projizierte Körper sichtbar bleibt;
ein Phasenname setzt nichts zurück. Beim Untergang fällt die gespeicherte Wirkung mit einer langsamen 9-Sekunden-Zeitkonstante
ab, statt hart auf null zu springen. Während der Konvektion entsteht keine neue Einstrahlung, eine
noch vorhandene Wirkung klingt jedoch ebenfalls weich aus. Warme und kühle Felder sowie das
spektrale Rauschen werden hochauflösend und kontinuierlich statt als grobe Pixelkreuze gerendert.

Die Daten fließen in einer festen Reihenfolge:

```text
getSnapshot(ms)
  → gemeinsame Weltpositionen von Sol und Yol
  → unveränderte Nordpol-Orbitansicht
  → Projektion derselben Punkte in den gewählten Horizontblick
  → additive Höhenkorrektur für Sol/Yol, invertierte Breitenkorrektur für ZEHS
  → phasenübergreifende Hüllkurve aus Sichtbarkeit, langsamem Aufbau und langsamem Abbau
  → deterministische Einstrahlung aus Hüllkurve, S-Int und relativer Bewegung
```

Der Vorwärtsanteil eines Weltpunkts bestimmt Sichtbarkeit und Höhe, sein Rechtsanteil die
horizontale Position. Ein Körper hinter der lokalen Horizontebene ist in dieser Blickrichtung
nicht sichtbar; ein Punkt auf der Schnittlinie liegt am Horizont. Orbit-, Horizont-, Umkehr- und
Parabellauf verwenden für denselben Sol-/Yol-Weltpunkt denselben Projektionsfaktor. Dadurch kann
ein Phasenwechsel die sichtbare Höhe nicht mehr künstlich versetzen. Die Breitenkorrektur bleibt
davon unabhängig und verändert weder `phases.js` noch kanonische Lore-Werte.

Ein Richtungs- oder Breitenwechsel berechnet keine neue Simulation: Zeitpunkt, Seed, Phase,
Sol-/Yol-Winkel, Geschwindigkeit, Intensität und Körpergröße bleiben unverändert. Nur Blickbasis,
Projektionshöhe, das richtungsgenaue Panorama sowie die zugehörigen Kompass- und
Breitenmarkierungen ändern sich.

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

| Era-Einheit | Um | kanonischer irdischer Vergleich | Prüfzeit bei 1× |
| --- | ---: | ---: | ---: |
| 1 Um | 1 | 1 Stunde 30 Minuten | 0:05 |
| 1 Tan | 16 | 24 Stunden | 1:20 |
| 1 Dir | 128 | 8 Tage | 10:40 |
| 1 Mohn | 4.608 | 288 Tage | 6:24:00 |
| 1 Konvektionszyklus | 46.080 | 2.880 Tage | 64:00:00 |

Die Anwendung hält zwei Zeitprofile bewusst auseinander:

| Zeitprofil | Weltzeit bei 1× | vollständiger Zyklus | Konvektion |
| --- | --- | ---: | ---: |
| 6-Minuten-Zeitfahrt · Erklärmodus | semantisch, abschnittsweise komprimiert | 6:00 | didaktisch vergrößert auf 0:32 |
| 5 s/Um · Prüfmodus | linear, 0,2 Um pro Sekunde | 64:00:00 = 2 Tage 16 Stunden | 0:33:20 |

Die ausführlichen Verträge stehen als eigenständige Dokumente bereit:

- [Prüfmodus mit 5 Sekunden pro Um](docs/00-zeitdarstellung/pruefmodus-5-sekunden-pro-um.md)
- [Erklärmodus als Sechs-Minuten-Zeitfahrt](docs/00-zeitdarstellung/erklaermodus-sechs-minuten.md)
- [Zeitbeispiel für beide Darstellungsmodi](docs/00-zeitdarstellung/zeitbeispiel-beide-zeitmodi.md)
- [Technische Umsetzung der Zeitmodi](docs/00-zeitdarstellung/technische-umsetzung-zeitmodi.md)

Im Prüfmodus ergeben fünf Sekunden genau 1 Um und eine vollständige Era-Rotation. Nach sechs
Minuten sind erst 72 Um beziehungsweise 0,15625 % des Zyklus vergangen. Die letzten 400 Um sind
bereits Teil der 46.080 Um: Die Konvektion beginnt nach 45.680 Um bei `63:26:40` und endet
zusammen mit dem Zyklus bei `64:00:00`. Sol und Yol sind in dieser gesamten Spanne in Orbit und
Horizont unsichtbar; Era und Weltzeit laufen weiter. Die Darstellung erfindet kein Zusammenlaufen,
Zusammenstoßen oder Verschmelzen der Sonnen.

Eine lineare Abbildung würde der Konvektion in der sechsminütigen Chronik nur rund drei Sekunden
geben. Der Erklärmodus nutzt deshalb weiterhin seine semantische, stückweise Zeitabbildung und
reserviert 32 Sekunden für die Konvektion. Diese Vorschauzeit ist ausdrücklich weder
Sonnenwinkel noch Strahlungsintensität. Der lokale Kalenderwert in der Oberfläche heißt
**Zyklusfortschritt** und wird ausschließlich aus den vergangenen Um geteilt durch 46.080
berechnet.

Kalender, Era-Rotation, Sol, Yol, Kor, Kor’s Shard, Orbit und Horizont entstehen pro Bild aus
genau demselben Snapshot. Die Animation addiert keinen festen Winkel pro Frame: `requestAnimationFrame` dient
nur zum Rendern, während ein monotoner Zeitstempelanker die verstrichene Moduszeit bestimmt.
Browserdrosselung oder unterschiedliche Bildraten verlieren daher keine Weltzeit.

Die konkrete Phasenfolge ist kein kanonisches historisches Datum. Sie dient als deterministische
Beispielsimulation.

## Zufallsalgorithmus

`app.js` normalisiert den Seed und bildet ihn mit FNV-1a auf einen 32-Bit-Wert ab. Ein
Mulberry32-Generator erzeugt den Ereignisplan. Separate gehashte Zufallsströme bestimmen
Bewegungsparameter und S-Int, sodass derselbe Root-Seed, Zyklusindex und dieselbe Weltzeit
denselben Zustand liefern. Blickrichtung und Breitenstufe sind kein Bestandteil dieser
Zufallsströme. Im Erklärmodus übernehmen synchrone Vorlagen Eras illustrative 5,6°/s; im
Prüfmodus überschreibt ihre verbindliche Semantik die Modellwerte mit exakt 360°/Um. Die
bisherigen Bereiche langsamer und asynchroner Läufe werden dort als illustrative Verhältnisse
zur früheren 5,6°/s-Referenz migriert. Bezeichnungen wie Tan- oder Dir-Lauf schreiben dadurch
weiterhin keine unbestätigte exakte Umlaufdauer fest.

Der Ereignisplan enthält:

1. jede reguläre Vorlage mindestens einmal;
2. 12 bis 18 zusätzliche, gewichtete Wiederholungen;
3. besonders häufig wechselnde Phasen als Meta-Regime;
4. eine feste Konvektion über die letzten 400 Um.

Die Bewegung wird analytisch aus `Seed + Zyklus + Abschnitt + Moduszeit` berechnet. Sie hängt
nicht von der Bildrate, der Blickrichtung oder dem vorherigen Navigationsweg ab. Jeder Abschnitt
übernimmt Winkel, Radialposition und Intensität vom exakten Ende seines Vorgängers. Folgezyklen
werden höchstens einmal erzeugt und in einem In-Memory-Register gehalten. Ihr Seed wird
reproduzierbar aus Root-Seed und Zyklusindex abgeleitet; die finalen Sol-/Yol-Werte und Eras
Rotation schließen ohne Sprung an. Nur der lokale Zyklusfortschritt beginnt wieder bei null, die
absolute Weltzeit läuft weiter.

## Pixeltechnik und Barrierefreiheit

Das Interface verwendet ein konsequentes Pixelraster, harte Rahmen und versetzte Schatten ohne
Blur. Die lokalen Chronikschriften bleiben großen Überschriften vorbehalten; Bedienelemente und
Messwerte verwenden blockige Monospace-Fallbacks. Die SVG-Grafiken arbeiten mit `crispEdges`,
ganzzahligen Strichstärken, quadratischen Linecaps und Miter-Verbindungen. Hochauflösende
Himmelskarten, Landschaftsebenen und Himmelsobjekte werden lokal als Rastergrafiken geladen;
jede Theme-Fassung referenziert nur ihr zugehöriges Motiv. Der Einstrahlungseffekt ist die bewusst
glatte Ausnahme: Seine Vektorfelder nutzen `geometricPrecision`, ein Filterraster von 3360×1120
und kontinuierliche Bewegungen, damit kein grobes Effektpixelraster sichtbar wird. Sanfte,
gemeinsame Radientokens runden
Instrumente, Icons und Eingabefelder ab, ohne die Pixelästhetik in Pillenformen aufzulösen.

Beide Themes besitzen eine vollständige Materialpalette. Fokuszustände sind deutlich sichtbar,
Slider und Chronikband bleiben per Tastatur bedienbar und `prefers-reduced-motion` wird
respektiert. Das Layout ordnet Phasenbibliothek, Kosmologie und Instrumententafel auf großen
Bildschirmen nebeneinander und auf kleinen Displays ohne horizontalen Seiten-Scroll logisch
untereinander an.

## Dokumentation

Der [Dokumentationsindex](docs/index.md) trennt Kosmologie, kanonische
Zeitrechnung, Webseitendarstellung, technische Umsetzung und vorgeschlagenes
Gameplay-Balancing. Hinweise zu Statuswerten, Quellenhierarchie und Pflege
stehen in [docs/README.md](docs/README.md). Der Einstieg in sämtliche
Zeitdokumente erfolgt über den
[Index der Zeitdarstellung](docs/00-zeitdarstellung/index.md).
Der eigene [Kor-/Kor’s-Shard-Vertrag](docs/00-kosmologie/KOR-UND-KORS-SHARD.md)
trennt bestätigte Mondlogik von den illustrativen Web-Bahnparametern.

## Dateien

```text
index.html                  Semantik, Pixel-SVGs, Nordpolansicht und Horizontpanorama
styles.css                  Themes, Pixelraster, Panels, Bedienelemente und Responsive Layout
favicon.svg                 lokales Pixel-Siegel für den Browser-Tab
phases.js                   kanonische Phasenvorlagen plus illustrative Wertebereiche
app.js                      Seed, Zeitmodell, Geometrie, Projektion, Animation und Interaktion
Textdatei.txt               kanonische Lore- und Zeitreferenz
docs/index.md               Einstieg in Kosmologie und Zeitdarstellung
docs/README.md              Dokumentklassen, Quellenhierarchie und Pflegeregeln
docs/00-zeitdarstellung/    getrennte Kanon-, Beispiel-, Modus- und Technikdokumente
assets/fonts/               lokal eingebettete, offen lizenzierte Chronikschrift
assets/images/              Astral-Wallpaper, Himmelskörper-Assets, 72 Panorama-PNGs und acht Wolken-Overlays
tests/smoke.cjs             Fake-DOM-, Interaktions-, Kontinuitäts- und Geometrievertrag
tests/time-mode-contract.cjs exakter 5-s/Um-, 64-h-, Synchronitäts- und Timeline-Zoom-Vertrag
tests/visual-contract.cjs   statischer HD-, Ebenen-, Theme- und Gestaltungsvertrag
tests/zehs-latitude-contract.cjs eigener Regressionstest für die umgekehrte ZEHS-Breitenkurve
tests/moon-contract.cjs      3D-Polbahn-, Paar-, Entfernungs- und 300er-Ereignisvertrag
```

## Tests

Die fünf Tests benötigen nur eine vorhandene Node.js-Laufzeit und keine zusätzlichen Pakete:

```bash
node tests/smoke.cjs
node tests/time-mode-contract.cjs
node tests/visual-contract.cjs
node tests/zehs-latitude-contract.cjs
node tests/moon-contract.cjs
```

Der Smoke-Test prüft unter anderem alle 18 Vorlagen, Seed-Reproduzierbarkeit, die sechsminütige
Zeitfassung, Theme-Speicherung, automatische Anschlusszyklen, Kompass- und Breitensteuerung per Maus und
Tastatur, Zustandsinvarianz bei Projektionswechseln, die invertierte ZEHS-Breitenhöhe, die
synchrone 5,6°/s-Kopplung, die vollständige Sol-/Yol-Einstrahlungsmatrix, jede erzeugte
Phasengrenze und mindestens 200 Geometriesnapshots. Dabei werden Winkel, Radialwerte,
Horizontpunkte und die kontinuierliche Einstrahlungshüllkurve in allen Blickrichtungen und Breiten sowie die
positionsgleiche Übergabe von Sol, Yol, ZEHS und Eras Rotation an den nächsten Vollzyklus geprüft.

Der Zeitmodus-Vertrag prüft zusätzlich 5 Sekunden = 1 Um = 360° Era-Rotation, 72 Um nach sechs
Minuten, die Grenzen `63:26:40` und `64:00:00`, die 400-Um-Konvektion, rAF-Zeitanker ohne
Framekappung, polare Ellipsensynchronität, weltfesten Stillstand, Phasen- und Zyklusstetigkeit,
reproduzierbare Folgeseeds, Moduswechsel am selben Um-Stand sowie alle drei Timeline-Zoomstufen.

Der eigenständige ZEHS-Vertrag prüft die exakte Gegenkurve zu Sol und Yol sowie die Reihenfolge
0° am höchsten, 30° mittig und 60° am flachsten in allen vier Horizontblickrichtungen.

Der Mondvertrag prüft getrennte kontinuierliche 3D-Zustände, die enge Paarführung, je ein
verschobenes Nähefenster pro Zyklus, schnellere Periapsisbewegung, entfernungsabhängige Größe,
den fast unsichtbaren Horizontuntergang, stetige Zyklusgrenzen und die gemeinsame
Nordpolausrichtung in der Konvektion des 300. Zyklus.

Der visuelle Vertrag liest HTML, CSS und JavaScript statisch und dekodiert die RGBA-PNGs ohne
Zusatzpaket. Er untersagt unter anderem `backdrop-filter`, Gauß-Weichzeichnung, Pillenradien, alte
SVG-Verläufe, orbitale Richtungspfeile und die frühere horizontabhängige Skalierung orbitaler
Y-Radien. Außerdem prüft er die präzisen Vektorbahnen, alle 48 Laufzeit-Panoramaslots, sämtliche
24 kombinierten 3:1-Originale samt 48 RGBA-Ebenen, ihre pixelgenaue Rekonstruktion, identische
Tag-/Nacht-Masken, eigenständige Tagespaletten, die feste Horizontebenen-Reihenfolge, den
hochaufgelösten Schimmer und den gemeinsamen Geometrievertrag.

## Grenzen der Darstellung

- Orbit- und Horizontansicht sind schematisch und keine naturwissenschaftlich exakte Astronomie.
- Die Horizontprojektion erklärt relative Sichtbarkeit; sie ist kein geografisches Geländemodell.
- Die Breitenstufen sind illustrative Polversätze; 90° und damit der Äquator bleiben ausgeschlossen.
- ZEHS bleibt ein visueller Referenzpunkt; 1 Um bezeichnet eine vollständige Era-Rotation.
- Während der Konvektion sind Sol und Yol unsichtbar. `S-Int 0` wird nicht verwendet, da die
  dokumentierte Skala bei 1 beginnt.
- Kor und Kor’s Shard sind ein eigenes illustratives Mondbahnmodell, aber keine zusätzlichen
  Sol-/Yol-Phasenvorlagen und keine Quelle neuer kanonischer Orbitalzahlen.
