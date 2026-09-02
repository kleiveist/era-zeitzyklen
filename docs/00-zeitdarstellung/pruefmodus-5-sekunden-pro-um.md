---
title: Prüfmodus mit 5 Sekunden pro Um
status: implemented
updated: 2026-09-01
---

<!-- AUTO-GENERATED:backlink START -->
[← Zurück](index.md)
<!-- AUTO-GENERATED:backlink END -->

# Prüfmodus mit 5 Sekunden pro Um

## Verbindliche Festlegung

Eine vollständige Eigenrotation Eras dauert im Prüfmodus bei
Wiedergabetempo 1× exakt fünf reale Sekunden. Die sichtbare Rotation entspricht
in diesem Modus tatsächlich einem Um; sie ist nicht nur ein Symbol für eine
unabhängig laufende Kalenderuhr.

> **5 Sekunden pro Um ergeben einen vollständigen Zyklus in 64 Stunden – nicht
> in sechs Minuten.**

Die [Sechs-Minuten-Zeitfahrt](erklaermodus-sechs-minuten.md) bleibt als
eigenständiger schematischer Erklärmodus bestehen.

## 1. Hochrechnung der Zeiteinheiten

Die feste Ordnung lautet 16 Um pro Tan, 8 Tan pro Dir, 36 Dir pro Mohn und
10 Mohn pro Konvektionszyklus. Ein Um entspricht kanonisch 90 irdischen
Vergleichsminuten.

| Era-Zeitraum | Um beziehungsweise Eigenrotationen | Kanonischer irdischer Vergleich | Reale Laufzeit im Prüfmodus bei 1× |
|---|---:|---:|---:|
| 1 Um | 1 | 1 Stunde 30 Minuten | 5 Sekunden |
| 1 Tan | 16 | 24 Stunden = 1 Tag | 1 Minute 20 Sekunden |
| 1 Dir | 128 | 192 Stunden = 8 Tage | 10 Minuten 40 Sekunden |
| 1 Mohn | 4.608 | 6.912 Stunden = 288 Tage | 6 Stunden 24 Minuten |
| 1 Konvektionszyklus | 46.080 | 69.120 Stunden = 2.880 Tage | 64 Stunden = 2 Tage 16 Stunden |

Alle Laufzeiten setzen ununterbrochene Wiedergabe bei 1× ohne Pause voraus.
Die auswählbaren Wiedergabefaktoren beschleunigen oder verlangsamen nur die
reale Abspielzeit; die Zuordnung von Weltzeit, Kalender und Bewegung bleibt
unverändert.

Nach sechs realen Minuten bei 1× sind im Prüfmodus erst 72 Um vergangen:

```text
360 Sekunden / 5 Sekunden pro Um = 72 Um
72 / 46.080 = 0,0015625 = 0,15625 %
```

## 2. Lage und Dauer der Konvektion

Die Konvektion ist kein zusätzlich an den Zyklus angehängter Zeitraum. Sie
bildet dessen letzte 400 Um.

| Ereignis | Zeitpunkt im Zyklus | Reale Laufzeit ab Zyklusbeginn bei 1× |
|---|---:|---:|
| Zyklusbeginn | 0 Um | 0:00 |
| Beginn der Konvektion | 45.680 Um | 63:26:40 |
| Ende der Konvektion und des Zyklus | 46.080 Um | 64:00:00 |

Die Konvektion dauert im Prüfmodus 2.000 Sekunden beziehungsweise 33 Minuten
20 Sekunden:

$$
400\ \text{Um} \times 5\ \text{Sekunden} = 2.000\ \text{Sekunden}
$$

Während der gesamten Konvektion sind Sol und Yol in Orbit- und Horizontansicht
unsichtbar. Era rotiert weiter und die Weltzeit bleibt aktiv. Die Darstellung
zeigt ausdrücklich kein Zusammenlaufen, Zusammenstoßen oder Verschmelzen der
beiden Sonnen. `Konvergenz` ist lediglich eine ältere
Dokumentationsbezeichnung.

## 3. Eine gemeinsame Weltzeit

Era, Sol, Yol, Kalender und beide Ansichten werden aus demselben
Simulationszeitpunkt berechnet.

| System | Regel im Prüfmodus |
|---|---|
| Weltzeit | Bei 1× vergehen pro realer Sekunde exakt 0,2 Um. |
| Era-Rotation | 360° pro Um beziehungsweise 72° pro realer Sekunde bei 1×; der vorhandene Drehsinn bleibt bestehen. |
| Kalender | Um, Tan, Dir und Mohn werden ausschließlich aus der Weltzeit abgeleitet. |
| Zyklusfortschritt | Vergangene lokale Um geteilt durch 46.080. |
| Sol und Yol | Position, Laufzustand, Intensität und Sichtbarkeit stammen aus Weltzeit und gespeichertem Phasenplan. |
| Orbit und Horizont | Beide verwenden denselben Weltpunkt; nur Projektion und Blickrichtung unterscheiden sich. |

`Zyklusfortschritt` ist weder Sonnenwinkel noch Sonnenphase oder
Strahlungsintensität. Ein unkommentierter Ausdruck wie `C-Stand` darf diese
Werte nicht miteinander gleichsetzen.

## 4. Laufzustände von Sol und Yol

