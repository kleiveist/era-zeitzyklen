# Era – Zeitzyklen von Sol und Yol

Eine eigenständige HTML/CSS/JavaScript-Visualisierung der Zeitzyklen auf Era. Der
70.000-Um-Großzyklus kann auf drei oder sechs Minuten verdichtet werden. Alle dokumentierten
Sonnenlauf-Vorlagen kommen in jedem erzeugten Szenario mindestens einmal vor;
weitere Wiederholungen, Reihenfolge, Geschwindigkeiten und S-Int-Verläufe werden
aus einem reproduzierbaren Seed erzeugt.

Die Oberfläche ist als illuminierte Fantasy-Chronik gestaltet: Jede der 18 Phasen
besitzt ein eigenes SVG-Siegel, die Zeitlinie wiederholt diese Bildsprache und ein
Schalter wechselt zwischen **Hellem Pergament** und **Dunkler Chronik**. Die gewählte
Darstellung bleibt lokal im Browser gespeichert.

## Start

`index.html` kann direkt im Browser geöffnet werden. Für eine lokale HTTP-Vorschau:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` öffnen.

## Bedienung

- Mit **Abspielen** läuft der vollständige Erklärzyklus wahlweise in 3:00 oder 6:00 Minuten.
- Die **Phasenbibliothek** springt zur nächsten Instanz einer ausgewählten Vorlage.
- Die 18 **Zyklus-Siegel** erlauben denselben Sprung direkt über ein Symbol.
- Die klickbare Zeitlinie und der Regler erlauben direkte Sprünge.
- Ein **Seed** erzeugt immer wieder dieselbe Phasenfolge und dieselben Bewegungswerte.
- **Neu würfeln** erzeugt einen anderen Seed.
- 1×, 1,5×, 2× und 4× verändern nur das Wiedergabetempo; das Zeitmodell bleibt gleich.
- **Helles Pergament / Dunkle Chronik** schaltet das vollständige Fantasy-Farbsystem um.

## Zeitmodell

Kanonische Eckwerte:

```text
1 Tan  = 20 Um
1 Dir  = 200 Um
1 Mohn = 7.000 Um
1 Großzyklus = 70.000 Um
1 Konvektion = 400 Um
```

Eine lineare Abbildung würde der Konvektion in einem dreiminütigen Film nur rund
eine Sekunde geben. Die Simulation nutzt deshalb eine semantische, stückweise
Zeitabbildung: In der 3-Minuten-Fassung sind 16 Sekunden, in der 6-Minuten-Fassung
32 Sekunden für die Konvektion reserviert. Die aktuelle Era-Zeit wird innerhalb
jedes Abschnitts weiterhin korrekt zwischen dessen Um-Grenzen interpoliert.

Die konkrete Phasenfolge ist kein kanonisches historisches Datum. Sie dient als
deterministische Beispielsimulation.

## Zufallsalgorithmus

`app.js` normalisiert den Seed und bildet ihn mit FNV-1a auf einen 32-Bit-Wert ab.
Ein Mulberry32-Generator erzeugt den Ereignisplan. Separate gehashte Zufallsströme
bestimmen Bewegungsparameter und S-Int, sodass derselbe Seed und dieselbe
Darstellungszeit denselben Zustand liefern.

Der Ereignisplan enthält:

1. jede reguläre Vorlage mindestens einmal;
2. 12 bis 18 zusätzliche, gewichtete Wiederholungen;
3. besonders häufig wechselnde Phasen als Meta-Regime;
4. eine feste Konvektion über die letzten 400 Um.

Die Bewegung wird analytisch aus `Seed + Abschnitt + Darstellungszeit` berechnet.
Sie hängt nicht von der Bildrate oder dem vorherigen Navigationsweg ab.

## Dateien

```text
index.html       Oberfläche und semantische Struktur
styles.css       responsives Layout und visuelle Gestaltung
phases.js        kanonische Phasenvorlagen plus illustrative Wertebereiche
app.js           Seed, Ereignisplan, Zeitabbildung, Animation und Interaktion
assets/fonts/     lokal eingebettete, offen lizenzierte Chronikschrift
tests/smoke.cjs  DOM-unabhängiger Smoke-Test für Vorlagen, Sprünge und Grenzen
.github/         optionale GitHub-Pages-Veröffentlichung
```

Der Smoke-Test läuft ohne zusätzliche Pakete und prüft zusätzlich alle 18 Siegel,
beide Zeitfassungen und den Theme-Schalter:

```bash
node tests/smoke.cjs
```

## GitHub Pages

Das enthaltene Workflow-File veröffentlicht den statischen Ordner bei einem Push
auf `main`. Im Repository unter **Settings → Pages** als Quelle **GitHub Actions**
auswählen. Es gibt keinen Build-Schritt und keine externen Laufzeitabhängigkeiten.

## Grenzen der Darstellung

- Die Himmelsansicht ist schematisch und keine naturwissenschaftlich exakte Umlaufbahn.
- ZEHS bleibt ein visueller Referenzpunkt; eine numerische Era-Rotationsdauer wird nicht erfunden.
- Während der Konvektion sind Sol und Yol unsichtbar. `S-Int 0` wird nicht verwendet,
  da die dokumentierte Skala bei 1 beginnt.
- Polare Besonderheiten sind Lore-Kontext, aber kein eigener Sonnenlauf und daher
  nicht als Phasenvorlage modelliert.
