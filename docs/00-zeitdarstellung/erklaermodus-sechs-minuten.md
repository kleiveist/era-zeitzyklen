---
title: Erklärmodus als Sechs-Minuten-Zeitfahrt
status: implemented
updated: 2026-09-01
---

<!-- AUTO-GENERATED:backlink START -->
[← Zurück](index.md)
<!-- AUTO-GENERATED:backlink END -->

# Erklärmodus als Sechs-Minuten-Zeitfahrt

## Zweck

Die Sechs-Minuten-Zeitfahrt zeigt einen vollständigen beispielhaften
Konvektionszyklus in einer für Menschen unmittelbar erfassbaren Dauer. Sie
veranschaulicht Phasenwechsel, Sol-/Yol-Läufe, Intensitäten und Konvektion und
bleibt deshalb der Standardmodus der Webseite.

Dieser Modus ist ausdrücklich **keine lineare Um-Uhr**. Eine Era-Rotation in
der Grafik entspricht hier nicht automatisch einem Um. Für eine lineare
Prüfung dient ausschließlich der
[5-Sekunden-Prüfmodus](pruefmodus-5-sekunden-pro-um.md).

## 1. Feste Darstellungszeiten

| Teil der Zeitfahrt | Erklärzeit bei 1× | Dargestellte Weltzeit |
|---|---:|---:|
| Reguläre Phasen | 5:28 = 328 Sekunden | 45.680 Um |
| Konvektion | 0:32 = 32 Sekunden | 400 Um |
| Vollständiger Zyklus | 6:00 = 360 Sekunden | 46.080 Um |

Die letzten 32 Sekunden sind bewusst für die Konvektion reserviert. Eine
vollständig lineare Stauchung auf sechs Minuten würde den 400 Um nur
3,125 Sekunden geben:

```text
360 Sekunden × 400 Um / 46.080 Um = 3,125 Sekunden
```

Diese kurze Spanne könnte die Konvektion kaum erklären. Die Zeitfahrt
vergrößert sie daher didaktisch auf 32 Sekunden und verteilt die verbleibenden
328 Sekunden auf die regulären Abschnitte.

## 2. Semantische Abschnittsverteilung

Der reproduzierbare Seed erzeugt einen Phasenplan. Jeder reguläre Abschnitt
besitzt eine Weltzeitspanne in Um und eine davon getrennte Erklärzeitspanne.
Lange Weltphasen erhalten grundsätzlich mehr Erklärzeit, werden aber
abgeflacht gewichtet, damit einzelne sehr lange Phasen die sechs Minuten nicht
vollständig beherrschen. Wechselnde Phasen werden leicht hervorgehoben und
jeder reguläre Abschnitt erhält eine sichtbare Mindestdauer.

Innerhalb eines einzelnen Abschnitts wird dessen Um-Bereich linear auf seine
zugeteilte Erklärzeit abgebildet. Zwischen verschiedenen Abschnitten kann der
Um-Durchsatz deshalb unterschiedlich sein. Nur Abschnittsgrenzen,
Reihenfolge, lokaler Weltzeitstand und das feste Ende bei 46.080 Um sind
verbindlich.

Folglich gibt es für einen beliebigen Wert wie 72 Um keine seedunabhängige
Erklärzeit. Feste Punkte sind dagegen:

- 0 Um bei `0:00`;
- 45.680 Um und Konvektionsbeginn bei `5:28`;
- 46.080 Um und Zyklusende bei `6:00`.

## 3. Illustrative Era-Rotation

Era rotiert im Erklärmodus mit 5,6° pro realer Sekunde bei 1×. Dieser Wert
dient der sichtbaren Vorschau und ist nicht die kanonische Regel
`360° pro Um`.

Über sechs Minuten entstehen damit:

```text
360 Sekunden × 5,6°/s = 2.016° = 5,6 sichtbare Rotationen
```

Der Erklärmodus behauptet also nicht, ein Zyklus bestehe aus 5,6 Um. Der
Kalender durchläuft weiterhin die hinterlegten 46.080 Um, während Eras
Vorschaurotation unabhängig und anschaulich langsam bleibt.

## 4. Sol, Yol und Konvektion

Sol und Yol folgen dem seedgebundenen illustrativen Phasenmodell. Synchrone,
langsame, stehende, asynchrone und wechselnde Zustände bleiben voneinander
unterschieden. Ihre Werte werden in Erklärsekunden ausgewertet und nicht aus
der linearen 5-s/Um-Geschwindigkeit übernommen.

Während `5:28–6:00` gilt:

- Sol ist in Orbit und Horizont unsichtbar;
- Yol ist in Orbit und Horizont unsichtbar;
- Era und die Zeitfahrt laufen weiter;
- der Weltzeitbereich steigt von 45.680 auf 46.080 Um;
- die Darstellung erfindet weder Kollision noch Verschmelzung.

## 5. Bedienung und Moduswechsel

Der Erklärmodus verwendet den kompakten Zeitpfad mit allen Phasensiegeln. Ein
Klick auf ein Siegel springt zum zugehörigen Abschnitt. Die drei
Langzeit-Zoomstufen des Prüfmodus werden hier nicht eingeblendet, da bereits
der gesamte Zyklus in sechs Minuten sichtbar ist.

Beim Wechsel in den Prüfmodus wird der aktuelle Um-Stand umgerechnet. Die
Wiedergabe pausiert während des Wechsels, Zyklus, Phase und Weltzeitpunkt
bleiben erhalten. Bei der Rückkehr wird derselbe Um-Stand wieder auf die
semantische Erklärzeit abgebildet.

Die gewählte Einstellung wird lokal als `era-time-mode` gespeichert. Die
Sechs-Minuten-Zeitfahrt bleibt der Standard, wenn keine gültige Auswahl
vorliegt.

## 6. Abgrenzung zum Prüfmodus

| Frage | Sechs-Minuten-Erklärmodus | 5-s/Um-Prüfmodus |
|---|---|---|
| Vollständiger Zyklus bei 1× | 6:00 | 64:00:00 |
| Beziehung zwischen Echtzeit und Um | abschnittsweise semantisch | überall linear |
| Era-Rotation | illustrativ 5,6°/s | kanonisch 360°/Um = 72°/s |
| Konvektion | didaktisch 0:32 | linear 0:33:20 |
| Zeitpfad | kompakte Phasenübersicht | Zyklusfolge, Zyklus und Detail |
| Hauptzweck | Phasen in einer Spielsitzung erklären | Zeitrechnung und Kontinuität exakt prüfen |

## 7. Abnahmekriterien

| Test | Erwartetes Ergebnis |
|---|---|
| Start ohne gespeicherte Auswahl | Erklärmodus ist aktiv |
| Vollständige Wiedergabe bei 1× | Ende exakt bei 6:00 |
| Zeitpunkt 5:28 | Beginn der 32-sekündigen Konvektion |
| Während der Konvektion | Sol und Yol unsichtbar, Era läuft weiter |
| Zyklusende ohne Autozyklus | Wiedergabe pausiert am Endpunkt |
| Moduswechsel | aktueller Um-Stand und aktive Phase bleiben erhalten |

Die konkrete Verteilung und Laufzeitsteuerung stehen in
[Technische Umsetzung der Zeitmodi](technische-umsetzung-zeitmodi.md).
