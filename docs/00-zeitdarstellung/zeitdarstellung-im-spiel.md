---
title: Zeitdarstellung im Spiel
status: proposed
updated: 2026-09-01
---
<!-- AUTO-GENERATED:backlink START -->
[← Zurück](index.md)
<!-- AUTO-GENERATED:backlink END -->
# Zeitdarstellung im Spiel

> **Status:** Vorgeschlagene verbindliche Arbeitsfassung
> **Geltungsbereich:** Spielmechanik und Simulation
> **Abgrenzung:** Die kanonische Umrechnung der Era-Zeit wird in einem getrennten Dokument beschrieben.

## 1. Ziel

Die Spielzeit soll drei Anforderungen gleichzeitig erfüllen:

1. Der Wechsel zwischen Hell-, Dunkel- und Mischphasen von Sol und Yol muss während normaler Spielsitzungen erlebbar sein.
2. Ein vollständiger Konvektionszyklus soll innerhalb eines umfangreichen Rollenspiels erreichbar bleiben.
3. Es darf keine automatisch eingefügte Erzählzeile wie „mehrere Monate später“ geben.

Daher verwendet das Spiel **keine einheitliche Zeitgeschwindigkeit**. Stattdessen wird die Weltzeit abhängig von Ort und Spielerhandlung unterschiedlich stark beschleunigt.

## 2. Bezug zur kanonischen Zeit

Für die Welt von Era gilt:

| Kanonische Größe              | Bedeutung                            |
| ----------------------------- | ------------------------------------ |
| 1 Um                          | 90 irdische Vergleichsminuten        |
| 1 Um                          | eine vollständige Eigenrotation Eras |
| durchschnittliche Hellphase   | 45 irdische Vergleichsminuten        |
| durchschnittliche Dunkelphase | 45 irdische Vergleichsminuten        |

Die genaue Beleuchtung hängt zusätzlich von der Stellung von Sol und Yol ab. Hell- und Dunkelphase müssen daher nicht immer exakt gleich lang oder gleich stark sein.

Die kanonische Zeit legt fest, **wie viel Zeit in der Welt vergeht**. Die Spielzeitskalierung legt fest, **wie schnell der Spieler diesen Zeitraum erlebt**.

### Abgrenzung zur Demonstrationswebseite

Die in diesem Dokument beschriebenen Gameplay-Faktoren sind ein eigenständiges
Balancing-Modell. Sie sind weder der lineare
[5-Sekunden-Prüfmodus](pruefmodus-5-sekunden-pro-um.md) noch der schematische
[Sechs-Minuten-Erklärmodus](erklaermodus-sechs-minuten.md) der Webseite. Die
drei Darstellungsformen teilen dieselbe kanonische Einheit, dürfen aber nicht
als gegenseitige Laufzeitversprechen gelesen werden.

## 3. Grundprinzip: keine Handlungssprünge

Das Spiel verwendet keine automatischen Handlungssprünge.

Zwischen zwei Hauptaufgaben dürfen nicht ohne Spielerhandlung plötzlich mehrere Tan, Dir oder Mohn vergehen. Jede verstrichene Zeiteinheit entsteht durch einen nachvollziehbaren Vorgang:

* aktive Erkundung,
* Aufenthalt in Gebäuden oder Dungeons,
* Kampf und Dialog,
* Schnellreise,
* Schlaf,
* Rast,
* Warten,
* eine vom Spieler gewählte Langzeitbeschäftigung.

Auch stark beschleunigte Zeit bleibt Teil der Simulation. Die Weltuhr läuft weiter und alle betroffenen Systeme werden berechnet. Dazu gehören insbesondere:

* Stellung von Sol und Yol,
* Beleuchtung und Wetter,
* NPC-Tagesabläufe,
* Händlerbestände,
* Pflanzenwachstum,
* Bau- und Herstellungsprozesse,
* Heilung und Erschöpfung,
* Questfristen,
* Weltzustände,
* Übergänge zwischen Um, Tan, Dir, Mohn und Konvektionsphasen.

