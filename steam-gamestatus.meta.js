// ==UserScript==
// @name              Steam GameStatus
// @name:ru           Steam GameStatus
// @name:zh-CN        Steam GameStatus
// @name:es           Steam GameStatus
// @name:pt-BR        Steam GameStatus
// @name:de           Steam GameStatus
// @name:fr           Steam GameStatus
// @name:ja           Steam GameStatus
// @name:ko           Steam GameStatus
// @name:pl           Steam GameStatus
// @namespace         https://github.com/NemoKing1210/steam-gamestatus
// @version           1.4.7
// @description       Adds extra game info from gamestatus.info on Steam store cards and game pages
// @description:ru    Добавляет доп. информацию с gamestatus.info на карточки Steam и страницы игр
// @description:zh-CN 在 Steam 商店卡片和游戏页面显示来自 gamestatus.info 的额外游戏信息
// @description:es    Añade información extra de gamestatus.info en tarjetas y páginas de Steam
// @description:pt-BR  Adiciona informações extras do gamestatus.info nos cards e páginas da Steam
// @description:de     Zeigt zusätzliche Spieldaten von gamestatus.info auf Steam-Karten und Spielseiten
// @description:fr     Ajoute des infos supplémentaires de gamestatus.info sur les cartes et pages Steam
// @description:ja     Steamのカードとゲームページに gamestatus.info の追加ゲーム情報を表示
// @description:ko     Steam 카드 및 게임 페이지에 gamestatus.info 추가 게임 정보를 표시
// @description:pl     Dodaje dodatkowe informacje z gamestatus.info na kartach i stronach Steam
// @author             NemoKing1210
// @tag                steam
// @tag                games
// @homepageURL        https://github.com/NemoKing1210/steam-gamestatus
// @supportURL         https://github.com/NemoKing1210/steam-gamestatus/issues
// @updateURL          https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
// @downloadURL        https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
// @license            MIT
// @icon               https://gamestatus.info/favicon.ico
// @match              https://store.steampowered.com/*
// @match              https://steamcommunity.com/app/*
// @grant              GM_xmlhttpRequest
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM_addStyle
// @grant              GM_registerMenuCommand
// @connect            gamestatus.info
// @connect            cdn.gamestatus.info
// @run-at             document-idle
// @noframes
// ==/UserScript==
