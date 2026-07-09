// ==UserScript==
// @name              Steam GameStatus — crack status
// @name:ru           Steam GameStatus — статус взлома
// @name:zh-CN        Steam GameStatus — 破解状态
// @name:es           Steam GameStatus — estado de crack
// @name:pt-BR        Steam GameStatus — status de crack
// @name:de           Steam GameStatus — Crack-Status
// @name:fr           Steam GameStatus — statut de crack
// @name:ja           Steam GameStatus — クラック状況
// @name:ko           Steam GameStatus — 크랙 상태
// @name:pl           Steam GameStatus — status cracka
// @namespace         https://github.com/NemoKing1210/steam-gamestatus
// @version           1.1.1
// @description       Shows game crack status from gamestatus.info on Steam store cards and game pages
// @description:ru    Показывает статус взлома игр с gamestatus.info на карточках Steam и страницах игр
// @description:zh-CN 在 Steam 商店卡片和游戏页面显示来自 gamestatus.info 的破解状态
// @description:es    Muestra el estado de crack de gamestatus.info en tarjetas y páginas de Steam
// @description:pt-BR  Mostra o status de crack do gamestatus.info nos cards e páginas da Steam
// @description:de     Zeigt Crack-Status von gamestatus.info auf Steam-Karten und Spielseiten
// @description:fr     Affiche le statut de crack gamestatus.info sur les cartes et pages Steam
// @description:ja     Steamのカードとゲームページに gamestatus.info のクラック状況を表示
// @description:ko     Steam 카드 및 게임 페이지에 gamestatus.info 크랙 상태를 표시
// @description:pl     Pokazuje status cracka z gamestatus.info na kartach i stronach Steam
// @author             NemoKing1210
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
// @connect            gamestatus.info
// @connect            cdn.gamestatus.info
// @run-at             document-idle
// @noframes
// ==/UserScript==

