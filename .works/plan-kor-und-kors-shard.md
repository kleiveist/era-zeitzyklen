# Plan: Kor und Kor’s Shard

## Ziel

Kor und Kor’s Shard werden als zwei eigenständig berechnete, eng gekoppelte Mondkörper in die gemeinsame Weltzeit eingebaut. Ihre stark elliptischen Polbahnen erscheinen sowohl im astralen Weltzustand als auch im Horizontverlauf. Sol, Yol und beide Monde ändern ihre scheinbare Größe kontinuierlich mit der Entfernung.

## Umsetzung

- Dokumentationsvertrag aus `docs/00-kosmologie/KOR-UND-KORS-SHARD.md` in einen testbaren 3D-Mondzustand übertragen.
- Beide Monde separat aus der absoluten Weltzeit berechnen; Bahnparameter bleiben ausdrücklich illustrativ.
- Stark elliptische, nahezu kantenständig sichtbare Polbahnen mit Kepler-Geschwindigkeit und gemeinsamer 300-Zyklen-Ausrichtung darstellen.
- Kor und Kor’s Shard als enges Paar führen, ohne Kor’s Shard als bloßen Dekorationssplitter von Kor zu behandeln.
- Nordpol-Draufsicht um Bahnen, Tiefenkennzeichnung, Verdeckung durch Era und zwei unterschiedliche HD-Sprites ergänzen.
- Horizontprojektion aus denselben 3D-Weltpositionen ableiten; Größe und Deckkraft bei wachsender Entfernung sowie am Untergang weich reduzieren.
- Sol und Yol im Horizont anhand ihres radialen Bahnabstands kontinuierlich skalieren.
- Monde während der Konvektion weiterlaufen und sichtbar lassen, sofern ihre eigene Horizontgeometrie das zulässt.
- Dokumentationsindizes ergänzen und automatisierte Verträge für Kontinuität, Polbahn, 300. Zyklus, Größenstaffelung und Assets hinzufügen.

## Abnahme

- Beide Monde besitzen zu jedem Snapshot getrennte endliche 3D-Positionen und Entfernungen.
- Bei wachsender Entfernung sinken scheinbare Größe und Sichtbarkeit kontinuierlich.
- Kor und Kor’s Shard bleiben räumlich als Paar erkennbar.
- Die Draufsicht zeigt schmale Polbahnen und verdeckt rückwärtige Körper hinter Era.
- Zyklus 300 richtet beide Monde während der Konvektion am Nordpol aus, ohne Kollision oder Verschmelzung.
- Konvektion blendet ausschließlich Sol und Yol regelbedingt aus.
- Bestehende Zeitmodus-, Horizont-, Wolken- und Darstellungsverträge bleiben grün.