Die kanonische Zeitordnung legt keine pauschale Umlaufdauer Sols oder Yols pro
Um, Mohn oder Zyklus fest. Der reproduzierbare Phasenplan behält seine
unterschiedlichen Laufarten.

| Sonnenzustand | Verbindliches Verhalten im Prüfmodus |
|---|---|
| Synchroner Grundlauf | Die betreffende Sonne folgt demselben Drehsinn und derselben tatsächlichen Winkelgeschwindigkeit wie Era: 360°/Um. |
| Stehend synchron | Ohne zusätzliche Relativbewegung bleibt der Richtungswinkel zur mitrotierenden Oberfläche konstant. |
| Auf der Umlaufbahn stehende Sonne | Der Weltpunkt bleibt fest, während Era weiterrotiert. Dieser Zustand ist nicht `stehend synchron`. |
| Langsamer Lauf | Das gespeicherte illustrative Bewegungsverhältnis bleibt erhalten. Phasennamen begründen keine neue exakte Umlaufdauer. |
| Asynchroner Lauf | Der vorgesehene Gegenlauf bleibt erhalten; er wird nicht auf Eras Drehsinn gezwungen. |
| Wechselnde Phase | Der seedgebundene Phasenplan wird reproduzierbar ausgewertet und nicht pro Bild neu gewürfelt. |
| Konvektion | Sol und Yol sind unsichtbar; Era und Weltzeit laufen ohne Rücksetzung weiter. |

Für die relative Winkelbewegung gilt:

$$
\omega_{\text{relativ}} = \omega_{\text{Sonne}} - \omega_{\text{Era}}
$$

Bei gleicher tatsächlicher Winkelgeschwindigkeit ist die Differenz null. Auf
elliptischen Bahnen ist dafür der polare Richtungswinkel des Weltpunkts
maßgeblich. Ein bloß gleich schnell veränderter Ellipsenparameter garantiert
noch keinen Gleichlauf.

## 5. Phasen- und Zykluswechsel

| Übergang | Verhalten |
|---|---|
| Neue reguläre Phase | Sie schließt an Winkel, radialen Zustand und Intensität des Vorgängers an. Bewegungsparameter dürfen sich ändern, der Weltpunkt springt nicht willkürlich. |
| Beginn der Konvektion | Beide Sonnen werden ausgeblendet; Era rotiert weiterhin einmal in fünf Sekunden. |
| Zyklusende ohne Autozyklus | Die Wiedergabe pausiert exakt am Endpunkt und zeigt den abgeschlossenen Zyklus. |
| Zyklusende mit Autozyklus | Die Nummer des Konvektionsabschlusses steigt und der nächste reproduzierbare Phasenplan schließt am erreichten Zustand an. |
| Folgeseed | Er wird einmalig aus Root-Seed und der Nummer des Konvektionsabschlusses abgeleitet und gespeichert, nicht pro Bild neu erzeugt. |
| Neuer Zyklus | Nur der lokale Zyklusfortschritt beginnt bei null. Absolute Weltzeit und erreichte Positionen bleiben stetig. |

Ein neuer Zyklus muss Sol und Yol daher nicht an die Ausgangspunkte des ersten
Zyklus zurücksetzen. Die große Zyklusdauer ist verlässlich; die konkrete
Phasenfolge bleibt eine reproduzierbare Beispielsimulation.

## 6. Zeitpfad und Navigation

Nur der Prüfmodus stellt die lineare Langzeitstruktur in drei Zoomstufen dar:

| Zoomstufe | Inhalt |
|---|---|
| Zyklusfolge | Alle bereits erzeugten Anschlusszyklen stehen nebeneinander. |
| Zyklus | Ein vollständiger Zyklus aus 46.080 Um wird gezeigt. |
| Abschnitt | Ein einzelnes Phasen- oder Konvektionssiegel wird groß dargestellt und füllt sich von links nach rechts mit seinem Fortschritt. |

Ein Klick auf einen Zyklus öffnet ihn. Vor- und Zurücknavigation materialisiert
benötigte Anschlusszyklen reproduzierbar. Das Herauszoomen kehrt zur
Zyklusfolge zurück. In der Zyklus- und Abschnittsansicht kann der Zeitstand mit
gedrückter Maustaste oder per Finger durch horizontales Ziehen feinjustiert
werden. Eine kleine Bewegungsschwelle trennt diese Geste vom normalen Klick;
beim Ziehen pausiert eine laufende Wiedergabe am gewählten Stand.

## 7. Abnahmekriterien

| Test | Erwartetes Ergebnis |
|---|---|
| Nach 5 Sekunden bei 1× | 1 Um und genau eine vollständige Era-Rotation |
| Nach 6 Minuten bei 1× | 72 Um und 0,15625 % Zyklusfortschritt |
| Bei 45.680 Um beziehungsweise 63:26:40 | Beginn der Konvektion; Sol und Yol unsichtbar |
| Bei 46.080 Um beziehungsweise 64:00:00 | Zyklus einschließlich Konvektion vollständig beendet |
| Reguläre Phasengrenze | Kein willkürlicher Winkel- oder Weltpunktsprung |
| Automatischer Anschluss | Absolute Weltzeit sowie Era-, Sol- und Yol-Zustände bleiben stetig |

Die konkrete Codeabbildung und die zuständigen Regressionstests beschreibt
[Technische Umsetzung der Zeitmodi](technische-umsetzung-zeitmodi.md).
