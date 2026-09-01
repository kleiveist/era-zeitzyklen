# Umsetzungsplan: Sechs-Minuten-Zeitfahrt und linearer 5-s/Um-Prüfmodus

Status: umgesetzt und durch die Abnahmetests verifiziert (2026-09-01)

## 1. Ziel und verbindliche Abgrenzung

Die bestehende sechsminütige Astralchronik bleibt als Standard und wird klar als
**schematischer Erklärmodus** bezeichnet. Zusätzlich kommt ein linearer
**Prüfmodus mit 5 realen Sekunden pro Um** hinzu. Beide Modi verwenden denselben
seedgebundenen Phasenplan, haben aber unterschiedliche Zeitabbildungen:

| Modus | Zweck | Dauer bei 1× | Konvektion |
| --- | --- | ---: | ---: |
| Sechs-Minuten-Zeitfahrt | schnelle, spielnahe Veranschaulichung des gesamten Beispielzyklus | 6 Minuten | didaktisch auf 32 Sekunden vergrößert |
| 5-s/Um-Prüfmodus | lineare Prüfung der kanonischen Um-Zeitbasis | 64 Stunden | letzte 400 Um = 33 Minuten 20 Sekunden |

Die bestehende Vorschau wird nicht durch den Prüfmodus ersetzt. Die bisherige
Zeitverzerrung bleibt ausschließlich im Erklärmodus erlaubt und wird an allen
betroffenen Stellen ausdrücklich so benannt.

## 2. Auslegungsentscheidung vor der Umsetzung

Die Anweisung nennt an zwei Stellen eine „Fünf-Minuten-Variante“, definiert aber
mehrfach und mit konkreten Abnahmewerten eindeutig **5 Sekunden pro Um**:

- 0,2 Um pro realer Sekunde;
- 1 Um nach 5 Sekunden;
- 72 Um nach 6 Minuten;
- 46.080 Um nach 64 Stunden;
- 400 Um Konvektion in 2.000 Sekunden.

Der Plan behandelt „fünf Minuten“ deshalb als Versprecher und sieht im Dropdown
die Option **„5 Sekunden pro Um · Prüfmodus (64 h/Zyklus)“** vor. Falls tatsächlich
5 Minuten pro Um gemeint sein sollten, muss der Plan vor der Implementierung neu
gerechnet werden; ein Zyklus würde dann 160 Tage statt 64 Stunden dauern.

## 3. Bestandsaufnahme im Repository

### Aktuelles Zeitmodell

- `phases.js` setzt `presentationMs: 360000`,
  `convectionPresentationMs: 32000` und eine illustrative Era-Rotation von
  `5.6°/s`.
- `buildScenario()` vergibt getrennte Um-Grenzen und Darstellungszeit-Grenzen.
- `getSnapshot(ms)` interpoliert die Weltzeit innerhalb eines Abschnitts aus der
  sechsminütigen Darstellungszeit.
- Sonnenwinkel und Era-Rotation werden derzeit in Grad pro Darstellungssekunde
  berechnet.
- `requestAnimationFrame` liefert zwar Zeitstempel, der aktuelle Tick addiert aber
  gekappte Frame-Deltas. Lange gedrosselte Frames beziehungsweise ein
  Hintergrund-Tab würden daher Zeit verlieren.
- Der untere `phase-track` zeigt alle Abschnitte eines einzigen Zyklus. Ein
  Abschnitt besitzt bereits einen schmalen Fortschrittsstreifen, aber keine
  Detail-, Zyklus- oder Folgen-Zoomstufe.
- Der automatische Anschluss übernimmt derzeit Endpositionen und Eras Winkel,
  erzeugt den nächsten Seed jedoch zufällig und setzt die lokale
  Darstellungszeit auf null.

### Erhaltenswerte Verträge

- Seedgebundene, reproduzierbare Phasenfolge;
- letzte 400 Um als Konvektion innerhalb der 46.080 Um;
- Sol und Yol in Orbit und Horizont aus demselben Zustands-Snapshot;
- positionsgleiche Phasen- und Zyklusübergänge;
- Autozyklus aus: exakt am Ende pausieren;
- Autozyklus an: ohne sichtbaren Sprung anschließen;
- Blickrichtung, Breitenstufe, Themes und die vorhandenen Bildschichten;
- alle bisherigen Bedienwege für Phasensprung, Abspielen, Pause, Neustart und
  Wiedergabetempo.