Ein beschleunigter Weltlauf ist deshalb **kein erzählerischer Sprung**, sondern eine vom Spieler ausgelöste und jederzeit unterbrechbare Simulationsbeschleunigung.

## 4. Grundgeschwindigkeit

Die normale Zeitgeschwindigkeit der offenen Welt lautet:

`1 Um = 30 reale Spielminuten`

Damit gilt während gewöhnlicher Erkundung:

| Zeitraum                      | Reale Spielzeit |
| ----------------------------- | --------------: |
| durchschnittliche Hellphase   |      15 Minuten |
| durchschnittliche Dunkelphase |      15 Minuten |
| 1 Um                          |      30 Minuten |
| 1 Tan = 16 Um                 |       8 Stunden |
| 1 Dir = 8 Tan                 |      64 Stunden |

Diese lineare Grundgeschwindigkeit wird nicht für alle Spielsituationen verwendet. Größere Zeiträume werden durch räumliche und aktionsabhängige Beschleunigung bewältigt.

## 5. Raumabhängige Zeitsteuerung

Der Aufenthaltsort bestimmt die normale Zeitgeschwindigkeit, solange keine besondere Aktion wie Schlafen oder Schnellreise aktiv ist.

| Spielsituation                              | Faktor gegenüber der offenen Welt |            Reale Zeit für 1 Um | Zweck                                                          |
| ------------------------------------------- | --------------------------------: | -----------------------------: | -------------------------------------------------------------- |
| Offene Welt und Außenbereiche               |                              1,0× |                     30 Minuten | lesbarer Tag-Nacht-Wechsel und ruhige Erkundung                |
| Siedlungen und belebte Außenbereiche        |                              1,0× |                     30 Minuten | NPC-Abläufe bleiben nachvollziehbar                            |
| Häuser, Räume und gewöhnliche Innenbereiche |                              1,5× |                     20 Minuten | Innenaufenthalte stellen mehr verstrichene Alltagszeit dar     |
| Höhlen, Ruinen und kleine Gefahrenbereiche  |                             1,75× | ungefähr 17 Minuten 9 Sekunden | Erkundung, Klettern und Vorsicht benötigen kanonisch mehr Zeit |
| Große Dungeons und unterirdische Komplexe   |                              2,0× |                     15 Minuten | längere Expeditionen wirken auch in der Weltzeit bedeutsam     |

Beim Wechsel zwischen zwei Bereichen wird die Geschwindigkeit über mehrere Sekunden weich angeglichen. Dadurch entstehen keine sichtbaren Sprünge der Sonne, Schatten oder Weltuhr.

Die räumlichen Faktoren werden **nicht miteinander multipliziert**. Es gilt immer nur der Faktor des aktuell aktiven Bereichs.

## 6. Aktionsabhängige Zeitsteuerung

Besondere Spielerhandlungen überschreiben vorübergehend die räumliche Zeitgeschwindigkeit.

| Mechanismus                                | Zeitsteuerung                      | Reale Darstellung              | Wichtige Regeln                                                         |
| ------------------------------------------ | ---------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Normale Bewegung und Erkundung             | Faktor des aktuellen Bereichs      | vollständig spielbar           | Standardzustand                                                         |
| Kampf                                      | 50 % des aktuellen Bereichsfaktors | kein Stillstand der Weltzeit   | verhindert zu schnelle Lichtwechsel während langer Kämpfe               |
| Gesprochener Dialog                        | 50 % des aktuellen Bereichsfaktors | Zeit läuft langsam weiter      | während einer offenen Antwortauswahl pausiert die Weltzeit              |
| Inventar, Kodex, Optionen und Pausenmenü   | pausiert                           | keine Weltzeit vergeht         | langsames Lesen oder Sortieren wird nicht bestraft                      |
| Handel und gewöhnliche Benutzeroberflächen | pausiert                           | keine Weltzeit vergeht         | der eigentliche Handel kann anschließend eine berechnete Dauer auslösen |
| Herstellen, Kochen und Reparieren          | berechnete Arbeitsdauer            | beschleunigte Arbeitsanimation | Dauer hängt vom Rezept und Werkzeug ab                                  |
| Schnellreise                               | adaptiv 60× bis 600×               | 1 Um dauert 30 bis 3 Sekunden  | Route wird vollständig simuliert und kann unterbrochen werden           |
| Kurzes Warten                              | 900×                               | 1 Um dauert 2 Sekunden         | nur an sicheren Positionen                                              |
| Schlafen                                   | 1.800×                             | 1 Um dauert 1 Sekunde          | Dauer, Sicherheit und Schlafqualität werden berücksichtigt              |
| Langzeitbeschäftigung                      | 28.800×                            | 1 Tan dauert 1 Sekunde         | nur an geeigneten sicheren Orten und mit gewählter Tätigkeit            |

