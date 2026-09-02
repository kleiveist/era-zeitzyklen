---
title: Zeitrechnung auf Era
status: accepted
updated: 2026-09-02
---
<!-- AUTO-GENERATED:backlink START -->
[← Zurück](index.md)
<!-- AUTO-GENERATED:backlink END -->
# Zeitrechnung auf Era

## 1. Grundprinzip der Zeitmessung

Eras feste Zeitrechnung verwendet die Einheiten Um, Tan, Dir und Mohn. Sie
bleibt rechnerisch stabil, obwohl Sol und Yol unregelmäßig laufen und sichtbare
Licht- oder Dunkelphasen deshalb keine gleichmäßige Uhr bilden.

Sol definiert grundsätzlich den erlebten Tag, Yol grundsätzlich die erlebte
Nacht. Für die vollständige Rotation Eras dient zusätzlich ZEHS als annähernd
fester Himmelsbezug. Kalenderdauer, lokale Sonnenphase und sichtbare
Strahlungsintensität sind daher getrennte Angaben.

## 2. Zeiteinheiten

| Größe | Umrechnung |
|---|---:|
| 1 Um | 1 vollständige Eigenrotation Eras |
| 1 Tan | 16 Um |
| 1 Dir | 8 Tan = 128 Um |
| 1 Mohn | 36 Dir = 288 Tan = 4.608 Um |
| 1 Konvektionszyklus | 10 Mohn = 360 Dir = 2.880 Tan = 46.080 Um |

Die ältere Quellenzeile `1 Mohn = Konvektion` ist rechnerisch unvereinbar mit
dieser Zeitrechnung und gilt als verworfene Arbeitszeile, nicht als Kanon.

## 3. Umrechnung in irdische Maßstäbe

Für den irdischen Vergleich gilt:

| Era-Einheit | Irdischer Vergleich |
|---|---:|
| 1 Um | 1 Stunde 30 Minuten |
| 1 Tan | 24 Stunden = 1 Tag |
| 1 Dir | 192 Stunden = 8 Tage |
| 1 Mohn | 6.912 Stunden = 288 Tage, ungefähr 0,79 Jahre |
| 1 Konvektionszyklus | 69.120 Stunden = 2.880 Tage, ungefähr 7,9 Jahre |

Ein idealisiertes Um lässt sich in durchschnittlich 45 Vergleichsminuten
Hellphase und 45 Vergleichsminuten Dunkelphase teilen. Sol und Yol können die
tatsächlich sichtbaren Phasen jedoch verlängern, verkürzen oder überlagern.

## 4. Theoretische In-Game-Umrechnung

Bei der theoretischen Skalierung `1 Um = 1 reale Spielminute` ergibt sich:

| Era-Einheit | Reale Spielzeit |
|---|---:|
| 1 Um | 1 Minute |
| 1 Tan | 16 Minuten |
| 1 Dir | 128 Minuten = 2 Stunden und 8 Minuten |
| 1 Mohn | 4.608 Minuten = 76 Stunden und 48 Minuten = 3 Tage, 4 Stunden und 48 Minuten |
| 1 Konvektionszyklus | 46.080 Minuten = 768 Stunden = 32 Tage |

Diese Tabelle ist eine theoretische Umrechnung. Sie verpflichtet das Spiel
weder zu einer vollständig in Echtzeit simulierten Welt noch zu diesem
Balancing.

## 5. Datums- und Uhrzeitnotation

In der Dokumentation steht eine Zeitmenge als Zahl mit Einheit, zum Beispiel
`25 Tan`, `3 Dir und 1 Tan` oder `400 Um`. Zusammengesetzte Mengen werden von
der größten zur kleinsten Einheit notiert.

Für Kalender- oder Simulationsbeispiele gilt die lesbare Struktur:

`Mohn <M> · Dir <D> · Tan <T> · Um <U> · Sonnenphase: <Laufart> · S-Int <Wert>`

Die Platzhalter zeigen nur das Format und legen kein historisches Datum fest.
Eine überall verbindliche In-World-Epoche und die Frage, ob einzelne Kulturen
null- oder einsbasiert zählen, sind nicht freigegeben. Quellen müssen ihre
Zählweise deshalb kenntlich machen. Gelehrte können Datierungen
unterschiedlicher Herkunft nur vergleichen, wenn diese Angabe erhalten ist.

## 6. ZEHS als Referenzpunkt

ZEHS ist ein weit entfernter, sehr heller und annähernd fester Referenzstern.
Er befindet sich ungefähr 40 AU vom zentralen System entfernt. Sein Untergang
und erneuter Aufgang dienen als Bezug für eine vollständige Rotation Eras. Der
Name steht in Verbindung mit Zehsen.

Im lokalen Horizont verhält sich ZEHS nordsternartig: Am Polstand bei 0° steht
er am höchsten. Mit 30° und 60° äquatorwärtigem Versatz sinkt seine projizierte
Höhe, während Sol und Yol in derselben Auswahl höher steigen.

ZEHS ist Weltenlogik. Entfernung und Bewegung sind keine Verpflichtung zu
einer naturwissenschaftlich exakten astronomischen Simulation.

## 7. Verhältnis zur Konvektion

Der verlässliche große Konvektionszyklus umfasst 10 Mohn, 360 Dir, 2.880 Tan
oder 46.080 Um und entspricht ungefähr 7,9 irdischen Jahren.

Die Konvektion selbst dauert:

- 25 Tan;
- 3 Dir und 1 Tan;
- 400 Um;
- im irdischen Vergleich 600 Stunden beziehungsweise 25 Tage;
- bei der theoretischen In-Game-Skalierung 400 Minuten beziehungsweise
  6 Stunden und 40 Minuten.

Die kosmischen Bedingungen des Ereignisses beschreibt
[Zeitzyklen und Konvektion](zeitzyklen-und-konvektion.md).

## 8. Abgrenzung zwischen Lore-Zeit und tatsächlicher Spielzeit

Die Zeitrechnung definiert Weltenlogik und belastbare Umrechnungen. Gameplay
kann lange Zeiträume durch Weltzustände, Zeitsprünge, Storyereignisse oder
regionale Regeln darstellen. Weder ein Mohn noch ein Konvektionszyklus muss in
voller Echtzeit ablaufen. Auch kurze spielbare Zustände dürfen einen längeren
Lore-Zeitraum repräsentieren, solange die Dokumentation beide Ebenen klar
trennt.

Die Webseite verwendet davon getrennt einen linearen
[5-Sekunden-Prüfmodus](pruefmodus-5-sekunden-pro-um.md), eine lineare
[15-Minuten-Spielsimulation](zeitdarstellung-im-spiel.md) für die offene-Welt-
Grundgeschwindigkeit und eine schematische
[Sechs-Minuten-Zeitfahrt](erklaermodus-sechs-minuten.md). Keiner dieser Modi
ändert die kanonische Bedeutung eines Um.