## 4. Zeit- und Zustandsarchitektur

### 4.1 Zwei explizite Zeitprofile

In `phases.js` wird statt verstreuter Einzelwerte eine unveränderliche
Moduskonfiguration eingeführt, beispielsweise:

```js
timeModes: {
  chronicle: {
    id: "chronicle",
    label: "6-Minuten-Zeitfahrt",
    kind: "semantic-preview",
    durationMs: 360_000,
    convectionDurationMs: 32_000,
    eraDegreesPerPresentationSecond: 5.6,
  },
  inspection: {
    id: "inspection",
    label: "5 Sekunden pro Um",
    kind: "linear-world-time",
    realMillisecondsPerUm: 5_000,
    durationMs: 46_080 * 5_000,
    convectionDurationMs: 400 * 5_000,
    eraDegreesPerUm: 360,
  },
}
```

Der alte Erklärmodus bleibt der Default. Die Modus-ID kann unter einem neuen,
eindeutigen Schlüssel wie `era-time-mode` lokal gespeichert werden; die
Simulation muss auch ohne verfügbaren `localStorage` funktionieren.

### 4.2 Eine Uhr pro aktivem Modus

Der Laufzeitzustand trennt künftig klar:

- `timeMode` – ausgewähltes Zeitprofil;
- `modeElapsedMs` – verstrichene Darstellungs-/Prüfzeit im aktiven Zyklus;
- `absoluteWorldUm` – fortlaufende Weltzeit über Zyklusgrenzen hinweg;
- `cycleIndex` – intern nullbasiert, in der Oberfläche einsbasiert;
- `cycleUm` – lokaler Wert von 0 bis einschließlich 46.080;
- `cycleProgress` – ausschließlich `cycleUm / 46_080`;
- `playing`, `playbackRate` und ein Zeitanker für die Wiedergabe.

Im Prüfmodus gilt ausschließlich:

```text
cycleUm = modeElapsedMs / 5.000
absoluteWorldUm = cycleIndex * 46.080 + cycleUm
Era-Winkel ungekürzt = Anfangswinkel + absoluteWorldUm * 360°
```

Kalender, Zyklusfortschritt, Era, Sol, Yol, Orbit und Horizont erhalten denselben
Snapshot aus dieser Weltzeit. Es gibt keine zweite, unabhängig beschleunigte
Sonnenuhr.

Im Erklärmodus bleibt die vorhandene semantische Abschnittsabbildung bestehen.
Sie wird als Vorschauprofil gekapselt, damit ihre illustrative 5,6°/s-Drehung
nicht versehentlich als kanonische Um-Drehung ausgegeben wird.

### 4.3 Zeitstempel statt Frame-Schritte

Die Wiedergabe wird auf einen Zeitanker umgestellt:

```text
aktuelle Moduszeit = Startwert + (rAF-Zeitstempel - Startzeitstempel) * Tempo
```

`requestAnimationFrame` löst nur das Rendern aus. Es wird kein fester Winkel und
kein festes Zeitquant pro Bild addiert. Die bisherige 120-ms-Kappung darf im
Prüfmodus keine Weltzeit verwerfen. Nach Browser-Drosselung wird aus dem
monotonen Zeitstempel korrekt aufgeholt, solange die Simulation nicht pausiert
wurde.

### 4.4 Moduswechsel

Beim Wechsel des Zeitmodus:

1. Wiedergabe pausieren;
2. aktuellen `cycleUm` und ausgewählten Zyklus erhalten;
3. Zielmoduszeit aus demselben `cycleUm` bestimmen;
4. den für diesen Modus deterministischen Snapshot neu berechnen;
5. Timeline, Beschriftungen, Slidergrenzen und Tempoangaben aktualisieren;
6. den Wechsel über die Live-Region ankündigen.

Ein bewusster Moduswechsel darf die visuelle Geschwindigkeit ändern. Er darf
aber weder Phase, Kalenderposition noch Seed zufällig wechseln.

## 5. Kalender und Benennung

- `formatEraTime()` arbeitet im Prüfmodus mit `absoluteWorldUm` und wird nicht
  mehr auf einen einzelnen Zyklus geklemmt. Nach dem ersten Anschluss läuft der
  absolute Mohn-/Dir-/Tan-/Um-Stand weiter.
