# Steam GameStatus

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · **Deutsch** · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![Userscript installieren](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)
[![Lizenz: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.13.0-green?style=for-the-badge)](CHANGELOG.md)

Ein Userscript für den Steam-Shop und die Steam Community, das zusätzliche Spielinformationen von [GameStatus.info](https://gamestatus.info) einblendet – Schutz, Erscheinungsdaten, Bewertungen, Hardware-Anforderungen und mehr.

Beim Surfen auf Steam siehst du kompakte Info-Badges auf Spielkarten und im Kopfbereich der Spielseite – ohne den Shop zu verlassen.

Kompatibel mit [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat und anderen Managern, die den Metadatenblock `// ==UserScript==` unterstützen.

## Schnellinstallation

1. Installiere einen Userscript-Manager (Tampermonkey oder Violentmonkey empfohlen).
2. Klicke auf den Installationslink unten – dein Manager sollte einen Installationsdialog öffnen.

**Installations-URL:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
```

[![Installieren](https://img.shields.io/badge/⬇_Install-Steam_GameStatus-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)

### Installation per URL (Dashboard)

| Manager | Pfad |
|---------|------|
| Tampermonkey | Dashboard → **Utilities** → **Install from URL** |
| Violentmonkey | Dashboard → **+** → **Install from URL** |
| Greasemonkey | Add-on-Menü → **New User Script** → Raw-URL einfügen |

Füge die oben genannte Installations-URL ein.

### Manuelle Installation

1. Öffne [`steam-gamestatus.user.js`](steam-gamestatus.user.js) in diesem Repository.
2. Kopiere den gesamten Dateiinhalt.
3. Erstelle in deinem Userscript-Manager ein neues Skript und füge den Code ein.
4. Speichere und aktiviere das Skript.

## Updates

Das Skript enthält die Metadaten `@updateURL` und `@downloadURL`, die auf die Raw-Datei bei GitHub verweisen. Unterstützte Manager prüfen automatisch auf Updates (Tampermonkey: Dashboard → Prüfintervall; Violentmonkey: ähnlich).

Die Manager vergleichen die installierte `@version` mit den entfernten Metadaten und entscheiden, ob sie ein Update anbieten.

## Funktionen

- **Einstellungsbereich** — Button im Kopfbereich für Badge-Position, Badge-Größe, Kartenposition, Cache-Dauer, Cache-Leeren und die Anzeige von „Nicht in der Datenbank“-Badges
- **Status-Badges auf Spielkarten** — Shop-Startseite, Suchergebnisse, Wunschlisten, Sale-Seiten und andere Listen mit `/app/{id}`-Links
- **Status-Badge auf Spielseiten** — kompakter Chip in `.apphub_OtherSiteInfo` neben den Links zu Community Hub / Store Page
- **Ausführliche Tooltips** — Popovers im Steam-Stil mit Cover, Status-Chips, farbigen Bewertungen und Hardware-Details
- **Farbcodierte Status** — schneller visueller Überblick über lange Spielelisten
- **Lazy Loading** — Badges werden erst geladen, wenn Karten in den sichtbaren Bereich scrollen
- **Intelligentes Caching** — Antworten werden lokal zwischengespeichert, um die API-Last zu senken und wiederholte Besuche zu beschleunigen
- **Steam-ähnliche Oberfläche** — Badges im Stil von Steams `.app_tag`, Tooltips wie die Hover-Popovers des Shops
- **10 Oberflächensprachen** — Englisch, Russisch, Chinesisch, Spanisch, Portugiesisch, Deutsch, Französisch, Japanisch, Koreanisch und Polnisch (anhand der Browsersprache erkannt)

## Unterstützte Seiten

| Seite | URL-Muster |
|------|-------------|
| Steam-Shop | `https://store.steampowered.com/*` |
| Steam Community (App-Hub) | `https://steamcommunity.com/app/*` |

## Statusfarben

Jedes Badge hat einen farbigen Punkt, der den Status des Spiels auf GameStatus.info widerspiegelt:

| Farbe | Status | Bedeutung |
|-------|--------|---------|
| Grün | Bereit | Der Status zeigt, dass das Spiel bereit / verfügbar ist |
| Orange | Ausstehend (kürzlich) | Status „ausstehend“; das Spiel ist vor weniger als einem Monat erschienen |
| Rot | Ausstehend (lange Wartezeit) | Status „ausstehend“; das Spiel ist vor mehr als einem Monat erschienen |
| Orange | Schutz-Umgehung | Der Status weist auf eine Methode zur Umgehung des Schutzes hin |
| Blau | Release heute | Das Spiel erscheint heute; der Status kann noch „ausstehend“ sein |
| Grau | Unbekannt / nicht in der Datenbank | Status unklar oder Spiel nicht auf GameStatus.info gefunden |
| Blau (Spinner) | Wird geladen | Die Daten werden von der API abgerufen |

Ein Klick auf ein Badge öffnet die Spielseite auf GameStatus.info (oder die Startseite der Website, wenn das Spiel nicht gefunden wurde).

## Tooltip-Inhalte

Beim Überfahren eines Badges öffnet sich ein Popover im Steam-Stil, das Folgendes anzeigen kann:

- **Kopfbereich** — Cover, Titel, Status-Chip, AAA- / Schutz- / Gruppen-Chips
- **Daten** — Erscheinungs- und Status-Aktualisierungsdatum, Steam-ID, Abonnements
- **Bewertungen** — GameStatus- und Metacritic-Werte mit Farben im Metacritic-Stil (grün ≥75, gelb ≥50, rot darunter)
- **Hardware** — CPU, RAM, GPU, Betriebssystem, sofern verfügbar
- **Beschreibung** — kurze Spielbeschreibung
- **Fußzeile** — Support-Button sowie API- / GameStatus-Links

Wenn ein Spiel nicht in der Datenbank ist, zeigt das Popover den Chip „Nicht in der Datenbank“ und listet die bei der Suche versuchten API-URLs auf.

## Einstellungen

Öffne **GameStatus** im Steam-Kopfbereich (oder im Menü des Userscript-Managers), um Folgendes zu konfigurieren:

| Einstellung | Standard | Hinweise |
|---------|---------|--------|
| Badge-Position (vertikal / horizontal) | Oben / Links | Nur Badges auf Karten; Chips auf Spielseiten bleiben im Kopfbereich |
| Kartenposition | Links | Wo die GameStatus-Karte neben dem Spiel erscheint; wechselt auf die nächste Seite mit Platz |
| Badge-Größe | Mittel | Klein / Mittel / Groß / Sehr groß; nur Badges auf Karten |
| „Nicht in der Datenbank“-Badges anzeigen | An | Wenn aus, bleiben Karten ohne Treffer unmarkiert |
| Cache-Dauer (Stunden) | 6 | Gilt für alle zwischengespeicherten Abfragen; maximal 168 (7 Tage) |
| Cache leeren | — | Sofort wirksam; Speichern nicht erforderlich |

## Für Entwickler

Dieser Abschnitt wurde in eigene Anleitungen ausgelagert:

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — Build, lokale Tests, Konfiguration, Veröffentlichung
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Funktionsweise, Repository-Struktur, Metadaten, Berechtigungen
- [CONTRIBUTING.md](CONTRIBUTING.md) — Beitragsablauf und PR-Checkliste
- [AGENTS.md](AGENTS.md) — Anweisungen für KI-Coding-Agenten
- [SECURITY.md](SECURITY.md) — Sicherheitsrichtlinie und vertrauliche Meldung

## Datenquelle

Alle Spieldaten stammen aus der öffentlichen GameStatus.info-API:

```
GET https://gamestatus.info/back/api/gameinfo/game/{slug}/
```

Dieses Projekt ist **nicht mit Valve, Steam oder GameStatus.info verbunden**. Die Statusinformationen werden von der Community gepflegt und können unvollständig oder veraltet sein. Betrachte sie als Referenz, nicht als Garantie.

## Lizenz

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
