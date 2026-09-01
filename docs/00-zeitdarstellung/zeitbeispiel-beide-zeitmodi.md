---
title: Zeitbeispiel für beide Darstellungsmodi
status: accepted
updated: 2026-09-01
---

<!-- AUTO-GENERATED:backlink START -->
[← Zurück](index.md)
<!-- AUTO-GENERATED:backlink END -->

# Zeitbeispiel für beide Darstellungsmodi

Dieses Beispiel verfolgt denselben lokalen Konvektionszyklus vom Beginn bis
zum Ende. Es zeigt, welche Aussagen linear feststehen und welche im
Sechs-Minuten-Erklärmodus vom reproduzierbaren Phasenplan abhängen.

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

| Weltzeitpunkt | Prüfmodus bei 1× | Sechs-Minuten-Erklärmodus bei 1× |
|---|---:|---:|
| 0 Um | 0:00 | 0:00 |
| 1 Um | 0:05 | seed- und abschnittsabhängig |
| 72 Um | 6:00 | seed- und abschnittsabhängig |
| 45.680 Um | 63:26:40 | 5:28 |
| 46.080 Um | 64:00:00 | 6:00 |

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

## 4. Beispiel nach sechs realen Minuten

### Prüfmodus

```text
360 Sekunden / 5 Sekunden pro Um = 72 Um
72 Um / 46.080 Um = 0,15625 %
```

Der Prüfmodus befindet sich weiterhin nahe am Zyklusbeginn. Era hat 72 echte
Um-Rotationen vollzogen; die Konvektion liegt noch 45.608 Um entfernt.

### Erklärmodus

Nach denselben sechs realen Minuten ist der gesamte Beispielzyklus beendet:

- 46.080 Um wurden abschnittsweise dargestellt;
- die letzten 32 Sekunden zeigten die 400-Um-Konvektion;
- Era hat illustrativ 2.016° beziehungsweise 5,6 sichtbare Rotationen
  ausgeführt;
- diese 5,6 sichtbaren Rotationen sind keine Kalender-Um.

## 5. Beispiel der Konvektion

Im Prüfmodus beginnt sie nach 45.680 Um bei `63:26:40` und dauert bis
`64:00:00`. Im Erklärmodus beginnt derselbe Weltzeitabschnitt bei `5:28` und
endet bei `6:00`.

| Eigenschaft | Prüfmodus | Erklärmodus |
|---|---:|---:|
| Weltzeitspanne | 400 Um | 400 Um |
| Darstellungsdauer bei 1× | 33:20 | 0:32 |
| Sol sichtbar | nein | nein |
| Yol sichtbar | nein | nein |
| Era und Weltzeit laufen weiter | ja | ja |

## 6. Merksatz

> Derselbe Weltzeitpunkt kann in beiden Modi angezeigt werden, aber die
> verstrichene reale Darstellungszeit ist nur im Prüfmodus proportional zu Um.

Die Vertragsdetails stehen getrennt im
[Prüfmodus-Dokument](pruefmodus-5-sekunden-pro-um.md) und im
[Erklärmodus-Dokument](erklaermodus-sechs-minuten.md).