- Der lokale Prozentwert heißt überall **„Zyklusfortschritt“**.
- „C-Stand“ wird nicht als Synonym für Sonnenwinkel, Phase, Intensität oder
  Fortschritt verwendet.
- „Darstellungszeit“ bleibt nur im Erklärmodus. Im Prüfmodus lautet die Anzeige
  beispielsweise „Prüflaufzeit“ beziehungsweise „5 s/Um“.
- Lange Laufzeiten werden lesbar als `63:26:40` und `64:00:00` oder zusätzlich
  als `2 Tage 16 Stunden` formatiert; `3840:00` soll nicht die einzige Anzeige
  sein.

## 6. Sol-/Yol-Bewegungsmodell im Prüfmodus

### 6.1 Gemeinsame Um-Basis

Der Prüfmodus bekommt analytische, seedgebundene Bewegungsparameter auf
Um-Basis. Eine Position wird immer direkt aus
`Seed + Zyklus + Abschnitt + absoluteWorldUm` berechnet. Dadurch bleibt das
Ergebnis unabhängig von Bildrate, Navigationsweg und Anzahl vorheriger
Renderaufrufe.

Die bisherigen illustrativen Geschwindigkeitsbereiche werden nicht als neue
kanonische Orbitalphysik ausgegeben. Für die Migration werden sie als Verhältnis
zur bisherigen Era-Referenz von 5,6°/s verstanden:

```text
relativer Faktor = bisheriger illustrativer Wert / 5,6
Prüfmodus-Winkelrate = relativer Faktor * 360° pro Um
```

Ausnahmen mit verbindlicher Semantik überschreiben diese Umrechnung:

| Zustand | Prüfmodus-Regel |
| --- | --- |
| Synchron / stehend synchron | exakt `+360°/Um`, keine Zusatzwelle, relative Richtung zu Era konstant |
| Auf der Umlaufbahn stehende Sonne | exakt `0°/Um` im Weltkoordinatensystem |
| Langsamer Lauf | positiver, seedgebundener Faktor aus dem bestehenden Phasenmodell |
| Asynchron | negativer, seedgebundener Faktor aus dem bestehenden Phasenmodell |
| Wechselnd | deterministische Teilbewegungen aus dem einmal erzeugten Abschnittsplan |
| Konvektion | unsichtbar; Weltzeit und Era laufen weiter; keine willkürliche Rücksetzung |

Die numerische Migrationsformel ist eine Modellierungsentscheidung und wird in
README und UI als illustrativ dokumentiert. Namen wie Tan-Lauf und Dir-Lauf
erzeugen weiterhin keine erfundene exakte Umlaufdauer.

### 6.2 Tatsächlicher Richtungswinkel auf Ellipsen

Der aktuelle `angle` ist ein Ellipsenparameter. Für echte Synchronität reicht es
nicht, diesen Zahlenwert parallel zu Eras Winkel zu erhöhen. Im Prüfmodus wird
deshalb der tatsächliche polare Richtungswinkel der Weltposition geführt.

`getOrbitPoint()` bestimmt den Schnitt dieses Richtungsvektors mit der jeweiligen
Ellipse. Damit gilt auch auf unterschiedlich gestreckten Sol-/Yol-Bahnen:

```text
polarAngle(Sonne) - eraRotationAngle = konstant
```

für exakt synchrone Zustände. Ein Regressionstest prüft diese Differenz an
mehreren Punkten der Ellipse, nicht nur den gespeicherten Kurvenparameter.

### 6.3 Übergänge

- Jede reguläre Phase übernimmt exakten Richtungswinkel, Radialwert und
  Intensität ihres Vorgängers.
- Parameter dürfen ab der Grenze wechseln; der Zustand selbst darf nicht
  springen.
- Der Konvektionsbeginn blendet beide Sonnen in beiden Ansichten aus, ohne ihre
  Anschlusswerte zu löschen.
- Das Zyklusende speichert Endzustände beider Modusprofile separat, damit ein
  Wechsel des Darstellungsprofils keinen pfadabhängigen Zufall einführt.

## 7. Zyklusfolge, Seeds und absolute Kontinuität

Es wird eine kleine Zyklusverwaltung eingeführt:

