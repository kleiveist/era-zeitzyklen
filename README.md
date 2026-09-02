# Era – Zeitzyklen von Sol, Yol, Kor und Kor’s Shard

Eine eigenständige HTML/CSS/JavaScript-Visualisierung der Zeitzyklen auf Era als modernes
Pixel-Fantasy-Observatorium. Zwei hochauflösende, motivgleiche Astronomie-Wallpaper zeigen die
Welt im tiefen Sternenlicht beziehungsweise im hellen Astralmorgen. Harte Pixelrahmen,
versetzte Schatten, Messingakzente und klare Instrumentenflächen halten beide Fassungen lesbar.

Die kosmologische Hauptansicht zeigt Era exakt von oben auf den Nordpol. Sol und Yol bewegen
sich auf vollständig sichtbaren, schematisch elliptischen Bahnen. Kor und Kor’s Shard erscheinen
als zwei eigenständige Welten der Ether-Entität Kor auf getrennten, stark elliptischen Polbahnen.
Ein zweites Pixelpanorama projiziert denselben 3D-Zustand als lokalen Horizontverlauf nach
Norden, Osten, Süden oder Westen. Beide Ansichten stammen aus demselben deterministischen
Simulationssnapshot.

Der 46.080-Um-Konvektionszyklus kann als sechsminütige Zeitfahrt erklärt, mit exakt fünf realen
Sekunden pro Um über 64 Stunden linear geprüft oder mit der offenen-Welt-Grundzeit von 15
Minuten pro Um über 480 Tage simuliert werden. Alle 18
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

- Das anklickbare Feld **Zeitmodus** im Kopf schaltet zwischen **6:00 · Erklärmodus**,
  **5 s/Um · 64 Stunden** und **15 min/Um · Spielsimulation** um. Die Auswahl bleibt lokal
  gespeichert.
- Mit **Abspielen** läuft der gewählte Zeitmodus timestampbasiert; bei 1× dauert der schnelle
  Erklärzyklus 6:00 Minuten, der lineare Prüfzyklus 64:00:00 Stunden und die lineare
  offene-Welt-Spielsimulation 480 Tage.
- Das **Archiv der Phasen** springt zur nächsten Instanz einer ausgewählten Vorlage.
- Die 18 **Zyklus-Runen** erlauben denselben Sprung direkt über ein Siegel.
- Das klickbare Chronikband und der Zeitregler erlauben direkte Zeitsprünge. In beiden linearen Modi lässt
  sich der Zeitstand zusätzlich mit gedrückter Maustaste oder per Finger horizontal über das
  Zyklus- und Abschnittsfeld feinjustieren.
- Ein **Seed** erzeugt immer wieder dieselbe Phasenfolge und dieselben Bewegungswerte.
- **Neu würfeln** erzeugt einen anderen Seed.
- Der kleine **Doppelkreis-Schalter** neben Abspielen/Pause schließt nach jeder vollständig
  beendeten Konvektion automatisch den nächsten Zyklus an. Sein Folgeseed wird einmalig und
  reproduzierbar aus Root-Seed und der Nummer des Konvektionsabschlusses abgeleitet; Sol, Yol,
  Era und die absolute Weltzeit laufen ohne Positionssprung weiter.
- Prüfmodus und Spielsimulation besitzen im Chronikband die Zoomstufen **Zyklusfolge**, **Zyklus** und
  **Abschnitt**. Rauszoomen zeigt alle bereits geladenen Zyklen, die Zyklusansicht zeigt genau
  einen linearen 46.080-Um-Zyklus und die Detailansicht ein großes, fortschreitend gefülltes
  Phasen- oder Konvektionssiegel. Dessen flächige Füllung läuft von links nach rechts.
- In beiden linearen Modi bezeichnet **Konvektionsabschluss** die nummerierte Auswahl eines
  der ersten 300 vollständigen Prüfpfade. **Zyklus öffnen** lädt den zugehörigen Pfad;
  **300er-Nordpolausrichtung** springt ohne Wartezeit in die gemeinsame Kor-/Kor’s-Shard-
  Ausrichtung innerhalb der Konvektion des 300. Pfads.
- Das quadratische Bild im **Himmelskörper-Messpunkt** öffnet eine Bildauswahl für ZEHS, Sol,
  Yol, Era, Kor und Kor’s Shard. Die Messkarte übernimmt anschließend Bild, Stammdaten,
  aktuellen Horizontstatus und die schematische Position des gewählten Körpers.
- 1×, 1,5×, 2×, 4× und 6× verändern nur das Wiedergabetempo; das Zeitmodell bleibt gleich.
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