(function () {
    'use strict';
  
    const API_BASE = 'https://gamestatus.info/back/api/gameinfo/game';
    const SITE_BASE = 'https://gamestatus.info';
    const DONATE_URL = `${SITE_BASE}/#donate`;
    const CACHE_KEY = 'gs_steam_cache_v3';
    const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
    const NEGATIVE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
    const MAX_CONCURRENT = 2;
    const CARD_ROOT_MARGIN = '80px 0px';
    const SCAN_DEBOUNCE_MS = 450;
    const SCROLL_IDLE_MS = 150;
    const CACHE_PERSIST_MS = 1000;
    const REQUEST_DELAY_MS = 75;
    const HYDRATE_BATCH_SIZE = 3;
    const MAX_SLUG_ATTEMPTS = 2;
    const BADGE_CLASS = 'gs-steam-badge';

    const SUPPORTED_LOCALES = ['en', 'ru', 'zh', 'es', 'pt', 'de', 'fr', 'ja', 'ko', 'pl'];

    const TRANSLATIONS = {
      en: {
        notInDatabase: 'Not in database',
        cracked: 'Cracked',
        notCracked: 'Not cracked',
        protectionBypass: 'Protection bypass',
        releaseToday: 'Release today',
        unknownStatus: 'Unknown status',
        checkedUrls: 'Checked URLs',
        gameNotFound: 'Game not found in the gamestatus.info database',
        status: 'Status',
        protection: 'Protection',
        group: 'Group',
        release: 'Release',
        crack: 'Crack',
        steamId: 'Steam ID',
        score: 'Score',
        metacritic: 'Metacritic',
        type: 'Type',
        subscriptions: 'Subscriptions',
        hardware: 'Hardware',
        torrent: 'Torrent',
        supportProject: 'Support project',
        loadError: 'Load error',
        loading: 'GameStatus…',
      },
      ru: {
        notInDatabase: 'Нет в базе',
        cracked: 'Взломана',
        notCracked: 'Не взломана',
        protectionBypass: 'Обход защиты',
        releaseToday: 'Релиз сегодня',
        unknownStatus: 'Статус неизвестен',
        checkedUrls: 'Проверенные URL',
        gameNotFound: 'Игра не найдена в базе gamestatus.info',
        status: 'Статус',
        protection: 'Защита',
        group: 'Группа',
        release: 'Релиз',
        crack: 'Взлом',
        steamId: 'Steam ID',
        score: 'Оценка',
        metacritic: 'Metacritic',
        type: 'Тип',
        subscriptions: 'Подписки',
        hardware: 'Железо',
        torrent: 'Торрент',
        supportProject: 'Поддержать проект',
        loadError: 'Ошибка загрузки',
        loading: 'GameStatus…',
      },
      zh: {
        notInDatabase: '未收录',
        cracked: '已破解',
        notCracked: '未破解',
        protectionBypass: '保护绕过',
        releaseToday: '今日发售',
        unknownStatus: '状态未知',
        checkedUrls: '已检查的 URL',
        gameNotFound: '在 gamestatus.info 数据库中未找到该游戏',
        status: '状态',
        protection: '保护',
        group: '组织',
        release: '发售',
        crack: '破解',
        steamId: 'Steam ID',
        score: '评分',
        metacritic: 'Metacritic',
        type: '类型',
        subscriptions: '订阅数',
        hardware: '硬件',
        torrent: '种子',
        supportProject: '支持项目',
        loadError: '加载失败',
        loading: 'GameStatus…',
      },
      es: {
        notInDatabase: 'No está en la base de datos',
        cracked: 'Crackeado',
        notCracked: 'Sin crackear',
        protectionBypass: 'Bypass de protección',
        releaseToday: 'Lanzamiento hoy',
        unknownStatus: 'Estado desconocido',
        checkedUrls: 'URLs comprobadas',
        gameNotFound: 'Juego no encontrado en la base de datos de gamestatus.info',
        status: 'Estado',
        protection: 'Protección',
        group: 'Grupo',
        release: 'Lanzamiento',
        crack: 'Crack',
        steamId: 'Steam ID',
        score: 'Puntuación',
        metacritic: 'Metacritic',
        type: 'Tipo',
        subscriptions: 'Suscripciones',
        hardware: 'Hardware',
        torrent: 'Torrent',
        supportProject: 'Apoyar el proyecto',
        loadError: 'Error de carga',
        loading: 'GameStatus…',
      },
      pt: {
        notInDatabase: 'Não está no banco de dados',
        cracked: 'Crackeado',
        notCracked: 'Não crackeado',
        protectionBypass: 'Bypass de proteção',
        releaseToday: 'Lançamento hoje',
        unknownStatus: 'Status desconhecido',
        checkedUrls: 'URLs verificadas',
        gameNotFound: 'Jogo não encontrado no banco de dados do gamestatus.info',
        status: 'Status',
        protection: 'Proteção',
        group: 'Grupo',
        release: 'Lançamento',
        crack: 'Crack',
        steamId: 'Steam ID',
        score: 'Pontuação',
        metacritic: 'Metacritic',
        type: 'Tipo',
        subscriptions: 'Inscrições',
        hardware: 'Hardware',
        torrent: 'Torrent',
        supportProject: 'Apoiar o projeto',
        loadError: 'Erro ao carregar',
        loading: 'GameStatus…',
      },
      de: {
        notInDatabase: 'Nicht in der Datenbank',
        cracked: 'Gecrackt',
        notCracked: 'Nicht gecrackt',
        protectionBypass: 'Schutz-Umgehung',
        releaseToday: 'Release heute',
        unknownStatus: 'Status unbekannt',
        checkedUrls: 'Geprüfte URLs',
        gameNotFound: 'Spiel nicht in der gamestatus.info-Datenbank gefunden',
        status: 'Status',
        protection: 'Schutz',
        group: 'Gruppe',
        release: 'Release',
        crack: 'Crack',
        steamId: 'Steam ID',
        score: 'Bewertung',
        metacritic: 'Metacritic',
        type: 'Typ',
        subscriptions: 'Abonnements',
        hardware: 'Hardware',
        torrent: 'Torrent',
        supportProject: 'Projekt unterstützen',
        loadError: 'Ladefehler',
        loading: 'GameStatus…',
      },
      fr: {
        notInDatabase: 'Absent de la base',
        cracked: 'Cracké',
        notCracked: 'Non cracké',
        protectionBypass: 'Contournement',
        releaseToday: 'Sortie aujourd\'hui',
        unknownStatus: 'Statut inconnu',
        checkedUrls: 'URLs vérifiées',
        gameNotFound: 'Jeu introuvable dans la base gamestatus.info',
        status: 'Statut',
        protection: 'Protection',
        group: 'Groupe',
        release: 'Sortie',
        crack: 'Crack',
        steamId: 'Steam ID',
        score: 'Note',
        metacritic: 'Metacritic',
        type: 'Type',
        subscriptions: 'Abonnements',
        hardware: 'Configuration',
        torrent: 'Torrent',
        supportProject: 'Soutenir le projet',
        loadError: 'Erreur de chargement',
        loading: 'GameStatus…',
      },
      ja: {
        notInDatabase: 'データベースに未登録',
        cracked: 'クラック済み',
        notCracked: '未クラック',
        protectionBypass: '保護回避',
        releaseToday: '本日リリース',
        unknownStatus: 'ステータス不明',
        checkedUrls: '確認した URL',
        gameNotFound: 'gamestatus.info のデータベースにゲームが見つかりません',
        status: 'ステータス',
        protection: '保護',
        group: 'グループ',
        release: 'リリース',
        crack: 'クラック',
        steamId: 'Steam ID',
        score: 'スコア',
        metacritic: 'Metacritic',
        type: 'タイプ',
        subscriptions: '購読数',
        hardware: 'スペック',
        torrent: 'トレント',
        supportProject: 'プロジェクトを支援',
        loadError: '読み込みエラー',
        loading: 'GameStatus…',
      },
      ko: {
        notInDatabase: '데이터베이스에 없음',
        cracked: '크랙됨',
        notCracked: '미크랙',
        protectionBypass: '보호 우회',
        releaseToday: '오늘 출시',
        unknownStatus: '상태 불명',
        checkedUrls: '확인한 URL',
        gameNotFound: 'gamestatus.info 데이터베이스에서 게임을 찾을 수 없습니다',
        status: '상태',
        protection: '보호',
        group: '그룹',
        release: '출시',
        crack: '크랙',
        steamId: 'Steam ID',
        score: '점수',
        metacritic: 'Metacritic',
        type: '유형',
        subscriptions: '구독 수',
        hardware: '사양',
        torrent: '토렌트',
        supportProject: '프로젝트 후원',
        loadError: '로드 오류',
        loading: 'GameStatus…',
      },
      pl: {
        notInDatabase: 'Brak w bazie',
        cracked: 'Zcrackowana',
        notCracked: 'Bez cracka',
        protectionBypass: 'Obejście zabezpieczeń',
        releaseToday: 'Premiera dziś',
        unknownStatus: 'Nieznany status',
        checkedUrls: 'Sprawdzone URL',
        gameNotFound: 'Gry nie znaleziono w bazie gamestatus.info',
        status: 'Status',
        protection: 'Zabezpieczenie',
        group: 'Grupa',
        release: 'Premiera',
        crack: 'Crack',
        steamId: 'Steam ID',
        score: 'Ocena',
        metacritic: 'Metacritic',
        type: 'Typ',
        subscriptions: 'Subskrypcje',
        hardware: 'Sprzęt',
        torrent: 'Torrent',
        supportProject: 'Wspieraj projekt',
        loadError: 'Błąd ładowania',
        loading: 'GameStatus…',
      },
    };

    function resolveLocale() {
      const candidates = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
      for (const candidate of candidates) {
        const raw = String(candidate).toLowerCase();
        const primary = raw.split('-')[0];
        if (SUPPORTED_LOCALES.includes(primary)) return primary;
        if (raw.startsWith('zh')) return 'zh';
        if (raw.startsWith('pt')) return 'pt';
      }
      return 'en';
    }

    const LOCALE = resolveLocale();

    function t(key) {
      return TRANSLATIONS[LOCALE]?.[key] ?? TRANSLATIONS.en[key] ?? key;
    }

    function getApiLanguage() {
      return navigator.language || 'en-US';
    }

    function getLocalizedGroup(game) {
      if (!game) return null;
      if (LOCALE === 'ru') return game.hacked_groups || game.hacked_groups_en;
      return game.hacked_groups_en || game.hacked_groups;
    }

    function getLocalizedDescription(game) {
      if (!game) return '';
      if (LOCALE === 'ru') return game.description || game.description_en;
      return game.description_en || game.description;
    }
  
    /** @type {Map<string, Promise<any|null>>} */
    const inflight = new Map();
    /** @type {Array<{ task: () => Promise<unknown>, resolve: (value: unknown) => void, reject: (reason?: unknown) => void }>} */
    const queue = [];
    let activeRequests = 0;
    /** @type {Record<string, unknown>|null} */
    let memoryCache = null;
    let cacheDirty = false;
    let cachePersistTimer = null;
    let mutationObserver = null;
    let isScrolling = false;
    let scrollIdleTimer = null;
    let hydrateFlushRaf = null;
    let hasInitialScan = false;
    /** @type {Element[]} */
    const pendingScanNodes = [];
    /** @type {Array<{ card: Element, appId: string, link: HTMLAnchorElement|{ href: string }, title: string }>} */
    const hydrationQueue = [];

    const MUTATION_OBSERVER_OPTIONS = { childList: true, subtree: true };
  
    GM_addStyle(`
      .${BADGE_CLASS} {
        --gs-accent: #67c1f5;
        --gs-bg: #384959;
        --gs-text: #c7d5e0;
        --gs-muted: #8f98a0;
        position: absolute;
        top: 8px;
        left: 8px;
        z-index: 12;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        max-width: calc(100% - 16px);
        padding: 0 7px;
        border-radius: 3px;
        border: none;
        background: var(--gs-bg);
        color: var(--gs-text);
        font: 500 11px/19px "Motiva Sans", Arial, sans-serif;
        text-decoration: none;
        box-shadow: 1px 1px 0 0 #000000;
        pointer-events: auto;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .${BADGE_CLASS}:hover {
        background: #4a5d70;
        color: #e3eaef;
      }

      .${BADGE_CLASS}__dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        flex: 0 0 auto;
        background: var(--gs-accent);
      }

      .${BADGE_CLASS}__label {
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .${BADGE_CLASS}--loading {
        --gs-accent: #67c1f5;
        cursor: wait;
        pointer-events: none;
      }

      .${BADGE_CLASS}--loading .${BADGE_CLASS}__dot {
        width: 10px;
        height: 10px;
        border: 2px solid rgba(103, 193, 245, 0.25);
        border-top-color: #67c1f5;
        background: transparent;
        animation: gs-spin 0.7s linear infinite;
      }

      .${BADGE_CLASS}--cracked {
        --gs-accent: #beee11;
        --gs-bg: #4c6b22;
        --gs-text: #beee11;
      }

      .${BADGE_CLASS}--cracked:hover {
        background: #5a7f28;
        color: #d4f54a;
      }

      .${BADGE_CLASS}--cracked .${BADGE_CLASS}__dot {
        background: #2d4a14;
      }

      .${BADGE_CLASS}--bypass {
        --gs-accent: #ffb321;
        --gs-text: #e3eaef;
      }

      .${BADGE_CLASS}--not-cracked-recent {
        --gs-accent: #ffb321;
        --gs-text: #e3eaef;
      }

      .${BADGE_CLASS}--not-cracked-old {
        --gs-accent: #f87171;
        --gs-text: #fecaca;
      }

      .${BADGE_CLASS}--release-today {
        --gs-accent: #67c1f5;
        --gs-text: #c7d5e0;
      }

      .${BADGE_CLASS}--unknown,
      .${BADGE_CLASS}--missing {
        --gs-accent: #8f98a0;
        --gs-text: #b0aeac;
      }

      .${BADGE_CLASS}--page,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page,
      span.${BADGE_CLASS}.${BADGE_CLASS}--page {
        position: static;
        top: auto;
        left: auto;
        z-index: auto;
        display: inline-block;
        vertical-align: top;
        margin: 0;
        padding: 1px;
        max-width: none;
        box-shadow: none;
        border: none;
        border-radius: 2px;
        background: rgba(103, 193, 245, 0.2);
        color: #67c1f5 !important;
        text-decoration: none !important;
        font: inherit;
        overflow: visible;
        white-space: nowrap;
        gap: 0;
        cursor: pointer;
      }

      a.${BADGE_CLASS}.${BADGE_CLASS}--page:hover,
      span.${BADGE_CLASS}.${BADGE_CLASS}--page:hover {
        color: #fff !important;
        background: linear-gradient(-60deg, #417a9b 5%, #67c1f5 95%);
      }

      .${BADGE_CLASS}--page > span,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page > span,
      span.${BADGE_CLASS}.${BADGE_CLASS}--page > span {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 2px;
        background: transparent;
        padding: 0 15px;
        font: normal 15px/30px "Motiva Sans", Sans-serif;
        color: inherit;
      }

      .${BADGE_CLASS}--page.${BADGE_CLASS}--cracked,
      .${BADGE_CLASS}--page.${BADGE_CLASS}--bypass,
      .${BADGE_CLASS}--page.${BADGE_CLASS}--not-cracked-recent,
      .${BADGE_CLASS}--page.${BADGE_CLASS}--not-cracked-old,
      .${BADGE_CLASS}--page.${BADGE_CLASS}--release-today,
      .${BADGE_CLASS}--page.${BADGE_CLASS}--unknown,
      .${BADGE_CLASS}--page.${BADGE_CLASS}--missing {
        --gs-bg: rgba(103, 193, 245, 0.2);
        --gs-text: #67c1f5;
      }

      a.${BADGE_CLASS}.${BADGE_CLASS}--page.${BADGE_CLASS}--cracked:hover,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page.${BADGE_CLASS}--bypass:hover,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page.${BADGE_CLASS}--not-cracked-recent:hover,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page.${BADGE_CLASS}--not-cracked-old:hover,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page.${BADGE_CLASS}--release-today:hover,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page.${BADGE_CLASS}--unknown:hover,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page.${BADGE_CLASS}--missing:hover {
        background: linear-gradient(-60deg, #417a9b 5%, #67c1f5 95%);
        color: #fff !important;
      }

      .${BADGE_CLASS}--page .${BADGE_CLASS}__dot {
        width: 8px;
        height: 8px;
        flex-shrink: 0;
      }

      .${BADGE_CLASS}--page .${BADGE_CLASS}__label {
        color: inherit;
        overflow: visible;
        text-overflow: clip;
      }

      .${BADGE_CLASS}--page.${BADGE_CLASS}--loading {
        pointer-events: none;
        cursor: wait;
      }

      .${BADGE_CLASS}--page.${BADGE_CLASS}--loading .${BADGE_CLASS}__dot {
        width: 12px;
        height: 12px;
      }

      .${BADGE_CLASS}__tooltip {
        position: fixed;
        z-index: 999999;
        max-width: 340px;
        padding: 8px 12px;
        border-radius: 2px;
        border: none;
        background: #3d4450;
        color: #dcdedf;
        font: normal 11px/1.45 "Motiva Sans", Arial, sans-serif;
        box-shadow: 0 0 3px #000000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
        word-wrap: break-word;
        white-space: normal;
      }

      .${BADGE_CLASS}__tooltip--visible {
        opacity: 1;
      }

      .${BADGE_CLASS}__tooltip--interactive {
        pointer-events: auto;
      }

      .${BADGE_CLASS}__tooltip strong {
        display: block;
        margin-bottom: 6px;
        color: #ffffff;
        font-size: 13px;
        font-weight: normal;
        line-height: 1.3;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-muted {
        margin: 0 0 6px;
        color: #8f98a0;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-section {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .${BADGE_CLASS}__tooltip .gs-tip-row {
        display: grid;
        grid-template-columns: 88px 1fr;
        gap: 6px;
        margin-bottom: 4px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-row:last-child {
        margin-bottom: 0;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-label {
        color: #8f98a0;
        font-size: 11px;
        font-weight: normal;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-value {
        color: #dcdedf;
        word-break: break-word;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-desc {
        margin: 0;
        color: #b8bcbf;
        font-size: 11px;
        line-height: 1.45;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-links {
        margin: 4px 0 0;
        padding: 0 0 0 15px;
        list-style: disc;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-links li + li {
        margin-top: 4px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-links a,
      .${BADGE_CLASS}__tooltip .gs-tip-footer a {
        color: #66c0f4;
        text-decoration: none;
        word-break: break-all;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-links a:hover,
      .${BADGE_CLASS}__tooltip .gs-tip-footer a:hover {
        color: #ffffff;
        text-decoration: underline;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-footer {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 11px;
        color: #8f98a0;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .${BADGE_CLASS}__tooltip .gs-tip-torrent-btn {
        display: inline-block;
        padding: 1px;
        border-radius: 2px;
        border: none;
        background: linear-gradient(-60deg, #4c6b22 5%, #6ba32d 95%);
        color: #ffffff !important;
        text-decoration: none !important;
        cursor: pointer;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-torrent-btn > span {
        display: block;
        padding: 0 15px;
        font: normal 13px/28px "Motiva Sans", Arial, sans-serif;
        color: #ffffff !important;
        background: transparent;
        border-radius: 2px;
        text-align: center;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-torrent-btn:hover {
        background: linear-gradient(-60deg, #5a7f28 5%, #7bb832 95%);
        color: #ffffff !important;
        text-decoration: none !important;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-donate-btn {
        display: inline-block;
        padding: 1px;
        border-radius: 2px;
        border: none;
        background: linear-gradient(-60deg, #417a9b 5%, #67c1f5 95%);
        color: #ffffff !important;
        text-decoration: none !important;
        cursor: pointer;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-donate-btn > span {
        display: block;
        padding: 0 15px;
        font: normal 13px/28px "Motiva Sans", Arial, sans-serif;
        color: #ffffff !important;
        background: transparent;
        border-radius: 2px;
        text-align: center;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-donate-btn:hover {
        background: linear-gradient(-60deg, #4f8eb0 5%, #7ad0ff 95%);
        color: #ffffff !important;
        text-decoration: none !important;
      }

      @keyframes gs-spin {
        to { transform: rotate(360deg); }
      }
    `);
  
    function loadMemoryCache() {
      if (memoryCache) return memoryCache;
      try {
        memoryCache = JSON.parse(GM_getValue(CACHE_KEY, '{}')) || {};
      } catch {
        memoryCache = {};
      }
      return memoryCache;
    }

    function readCache() {
      return loadMemoryCache();
    }

    function persistCacheNow() {
      if (!cacheDirty || !memoryCache) return;
      GM_setValue(CACHE_KEY, JSON.stringify(memoryCache));
      cacheDirty = false;
    }

    function scheduleCachePersist() {
      cacheDirty = true;
      clearTimeout(cachePersistTimer);
      cachePersistTimer = setTimeout(persistCacheNow, CACHE_PERSIST_MS);
    }

    function writeCache(cache) {
      memoryCache = cache;
      scheduleCachePersist();
    }

    function getCached(appId) {
      const entry = readCache()[String(appId)];
      if (!entry) return null;
      const ttl = entry.missing ? NEGATIVE_CACHE_TTL_MS : CACHE_TTL_MS;
      if (Date.now() - entry.ts > ttl) return null;
      return entry;
    }

    function setCached(appId, payload) {
      const cache = readCache();
      cache[String(appId)] = { ...payload, ts: Date.now() };
      writeCache(cache);
    }
  
    function slugify(text) {
      return String(text || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[™®©'’":]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
    }
  
    function extractAppIdFromHref(href) {
      const match = String(href || '').match(/\/app\/(\d+)(?:\/|$|\?)/i);
      return match ? match[1] : null;
    }
  
    function extractSlugFromHref(href) {
      const match = String(href || '').match(/\/app\/\d+\/([^/?#]+)/i);
      if (!match) return null;
      return slugify(match[1].replace(/_/g, '-'));
    }
  
    function getPageAppId() {
      const fromUrl = extractAppIdFromHref(location.pathname);
      if (fromUrl) return fromUrl;
      if (typeof window.g_rgAppData === 'object' && window.g_rgAppData?.appid) {
        return String(window.g_rgAppData.appid);
      }
      const appDataNode = document.querySelector('[data-appid]');
      return appDataNode?.getAttribute('data-appid') || null;
    }
  
    function getPageTitle() {
      return (
        document.querySelector('.apphub_AppName')?.textContent?.trim() ||
        document.querySelector('#appHubAppName')?.textContent?.trim() ||
        document.title.replace(/\s+on Steam.*$/i, '').trim()
      );
    }
  
    const TITLE_SELECTORS = [
      '.tab_item_title',
      '.search_name .title',
      '.search_result_row .title',
      '.title',
      '.StoreSaleWidgetTitle',
      '[class*="item_title"]',
      '[class*="ItemTitle"]',
    ];
  
    const INVALID_SLUG_RE =
      /^(https?-)?(store-)?steam(powered|static)?(-[a-z0-9]+)*(-com)?$|steampowered|steamstatic|akamaihd/;
  
    function looksLikePriceText(text) {
      const value = String(text || '').replace(/\s+/g, ' ').trim();
      if (!value) return true;
      if (value.length > 100) return true;
      if (/^-\d+%/.test(value)) return true;
      if (/^\d+%?\s*off\b/i.test(value)) return true;
      if (/\b(руб|₽|usd|eur|uah|gbp|cad|aud|try|idr|vnd|kr)\b/i.test(value) && /\d/.test(value)) {
        return true;
      }
      if (/^(released|выход|дата выхода|release date)/i.test(value)) return true;
  
      const digits = (value.match(/\d/g) || []).length;
      return digits > 0 && digits / value.length > 0.45 && /%|руб|₽|\$|€|£/.test(value);
    }
  
    function isValidSlug(slug) {
      if (!slug || slug.length < 2) return false;
      if (!/[a-z]/.test(slug)) return false;
      if (INVALID_SLUG_RE.test(slug)) return false;
      if (/^\d+(-\d+)+$/.test(slug)) return false;
  
      const segments = slug.split('-').filter(Boolean);
      if (!segments.length) return false;
      if (segments.every((part) => /^\d+$/.test(part))) return false;
  
      const numericParts = segments.filter((part) => /^\d+$/.test(part)).length;
      return numericParts / segments.length <= 0.5;
    }
  
    function getCardTitle(card, link) {
      const sources = [];
  
      const add = (value) => {
        const text = String(value || '').replace(/\s+/g, ' ').trim();
        if (text && !looksLikePriceText(text) && !sources.includes(text)) {
          sources.push(text);
        }
      };
  
      for (const selector of TITLE_SELECTORS) {
        const element = card.querySelector(selector);
        if (element) add(element.textContent);
      }
  
      add(
        card.querySelector(
          'img.sale_capsule_image[alt], img.tab_row_capsule[alt], img[class*="capsule"][alt], img[alt]'
        )?.alt
      );
  
      const ariaLabel = link?.getAttribute('aria-label')?.trim();
      if (ariaLabel && !/^\d+%\s*off\b/i.test(ariaLabel) && !looksLikePriceText(ariaLabel)) {
        add(ariaLabel.replace(/\.\s*\d+%\s*off.*$/i, '').trim());
      }
  
      const slugFromHref = extractSlugFromHref(link?.href);
      if (slugFromHref && isValidSlug(slugFromHref)) {
        add(slugFromHref.replace(/-/g, ' '));
      }
  
      if (!sources.length && link?.textContent) {
        const firstLine = link.textContent
          .split('\n')
          .map((line) => line.trim())
          .find((line) => line && !looksLikePriceText(line));
        add(firstLine);
      }
  
      return sources[0] || '';
    }
  
    function buildSlugCandidates(appId, link, title) {
      const candidates = [];
      const addSlug = (slug) => {
        if (slug && isValidSlug(slug) && !candidates.includes(slug)) {
          candidates.push(slug);
        }
      };
      const addFromHref = (href) => addSlug(extractSlugFromHref(href));
      const addFromText = (text) => {
        const normalized = String(text || '').replace(/\s+/g, ' ').trim();
        if (!normalized || looksLikePriceText(normalized)) return;
  
        addSlug(slugify(normalized));
        addSlug(slugify(normalized.replace(/\s*[-–—:|].*$/, '')));
      };
  
      addFromHref(link?.href);
  
      if (isGamePage()) {
        addFromHref(location.pathname);
        addFromHref(document.querySelector('link[rel="canonical"]')?.href);
        addFromHref(document.querySelector('meta[property="og:url"]')?.content);
      }
  
      addFromText(title);
  
      return candidates;
    }
  
    function isGamePage() {
      return /\/app\/\d+/i.test(location.pathname);
    }
  
    function requestJson(url) {
      const language = getApiLanguage();
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          headers: {
            Accept: 'application/json',
            'Accept-Language': language,
          },
          timeout: 15000,
          onload(response) {
            if (response.status === 404) {
              resolve(null);
              return;
            }
            if (response.status < 200 || response.status >= 300) {
              reject(new Error(`HTTP ${response.status}`));
              return;
            }
            try {
              resolve(JSON.parse(response.responseText));
            } catch (error) {
              reject(error);
            }
          },
          onerror: () => reject(new Error('Network error')),
          ontimeout: () => reject(new Error('Timeout')),
        });
      });
    }
  
    function isMatchingGame(data, appId) {
      if (!data) return false;
      if (!data.steam_prod_id) return true;
      return String(data.steam_prod_id) === String(appId);
    }
  
    function buildApiUrl(slug) {
      return `${API_BASE}/${encodeURIComponent(slug)}/`;
    }
  
    function getTriedUrls(entry) {
      if (entry?.triedUrls?.length) return entry.triedUrls;
      if (entry?.slugs?.length) return entry.slugs.map(buildApiUrl);
      if (entry?.slug) return [buildApiUrl(entry.slug)];
      return [];
    }
  
    function truncateText(text, maxLength = 140) {
      const value = String(text || '').trim();
      if (value.length <= maxLength) return value;
      return `${value.slice(0, maxLength - 1).trim()}…`;
    }
  
    function formatDate(value) {
      if (!value) return null;
      const date = parseGameDate(value);
      if (!date) return value;
      return date.toLocaleDateString(getApiLanguage());
    }
  
    function formatScore(value) {
      if (value === null || value === undefined || value === '') return null;
      const number = Number(value);
      return Number.isFinite(number) ? `${number}` : String(value);
    }
  
    async function fetchBySlug(slug, appId) {
      const data = await requestJson(buildApiUrl(slug));
      return isMatchingGame(data, appId) ? data : null;
    }
  
    async function resolveGame(appId, link, title) {
      const cached = getCached(appId);
      if (cached) return cached;
  
      const slugs = buildSlugCandidates(appId, link, title);
      const triedUrls = slugs.map(buildApiUrl);
      const slugsToTry = slugs.slice(0, MAX_SLUG_ATTEMPTS);

      for (const slug of slugsToTry) {
        try {
          const data = await fetchBySlug(slug, appId);
          if (data) {
            const entry = {
              data,
              slug,
              slugs,
              triedUrls,
              apiUrl: buildApiUrl(slug),
              missing: false,
            };
            setCached(appId, entry);
            return entry;
          }
        } catch {
          // try next slug
        }
      }
  
      const entry = {
        data: null,
        slug: slugs[0] || null,
        slugs,
        triedUrls,
        missing: true,
      };
      setCached(appId, entry);
      return entry;
    }
  
    function startQueueItem(item) {
      activeRequests += 1;
      item
        .task()
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          activeRequests -= 1;
          setTimeout(drainQueue, REQUEST_DELAY_MS);
        });
    }

    function drainQueue() {
      while (activeRequests < MAX_CONCURRENT && queue.length > 0) {
        startQueueItem(queue.shift());
      }
    }

    function enqueue(task) {
      return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject });
        drainQueue();
      });
    }

    function loadGame(appId, link, title) {
      const key = String(appId);
      const cached = getCached(key);
      if (cached) return Promise.resolve(cached);

      if (!inflight.has(key)) {
        inflight.set(
          key,
          enqueue(() => resolveGame(appId, link, title)).finally(() => {
            inflight.delete(key);
          })
        );
      }
      return inflight.get(key);
    }
  
    function parseGameDate(value) {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    function getNotCrackedVariant(game) {
      const release = parseGameDate(game.release_date);
      if (!release) return 'not-cracked-recent';

      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return release > monthAgo ? 'not-cracked-recent' : 'not-cracked-old';
    }

    function getStatusType(game) {
      if (!game) return 'missing';

      const status = String(game.readable_status || '').toLowerCase();
      const groups = String(game.hacked_groups_en || game.hacked_groups || '').toLowerCase();

      if (/release today|релиз сегодня|выходит сегодня/.test(status)) {
        return 'release-today';
      }
      if (/bypass|обход|hypervisor/.test(groups) || /bypass|обход/.test(status)) {
        return 'bypass';
      }
      if (/not cracked|не взлом|не взломан|unbroken|unreleased crack/.test(status)) {
        return getNotCrackedVariant(game);
      }
      if (game.crack_date || /cracked|взлом/.test(status)) {
        return 'cracked';
      }
      return 'unknown';
    }

    function getStatusLabel(game, type) {
      if (!game) return t('notInDatabase');
      if (game.readable_status) return game.readable_status;
      if (type === 'cracked') return t('cracked');
      if (type === 'not-cracked-recent' || type === 'not-cracked-old') return t('notCracked');
      if (type === 'bypass') return t('protectionBypass');
      if (type === 'release-today') return t('releaseToday');
      return t('unknownStatus');
    }
  
    function tooltipRow(label, value) {
      if (!value) return '';
      return `
        <div class="gs-tip-row">
          <span class="gs-tip-label">${escapeHtml(label)}</span>
          <span class="gs-tip-value">${escapeHtml(value)}</span>
        </div>
      `;
    }

    function formatTooltipActions(torrentLink = null) {
      const buttons = [
        torrentLink
          ? `<a class="gs-tip-torrent-btn" href="${escapeAttr(torrentLink)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(t('torrent'))}</span></a>`
          : '',
        `<a class="gs-tip-donate-btn" href="${escapeAttr(DONATE_URL)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(t('supportProject'))}</span></a>`,
      ].filter(Boolean);

      return `<div class="gs-tip-actions">${buttons.join('')}</div>`;
    }
  
    function formatTooltip(entry) {
      const game = entry?.data || null;
  
      if (!game) {
        const urls = getTriedUrls(entry);
        const links = urls.length
          ? `<div class="gs-tip-section">
              <span class="gs-tip-label">${escapeHtml(t('checkedUrls'))}</span>
              <ul class="gs-tip-links">
                ${urls
                  .map(
                    (url) =>
                      `<li><a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`
                  )
                  .join('')}
              </ul>
            </div>`
          : '';
  
        return `<strong>GameStatus</strong><p class="gs-tip-muted">${escapeHtml(t('gameNotFound'))}</p>${links}${formatTooltipActions()}`;
      }
  
      const rows = [
        tooltipRow(t('status'), game.readable_status),
        tooltipRow(t('protection'), game.protections),
        tooltipRow(t('group'), getLocalizedGroup(game)),
        tooltipRow(t('release'), formatDate(game.release_date)),
        tooltipRow(t('crack'), formatDate(game.crack_date)),
        tooltipRow(t('steamId'), game.steam_prod_id),
        tooltipRow(t('score'), formatScore(game.user_score)),
        tooltipRow(t('metacritic'), formatScore(game.mata_score)),
        tooltipRow(t('type'), game.is_AAA ? 'AAA' : null),
        tooltipRow(t('subscriptions'), game.count_subscribe),
      ].join('');
  
      const specs = game.specs_info;
      const specLines = specs
        ? [
            specs.cpu_info && `CPU: ${specs.cpu_info}`,
            specs.ram_info && `RAM: ${specs.ram_info}`,
            specs.gpu_info && `GPU: ${specs.gpu_info}`,
            specs.os_info && `OS: ${specs.os_info}`,
          ].filter(Boolean)
        : [];
      const specsBlock = specLines.length
        ? `<div class="gs-tip-section">${tooltipRow(t('hardware'), specLines.join(' · '))}</div>`
        : '';
  
      const description = truncateText(getLocalizedDescription(game));
      const descriptionBlock = description
        ? `<div class="gs-tip-section"><p class="gs-tip-desc">${escapeHtml(description)}</p></div>`
        : '';
  
      const pageUrl = game.slug ? `${SITE_BASE}/${game.slug}` : SITE_BASE;
      const apiUrl = entry.apiUrl || (game.slug ? buildApiUrl(game.slug) : null);
      const footerLinks = [
        apiUrl
          ? `<a href="${escapeAttr(apiUrl)}" target="_blank" rel="noopener noreferrer">API</a>`
          : '',
        `<a href="${escapeAttr(pageUrl)}" target="_blank" rel="noopener noreferrer">GameStatus</a>`,
      ]
        .filter(Boolean)
        .join(' · ');

      const torrentButton = formatTooltipActions(game.torrent_link || null);

      return `
        <strong>${escapeHtml(game.title || 'GameStatus')}</strong>
        <div class="gs-tip-section">${rows}</div>
        ${specsBlock}
        ${descriptionBlock}
        ${torrentButton}
        <div class="gs-tip-footer">${footerLinks}</div>
      `;
    }
  
    function escapeAttr(value) {
      return escapeHtml(value).replace(/`/g, '&#96;');
    }
  
    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  
    let tooltipEl = null;
  
    function ensureTooltip() {
      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = `${BADGE_CLASS}__tooltip`;
        document.documentElement.appendChild(tooltipEl);
      }
      return tooltipEl;
    }
  
    function bindTooltip(badge, entry) {
      const activate = () => {
        badge.removeEventListener('mouseenter', activate);
        badge.removeEventListener('focus', activate);

        const tip = ensureTooltip();
        let hideTimer = null;

        const show = () => {
          clearTimeout(hideTimer);
          tip.innerHTML = formatTooltip(entry);
          tip.classList.add(`${BADGE_CLASS}__tooltip--visible`, `${BADGE_CLASS}__tooltip--interactive`);

          const rect = badge.getBoundingClientRect();
          const tipRect = tip.getBoundingClientRect();
          const pad = 15;
          let left = rect.left;
          let top = rect.top - tipRect.height - 7;

          if (top < pad) {
            top = rect.bottom + 7;
          }

          if (top + tipRect.height > window.innerHeight - pad) {
            top = Math.max(pad, rect.top - tipRect.height - 7);
          }

          if (left + tipRect.width > window.innerWidth - pad) {
            left = window.innerWidth - tipRect.width - pad;
          }

          tip.style.left = `${Math.max(pad, left)}px`;
          tip.style.top = `${Math.max(pad, top)}px`;
        };

        const scheduleHide = () => {
          clearTimeout(hideTimer);
          hideTimer = setTimeout(() => {
            tip.classList.remove(`${BADGE_CLASS}__tooltip--visible`, `${BADGE_CLASS}__tooltip--interactive`);
          }, 120);
        };

        badge.addEventListener('mouseenter', show);
        badge.addEventListener('focus', show);
        badge.addEventListener('mouseleave', scheduleHide);
        badge.addEventListener('blur', scheduleHide);

        tip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
        tip.addEventListener('mouseleave', scheduleHide);

        show();
      };

      badge.addEventListener('mouseenter', activate);
      badge.addEventListener('focus', activate);
    }
  
    function createLoaderBadge(isPage = false) {
      const badge = document.createElement('span');
      const pageClasses = isPage ? ` btnv6_blue_hoverfade btn_medium ${BADGE_CLASS}--page` : '';
      badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--loading${pageClasses}`;
      if (isPage) {
        badge.innerHTML = `<span><span class="${BADGE_CLASS}__dot"></span><span class="${BADGE_CLASS}__label">${escapeHtml(t('loading'))}</span></span>`;
      } else {
        badge.innerHTML = `<span class="${BADGE_CLASS}__dot"></span><span class="${BADGE_CLASS}__label">${escapeHtml(t('loading'))}</span>`;
      }
      return badge;
    }

    function renderBadge(entry, options = {}) {
      const { isPage = false } = options;
      const game = entry?.data || null;
      const type = getStatusType(game);
      const label = getStatusLabel(game, type);
      const href = game?.slug ? `${SITE_BASE}/${game.slug}` : SITE_BASE;

      const badge = document.createElement('a');
      const pageClasses = isPage ? ` btnv6_blue_hoverfade btn_medium ${BADGE_CLASS}--page` : '';
      badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--${type}${pageClasses}`;
      badge.href = href;
      badge.target = '_blank';
      badge.rel = 'noopener noreferrer';
      badge.setAttribute('data-gs-processed', '1');

      if (isPage) {
        badge.innerHTML = `<span><span class="${BADGE_CLASS}__dot"></span><span class="${BADGE_CLASS}__label">${escapeHtml(label)}</span></span>`;
      } else {
        badge.innerHTML = `<span class="${BADGE_CLASS}__dot"></span><span class="${BADGE_CLASS}__label">${escapeHtml(label)}</span>`;
      }

      bindTooltip(badge, entry);
      return badge;
    }
  
    function ensureRelativePosition(element) {
      const inlinePosition = element.style.position;
      if (inlinePosition && inlinePosition !== 'static') return;
      if (!inlinePosition) {
        const computed = getComputedStyle(element).position;
        if (computed !== 'static') return;
      }
      element.style.position = 'relative';
    }

    function pauseMutationObserver() {
      mutationObserver?.disconnect();
    }

    function resumeMutationObserver() {
      if (mutationObserver && document.body) {
        mutationObserver.observe(document.body, MUTATION_OBSERVER_OPTIONS);
      }
    }

    function isRelevantAddedNode(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) return false;
      const el = /** @type {Element} */ (node);
      if (el.classList?.contains(BADGE_CLASS)) return false;
      if (el.closest?.(`.${BADGE_CLASS}__tooltip`)) return false;
      if (el.closest?.('[data-gs-observed="1"]')) return false;
      if (el.matches?.('a[href*="/app/"]')) return true;
      return Boolean(el.querySelector?.('a[href*="/app/"]'));
    }

    function collectRelevantAddedNodes(mutations) {
      const nodes = [];
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (isRelevantAddedNode(node)) {
            nodes.push(/** @type {Element} */ (node));
          }
        }
      }
      return nodes;
    }

    function getCardAppId(card) {
      if (!card) return null;
      return card.getAttribute('data-ds-appid') || card.dataset.dsAppid || null;
    }

    function resolveCardAppId(card, fallbackAppId) {
      return getCardAppId(card) || String(fallbackAppId || '');
    }

    function tryAddCardFromLink(link, cards) {
      if (link.classList.contains(BADGE_CLASS)) return;
      if (link.closest('[data-gs-observed="1"]')) return;
      if (link.closest('.home_content_reason')) return;

      const appId = extractAppIdFromHref(link.href);
      if (!appId) return;

      const card = findCardContainer(link);
      if (!card || card.closest('.apphub_AppName, .game_area_purchase, #game_highlights')) return;

      const cardAppId = getCardAppId(card);
      if (cardAppId && cardAppId !== appId) return;

      const anchor = getBadgeAnchor(card);
      if (anchor.querySelector(`.${BADGE_CLASS}:not(.${BADGE_CLASS}--loading)`)) return;
      if (anchor.dataset.gsObserved === '1' && anchor.querySelector(`.${BADGE_CLASS}--loading`)) return;

      const cardLink = getCardLink(card);
      const title = getCardTitle(card, cardLink);
      const resolvedAppId = cardAppId || appId;
      const existing = cards.get(resolvedAppId);
      if (!existing || shouldPreferCard(card, existing.card)) {
        cards.set(resolvedAppId, { card, link: cardLink, title });
      }
    }

    function collectCardsFromRoot(root, cards = new Map()) {
      if (root instanceof HTMLAnchorElement && root.href.includes('/app/')) {
        tryAddCardFromLink(root, cards);
      }
      root.querySelectorAll('a[href*="/app/"]').forEach((link) => tryAddCardFromLink(link, cards));
      return cards;
    }
  
    function resolveCardLink(card) {
      if (card instanceof HTMLAnchorElement && /\/app\/\d+/i.test(card.href)) {
        return card;
      }
      return getCardLink(card);
    }
  
    function findHomeContentGamelink(link) {
      const homeRoot = link.closest('.home_content.single, .home_content_single_ctn');
      if (!homeRoot) return null;

      const gamelink = homeRoot.querySelector('.home_content_items[data-ds-appid], .gamelink[data-ds-appid]');
      if (!gamelink) return null;

      const linkAppId = extractAppIdFromHref(link.href);
      const cardAppId = getCardAppId(gamelink);
      if (linkAppId && cardAppId && linkAppId !== cardAppId) return null;

      return gamelink;
    }

    function getBadgeAnchor(card) {
      if (!card) return card;

      const imageAnchor =
        card.querySelector('.microtrailer_wrapper') ||
        card.querySelector('.capsule_image_ctn') ||
        card.querySelector('a.capsule_image_ctn');

      if (imageAnchor) return imageAnchor;

      const homeRoot = card.closest('.home_content.single, .home_content_single_ctn');
      if (homeRoot) {
        const gamelink = homeRoot.querySelector('.home_content_items[data-ds-appid], .gamelink[data-ds-appid]');
        return (
          gamelink?.querySelector('.microtrailer_wrapper') ||
          gamelink?.querySelector('.capsule_image_ctn') ||
          gamelink?.querySelector('a.capsule_image_ctn') ||
          gamelink ||
          card
        );
      }

      return card;
    }

    function cleanupMisplacedHomeBadge(card) {
      const homeRoot = card.closest('.home_content.single, .home_content_single_ctn');
      if (!homeRoot) return;

      homeRoot.querySelectorAll('.single_buttonbar .' + BADGE_CLASS).forEach((badge) => badge.remove());
    }

    function shouldPreferCard(candidate, current) {
      if (!current) return true;
      if (current.contains(candidate)) return false;
      if (candidate.contains(current)) return true;

      const candidateAnchor = getBadgeAnchor(candidate);
      const currentAnchor = getBadgeAnchor(current);
      const candidateHasImage = candidateAnchor !== candidate;
      const currentHasImage = currentAnchor !== current;
      return candidateHasImage && !currentHasImage;
    }

    function findCardContainer(link) {
      const homeGamelink = findHomeContentGamelink(link);
      if (homeGamelink) return homeGamelink;

      const container = link.closest(
        [
          '[data-ds-appid]',
          '.sale_capsule',
          '.tab_row_item',
          '.search_result_row',
          '.browse_item',
          '.store_capsule',
          '.capsule',
          '.home_content_items',
          '.gamelink',
          '.Panel',
          'div[class*="Capsule"]',
          'div[class*="Item"]',
        ].join(', ')
      );

      if (container?.classList.contains('single_buttonbar')) {
        const gamelink = findHomeContentGamelink(link);
        if (gamelink) return gamelink;
      }

      return container || link.parentElement;
    }
  
    function getCardLink(card) {
      if (card instanceof HTMLAnchorElement && card.href.includes('/app/')) {
        return card;
      }

      const cardAppId = getCardAppId(card);
      if (cardAppId) {
        const matchedLink = card.querySelector(`a[href*="/app/${cardAppId}/"]`);
        if (matchedLink) return matchedLink;
      }

      return card.querySelector('a[href*="/app/"]');
    }
  
    function collectCards() {
      return collectCardsFromRoot(document);
    }

    function collectCardsFromNodes(nodes) {
      const cards = new Map();
      nodes.forEach((node) => collectCardsFromRoot(node, cards));
      return cards;
    }

    function enqueueHydration(card, appId, link, title) {
      const anchor = getBadgeAnchor(card);
      visibilityObserver.unobserve(anchor);
      hydrationQueue.push({ card, appId, link, title });
      if (!isScrolling) {
        flushHydrationQueue();
      }
    }

    function flushHydrationQueue() {
      if (hydrateFlushRaf || hydrationQueue.length === 0 || isScrolling) return;

      hydrateFlushRaf = requestAnimationFrame(() => {
        hydrateFlushRaf = null;
        const batch = hydrationQueue.splice(0, HYDRATE_BATCH_SIZE);
        batch.forEach(({ card, appId, link, title }) => {
          hydrateCard(card, appId, link, title);
        });
        if (hydrationQueue.length > 0) {
          flushHydrationQueue();
        }
      });
    }

    function setupScrollListener() {
      window.addEventListener(
        'scroll',
        () => {
          isScrolling = true;
          clearTimeout(scrollIdleTimer);
          scrollIdleTimer = setTimeout(() => {
            isScrolling = false;
            flushHydrationQueue();
          }, SCROLL_IDLE_MS);
        },
        { passive: true }
      );
    }

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const anchor = entry.target;
          const card =
            anchor.closest('.home_content_items[data-ds-appid], .gamelink[data-ds-appid], [data-ds-appid]') ||
            anchor;
          const appId = resolveCardAppId(card, anchor.dataset.gsAppId);
          if (!appId) return;

          const link = getCardLink(card) || resolveCardLink(card);
          const title = anchor.dataset.gsTitle || getCardTitle(card, link);
          enqueueHydration(card, appId, link, title);
        });
      },
      { root: null, rootMargin: CARD_ROOT_MARGIN, threshold: 0.05 }
    );

    function resetBadgeAnchor(anchor) {
      anchor.querySelectorAll(`.${BADGE_CLASS}`).forEach((badge) => badge.remove());
      visibilityObserver.unobserve(anchor);
      delete anchor.dataset.gsObserved;
      delete anchor.dataset.gsAppId;
      delete anchor.dataset.gsTitle;
    }

    async function hydrateCard(card, appId, link, title) {
      const anchor = getBadgeAnchor(card);
      const resolvedAppId = resolveCardAppId(card, appId);
      const resolvedLink = getCardLink(card) || link;
      const resolvedTitle = title || getCardTitle(card, resolvedLink);
      const loader = anchor.querySelector(`.${BADGE_CLASS}--loading`);
      try {
        const entry = await loadGame(resolvedAppId, resolvedLink, resolvedTitle);
        const badge = renderBadge(entry, { isPage: false });
        requestAnimationFrame(() => {
          loader?.replaceWith(badge);
        });
      } catch {
        const badge = renderBadge({ data: null, missing: true, triedUrls: [] }, { isPage: false });
        badge.querySelector(`.${BADGE_CLASS}__label`).textContent = t('loadError');
        requestAnimationFrame(() => {
          loader?.replaceWith(badge);
        });
      }
    }

    function observeCardsMap(cards) {
      if (!cards.size) return;

      pauseMutationObserver();
      requestAnimationFrame(() => {
        try {
          cards.forEach(({ card, link, title }, appId) => {
            const resolvedAppId = resolveCardAppId(card, appId);
            if (getCardAppId(card) && String(appId) !== resolvedAppId) return;

            const anchor = getBadgeAnchor(card);
            if (anchor.dataset.gsObserved === '1') {
              if (anchor.dataset.gsAppId === resolvedAppId) return;
              resetBadgeAnchor(anchor);
            }

            cleanupMisplacedHomeBadge(card);
            ensureRelativePosition(anchor);
            anchor.dataset.gsObserved = '1';
            anchor.dataset.gsAppId = resolvedAppId;
            anchor.dataset.gsTitle = title;
            card.dataset.gsObserved = '1';

            if (!anchor.querySelector(`.${BADGE_CLASS}`)) {
              anchor.appendChild(createLoaderBadge(false));
            }

            visibilityObserver.observe(anchor);
          });
        } finally {
          resumeMutationObserver();
        }
      });
    }

    function observeCards() {
      observeCardsMap(collectCards());
    }

    function observeCardsFromNodes(nodes) {
      observeCardsMap(collectCardsFromNodes(nodes));
    }
  
    async function renderGamePage() {
      const appId = getPageAppId();
      if (!appId) return;

      const anchor = document.querySelector('.apphub_OtherSiteInfo');
      if (!anchor || anchor.dataset.gsPageProcessed === '1') return;
      if (anchor.querySelector(`.${BADGE_CLASS}`)) return;

      anchor.dataset.gsPageProcessed = '1';

      const loader = createLoaderBadge(true);
      anchor.prepend(loader);

      const title = getPageTitle();
      const link = document.querySelector(`a[href*="/app/${appId}/"]`) || { href: location.pathname };

      try {
        const entry = await loadGame(appId, link, title);
        loader.replaceWith(renderBadge(entry, { isPage: true }));
      } catch {
        const badge = renderBadge({ data: null, missing: true, triedUrls: [] }, { isPage: true });
        badge.querySelector(`.${BADGE_CLASS}__label`).textContent = t('loadError');
        loader.replaceWith(badge);
      }
    }
  
    function debounce(fn, delay) {
      let timer = null;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    }
  
    function runScan() {
      if (isGamePage()) {
        renderGamePage();
        pendingScanNodes.length = 0;
        return;
      }

      if (!hasInitialScan) {
        hasInitialScan = true;
        pendingScanNodes.length = 0;
        observeCards();
        return;
      }

      if (pendingScanNodes.length > 0) {
        const nodes = pendingScanNodes.splice(0, pendingScanNodes.length);
        observeCardsFromNodes(nodes);
      } else {
        observeCards();
      }
    }

    const scheduleScan = debounce(runScan, SCAN_DEBOUNCE_MS);

    function init() {
      loadMemoryCache();
      setupScrollListener();
      window.addEventListener('pagehide', persistCacheNow);
      scheduleScan();

      mutationObserver = new MutationObserver((mutations) => {
        const nodes = collectRelevantAddedNodes(mutations);
        if (!nodes.length) return;
        pendingScanNodes.push(...nodes);
        scheduleScan();
      });

      mutationObserver.observe(document.body, MUTATION_OBSERVER_OPTIONS);
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
  