- `rootSeed` bezeichnet die gewählte Folge;
- `deriveCycleSeed(rootSeed, cycleIndex, schemaVersion)` leitet jeden
  Anschluss-Seed reproduzierbar ab;
- `ensureCycle(index)` baut einen Zyklus höchstens einmal und legt ihn in einem
  In-Memory-Register ab;
- Folgezyklen werden der Reihe nach aufgebaut, weil sie den Endzustand des
  Vorgängers übernehmen;
- während eines Frames wird niemals neu gewürfelt;
- „Neu würfeln“ startet bewusst eine neue Root-Seed-Folge;
- bereits materialisierte Zyklen bleiben für Rücksprung und Übersicht erhalten.

Autozyklus ausgeschaltet:

- exakt bei 46.080 Um stoppen;
- `cycleProgress = 100 %` und den abgeschlossenen Konvektionszustand anzeigen;
- nicht durch Modulo sofort auf Zyklus 2, Um 0 springen.

Autozyklus eingeschaltet:

- Zyklusnummer erhöhen;
- nächsten Seed einmalig ableiten und registrieren;
- lokalen Fortschritt auf null setzen;
- `absoluteWorldUm` fortführen;
- Endzustände von Sol und Yol anschließen;
- den nächsten `requestAnimationFrame` mit demselben Zeitanker fortsetzen.

## 8. Modusauswahl in der Oberfläche

Die statische Header-Kachel „6:00 Minuten Astralchronik“ wird zu einem echten,
per Tastatur bedienbaren Zeitmodus-Steuerelement. Vorgesehen ist ein natives
`select` mit sichtbarem Label, nicht ein klickbares `div`:

1. `6-Minuten-Zeitfahrt · Erklärmodus`
2. `5 Sekunden pro Um · Prüfmodus (64 h/Zyklus)`

Der Text, an dem heute „6:00“ steht, ist damit selbst Teil des anklickbaren
Controls. Die Timeline-Überschrift, der Begleittext, die Messwertbezeichnung und
die Tempooptionen reagieren auf die Auswahl.

Die sechs Minuten bleiben in Hero, Metadaten und Erklärung sichtbar, aber nicht
mehr als einzig mögliche oder kanonisch lineare Laufzeit. Metadaten und README
benennen beide Modi ohne die 64 Stunden mit sechs Minuten gleichzusetzen.

## 9. Untere Timeline nur im Prüfmodus erweitern

Die bestehende kompakte Mehrsegment-Timeline bleibt im Erklärmodus erhalten. Im
Prüfmodus erhält der untere Rahmen drei diskrete Zoomstufen:

### 9.1 Detail: ein Abschnitt

- Genau eine ausgewählte Phase oder die Konvektion füllt den Rahmen.
- Das große Siegel erhält eine flächige, langsam wachsende Fortschrittsfüllung.
- Name, Um-Spanne, reale Dauer und Fortschritt werden sichtbar angegeben.
- Klick auf ein Siegel in der Zyklusansicht öffnet diese Detailstufe und springt
  bewusst zu diesem Abschnitt.
- Vor/Zurück wechselt zum vorherigen beziehungsweise nächsten Abschnitt; über
  die Zyklusgrenze wird der Anschlusszyklus einmalig geladen.

### 9.2 Zyklus: genau ein Konvektionszyklus

- Alle Abschnitte eines ausgewählten 46.080-Um-Zyklus liegen im unteren Rahmen.
- Die linearen Breiten entsprechen ihren Um-Dauern; die letzten 400 Um werden
  nicht künstlich verbreitert.
- Der aktuelle Zyklus zeigt seinen Gesamtfortschritt und das aktive Siegel.
- Klick auf einen anderen Zyklus in der Übersicht macht diesen zum ausgewählten
  Zyklus, ohne einen Seed pro Bild neu zu erzeugen.

### 9.3 Folge: alle bereits geladenen Zyklen

- Rauszoomen zeigt alle in der aktuellen Seed-Folge bereits erzeugten oder durch
  Navigation angeforderten Zyklen direkt aneinander.
- Eine unendliche Folge wird nicht vorab in den DOM geschrieben. Weitere Zyklen
  werden beim Vorwärtsnavigieren deterministisch materialisiert.