Im sechsminütigen Erklärmodus läuft Eras illustrative Eigenrotation mit 5,6°/s. In beiden
linearen Modi dreht sich Era dagegen kanonisch exakt 360° pro Um: bei 1× im Prüfmodus um 72°/s,
in der Spielsimulation um 0,4°/s. Alle synchronen Sol-/Yol-Phasen verwenden dort exakt 360°/Um; ihr tatsächlicher polarer
Richtungswinkel bleibt relativ zur rotierenden Oberfläche konstant. Eine auf der Umlaufbahn
stehende Sonne erhält dagegen 0°/Um im Weltkoordinatensystem. Gleichlauf und weltfester
Stillstand sind damit getrennte Zustände.

Die hochauflösende Himmelskarte kombiniert Sternenstaub, Tiefenwolken, entfernte Ringwelten,
Kartengitter und Sektormarkierungen mit Eras Flüssen, Eisfeldern, Gebirgsketten und kleinen
Observatorien. Dunkle Chronik und Helles Pergament verwenden dafür jeweils eigenständige
Himmels-, Planeten- und Instrumentenfarben.

Kor und Kor’s Shard verwenden getrennte 3D-Zustände `{x, y, z}`, unterschiedliche illustrative
Halbachsen, Exzentrizitäten, Bahnknoten und Phasenpläne. Kor’s Shard folgt Kor deshalb weder
grafisch noch zeitlich als synchrones Bruchstück. Die polaren Bahnen liegen ungefähr 90° zur
Sol-/Yol-Ebene und erscheinen in der direkten Nordpolansicht als zwei schmale
Durchmesserbahnen statt als zusätzliche breite Ringe. Volle Linien markieren nordwärts vor Era
liegende Abschnitte; gestrichelte Linien die rückwärtigen Abschnitte. Rückwärtige Weltkörper
werden hinter Era verdeckt. Die konkrete Bahnparametrisierung ist ein reproduzierbares
Anschauungsmodell und kein neuer Kanonwert.

Die analytische Kepler-Lösung macht beide Körper nahe Era schneller und in großer Entfernung
langsamer. Im Webmodell absolviert jeder Körper pro Konvektionszyklus zwei Sichtpassagen und
zwei Verdeckungen. Getrennte Phasenversätze lassen diese Auftritte unabhängig voneinander
wandern und richten beide erst im 300. Zyklus bei Um 45.880 gleichzeitig nordwärts aus. Die
Zweifachpassage und dieser einzelne Prüfpunkt sind Darstellungsentscheidungen, keine neu
festgeschriebenen kanonischen Umlaufzeiten.

Ein cyanfarbener Breitenring zeigt den gewählten Beobachterkreis direkt auf Era. Beim bisherigen
Polstand bleibt er als kleiner Polring sichtbar; bei 30° und 60° wächst er entsprechend nach
außen. Eine blockige Beobachtermarke verbindet Ring und gewählte Blickrichtung.

Die Ellipsen von Sol und Yol sind schematische Bahnformen in einer gemeinsamen zweidimensionalen
Ebene. Sie sind kein perspektivischer Effekt. In beiden linearen Modi bezeichnet der Sonnenwinkel den
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

## Himmelskörper-Messpunkt und ZEHS-Referenzstern

ZEHS ist in der Nordpolkarte als eigenständiger, mehrlagiger Pixelpunkt und im lokalen Horizont
als projizierter Fixpunkt sichtbar. Sein quadratisches Bild dient zugleich als Schalter für ein
Dropdown mit ZEHS, Sol, Yol, Era, Kor und Kor’s Shard. Alle Vorschaubilder verwenden denselben
quadratischen Rahmen. Nach einer Auswahl füllt der gewählte Körper dieselbe Messkarte; dynamische
Sichtbarkeit und Koordinaten stammen aus dem gemeinsamen Renderzustand. ZEHS bleibt die
Standardauswahl und hält folgende freigegebenen Angaben zusammen:

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

Der Horizont berechnet Sols und Yols Einstrahlung getrennt aus ihrer kontinuierlichen
Sichtdauer innerhalb des aktiven Zyklus. Ein Körper aktiviert seinen Effekt exakt nach zwei
vollständigen sichtbaren Um. Die Zählung läuft über Phasengrenzen weiter, solange der projizierte
Körper an der Himmelsscheibe bleibt; Untergang, Konvektion und Zykluswechsel setzen seine Serie
zurück. Die Zwei-Um-Regel gilt auch bei 0°, die erreichbare Effektstärke nimmt jedoch bewusst nach
Norden ab: 60° verwendet den Faktor 1,00, 30° den mittleren Faktor 0,73 und 0° am Nordpol den
leichten Faktor 0,46.

