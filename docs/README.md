---
title: Hinweise zur Dokumentation
status: accepted
updated: 2026-09-01
---

[← Zum Dokumentationsindex](index.md)

# Hinweise zur Dokumentation

Der Ordner `docs/` hält Weltenlogik, Darstellungsregeln und technische
Umsetzung als getrennte Markdown-Dokumente. Der Einstieg erfolgt über den
[Dokumentationsindex](index.md).

## Struktur

```text
docs/
├── index.md
├── README.md
├── 00-kosmologie/
│   ├── index.md
│   ├── era-sol-und-yol.md
│   ├── KOR-UND-KORS-SHARD.md
│   ├── hera-und-splitterwelten.md
│   └── ether-seelen-und-pakte.md
└── 00-zeitdarstellung/
    ├── index.md
    ├── zeitrechnung-auf-era.md
    ├── zeitzyklen-und-konvektion.md
    ├── zeitdarstellung-im-spiel.md
    ├── zeitbeispiel-beide-zeitmodi.md
    ├── pruefmodus-5-sekunden-pro-um.md
    ├── erklaermodus-sechs-minuten.md
    └── technische-umsetzung-zeitmodi.md
```

## Dokumentklassen

| Klasse | Zweck |
|---|---|
| Kanon | Feste Weltordnung, Einheiten und bestätigte Ereignisregeln |
| Darstellungsvertrag | Verbindliches Verhalten eines Modus der Webseite |
| Gameplay-Vorschlag | Vom Webmodell getrenntes Balancing für ein mögliches Spiel |
| Implementierungsnotiz | Abbildung der Verträge auf Dateien, Zustände und Tests |

Der Frontmatter-Wert `status` kennzeichnet den jeweiligen Stand. `accepted`
bezeichnet eine angenommene Sach- oder Strukturregel, `implemented` einen in
der Webseite und ihren Tests vorhandenen Vertrag und `proposed` einen noch als
Gameplay-Vorschlag geführten Stand.

## Quellenhierarchie für die Zeitdarstellung

1. Die kanonische Ordnung steht in
   [Zeitrechnung auf Era](00-zeitdarstellung/zeitrechnung-auf-era.md).
2. Die Ereignisregeln stehen in
   [Zeitzyklen und Konvektion](00-zeitdarstellung/zeitzyklen-und-konvektion.md).
3. Die beiden Webmodi besitzen je ein eigenes Vertragsdokument.
4. Die tatsächliche Codeabbildung steht in
   [Technische Umsetzung der Zeitmodi](00-zeitdarstellung/technische-umsetzung-zeitmodi.md).
5. Das Gameplay-Balancing in `zeitdarstellung-im-spiel.md` ist davon getrennt
   und überschreibt keinen Webmodus.

## Pflegegrundsätze

- `Zyklusfortschritt` bedeutet vergangene Um geteilt durch 46.080.
- Sonnenwinkel, Sonnenphase, `S-Int` und Zyklusfortschritt bleiben getrennte
  Werte.
- Die 5-Sekunden-Regel gilt nur für den linearen Prüfmodus bei 1×.
- Die Sechs-Minuten-Zeitfahrt ist eine semantisch komprimierte Erklärung und
  keine lineare Um-Skala.
- Eine Konvektion belegt die letzten 400 Um des Zyklus. Sol und Yol sind dabei
  unsichtbar; die Dokumentation erfindet keine körperliche Verschmelzung.
- Neue Zahlenwerte für unbestätigte Sol-/Yol-Umlaufdauern werden nicht aus
  Phasennamen abgeleitet.
- Jedes eigenständige Thema bleibt in einer eigenen Markdown-Datei und wird in
  den zuständigen Index aufgenommen.