- Jeder Zyklus erscheint als anklickbares Zyklussiegel mit Gesamtfüllstand und
  Konvektionsmarke.
- Reinzoomen auf ein Zyklussiegel öffnet die Ein-Zyklus-Ansicht; erneutes
  Reinzoomen auf ein Phasensiegel öffnet die Detailansicht.

### 9.4 Bedienung und Darstellung

- Echte `button`-Elemente für Reinzoomen, Rauszoomen, vorherigen und nächsten
  Abschnitt/Zyklus;
- klare `aria-label`-, `aria-current`- und Fokuszustände;
- Zoomstufe und ausgewählter Zyklus in der Live-Region ankündigen;
- die vorhandene Slider-Navigation bleibt erhalten und erhält modusabhängige
  Grenzen und zugängliche Zeittexte;
- die Fortschrittsfüllung liegt hinter Icon und Text und beeinträchtigt deren
  Kontrast nicht;
- responsive Darstellung ohne horizontalen Seiten-Scroll; nur der eingerahmte
  Track darf bei Bedarf intern scrollen.

Diese drei Stufen sind die konkrete Auslegung von „ein Siegel/ein Zyklus groß“
und „beim Rauszoomen alle Zyklen aneinander“.

## 10. Konvektion im Prüfmodus

Die linearen Grenzen werden nicht aus Prozentwerten geschätzt, sondern direkt
aus Um berechnet:

```text
Beginn: 45.680 Um * 5.000 ms = 228.400.000 ms = 63:26:40
Ende:   46.080 Um * 5.000 ms = 230.400.000 ms = 64:00:00
Dauer:     400 Um * 5.000 ms =   2.000.000 ms = 00:33:20
```

Während dieser Spanne:

- `motion === "convection"`;
- Sol und Yol sind in Orbit und Horizont unsichtbar;
- keine Annäherungs-, Kollisions- oder Verschmelzungsanimation;
- ZEHS behält seine normale Projektion;
- Era und absolute Weltzeit laufen weiter;
- vorhandene Einstrahlung darf nach dem bestehenden Hüllkurvenmodell weich
  auslaufen, neue Sonnenwirkung wird nicht aufgebaut.

## 11. Einstrahlung und Langzeit-Performance

Die aktuelle Vorberechnung alle 200 ms über sechs Minuten darf nicht unverändert
auf 64 Stunden hochskaliert werden. Das wären mehr als 1,15 Millionen Samples
pro Richtungs-/Breitenkombination.

Vorgesehene Lösung:

- Erklärmodus: vorhandene vorberechnete Hüllkurve beibehalten;
- Prüfmodus bei normaler Wiedergabe: Hüllkurve inkrementell aus dem echten
  Zeitdelta fortschreiben;
- Prüfmodus nach Seek, Richtungs- oder Breitenwechsel: Zustand deterministisch
  aus einem begrenzten Rückblickfenster rekonstruieren. Das Fenster umfasst
  mindestens Verzögerung plus mehrere Aufbau-/Abbau-Zeitkonstanten, statt den
  gesamten 64-Stunden-Zyklus zu sampeln;
- optionale grobe Checkpoints pro Abschnitt nur dann ergänzen, wenn Messungen
  zeigen, dass der begrenzte Rückblick nicht genügt;
- keine per-Frame-Neuerzeugung des Szenarios, der Timeline oder der Seedfolge.

## 12. Voraussichtlich betroffene Dateien

| Datei | Geplante Änderung |
| --- | --- |
| `phases.js` | beide Zeitprofile, Um-basierte Prüfparameter, neue Schema-Version |
| `app.js` | Weltuhr, Moduswechsel, analytische Prüfbewegung, Zyklusregister, Timeline-Zoom, formatierte Langzeitwerte |
| `index.html` | zugängliches Zeitmodus-Dropdown, dynamische Texte, Zoom- und Zyklusnavigation |
| `styles.css` | Dropdown-Kachel, drei Timeline-Zoomstufen, große Siegelfüllung, responsive Zustände |
| `README.md` | klare Trennung Erklär-/Prüfmodus, Zeitrechnung, Seedfolge und Bedienung |
| `tests/smoke.cjs` | dynamische Verträge und exakte Zeit-/Kontinuitätstests |
| `tests/visual-contract.cjs` | statischer UI-, Modus- und Timeline-Vertrag |
| optional neuer Test | fokussierter Vertrag für 5-s/Um-Zeitbasis und Ellipsen-Synchronität |