Aktionsfaktoren werden niemals mit Schnellreise, Schlafen oder Langzeitbeschäftigung gestapelt. Es gilt immer genau ein aktiver Hauptzustand.

## 7. Priorität der Zeitmechanismen

Damit keine unbeabsichtigten Extremwerte entstehen, gilt folgende Priorität:

1. Pausenmenü und pausierende Benutzeroberflächen
2. Langzeitbeschäftigung
3. Schlafen
4. Warten
5. Schnellreise
6. Kampf oder Dialog
7. Zeitfaktor des aktuellen Bereichs

Ein Zustand mit höherer Priorität ersetzt alle darunterliegenden Zeitfaktoren.

Beispiel: Beginnt während einer Schnellreise ein Zufallsereignis, endet die Reisebeschleunigung. Für die anschließende Erkundung oder den Kampf gilt wieder der Faktor des aktuellen Ortes.

## 8. Schnellreise

Schnellreise teleportiert den Spieler nicht. Sie beschleunigt eine tatsächlich berechnete Reise entlang einer gültigen Route.

Die kanonische Reisedauer hängt mindestens von folgenden Größen ab:

| Einfluss             | Wirkung                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| Streckenlänge        | erhöht die Reisedauer                                                      |
| Gelände              | Straßen sind schneller als Gebirge, Sumpf oder Schnee                      |
| Wetter               | Sturm, Eis, Hitze oder starker Regen können verlangsamen                   |
| Transportmittel      | Reittier, Wagen, Schiff oder besondere Reisemittel verändern das Tempo     |
| Gepäck und Belastung | schwere Lasten können die Reise verlängern                                 |
| Begleiter            | verletzte oder langsame Gruppenmitglieder beeinflussen die Geschwindigkeit |
| Gefahrenlage         | feindliche Gebiete erhöhen das Risiko einer Unterbrechung                  |

Der Spieler sieht während der Schnellreise mindestens:

* die aktuelle Route,
* die bereits verstrichene Weltzeit,
* die erwartete Ankunftszeit,
* den aktuellen Tan, Dir und Mohn,
* Veränderungen von Sol und Yol,
* wichtige Wetter- und Weltzustände.

Schnellreise wird automatisch unterbrochen durch:

* einen Kampf oder Hinterhalt,
* eine blockierte Route,
* eine wichtige Entdeckung,
* eine kritische Zustandsänderung,
* einen vom Spieler gesetzten Zwischenhalt,
* das Erreichen des Ziels.

Die bis zur Unterbrechung verstrichene Zeit bleibt vollständig bestehen.

## 9. Schlafen

Schlafen ist eine körperliche Aktion und kein Handlungssprung.

Der Spieler wählt eine Schlafdauer in Um. Als übliche vollständige Ruhephase gelten abhängig von Spezies, Zustand und Umgebung ungefähr vier bis sechs Um.

| Schlafdauer | Kanonischer Vergleich | Reale Darstellung |
| ----------- | --------------------: | ----------------: |
| 1 Um        |   1 Stunde 30 Minuten |         1 Sekunde |
| 4 Um        |             6 Stunden |        4 Sekunden |
| 6 Um        |             9 Stunden |        6 Sekunden |
| 8 Um        |            12 Stunden |        8 Sekunden |

Während des Schlafs werden alle Weltprozesse fortgeführt. Der Schlaf kann durch Gefahr, Wetter, Krankheit, Lärm, ein wichtiges Ereignis oder einen festgelegten Weckzeitpunkt beendet werden.