Nach der Zwei-Um-Schwelle steigt die Wirkung über weitere sichtbare Um stufenlos an. Das
erreichbare Maximum folgt der projizierten Himmelshöhe und der jeweiligen S-Intensität. Sol baut
mehrere warme Lagen aus Farbglut und Hitzeflimmern auf; in den hohen Stufen tanzen kleine gelbrote
Leuchtpunkte über die Fläche. Beide Punktfarben verwenden verkleinerte Glühkerne und werden zum
oberen Bildrand über eine stetige Höhenmaske schwächer. Yols magische Kälte spiegelt Sols
atmosphärischen Aufbau in Blau: ein hochauflösendes Kältefeld und zwei bewegte blaue Schleier sind
oben fast transparent und nehmen nach unten stetig zu. Kleine blaue Glühwürmchen-Kugeln ergänzen
die Schleier; Eiszapfen, Frostkanten und Schneeflocken werden nicht verwendet. In Stufe 4
verdichten sich die Punkte jedes Körpers in zwei
gegenläufige, sehr schnelle Sturmfelder mit jeweils mindestens 48 zusätzlichen Partikeln. Sind
beide Körper lange genug sichtbar, bleiben beide farbgetrennten Stürme gleichzeitig aktiv und ein
zweilagiger Regenbogenschimmer wird dezent heller. Alle Ebenen sind hochauflösende Vektoren
beziehungsweise Filterfelder und werden im hellen wie im dunklen Theme aus denselben Modellwerten
gespeist.

Der Effekt verwendet Weltzeit in Um statt Darstellungssekunden. Deshalb entsteht bei demselben
Um-Stand im 5-s/Um-Prüfmodus und in der 15-min/Um-Spielsimulation dieselbe Stärke. Der Erklärmodus
tastet seine semantische Zeitfahrt weiterhin in 200-ms-Schritten ab; beide linearen Modi arbeiten
in 0,05-Um-Schritten und rekonstruieren Sprünge aus einem begrenzten deterministischen
Rückblickfenster. Beim Untergang fällt der Modellwert sofort auf null; eine 900-ms-CSS-Blende lässt
die sichtbaren Grafikebenen weich verschwinden, ohne unsichtbare Weltzeit weiterzuspeichern.

Die Daten fließen in einer festen Reihenfolge:

