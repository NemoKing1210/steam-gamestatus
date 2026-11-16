# Steam GameStatus

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Polski**

[![Zainstaluj userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)
[![Licencja: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Wersja](https://img.shields.io/badge/version-1.13.0-green?style=for-the-badge)](CHANGELOG.md)

Skrypt użytkownika dla sklepu Steam i Steam Community, który dodaje dodatkowe informacje o grach z [GameStatus.info](https://gamestatus.info) — ochronę, daty wydania, oceny, wymagania sprzętowe i nie tylko.

Przeglądając Steam, widzisz kompaktowe odznaki informacyjne na kartach gier i w nagłówku strony gry — bez opuszczania sklepu.

Zgodny z [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat oraz innymi menedżerami obsługującymi blok metadanych `// ==UserScript==`.

## Szybka instalacja

1. Zainstaluj menedżer skryptów użytkownika (zalecane Tampermonkey lub Violentmonkey).
2. Kliknij link instalacyjny poniżej — menedżer powinien otworzyć okno instalacji.

**Adres instalacyjny:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
```

[![Zainstaluj](https://img.shields.io/badge/⬇_Install-Steam_GameStatus-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)

### Instalacja z adresu URL (panel)

| Menedżer | Ścieżka |
|---------|------|
| Tampermonkey | Panel → **Utilities** → **Install from URL** |
| Violentmonkey | Panel → **+** → **Install from URL** |
| Greasemonkey | Menu dodatku → **New User Script** → wklej surowy adres URL |

Wklej adres instalacyjny podany powyżej.

### Instalacja ręczna

1. Otwórz [`steam-gamestatus.user.js`](steam-gamestatus.user.js) w tym repozytorium.
2. Skopiuj całą zawartość pliku.
3. W menedżerze skryptów utwórz nowy skrypt i wklej kod.
4. Zapisz i włącz skrypt.

## Aktualizacje

Skrypt zawiera metadane `@updateURL` i `@downloadURL` wskazujące na surowy plik GitHub. Obsługiwane menedżery automatycznie sprawdzają aktualizacje (Tampermonkey: Panel → interwał sprawdzania; Violentmonkey: podobnie).

Menedżery porównują zainstalowaną `@version` ze zdalnymi metadanymi, aby zdecydować, czy zaproponować aktualizację.

## Funkcje

- **Panel ustawień** — przycisk w nagłówku do ustawiania pozycji i rozmiaru odznaki, pozycji karty, czasu trwania pamięci podręcznej, czyszczenia pamięci podręcznej i wyświetlania odznak „Brak w bazie”
- **Odznaki statusu na kartach gier** — strona główna sklepu, wyniki wyszukiwania, listy życzeń, strony wyprzedaży i inne listy z linkami `/app/{id}`
- **Odznaka statusu na stronach gier** — kompaktowy chip w `.apphub_OtherSiteInfo` obok linków Community Hub / Store Page
- **Rozbudowane podpowiedzi** — wyskakujące okna w stylu Steam z okładką, chipami statusu, kolorowymi ocenami i szczegółami sprzętowymi
- **Statusy oznaczone kolorami** — szybki przegląd długiej listy gier
- **Leniwe ładowanie** — odznaki ładują się dopiero, gdy karty znajdą się w widocznym obszarze
- **Inteligentne buforowanie** — odpowiedzi są buforowane lokalnie, aby zmniejszyć obciążenie API i przyspieszyć kolejne wizyty
- **Interfejs w stylu Steam** — odznaki w stylu `.app_tag` Steam, podpowiedzi jak okna sklepu
- **10 języków interfejsu** — angielski, rosyjski, chiński, hiszpański, portugalski, niemiecki, francuski, japoński, koreański i polski (wykrywany na podstawie języka przeglądarki)

## Obsługiwane strony

| Witryna | Wzorzec URL |
|------|-------------|
| Sklep Steam | `https://store.steampowered.com/*` |
| Steam Community (centrum aplikacji) | `https://steamcommunity.com/app/*` |

## Kolory statusów

Każda odznaka ma kolorową kropkę odzwierciedlającą status gry w GameStatus.info:

| Kolor | Status | Znaczenie |
|-------|--------|---------|
| Zielony | Gotowe | Status wskazuje, że gra jest gotowa / dostępna |
| Pomarańczowy | Oczekujące (niedawno) | Status oczekiwania; gra wydana mniej niż miesiąc temu |
| Czerwony | Oczekujące (długie oczekiwanie) | Status oczekiwania; gra wydana ponad miesiąc temu |
| Pomarańczowy | Obejście zabezpieczeń | Status wskazuje metodę obejścia zabezpieczeń |
| Niebieski | Premiera dziś | Gra wychodzi dziś; status może nadal być „oczekuje” |
| Szary | Nieznany status / brak w bazie | Status niejasny lub gra nieznaleziona w GameStatus.info |
| Niebieski (spinner) | Ładowanie | Dane są pobierane z API |

Kliknięcie odznaki otwiera stronę gry w GameStatus.info (lub stronę główną serwisu, jeśli gry nie znaleziono).

## Zawartość podpowiedzi

Najechanie na odznakę otwiera okno w stylu Steam, które może pokazywać:

- **Nagłówek** — okładka, tytuł, chip statusu, chipy AAA / ochrony / grupy
- **Daty** — data wydania i aktualizacji statusu, Steam ID, subskrypcje
- **Oceny** — wartości GameStatus i Metacritic z kolorami w stylu Metacritic (zielony ≥75, żółty ≥50, czerwony poniżej)
- **Sprzęt** — CPU, RAM, GPU, system operacyjny, jeśli dostępne
- **Opis** — krótki opis gry
- **Stopka** — przycisk wsparcia oraz linki API / GameStatus

Jeśli gry nie ma w bazie danych, okno pokazuje chip „Brak w bazie” i listę adresów API wypróbowanych podczas wyszukiwania.

## Ustawienia

Otwórz **GameStatus** w nagłówku Steam (lub w menu menedżera skryptów), aby skonfigurować:

| Ustawienie | Domyślnie | Uwagi |
|---------|---------|--------|
| Pozycja odznaki (pionowa / pozioma) | Góra / Lewo | Dotyczy tylko odznak na kartach; chipy na stronach gier pozostają w nagłówku |
| Pozycja karty | Lewo | Gdzie karta GameStatus otwiera się obok gry; przełącza się na kolejny bok z miejscem |
| Rozmiar odznaki | Średni | Mały / Średni / Duży / Bardzo duży; dotyczy tylko odznak na kartach |
| Pokazuj odznaki „Brak w bazie” | Wł. | Po wyłączeniu karty bez dopasowania pozostają nieoznaczone |
| Czas trwania pamięci podręcznej (godziny) | 6 | Dotyczy wszystkich buforowanych zapytań; maksymalnie 168 (7 dni) |
| Wyczyść pamięć podręczną | — | Natychmiast; nie wymaga zapisu |

## Dla deweloperów

Ta sekcja została przeniesiona do osobnych przewodników:

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — kompilacja, testy lokalne, konfiguracja, wydania
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — jak to działa, struktura repozytorium, metadane, uprawnienia
- [CONTRIBUTING.md](CONTRIBUTING.md) — proces współtworzenia i lista kontrolna PR
- [AGENTS.md](AGENTS.md) — instrukcje dla agentów AI
- [SECURITY.md](SECURITY.md) — polityka bezpieczeństwa i prywatne zgłoszenia

## Źródło danych

Wszystkie dane o grach pochodzą z publicznego API GameStatus.info:

```
GET https://gamestatus.info/back/api/gameinfo/game/{slug}/
```

Ten projekt **nie jest powiązany** z Valve, Steam ani GameStatus.info. Informacje o statusach są utrzymywane przez społeczność i mogą być niekompletne lub nieaktualne. Traktuj je jako odniesienie, a nie gwarancję.

## Licencja

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