Schlafen ist nur möglich, wenn der Charakter eine geeignete Ruheposition erreicht. Die Qualität des Schlafplatzes beeinflusst Regeneration, Krankheiten, Erschöpfung und mögliche Unterbrechungen.

## 10. Warten

Warten dient kurzen, gezielten Zeitüberbrückungen. Es darf nicht verwendet werden, während unmittelbare Gefahr besteht.

Mögliche Ziele sind:

* bis zu einer bestimmten Stellung von Sol oder Yol,
* bis zum Beginn der nächsten Hell- oder Dunkelphase,
* bis zur Öffnung eines Geschäfts,
* bis zur Rückkehr einer Person,
* für eine frei gewählte Anzahl Um,
* bis zum Abschluss eines kurzen Herstellungs- oder Bauvorgangs.

Beim kurzen Warten gilt:

`1 Um = 2 reale Sekunden`

Vor dem Start zeigt das Spiel die erwartete Zielzeit und alle bekannten Folgen. Warten wird unterbrochen, sobald ein relevantes Ereignis eintritt.

## 11. Langzeitbeschäftigung und beschleunigter Weltlauf

Ein vollständiger Konvektionszyklus umfasst 46.080 Um. Bei ausschließlich normaler Erkundung würde seine Darstellung zu lange dauern. Deshalb kann der Spieler an geeigneten sicheren Orten eine Langzeitbeschäftigung beginnen.

Eine Langzeitbeschäftigung ist keine leere Wartefunktion. Der Charakter führt währenddessen eine gewählte Tätigkeit aus, beispielsweise:

* trainieren,
* forschen,
* ein Handwerk ausüben,
* eine Siedlung verwalten,
* ein Bauprojekt betreuen,
* eine Verletzung ausheilen,
* Pflanzen anbauen,
* Handel treiben,
* ein umfangreiches Werk herstellen,
* einen Begleiter ausbilden.

Für diesen Zustand gilt:

| Verstrichene Era-Zeit         | Reale Simulationszeit |
| ----------------------------- | --------------------: |
| 1 Tan = 16 Um                 |             1 Sekunde |
| 1 Dir = 8 Tan                 |            8 Sekunden |
| 1 Mohn = 36 Dir               | 4 Minuten 48 Sekunden |
| 1 Konvektionszyklus = 10 Mohn |            48 Minuten |

Obwohl die Darstellung stark beschleunigt wird, verarbeitet die Simulation jeden Um. Grafische Tag-Nacht-Wechsel dürfen dabei zusammengefasst dargestellt werden, damit kein schnelles Flackern entsteht. Die Weltlogik verwendet dennoch die vollständige Zeitfolge.

Der Langzeitlauf stoppt automatisch bei:

* einem Mohn- oder Phasenwechsel,
* einem wichtigen Weltereignis,
* einer Bedrohung am Aufenthaltsort,
* dem Abschluss der gewählten Tätigkeit,
* fehlenden Vorräten oder Werkzeugen,
* einer kritischen Nachricht,
* einer Questfrist,
* einem vom Spieler festgelegten Zeitpunkt.

Der Spieler kann die Beschleunigung jederzeit manuell beenden.

## 12. Zeit in Dungeons

In großen Dungeons gilt grundsätzlich:

`1 Um = 15 reale Spielminuten`

Dadurch vergeht während einer einstündigen Dungeon-Erkundung ungefähr vier Um. Das entspricht sechs kanonischen Vergleichsstunden.

Diese Beschleunigung bildet ab, dass folgende Tätigkeiten in der Darstellung verkürzt werden:

* vorsichtiges Absuchen von Wegen,
* Klettern und Überwinden von Hindernissen,
* Öffnen und Sichern schwerer Türen,
* Untersuchen von Räumen,
* Orientieren in Dunkelheit,
* Versorgen kleiner Verletzungen,
* kurze nicht dargestellte Ruhepausen.

Im Kampf wird der Dungeonfaktor halbiert. Während eines Kampfes gilt daher:

`1 Um = 30 reale Spielminuten`

Beim Verlassen des Dungeons zeigt die Außenwelt exakt den inzwischen erreichten Zustand. Sol, Yol, Wetter, NPCs und Questzeiten werden nicht auf den Eintrittszeitpunkt zurückgesetzt.

## 13. Darstellung langer Zeiträume

Bei sehr hoher Beschleunigung darf nicht jede Rotation als vollständiger schneller Sonnenumlauf gerendert werden. Stattdessen verwendet die Darstellung:

* langsam überblendende Lichtfarben,
* Himmelsbahnen oder Zeitspuren von Sol und Yol,
* eine beschleunigte Kalenderanzeige,
* Wetter- und Wolkenübergänge,
* zusammengefasste Aktivitätsanimationen,
* sichtbare Fortschritte an Bauwerken, Pflanzen und Werkstücken.

Die Simulation bleibt exakt. Nur die grafische Darstellung wird geglättet.

## 14. Benutzeroberfläche

Die Zeitanzeige muss jederzeit erkennen lassen:

| Anzeige          | Inhalt                                                          |
| ---------------- | --------------------------------------------------------------- |
| aktuelle Einheit | Um, Tan, Dir und Mohn                                           |
| Konvektionsphase | aktuelle Phase und Fortschritt                                  |
| Himmelszustand   | Stellung und Einfluss von Sol und Yol                           |
| Zeitmodus        | normal, Dungeon, Kampf, Reise, Schlaf, Warten oder Langzeitlauf |
| Zeitfaktor       | aktuelle Beschleunigung                                         |
| Vorschau         | erwartete Zielzeit vor Schlaf, Reise oder Warten                |
| Unterbrechungen  | Grund, Zeitpunkt und Folgen einer gestoppten Beschleunigung     |

Es darf keine versteckte Zeitbeschleunigung geben. Jede Abweichung von der normalen Gebietszeit wird sichtbar angezeigt.

## 15. Kampagnenziel

Ein vollständiger Konvektionszyklus soll innerhalb eines umfangreichen Rollenspiels erlebbar sein, ohne dass der Tag-Nacht-Wechsel während normaler Erkundung störend schnell wird.

Als Planungswert gilt:

| Inhalt                               |                                                            Ziel |
| ------------------------------------ | --------------------------------------------------------------: |
| aktiver Inhalt pro Mohn              |                                        ungefähr 5 bis 8 Stunden |
| aktiver Inhalt für 10 Mohn           |                                      ungefähr 50 bis 80 Stunden |
| zusätzlicher beschleunigter Weltlauf | abhängig von Entscheidungen, Reisen und Langzeitbeschäftigungen |
| vollständiger Konvektionszyklus      |               innerhalb einer umfangreichen Kampagne erreichbar |

Die Handlung löst dabei keinen automatischen Zeitsprung aus. Der Spieler entscheidet selbst, wann er reist, schläft, wartet oder eine Langzeitbeschäftigung beginnt. Die Welt erreicht die nächste Phase ausschließlich durch tatsächlich simulierte Zeit.

## 16. Verbindliche Kurzfassung

* In der offenen Welt gilt `1 Um = 30 reale Minuten`.
* In gewöhnlichen Innenräumen gilt `1 Um = 20 reale Minuten`.
* In großen Dungeons gilt `1 Um = 15 reale Minuten`.
* Kämpfe verlangsamen den aktuellen Zeitfaktor um 50 Prozent.
* Menüs und offene Antwortauswahlen pausieren die Weltzeit.
* Schnellreise simuliert eine echte Route mit adaptiver Beschleunigung.
* Schlafen, Warten und Langzeitbeschäftigungen lassen die Weltzeit sichtbar und unterbrechbar weiterlaufen.
* Es gibt keine automatischen Handlungssprünge.
* Jeder verstrichene Um wird von den relevanten Weltsystemen verarbeitet.
* Ein vollständiger Konvektionszyklus bleibt durch spielergesteuerte Zeitbeschleunigung innerhalb einer langen Kampagne erreichbar.