```text
getSnapshot(ms)
  → gemeinsame Weltpositionen von Sol und Yol
  → unveränderte Nordpol-Orbitansicht
  → Projektion derselben Punkte in den gewählten Horizontblick
  → additive Höhenkorrektur für Sol/Yol, invertierte Breitenkorrektur für ZEHS
  → pro Körper und Zyklus gezählte kontinuierlich sichtbare Um
  → Aktivierung nach exakt zwei Um und weiterer stufenloser Aufbau
  → deterministische Einstrahlung aus Sichtdauer, projizierter Höhe, S-Int und Breitenfaktor
  → getrennte Sol-, Yol- und gemeinsame Interferenzlagen
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

| Era-Einheit | Um | kanonischer irdischer Vergleich | Prüfzeit bei 1× | Spielsimulation bei 1× |
| --- | ---: | ---: | ---: | ---: |
| 1 Um | 1 | 1 Stunde 30 Minuten | 0:05 | 0:15:00 |
| 1 Tan | 16 | 24 Stunden | 1:20 | 4:00:00 |
| 1 Dir | 128 | 8 Tage | 10:40 | 32:00:00 |
| 1 Mohn | 4.608 | 288 Tage | 6:24:00 | 48 Tage |
| 1 Konvektionszyklus | 46.080 | 2.880 Tage | 64:00:00 | 480 Tage |

Die Anwendung hält drei Zeitprofile bewusst auseinander:

| Zeitprofil | Weltzeit bei 1× | vollständiger Zyklus | Konvektion |
| --- | --- | ---: | ---: |
| 6-Minuten-Zeitfahrt · Erklärmodus | semantisch, abschnittsweise komprimiert | 6:00 | didaktisch vergrößert auf 0:32 |
| 5 s/Um · Prüfmodus | linear, 0,2 Um pro Sekunde | 64:00:00 = 2 Tage 16 Stunden | 0:33:20 |
| 15 min/Um · Spielsimulation | linear, 1/900 Um pro Sekunde | 480 Tage | 4 Tage 4 Stunden |

Die ausführlichen Verträge stehen als eigenständige Dokumente bereit:

- [Prüfmodus mit 5 Sekunden pro Um](docs/00-zeitdarstellung/pruefmodus-5-sekunden-pro-um.md)
- [Erklärmodus als Sechs-Minuten-Zeitfahrt](docs/00-zeitdarstellung/erklaermodus-sechs-minuten.md)
- [Spielzeit-Grundmodell](docs/00-zeitdarstellung/zeitdarstellung-im-spiel.md)
- [Zeitbeispiel für die Darstellungsmodi](docs/00-zeitdarstellung/zeitbeispiel-beide-zeitmodi.md)
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
Zufallsströme. Im Erklärmodus übernehmen synchrone Vorlagen Eras illustrative 5,6°/s; in den
beiden linearen Modi überschreibt ihre verbindliche Semantik die Modellwerte mit exakt 360°/Um. Die
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
trennt den Kanon der beiden Welten von den illustrativen Web-Bahnparametern.

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
tests/time-mode-contract.cjs Drei-Modi-, 5-s/Um-, 15-min/Um-, Synchronitäts- und Timeline-Zoom-Vertrag
tests/visual-contract.cjs   statischer HD-, Ebenen-, Theme- und Gestaltungsvertrag
tests/zehs-latitude-contract.cjs eigener Regressionstest für die umgekehrte ZEHS-Breitenkurve
tests/moon-contract.cjs      Zweifachpassage, getrennte 3D-Polbahnen und 300er-Ereignisvertrag
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
Horizontpunkte sowie Zwei-Um-Schwelle, Höhenmaximum und mehrstufige Einstrahlung in allen
Blickrichtungen und Breiten geprüft. Hinzu kommt die positionsgleiche Übergabe von Sol, Yol,
ZEHS und Eras Rotation an den nächsten Vollzyklus.

Der Zeitmodus-Vertrag prüft zusätzlich 5 Sekunden beziehungsweise 15 Minuten = 1 Um = 360°
Era-Rotation, den 64-Stunden-Prüfpfad und den 480-Tage-Spielpfad, die 400-Um-Konvektion, rAF-Zeitanker ohne
Framekappung, polare Ellipsensynchronität, weltfesten Stillstand, Phasen- und Zyklusstetigkeit,
reproduzierbare Folgeseeds, Moduswechsel am selben Um-Stand, 6×-Wiedergabe sowie alle drei Timeline-Zoomstufen.

Der eigenständige ZEHS-Vertrag prüft die exakte Gegenkurve zu Sol und Yol sowie die Reihenfolge
0° am höchsten, 30° mittig und 60° am flachsten in allen vier Horizontblickrichtungen.

Der Kor-Vertrag prüft getrennte kontinuierliche 3D-Zustände und Phasen sowie je zwei
Sichtpassagen, Nähefenster, Horizontauftritte und Era-Verdeckungen pro Zyklus. Hinzu kommen
schnellere Periapsisbewegung, entfernungsabhängige Größe, der fast unsichtbare
Horizontuntergang, stetige Zyklusgrenzen und die gemeinsame Nordpolausrichtung in der
Konvektion des 300. Zyklus.

Der visuelle Vertrag liest HTML, CSS und JavaScript statisch und dekodiert die RGBA-PNGs ohne
Zusatzpaket. Er untersagt unter anderem `backdrop-filter`, Gauß-Weichzeichnung, Pillenradien, alte
SVG-Verläufe, orbitale Richtungspfeile und die frühere horizontabhängige Skalierung orbitaler
Y-Radien. Außerdem prüft er die präzisen Vektorbahnen, alle 48 Laufzeit-Panoramaslots, sämtliche
24 kombinierten 3:1-Originale samt 48 RGBA-Ebenen, ihre pixelgenaue Rekonstruktion, identische
Tag-/Nacht-Masken, eigenständige Tagespaletten, die feste Horizontebenen-Reihenfolge, den
hochaufgelösten Sol-Hitzelagen, Yols nach unten zunehmende blaue Kälteschleier, beide
farbgetrennten Partikelstürme, den dezenten zweilagigen Regenbogenschimmer und den gemeinsamen
Geometrievertrag.

## Grenzen der Darstellung

- Orbit- und Horizontansicht sind schematisch und keine naturwissenschaftlich exakte Astronomie.
- Die Horizontprojektion erklärt relative Sichtbarkeit; sie ist kein geografisches Geländemodell.
- Die Breitenstufen sind illustrative Polversätze; 90° und damit der Äquator bleiben ausgeschlossen.
- ZEHS bleibt ein visueller Referenzpunkt; 1 Um bezeichnet eine vollständige Era-Rotation.
- Während der Konvektion sind Sol und Yol unsichtbar. `S-Int 0` wird nicht verwendet, da die
  dokumentierte Skala bei 1 beginnt.
- Kor und Kor’s Shard sind ein eigenes illustratives Weltbahnmodell, aber keine zusätzlichen
  Sol-/Yol-Phasenvorlagen und keine Quelle neuer kanonischer Orbitalzahlen.