Die bereits vorhandenen Horizontänderungen in `README.md`, `index.html`,
`styles.css` und `tests/visual-contract.cjs` werden bei der Umsetzung erhalten
und nicht überschrieben.

## 13. Umsetzungsreihenfolge

1. Zeitprofile und reine Umrechnungsfunktionen ergänzen.
2. Tests für 5 s/Um, 64 Stunden und exakte Konvektionsgrenzen zunächst gegen die
   neue reine Zeitlogik schreiben.
3. Zustandsmodell auf `absoluteWorldUm`, `cycleIndex` und Zeitanker umstellen.
4. Prüfmodus-Bewegungsparameter und echten polaren Ellipsenwinkel implementieren.
5. Phasen- und Zyklusübergänge samt deterministischer Seedfolge absichern.
6. Modus-Dropdown und dynamische Beschriftungen anbinden.
7. Detail-/Zyklus-/Folgen-Timeline und Siegelfüllung implementieren.
8. Einstrahlung für lange Laufzeiten auf bounded lookback beziehungsweise
   inkrementelle Berechnung umstellen.
9. README, Metadaten und Erklärungstexte aktualisieren.
10. vollständige Regression, Diff-Prüfung und manuelle visuelle Kontrolle in
    beiden Themes und auf schmalen Ansichten.

## 14. Abnahmematrix

| Prüfung | Erwartung |
| --- | --- |
| Standard nach Laden | Sechs-Minuten-Zeitfahrt ist weiterhin verfügbar und als Erklärmodus erkennbar |
| Modus-Dropdown | Beide Modi sind per Maus und Tastatur auswählbar |
| 5 Sekunden bei 1× | exakt 1 Um und 360° Era-Drehung |
| 360 Sekunden bei 1× | exakt 72 Um, 0,15625 % Zyklusfortschritt, kein Zyklusende |
| 228.400 Sekunden | Beginn der Konvektion bei 45.680 Um |
| 230.400 Sekunden | Ende bei 46.080 Um beziehungsweise 64 Stunden |
| Konvektionsspanne | exakt 400 Um beziehungsweise 33:20; Sol/Yol in beiden Ansichten unsichtbar |
| Erklärmodus-Konvektion | weiterhin 32 Sekunden innerhalb der 6:00-Chronik |
| Synchron auf Ellipse | tatsächlicher polarer Sonnenwinkel bleibt relativ zu Era konstant |
| Auf Orbit stehend | Sonnenweltpunkt bleibt konstant, während Era rotiert |
| Asynchron/langsam | vorhandene seedgebundene Richtung und relative Geschwindigkeit bleiben unterscheidbar |
| Phasengrenze | kein Sprung in Winkel, Radialwert oder Intensität |
| Autozyklus aus | exakter Endzustand bleibt pausiert sichtbar |
| Autozyklus an | Zyklusnummer und absolute Weltzeit laufen weiter; kein Positionssprung |
| Seedfolge | derselbe Root-Seed und Zyklusindex ergeben denselben Plan; kein Zufall pro Frame |
| Moduswechsel | gleicher Zyklus, gleiche Um-Position und Phase; keine zufällige Neuauswahl |
| Timeline Detail | ein großes Siegel füllt sich proportional zur Abschnittszeit |
| Timeline Zyklus | genau ein linearer 46.080-Um-Zyklus im Rahmen |
| Timeline Folge | alle materialisierten Zyklen liegen lückenlos aneinander und sind anklickbar |
| Frame-Unabhängigkeit | identischer Zeitstempelverlauf ergibt bei verschiedenen Framefolgen denselben Zustand |
| Bestehende Projektionen | Orbit und Horizont verwenden weiterhin exakt denselben Weltpunkt |

## 15. Abschlussbedingung

Die Umsetzung ist erst abgeschlossen, wenn sowohl die schnelle sechsminütige
Erklärung als auch der 64-Stunden-Prüfmodus nebeneinander funktionieren, alle
oben genannten Zeitgrenzen automatisiert geprüft sind und weder an Phasen- noch
an Zyklusgrenzen ein unbeabsichtigter Sprung von Era, Sol oder Yol entsteht.
