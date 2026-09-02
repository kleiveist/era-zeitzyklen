---
title: Zeitbeispiel für drei Darstellungsmodi
status: accepted
updated: 2026-09-02
---

<!-- AUTO-GENERATED:backlink START -->
[← Zurück](index.md)
<!-- AUTO-GENERATED:backlink END -->

# Zeitbeispiel für drei Darstellungsmodi

Dieses Beispiel verfolgt denselben lokalen Konvektionszyklus vom Beginn bis
zum Ende. Es zeigt, welche Aussagen linear feststehen und welche im
Sechs-Minuten-Erklärmodus vom reproduzierbaren Phasenplan abhängen. Die
Spielsimulation verwendet dabei die offene-Welt-Grundzeit von 15 Minuten pro
Um.

## 1. Gemeinsame Weltzeitpunkte

| Weltzeitpunkt | Kalenderdarstellung innerhalb des Beispiels | Anteil am Zyklus |
|---|---|---:|
| 0 Um | Mohn 0 · Dir 0 · Tan 0 · Um 0 | 0 % |
| 1 Um | Mohn 0 · Dir 0 · Tan 0 · Um 1 | ca. 0,00217 % |
| 72 Um | Mohn 0 · Dir 0 · Tan 4 · Um 8 | 0,15625 % |
| 45.680 Um | Mohn 9 · Dir 32 · Tan 7 · Um 0 | ca. 99,13194 % |
| 46.080 Um | Ende von Mohn 9 beziehungsweise Grenze zu Mohn 10 | 100 % |

Die Kalenderdarstellung ist hier ausdrücklich nullbasiert und lokal zum
Beispielzyklus. Sie legt keine historische Epoche fest.

## 2. Dieselben Punkte im Vergleich

| Weltzeitpunkt | Prüfmodus bei 1× | Spielsimulation bei 1× | Sechs-Minuten-Erklärmodus bei 1× |
|---|---:|---:|---:|
| 0 Um | 0:00 | 0:00 | 0:00 |
| 1 Um | 0:05 | 0:15:00 | seed- und abschnittsabhängig |
| 72 Um | 6:00 | 18:00:00 | seed- und abschnittsabhängig |
| 45.680 Um | 63:26:40 | 475 Tage · 20:00:00 | 5:28 |
| 46.080 Um | 64:00:00 | 480 Tage · 00:00:00 | 6:00 |

Warum fehlen bei 1 Um und 72 Um feste Erklärzeiten? Die regulären Abschnitte
teilen 328 Erklärsekunden anhand ihrer gewichteten Bedeutung untereinander
auf. Innerhalb eines Abschnitts ist die Zuordnung linear, zwischen den
Abschnitten jedoch nicht. Ein anderer Seed kann denselben Um-Wert deshalb an
einer anderen Erklärsekunde erreichen.

## 3. Beispiel nach fünf realen Sekunden

### Prüfmodus

```text
5 Sekunden / 5 Sekunden pro Um = 1 Um
1 Um × 360° = 360° Era-Rotation
```

Ergebnis: Die Weltzeit steht bei 1 Um, Era hat eine vollständige Rotation
vollzogen und der Zyklusfortschritt beträgt ungefähr 0,00217 %.

### Erklärmodus

```text
5 Sekunden × 5,6°/s = 28° illustrative Era-Rotation
```

Der erreichte Um-Wert hängt vom ersten Abschnitt des konkreten Phasenplans ab.
Aus den fünf Sekunden darf weder `1 Um` noch eine kanonische Rotationszahl
abgeleitet werden.

### Spielsimulation

```text
5 Sekunden / 900 Sekunden pro Um = 1/180 Um
```

Nach fünf Sekunden ist die offene-Welt-Grundsimulation erst um ungefähr
0,00556 Um fortgeschritten. Der Sonnen- und Weltwinkel gehört dennoch zum
gleichen linearen Um-Modell wie im Prüfmodus.

## 4. Beispiel nach sechs realen Minuten

### Prüfmodus

```text
360 Sekunden / 5 Sekunden pro Um = 72 Um
72 Um / 46.080 Um = 0,15625 %
```

Der Prüfmodus befindet sich weiterhin nahe am Zyklusbeginn. Era hat 72 echte
Um-Rotationen vollzogen; die Konvektion liegt noch 45.608 Um entfernt.

### Spielsimulation

```text
360 Sekunden / 900 Sekunden pro Um = 0,4 Um
```

Nach sechs Minuten sind in der offenen-Welt-Grundsimulation zwei Fünftel Um
vergangen. Die lange Laufzeit ist beabsichtigt; 6× verändert sie auf 1 Um pro
zwei Minuten und 30 Sekunden, ohne das Zeitmodell zu wechseln.

### Erklärmodus

Nach denselben sechs realen Minuten ist der gesamte Beispielzyklus beendet:

- 46.080 Um wurden abschnittsweise dargestellt;
- die letzten 32 Sekunden zeigten die 400-Um-Konvektion;
- Era hat illustrativ 2.016° beziehungsweise 5,6 sichtbare Rotationen
  ausgeführt;
- diese 5,6 sichtbaren Rotationen sind keine Kalender-Um.

## 5. Beispiel der Konvektion

Im Prüfmodus beginnt sie nach 45.680 Um bei `63:26:40` und dauert bis
`64:00:00`. In der Spielsimulation beginnt sie nach 475 Tagen und 20 Stunden
und endet nach 480 Tagen. Im Erklärmodus beginnt derselbe Weltzeitabschnitt bei
`5:28` und endet bei `6:00`.

| Eigenschaft | Prüfmodus | Spielsimulation | Erklärmodus |
|---|---:|---:|---:|
| Weltzeitspanne | 400 Um | 400 Um | 400 Um |
| Darstellungsdauer bei 1× | 33:20 | 4 Tage 4 Stunden | 0:32 |
| Sol sichtbar | nein | nein | nein |
| Yol sichtbar | nein | nein | nein |
| Era und Weltzeit laufen weiter | ja | ja | ja |

## 6. Merksatz

> Derselbe Weltzeitpunkt kann in allen drei Modi angezeigt werden. Die reale
> Darstellungszeit ist in Prüf- und Spielmodus proportional zu Um, im
> Erklärmodus dagegen abschnittsweise semantisch komprimiert.

Die Vertragsdetails stehen getrennt im
[Prüfmodus-Dokument](pruefmodus-5-sekunden-pro-um.md), im
[Spielzeit-Dokument](zeitdarstellung-im-spiel.md) und im
[Erklärmodus-Dokument](erklaermodus-sechs-minuten.md).
