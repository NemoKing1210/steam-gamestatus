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

(function () {
    'use strict';
  
    const API_BASE = 'https://gamestatus.info/back/api/gameinfo/game';
    const SITE_BASE = 'https://gamestatus.info';
    const DONATE_URL = `${SITE_BASE}/#donate`;
    const REPO_URL = 'https://github.com/NemoKing1210/steam-gamestatus';
    const CACHE_KEY = 'gs_steam_cache_v5';
    const SETTINGS_KEY = 'gs_steam_settings';
    const CACHE_HOURS_MAX = 168;
    const DEFAULT_SETTINGS = {
      cacheHours: 6,
      badgeVertical: 'top',
      badgeHorizontal: 'left',
      badgeSize: 'medium',
      showMissingBadge: true,
    };
    const MAX_CONCURRENT = 2;
    const CARD_ROOT_MARGIN = '80px 0px';
    const SCAN_DEBOUNCE_MS = 450;
    const SCROLL_IDLE_MS = 150;
    const CACHE_PERSIST_MS = 1000;
    const REQUEST_DELAY_MS = 75;
    const HYDRATE_BATCH_SIZE = 3;
    const MAX_SLUG_ATTEMPTS = 2;
    const BADGE_CLASS = 'gs-steam-badge';
    const STEAM_APPDETAILS_URL = 'https://store.steampowered.com/api/appdetails';

    const SUPPORTED_LOCALES = ['en', 'ru', 'zh', 'es', 'pt', 'de', 'fr', 'ja', 'ko', 'pl'];

    const TRANSLATIONS = {
      en: {
        notInDatabase: 'Not in database',
        cracked: 'Ready',
        notCracked: 'Pending',
        protectionBypass: 'Protection bypass',
        releaseToday: 'Release today',
        unknownStatus: 'Unknown status',
        checkedUrls: 'Checked URLs',
        gameNotFound: 'Game not found in the gamestatus.info database',
        status: 'Status',
        protection: 'Protection',
        group: 'Group',
        release: 'Release',
        crack: 'Updated',
        steamId: 'Steam ID',
        score: 'Score',
        metacritic: 'Metacritic',
        type: 'Type',
        subscriptions: 'Subscriptions',
        hardware: 'Hardware',
        supportProject: 'Support project',
        loadError: 'Load error',
        loading: 'GameStatus…',
        menuSettings: 'Steam GameStatus — Settings',
        btnTitle: 'Steam GameStatus',
        btnText: 'GameStatus',
        panelTitle: 'GameStatus',
        panelSubtitle: 'Badges · cache · display options',
        close: 'Close',
        cancel: 'Cancel',
        save: 'Save',
        saveReload: 'Save & Reload page',
        sectionBadge: 'Badge',
        sectionCache: 'Cache',
        badgePosition: 'Position on cards',
        badgeVertical: 'Vertical',
        badgeHorizontal: 'Horizontal',
        posTop: 'Top',
        posBottom: 'Bottom',
        posLeft: 'Left',
        posRight: 'Right',
        badgePositionHint: 'Applies to badges on store cards. Game page chips stay in the header.',
        badgeSize: 'Size on cards',
        sizeSmall: 'Small',
        sizeMedium: 'Medium',
        sizeLarge: 'Large',
        sizeXLarge: 'Very large',
        badgeSizeHint: 'Applies to badges on store cards. Game page chips stay the same size.',
        showMissing: 'Show “not in database” badges',
        showMissingHint: 'When off, cards without a GameStatus match stay unmarked.',
        on: 'ON',
        off: 'OFF',
        cacheHours: 'Cache duration (hours)',
        cacheHoursHint:
          'How long to reuse API results (including not-found). 0 disables cache. Clear cache or reload to refetch sooner.',
        clearCache: 'Clear cache',
        cacheCleared: 'Cache cleared ({count})',
        cacheEmpty: 'Cache is empty',
        cacheClearHint: 'Removes all stored GameStatus lookups from this browser profile.',
        repoLink: 'GitHub',
        repoAbout: 'Source code, updates, and issue reports',
      },
      ru: {
        notInDatabase: 'Нет в базе',
        cracked: 'Готово',
        notCracked: 'Ожидание',
        protectionBypass: 'Обход защиты',
        releaseToday: 'Релиз сегодня',
        unknownStatus: 'Статус неизвестен',
        checkedUrls: 'Проверенные URL',
        gameNotFound: 'Игра не найдена в базе gamestatus.info',
        status: 'Статус',
        protection: 'Защита',
        group: 'Группа',
        release: 'Релиз',
        crack: 'Обновлено',
        steamId: 'Steam ID',
        score: 'Оценка',
        metacritic: 'Metacritic',
        type: 'Тип',
        subscriptions: 'Подписки',
        hardware: 'Железо',
        supportProject: 'Поддержать проект',
        loadError: 'Ошибка загрузки',
        loading: 'GameStatus…',
        menuSettings: 'Steam GameStatus — Настройки',
        btnTitle: 'Steam GameStatus',
        btnText: 'GameStatus',
        panelTitle: 'GameStatus',
        panelSubtitle: 'Бейджи · кеш · отображение',
        close: 'Закрыть',
        cancel: 'Отмена',
        save: 'Сохранить',
        saveReload: 'Сохранить и обновить',
        sectionBadge: 'Бейдж',
        sectionCache: 'Кеш',
        badgePosition: 'Положение на карточках',
        badgeVertical: 'По вертикали',
        badgeHorizontal: 'По горизонтали',
        posTop: 'Сверху',
        posBottom: 'Снизу',
        posLeft: 'Слева',
        posRight: 'Справа',
        badgePositionHint: 'Для бейджей на карточках магазина. На странице игры чип остаётся в шапке.',
        badgeSize: 'Размер на карточках',
        sizeSmall: 'Маленький',
        sizeMedium: 'Средний',
        sizeLarge: 'Большой',
        sizeXLarge: 'Очень большой',
        badgeSizeHint: 'Для бейджей на карточках магазина. На странице игры размер чипа не меняется.',
        showMissing: 'Показывать «нет в базе»',
        showMissingHint: 'Если выключено, карточки без записи в GameStatus остаются без бейджа.',
        on: 'ВКЛ',
        off: 'ВЫКЛ',
        cacheHours: 'Время кеширования (часы)',
        cacheHoursHint:
          'Как долго хранить ответы API (включая «не найдено»). 0 отключает кеш. Сброс кеша или обновление страницы — для немедленного запроса.',
        clearCache: 'Сбросить кеш',
        cacheCleared: 'Кеш очищен ({count})',
        cacheEmpty: 'Кеш пуст',
        cacheClearHint: 'Удаляет все сохранённые ответы GameStatus в этом профиле браузера.',
        repoLink: 'GitHub',
        repoAbout: 'Исходный код, обновления и сообщения об ошибках',
      },
      zh: {
        notInDatabase: '未收录',
        cracked: '就绪',
        notCracked: '待定',
        protectionBypass: '保护绕过',
        releaseToday: '今日发售',
        unknownStatus: '状态未知',
        checkedUrls: '已检查的 URL',
        gameNotFound: '在 gamestatus.info 数据库中未找到该游戏',
        status: '状态',
        protection: '保护',
        group: '组织',
        release: '发售',
        crack: '更新',
        steamId: 'Steam ID',
        score: '评分',
        metacritic: 'Metacritic',
        type: '类型',
        subscriptions: '订阅数',
        hardware: '硬件',
        supportProject: '支持项目',
        loadError: '加载失败',
        loading: 'GameStatus…',
        menuSettings: 'Steam GameStatus — 设置',
        btnTitle: 'Steam GameStatus',
        btnText: 'GameStatus',
        panelTitle: 'GameStatus',
        panelSubtitle: '徽章 · 缓存 · 显示选项',
        close: '关闭',
        cancel: '取消',
        save: '保存',
        saveReload: '保存并刷新页面',
        sectionBadge: '徽章',
        sectionCache: '缓存',
        badgePosition: '卡片上的位置',
        badgeVertical: '垂直',
        badgeHorizontal: '水平',
        posTop: '顶部',
        posBottom: '底部',
        posLeft: '左侧',
        posRight: '右侧',
        badgePositionHint: '适用于商店卡片上的徽章。游戏页徽章仍在页头。',
        badgeSize: '卡片上的大小',
        sizeSmall: '小',
        sizeMedium: '中',
        sizeLarge: '大',
        sizeXLarge: '特大',
        badgeSizeHint: '适用于商店卡片上的徽章。游戏页徽章大小不变。',
        showMissing: '显示“未收录”徽章',
        showMissingHint: '关闭后，未在 GameStatus 找到的游戏不显示徽章。',
        on: '开',
        off: '关',
        cacheHours: '缓存时长（小时）',
        cacheHoursHint: '复用 API 结果（含未找到）的时间。0 禁用缓存。清空缓存或刷新可立即重新请求。',
        clearCache: '清空缓存',
        cacheCleared: '已清空缓存（{count}）',
        cacheEmpty: '缓存为空',
        cacheClearHint: '删除此浏览器配置中保存的全部 GameStatus 查询结果。',
        repoLink: 'GitHub',
        repoAbout: '源代码、更新与问题反馈',
      },
      es: {
        notInDatabase: 'No está en la base de datos',
        cracked: 'Listo',
        notCracked: 'Pendiente',
        protectionBypass: 'Bypass de protección',
        releaseToday: 'Lanzamiento hoy',
        unknownStatus: 'Estado desconocido',
        checkedUrls: 'URLs comprobadas',
        gameNotFound: 'Juego no encontrado en la base de datos de gamestatus.info',
        status: 'Estado',
        protection: 'Protección',
        group: 'Grupo',
        release: 'Lanzamiento',
        crack: 'Actualizado',
        steamId: 'Steam ID',
        score: 'Puntuación',
        metacritic: 'Metacritic',
        type: 'Tipo',
        subscriptions: 'Suscripciones',
        hardware: 'Hardware',
        supportProject: 'Apoyar el proyecto',
        loadError: 'Error de carga',
        loading: 'GameStatus…',
        menuSettings: 'Steam GameStatus — Ajustes',
        btnTitle: 'Steam GameStatus',
        btnText: 'GameStatus',
        panelTitle: 'GameStatus',
        panelSubtitle: 'Insignias · caché · visualización',
        close: 'Cerrar',
        cancel: 'Cancelar',
        save: 'Guardar',
        saveReload: 'Guardar y recargar',
        sectionBadge: 'Insignia',
        sectionCache: 'Caché',
        badgePosition: 'Posición en las cartas',
        badgeVertical: 'Vertical',
        badgeHorizontal: 'Horizontal',
        posTop: 'Arriba',
        posBottom: 'Abajo',
        posLeft: 'Izquierda',
        posRight: 'Derecha',
        badgePositionHint: 'Aplica a insignias en cartas de la tienda. En la página del juego permanece en la cabecera.',
        badgeSize: 'Tamaño en las tarjetas',
        sizeSmall: 'Pequeño',
        sizeMedium: 'Mediano',
        sizeLarge: 'Grande',
        sizeXLarge: 'Muy grande',
        badgeSizeHint: 'Aplica a las insignias en las tarjetas de la tienda. En la página del juego el tamaño no cambia.',
        showMissing: 'Mostrar “no está en la base”',
        showMissingHint: 'Si está desactivado, las cartas sin coincidencia en GameStatus quedan sin insignia.',
        on: 'ON',
        off: 'OFF',
        cacheHours: 'Duración de caché (horas)',
        cacheHoursHint:
          'Cuánto reutilizar resultados de la API (incluido no encontrado). 0 desactiva la caché. Vaciar o recargar para pedir de nuevo.',
        clearCache: 'Vaciar caché',
        cacheCleared: 'Caché vaciada ({count})',
        cacheEmpty: 'La caché está vacía',
        cacheClearHint: 'Elimina todas las consultas de GameStatus guardadas en este perfil del navegador.',
        repoLink: 'GitHub',
        repoAbout: 'Código fuente, actualizaciones e informes de errores',
      },
      pt: {
        notInDatabase: 'Não está no banco de dados',
        cracked: 'Pronto',
        notCracked: 'Pendente',
        protectionBypass: 'Bypass de proteção',
        releaseToday: 'Lançamento hoje',
        unknownStatus: 'Status desconhecido',
        checkedUrls: 'URLs verificadas',
        gameNotFound: 'Jogo não encontrado no banco de dados do gamestatus.info',
        status: 'Status',
        protection: 'Proteção',
        group: 'Grupo',
        release: 'Lançamento',
        crack: 'Atualizado',
        steamId: 'Steam ID',
        score: 'Pontuação',
        metacritic: 'Metacritic',
        type: 'Tipo',
        subscriptions: 'Inscrições',
        hardware: 'Hardware',
        supportProject: 'Apoiar o projeto',
        loadError: 'Erro ao carregar',
        loading: 'GameStatus…',
        menuSettings: 'Steam GameStatus — Configurações',
        btnTitle: 'Steam GameStatus',
        btnText: 'GameStatus',
        panelTitle: 'GameStatus',
        panelSubtitle: 'Emblemas · cache · exibição',
        close: 'Fechar',
        cancel: 'Cancelar',
        save: 'Salvar',
        saveReload: 'Salvar e recarregar',
        sectionBadge: 'Emblema',
        sectionCache: 'Cache',
        badgePosition: 'Posição nos cards',
        badgeVertical: 'Vertical',
        badgeHorizontal: 'Horizontal',
        posTop: 'Topo',
        posBottom: 'Base',
        posLeft: 'Esquerda',
        posRight: 'Direita',
        badgePositionHint: 'Aplica-se a emblemas nos cards da loja. Na página do jogo permanece no cabeçalho.',
        badgeSize: 'Tamanho nos cards',
        sizeSmall: 'Pequeno',
        sizeMedium: 'Médio',
        sizeLarge: 'Grande',
        sizeXLarge: 'Muito grande',
        badgeSizeHint: 'Aplica-se às badges nos cards da loja. Na página do jogo o tamanho não muda.',
        showMissing: 'Mostrar “não está no banco”',
        showMissingHint: 'Se desativado, cards sem correspondência no GameStatus ficam sem emblema.',
        on: 'ON',
        off: 'OFF',
        cacheHours: 'Duração do cache (horas)',
        cacheHoursHint:
          'Por quanto tempo reutilizar resultados da API (incluindo não encontrado). 0 desativa o cache. Limpe ou recarregue para buscar de novo.',
        clearCache: 'Limpar cache',
        cacheCleared: 'Cache limpo ({count})',
        cacheEmpty: 'O cache está vazio',
        cacheClearHint: 'Remove todas as consultas do GameStatus salvas neste perfil do navegador.',
        repoLink: 'GitHub',
        repoAbout: 'Código-fonte, atualizações e relatos de problemas',
      },
      de: {
        notInDatabase: 'Nicht in der Datenbank',
        cracked: 'Bereit',
        notCracked: 'Ausstehend',
        protectionBypass: 'Schutz-Umgehung',
        releaseToday: 'Release heute',
        unknownStatus: 'Status unbekannt',
        checkedUrls: 'Geprüfte URLs',
        gameNotFound: 'Spiel nicht in der gamestatus.info-Datenbank gefunden',
        status: 'Status',
        protection: 'Schutz',
        group: 'Gruppe',
        release: 'Release',
        crack: 'Aktualisiert',
        steamId: 'Steam ID',
        score: 'Bewertung',
        metacritic: 'Metacritic',
        type: 'Typ',
        subscriptions: 'Abonnements',
        hardware: 'Hardware',
        supportProject: 'Projekt unterstützen',
        loadError: 'Ladefehler',
        loading: 'GameStatus…',
        menuSettings: 'Steam GameStatus — Einstellungen',
        btnTitle: 'Steam GameStatus',
        btnText: 'GameStatus',
        panelTitle: 'GameStatus',
        panelSubtitle: 'Badges · Cache · Anzeige',
        close: 'Schließen',
        cancel: 'Abbrechen',
        save: 'Speichern',
        saveReload: 'Speichern & neu laden',
        sectionBadge: 'Badge',
        sectionCache: 'Cache',
        badgePosition: 'Position auf Karten',
        badgeVertical: 'Vertikal',
        badgeHorizontal: 'Horizontal',
        posTop: 'Oben',
        posBottom: 'Unten',
        posLeft: 'Links',
        posRight: 'Rechts',
        badgePositionHint: 'Gilt für Badges auf Store-Karten. Auf der Spielseite bleibt der Chip in der Kopfzeile.',
        badgeSize: 'Größe auf Karten',
        sizeSmall: 'Klein',
        sizeMedium: 'Mittel',
        sizeLarge: 'Groß',
        sizeXLarge: 'Sehr groß',
        badgeSizeHint: 'Gilt für Badges auf Store-Karten. Auf der Spieleseite bleibt die Größe unverändert.',
        showMissing: '„Nicht in der Datenbank“ anzeigen',
        showMissingHint: 'Wenn aus, bleiben Karten ohne GameStatus-Treffer ohne Badge.',
        on: 'AN',
        off: 'AUS',
        cacheHours: 'Cache-Dauer (Stunden)',
        cacheHoursHint:
          'Wie lange API-Ergebnisse wiederverwendet werden (inkl. nicht gefunden). 0 deaktiviert den Cache. Leeren oder neu laden zum Sofortabruf.',
        clearCache: 'Cache leeren',
        cacheCleared: 'Cache geleert ({count})',
        cacheEmpty: 'Cache ist leer',
        cacheClearHint: 'Entfernt alle gespeicherten GameStatus-Abfragen in diesem Browserprofil.',
        repoLink: 'GitHub',
        repoAbout: 'Quellcode, Updates und Fehlerberichte',
      },
      fr: {
        notInDatabase: 'Absent de la base',
        cracked: 'Prêt',
        notCracked: 'En attente',
        protectionBypass: 'Contournement',
        releaseToday: 'Sortie aujourd\'hui',
        unknownStatus: 'Statut inconnu',
        checkedUrls: 'URLs vérifiées',
        gameNotFound: 'Jeu introuvable dans la base gamestatus.info',
        status: 'Statut',
        protection: 'Protection',
        group: 'Groupe',
        release: 'Sortie',
        crack: 'Mis à jour',
        steamId: 'Steam ID',
        score: 'Note',
        metacritic: 'Metacritic',
        type: 'Type',
        subscriptions: 'Abonnements',
        hardware: 'Configuration',
        supportProject: 'Soutenir le projet',
        loadError: 'Erreur de chargement',
        loading: 'GameStatus…',
        menuSettings: 'Steam GameStatus — Paramètres',
        btnTitle: 'Steam GameStatus',
        btnText: 'GameStatus',
        panelTitle: 'GameStatus',
        panelSubtitle: 'Badges · cache · affichage',
        close: 'Fermer',
        cancel: 'Annuler',
        save: 'Enregistrer',
        saveReload: 'Enregistrer et recharger',
        sectionBadge: 'Badge',
        sectionCache: 'Cache',
        badgePosition: 'Position sur les cartes',
        badgeVertical: 'Vertical',
        badgeHorizontal: 'Horizontal',
        posTop: 'Haut',
        posBottom: 'Bas',
        posLeft: 'Gauche',
        posRight: 'Droite',
        badgePositionHint: 'S’applique aux badges des cartes boutique. Sur la page jeu, le chip reste dans l’en-tête.',
        badgeSize: 'Taille sur les cartes',
        sizeSmall: 'Petit',
        sizeMedium: 'Moyen',
        sizeLarge: 'Grand',
        sizeXLarge: 'Très grand',
        badgeSizeHint: 'S’applique aux badges des cartes du magasin. Sur la page du jeu, la taille ne change pas.',
        showMissing: 'Afficher « absent de la base »',
        showMissingHint: 'Si désactivé, les cartes sans correspondance GameStatus restent sans badge.',
        on: 'ON',
        off: 'OFF',
        cacheHours: 'Durée du cache (heures)',
        cacheHoursHint:
          'Combien de temps réutiliser les résultats API (y compris introuvable). 0 désactive le cache. Vider ou recharger pour refetch.',
        clearCache: 'Vider le cache',
        cacheCleared: 'Cache vidé ({count})',
        cacheEmpty: 'Le cache est vide',
        cacheClearHint: 'Supprime toutes les requêtes GameStatus enregistrées dans ce profil navigateur.',
        repoLink: 'GitHub',
        repoAbout: 'Code source, mises à jour et signalements',
      },
      ja: {
        notInDatabase: 'データベースに未登録',
        cracked: '準備完了',
        notCracked: '保留中',
        protectionBypass: '保護回避',
        releaseToday: '本日リリース',
        unknownStatus: 'ステータス不明',
        checkedUrls: '確認した URL',
        gameNotFound: 'gamestatus.info のデータベースにゲームが見つかりません',
        status: 'ステータス',
        protection: '保護',
        group: 'グループ',
        release: 'リリース',
        crack: '更新',
        steamId: 'Steam ID',
        score: 'スコア',
        metacritic: 'Metacritic',
        type: 'タイプ',
        subscriptions: '購読数',
        hardware: 'スペック',
        supportProject: 'プロジェクトを支援',
        loadError: '読み込みエラー',
        loading: 'GameStatus…',
        menuSettings: 'Steam GameStatus — 設定',
        btnTitle: 'Steam GameStatus',
        btnText: 'GameStatus',
        panelTitle: 'GameStatus',
        panelSubtitle: 'バッジ · キャッシュ · 表示',
        close: '閉じる',
        cancel: 'キャンセル',
        save: '保存',
        saveReload: '保存して再読み込み',
        sectionBadge: 'バッジ',
        sectionCache: 'キャッシュ',
        badgePosition: 'カード上の位置',
        badgeVertical: '上下',
        badgeHorizontal: '左右',
        posTop: '上',
        posBottom: '下',
        posLeft: '左',
        posRight: '右',
        badgePositionHint: 'ストアカードのバッジに適用。ゲームページのチップはヘッダーのままです。',
        badgeSize: 'カード上のサイズ',
        sizeSmall: '小',
        sizeMedium: '中',
        sizeLarge: '大',
        sizeXLarge: '特大',
        badgeSizeHint: 'ストアカードのバッジに適用されます。ゲームページのチップサイズは変わりません。',
        showMissing: '「未登録」バッジを表示',
        showMissingHint: 'オフにすると、GameStatus にないゲームはバッジなしのままになります。',
        on: 'ON',
        off: 'OFF',
        cacheHours: 'キャッシュ期間（時間）',
        cacheHoursHint:
          'API 結果（未検出含む）を再利用する時間。0 でキャッシュ無効。クリアまたは再読み込みで即再取得。',
        clearCache: 'キャッシュをクリア',
        cacheCleared: 'キャッシュをクリアしました（{count}）',
        cacheEmpty: 'キャッシュは空です',
        cacheClearHint: 'このブラウザプロファイルに保存された GameStatus の結果をすべて削除します。',
        repoLink: 'GitHub',
        repoAbout: 'ソースコード・更新・不具合報告',
      },
      ko: {
        notInDatabase: '데이터베이스에 없음',
        cracked: '준비됨',
        notCracked: '대기 중',
        protectionBypass: '보호 우회',
        releaseToday: '오늘 출시',
        unknownStatus: '상태 불명',
        checkedUrls: '확인한 URL',
        gameNotFound: 'gamestatus.info 데이터베이스에서 게임을 찾을 수 없습니다',
        status: '상태',
        protection: '보호',
        group: '그룹',
        release: '출시',
        crack: '업데이트',
        steamId: 'Steam ID',
        score: '점수',
        metacritic: 'Metacritic',
        type: '유형',
        subscriptions: '구독 수',
        hardware: '사양',
        supportProject: '프로젝트 후원',
        loadError: '로드 오류',
        loading: 'GameStatus…',
        menuSettings: 'Steam GameStatus — 설정',
        btnTitle: 'Steam GameStatus',
        btnText: 'GameStatus',
        panelTitle: 'GameStatus',
        panelSubtitle: '배지 · 캐시 · 표시',
        close: '닫기',
        cancel: '취소',
        save: '저장',
        saveReload: '저장 후 새로고침',
        sectionBadge: '배지',
        sectionCache: '캐시',
        badgePosition: '카드 위치',
        badgeVertical: '세로',
        badgeHorizontal: '가로',
        posTop: '위',
        posBottom: '아래',
        posLeft: '왼쪽',
        posRight: '오른쪽',
        badgePositionHint: '스토어 카드 배지에 적용됩니다. 게임 페이지 칩은 헤더에 유지됩니다.',
        badgeSize: '카드 크기',
        sizeSmall: '작게',
        sizeMedium: '보통',
        sizeLarge: '크게',
        sizeXLarge: '매우 크게',
        badgeSizeHint: '스토어 카드 배지에 적용됩니다. 게임 페이지 칩 크기는 그대로입니다.',
        showMissing: '“데이터베이스에 없음” 표시',
        showMissingHint: '끄면 GameStatus에 없는 게임은 배지 없이 남습니다.',
        on: 'ON',
        off: 'OFF',
        cacheHours: '캐시 기간(시간)',
        cacheHoursHint:
          'API 결과(미발견 포함)를 재사용하는 시간. 0은 캐시 비활성화. 비우거나 새로고침하면 즉시 다시 요청.',
        clearCache: '캐시 비우기',
        cacheCleared: '캐시를 비웠습니다 ({count})',
        cacheEmpty: '캐시가 비어 있습니다',
        cacheClearHint: '이 브라우저 프로필에 저장된 모든 GameStatus 조회를 삭제합니다.',
        repoLink: 'GitHub',
        repoAbout: '소스 코드, 업데이트 및 문제 제보',
      },
      pl: {
        notInDatabase: 'Brak w bazie',
        cracked: 'Gotowe',
        notCracked: 'Oczekujące',
        protectionBypass: 'Obejście zabezpieczeń',
        releaseToday: 'Premiera dziś',
        unknownStatus: 'Nieznany status',
        checkedUrls: 'Sprawdzone URL',
        gameNotFound: 'Gry nie znaleziono w bazie gamestatus.info',
        status: 'Status',
        protection: 'Zabezpieczenie',
        group: 'Grupa',
        release: 'Premiera',
        crack: 'Zaktualizowano',
        steamId: 'Steam ID',
        score: 'Ocena',
        metacritic: 'Metacritic',
        type: 'Typ',
        subscriptions: 'Subskrypcje',
        hardware: 'Sprzęt',
        supportProject: 'Wspieraj projekt',
        loadError: 'Błąd ładowania',
        loading: 'GameStatus…',
        menuSettings: 'Steam GameStatus — Ustawienia',
        btnTitle: 'Steam GameStatus',
        btnText: 'GameStatus',
        panelTitle: 'GameStatus',
        panelSubtitle: 'Odznaki · cache · wyświetlanie',
        close: 'Zamknij',
        cancel: 'Anuluj',
        save: 'Zapisz',
        saveReload: 'Zapisz i odśwież',
        sectionBadge: 'Odznaka',
        sectionCache: 'Cache',
        badgePosition: 'Pozycja na kartach',
        badgeVertical: 'Pionowo',
        badgeHorizontal: 'Poziomo',
        posTop: 'Góra',
        posBottom: 'Dół',
        posLeft: 'Lewo',
        posRight: 'Prawo',
        badgePositionHint: 'Dotyczy odznak na kartach sklepu. Na stronie gry chip zostaje w nagłówku.',
        badgeSize: 'Rozmiar na kartach',
        sizeSmall: 'Mały',
        sizeMedium: 'Średni',
        sizeLarge: 'Duży',
        sizeXLarge: 'Bardzo duży',
        badgeSizeHint: 'Dotyczy odznak na kartach sklepu. Na stronie gry rozmiar chipa się nie zmienia.',
        showMissing: 'Pokazuj „brak w bazie”',
        showMissingHint: 'Gdy wyłączone, karty bez dopasowania w GameStatus pozostają bez odznaki.',
        on: 'WŁ',
        off: 'WYŁ',
        cacheHours: 'Czas cache (godziny)',
        cacheHoursHint:
          'Jak długo ponownie używać wyników API (w tym nie znaleziono). 0 wyłącza cache. Wyczyść lub odśwież, by pobrać od razu.',
        clearCache: 'Wyczyść cache',
        cacheCleared: 'Cache wyczyszczony ({count})',
        cacheEmpty: 'Cache jest pusty',
        cacheClearHint: 'Usuwa wszystkie zapisane zapytania GameStatus w tym profilu przeglądarki.',
        repoLink: 'GitHub',
        repoAbout: 'Kod źródłowy, aktualizacje i zgłoszenia błędów',
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

    /** @type {typeof DEFAULT_SETTINGS} */
    let settings = loadSettings();
    let panelOpen = false;

    function t(key, vars) {
      let text = TRANSLATIONS[LOCALE]?.[key] ?? TRANSLATIONS.en[key] ?? key;
      if (vars && typeof vars === 'object') {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
        }
      }
      return text;
    }

    function normalizeCacheHours(value) {
      const n = Math.round(Number(value));
      if (!Number.isFinite(n) || n < 0) return DEFAULT_SETTINGS.cacheHours;
      return Math.min(n, CACHE_HOURS_MAX);
    }

    function normalizeBadgeVertical(value) {
      return value === 'bottom' ? 'bottom' : 'top';
    }

    function normalizeBadgeHorizontal(value) {
      return value === 'right' ? 'right' : 'left';
    }

    function normalizeBadgeSize(value) {
      if (value === 'small' || value === 'large' || value === 'xlarge') return value;
      return 'medium';
    }

    function loadSettings() {
      const raw = GM_getValue(SETTINGS_KEY, null);
      if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
      return {
        ...DEFAULT_SETTINGS,
        ...raw,
        cacheHours: normalizeCacheHours(raw.cacheHours),
        badgeVertical: normalizeBadgeVertical(raw.badgeVertical),
        badgeHorizontal: normalizeBadgeHorizontal(raw.badgeHorizontal),
        badgeSize: normalizeBadgeSize(raw.badgeSize),
        showMissingBadge: raw.showMissingBadge !== false,
      };
    }

    function saveSettings(next) {
      settings = {
        ...settings,
        ...next,
        cacheHours: normalizeCacheHours(next.cacheHours ?? settings.cacheHours),
        badgeVertical: normalizeBadgeVertical(next.badgeVertical ?? settings.badgeVertical),
        badgeHorizontal: normalizeBadgeHorizontal(next.badgeHorizontal ?? settings.badgeHorizontal),
        badgeSize: normalizeBadgeSize(next.badgeSize ?? settings.badgeSize),
        showMissingBadge:
          typeof next.showMissingBadge === 'boolean'
            ? next.showMissingBadge
            : settings.showMissingBadge !== false,
      };
      GM_setValue(SETTINGS_KEY, settings);
      applyBadgeAppearance();
      updateSettingsButtonState();
    }

    function getCacheTtlMs() {
      const hours = normalizeCacheHours(settings.cacheHours);
      return hours > 0 ? hours * 60 * 60 * 1000 : 0;
    }

    function applyBadgeAppearance() {
      const root = document.documentElement;
      root.classList.remove(
        'gs-badge-v-top',
        'gs-badge-v-bottom',
        'gs-badge-h-left',
        'gs-badge-h-right',
        'gs-badge-size-sm',
        'gs-badge-size-md',
        'gs-badge-size-lg',
        'gs-badge-size-xl'
      );
      const sizeClass =
        settings.badgeSize === 'small'
          ? 'gs-badge-size-sm'
          : settings.badgeSize === 'large'
            ? 'gs-badge-size-lg'
            : settings.badgeSize === 'xlarge'
              ? 'gs-badge-size-xl'
              : 'gs-badge-size-md';
      root.classList.add(
        settings.badgeVertical === 'bottom' ? 'gs-badge-v-bottom' : 'gs-badge-v-top',
        settings.badgeHorizontal === 'right' ? 'gs-badge-h-right' : 'gs-badge-h-left',
        sizeClass
      );
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

    const MUTATION_OBSERVER_OPTIONS = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ds-appid', 'data-sub-id', 'class'],
    };
  
    GM_addStyle(`
      html.gs-badge-size-sm {
        --gs-card-badge-font: 11px;
        --gs-card-badge-lh: 19px;
        --gs-card-badge-gap: 5px;
        --gs-card-badge-pad-x: 7px;
        --gs-card-badge-dot: 4px;
        --gs-card-badge-loading-dot: 10px;
        --gs-chart-badge-font: 10px;
        --gs-chart-badge-lh: 16px;
        --gs-chart-badge-pad-x: 6px;
      }

      html.gs-badge-size-md {
        --gs-card-badge-font: 13px;
        --gs-card-badge-lh: 23px;
        --gs-card-badge-gap: 6px;
        --gs-card-badge-pad-x: 9px;
        --gs-card-badge-dot: 5px;
        --gs-card-badge-loading-dot: 12px;
        --gs-chart-badge-font: 12px;
        --gs-chart-badge-lh: 19px;
        --gs-chart-badge-pad-x: 7px;
      }

      html.gs-badge-size-lg {
        --gs-card-badge-font: 15px;
        --gs-card-badge-lh: 26px;
        --gs-card-badge-gap: 7px;
        --gs-card-badge-pad-x: 10px;
        --gs-card-badge-dot: 6px;
        --gs-card-badge-loading-dot: 14px;
        --gs-chart-badge-font: 14px;
        --gs-chart-badge-lh: 22px;
        --gs-chart-badge-pad-x: 8px;
      }

      html.gs-badge-size-xl {
        --gs-card-badge-font: 17px;
        --gs-card-badge-lh: 29px;
        --gs-card-badge-gap: 8px;
        --gs-card-badge-pad-x: 12px;
        --gs-card-badge-dot: 7px;
        --gs-card-badge-loading-dot: 16px;
        --gs-chart-badge-font: 16px;
        --gs-chart-badge-lh: 25px;
        --gs-chart-badge-pad-x: 10px;
      }

      .${BADGE_CLASS} {
        --gs-accent: #67c1f5;
        --gs-bg: #384959;
        --gs-text: #c7d5e0;
        --gs-muted: #8f98a0;
        position: absolute;
        top: auto;
        right: auto;
        bottom: auto;
        left: auto;
        z-index: 100;
        display: inline-flex;
        align-items: center;
        gap: var(--gs-card-badge-gap, 6px);
        max-width: calc(100% - 16px);
        padding: 0 var(--gs-card-badge-pad-x, 9px);
        border-radius: 3px;
        border: none;
        background: var(--gs-bg);
        color: var(--gs-text);
        font: 500 var(--gs-card-badge-font, 13px)/var(--gs-card-badge-lh, 23px) "Motiva Sans", Arial, sans-serif;
        text-decoration: none;
        box-shadow: 1px 1px 0 0 #000000;
        pointer-events: auto;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      html.gs-badge-v-top .${BADGE_CLASS}:not(.${BADGE_CLASS}--page):not(.${BADGE_CLASS}--chart) {
        top: 8px;
      }

      html.gs-badge-v-bottom .${BADGE_CLASS}:not(.${BADGE_CLASS}--page):not(.${BADGE_CLASS}--chart) {
        bottom: 8px;
      }

      html.gs-badge-h-left .${BADGE_CLASS}:not(.${BADGE_CLASS}--page):not(.${BADGE_CLASS}--chart) {
        left: 8px;
      }

      html.gs-badge-h-right .${BADGE_CLASS}:not(.${BADGE_CLASS}--page):not(.${BADGE_CLASS}--chart) {
        right: 8px;
      }

      .${BADGE_CLASS}:hover {
        background: #4a5d70;
        color: #e3eaef;
      }

      .${BADGE_CLASS}__dot {
        width: var(--gs-card-badge-dot, 5px);
        height: var(--gs-card-badge-dot, 5px);
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
        width: var(--gs-card-badge-loading-dot, 12px);
        height: var(--gs-card-badge-loading-dot, 12px);
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

      .${BADGE_CLASS}--chart {
        position: static;
        top: auto;
        left: auto;
        z-index: auto;
        display: inline-flex;
        margin-top: 6px;
        max-width: 100%;
        white-space: normal;
        box-shadow: none;
        font-size: var(--gs-chart-badge-font, 12px);
        line-height: var(--gs-chart-badge-lh, 19px);
        padding: 0 var(--gs-chart-badge-pad-x, 7px);
      }

      /* Featured carousel: slides share the same coordinates — show badge only on focus */
      .carousel_wide_mode .store_main_capsule:not(.focus) .${BADGE_CLASS} {
        display: none !important;
        pointer-events: none !important;
      }

      .carousel_wide_mode .store_main_capsule.focus .${BADGE_CLASS} {
        z-index: 110;
      }

      [class*="StoreSalePriceWidgetContainer"] > .${BADGE_CLASS}--chart {
        align-self: flex-start;
      }

      .${BADGE_CLASS}--page,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page,
      span.${BADGE_CLASS}.${BADGE_CLASS}--page {
        position: static;
        top: auto;
        left: auto;
        z-index: auto;
        display: inline-flex;
        vertical-align: top;
        align-items: center;
        margin: 0;
        max-width: none;
        gap: 8px;
        padding: 0 15px;
        border-radius: 3px;
        border: none;
        background: var(--gs-bg);
        color: var(--gs-text);
        font: 500 15px/30px "Motiva Sans", Arial, sans-serif;
        text-decoration: none;
        box-shadow: 1px 1px 0 0 #000000;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        cursor: pointer;
      }

      .${BADGE_CLASS}--page:hover,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page:hover,
      span.${BADGE_CLASS}.${BADGE_CLASS}--page:hover {
        background: #4a5d70;
        color: #e3eaef;
        text-decoration: none;
      }

      .${BADGE_CLASS}--page.${BADGE_CLASS}--cracked:hover,
      a.${BADGE_CLASS}.${BADGE_CLASS}--page.${BADGE_CLASS}--cracked:hover {
        background: #5a7f28;
        color: #d4f54a;
      }

      .${BADGE_CLASS}--page .${BADGE_CLASS}__dot {
        width: 8px;
        height: 8px;
        flex-shrink: 0;
      }

      .${BADGE_CLASS}--page .${BADGE_CLASS}__label {
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .${BADGE_CLASS}--page.${BADGE_CLASS}--loading {
        pointer-events: none;
        cursor: wait;
      }

      .${BADGE_CLASS}--page.${BADGE_CLASS}--loading .${BADGE_CLASS}__dot {
        width: 14px;
        height: 14px;
      }

      .${BADGE_CLASS}__tooltip {
        position: fixed;
        z-index: 999999;
        width: min(380px, calc(100vw - 24px));
        max-width: 380px;
        padding: 0;
        border-radius: 3px;
        border: 1px solid #000;
        background: linear-gradient(180deg, #1b2838 0%, #16202d 100%);
        color: #c7d5e0;
        font: normal 12px/1.45 "Motiva Sans", Arial, Helvetica, sans-serif;
        box-shadow:
          0 0 12px rgba(0, 0, 0, 0.7),
          inset 0 1px 0 rgba(255, 255, 255, 0.04);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
        word-wrap: break-word;
        white-space: normal;
        overflow: hidden;
      }

      .${BADGE_CLASS}__tooltip--visible {
        opacity: 1;
      }

      .${BADGE_CLASS}__tooltip--interactive {
        pointer-events: auto;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-header {
        display: flex;
        gap: 12px;
        padding: 12px 12px 10px;
        background:
          radial-gradient(120% 90% at 0% 0%, rgba(102, 192, 244, 0.16), transparent 55%),
          linear-gradient(90deg, #1a2332, #1b2838);
        border-bottom: 1px solid #000;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-cover {
        flex: 0 0 92px;
        width: 92px;
        height: 43px;
        border-radius: 2px;
        object-fit: cover;
        background: #0e1620;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.55);
      }

      .${BADGE_CLASS}__tooltip .gs-tip-header-body {
        min-width: 0;
        flex: 1 1 auto;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-title {
        margin: 0 0 8px;
        color: #ffffff;
        font-size: 14px;
        font-weight: 700;
        line-height: 1.25;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-chip {
        display: inline-flex;
        align-items: center;
        max-width: 100%;
        padding: 0 7px;
        border-radius: 2px;
        border: none;
        background: #384959;
        color: #c7d5e0;
        font: 500 11px/18px "Motiva Sans", Arial, sans-serif;
        box-shadow: 1px 1px 0 0 #000;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-chip--cracked {
        background: #4c6b22;
        color: #beee11;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-chip--bypass,
      .${BADGE_CLASS}__tooltip .gs-tip-chip--not-cracked-recent {
        background: #5a4630;
        color: #ffb321;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-chip--not-cracked-old {
        background: #5a3030;
        color: #fecaca;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-chip--release-today {
        background: #2a4a63;
        color: #67c1f5;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-chip--unknown,
      .${BADGE_CLASS}__tooltip .gs-tip-chip--missing {
        background: #3a4149;
        color: #b0aeac;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-chip--aaa {
        background: linear-gradient(to bottom, #66c0f4 5%, #417a9b 95%);
        color: #fff;
        font-weight: 700;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
      }

      .${BADGE_CLASS}__tooltip .gs-tip-chip--protection {
        background: #2a3644;
        color: #acb2b8;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-body {
        padding: 10px 12px 12px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-muted {
        margin: 0 0 8px;
        color: #8f98a0;
        font-size: 12px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-section {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .${BADGE_CLASS}__tooltip .gs-tip-section:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-section-title {
        margin: 0 0 6px;
        color: #8f98a0;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-row {
        display: grid;
        grid-template-columns: 92px 1fr;
        gap: 8px;
        align-items: start;
        margin-bottom: 5px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-row:last-child {
        margin-bottom: 0;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-label {
        color: #8f98a0;
        font-size: 11px;
        font-weight: normal;
        line-height: 18px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-value {
        color: #dcdedf;
        word-break: break-word;
        line-height: 18px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-scores {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-score {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 64px;
        padding: 6px 10px;
        border-radius: 2px;
        border: 1px solid #000;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        text-align: center;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-score__value {
        font-size: 18px;
        font-weight: 700;
        line-height: 1.1;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35);
      }

      .${BADGE_CLASS}__tooltip .gs-tip-score__label {
        margin-top: 2px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        opacity: 0.85;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-score--high {
        background: linear-gradient(180deg, #4c6b22 0%, #3a5219 100%);
        color: #beee11;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-score--mid {
        background: linear-gradient(180deg, #8a6d1a 0%, #6a5214 100%);
        color: #ffcc33;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-score--low {
        background: linear-gradient(180deg, #8a3030 0%, #6a2020 100%);
        color: #ff8a8a;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-score--unknown {
        background: linear-gradient(180deg, #384959 0%, #2c3845 100%);
        color: #c7d5e0;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-specs {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-spec {
        display: grid;
        grid-template-columns: 36px 1fr;
        gap: 8px;
        align-items: start;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-spec__key {
        color: #66c0f4;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.03em;
        line-height: 16px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-spec__val {
        color: #acb2b8;
        font-size: 11px;
        line-height: 16px;
        word-break: break-word;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-desc {
        margin: 0;
        color: #acb2b8;
        font-size: 11px;
        line-height: 1.45;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-links {
        margin: 4px 0 0;
        padding: 0;
        list-style: none;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-links li + li {
        margin-top: 4px;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-links a,
      .${BADGE_CLASS}__tooltip .gs-tip-footer-links a {
        color: #66c0f4;
        text-decoration: none;
        word-break: break-all;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-links a:hover,
      .${BADGE_CLASS}__tooltip .gs-tip-footer-links a:hover {
        color: #ffffff;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-footer {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 10px;
        padding: 10px 12px;
        border-top: 1px solid #000;
        background: rgba(0, 0, 0, 0.22);
        font-size: 11px;
        color: #8f98a0;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-footer-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-footer-links {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-footer-sep {
        color: #4b5561;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-footer-divider {
        height: 1px;
        width: 100%;
        background: linear-gradient(90deg, transparent, #000, transparent);
      }

      .${BADGE_CLASS}__tooltip .gs-tip-repo {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        color: #8f98a0;
        text-decoration: none;
        word-break: normal;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-repo:hover {
        color: #c7d5e0;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-repo:hover .gs-tip-repo-title {
        color: #66c0f4;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-repo-title {
        color: #67c1f5;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.2;
      }

      .${BADGE_CLASS}__tooltip .gs-tip-repo-desc {
        font-size: 11px;
        line-height: 1.3;
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
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
      }

      .${BADGE_CLASS}__tooltip .gs-tip-donate-btn > span {
        display: block;
        padding: 0 12px;
        font: normal 12px/26px "Motiva Sans", Arial, sans-serif;
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

      #gs-settings-btn.gs-header-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-right: 8px;
        height: 24px;
        padding: 0 10px;
        border: none;
        border-radius: 2px;
        background: linear-gradient(to bottom, #66c0f4 5%, #417a9b 95%);
        color: #fff;
        font: 700 11px/24px "Motiva Sans", Arial, Helvetica, sans-serif;
        text-shadow: 0 1px 1px rgba(0,0,0,.3);
        cursor: pointer;
        position: relative;
        white-space: nowrap;
        box-shadow: 0 0 0 1px rgba(0,0,0,.35);
      }
      #gs-settings-btn.gs-header-btn:hover {
        background: linear-gradient(to bottom, #7dcaFA 5%, #4d8bb0 95%);
      }
      #gs-settings-btn.gs-header-btn.is-open {
        background: linear-gradient(to bottom, #a4d007 5%, #536904 95%);
      }
      .gs-header-btn__dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: rgba(255,255,255,.35);
        box-shadow: inset 0 0 0 1px rgba(0,0,0,.25);
      }
      .gs-header-btn__dot.is-on {
        background: #beee11;
        box-shadow: 0 0 6px rgba(190,238,17,.8);
      }

      .gs-panel {
        position: fixed;
        z-index: 999999;
        width: 360px;
        max-height: calc(100vh - 24px);
        overflow: auto;
        background: linear-gradient(180deg, #1b2838 0%, #16202d 100%);
        border: 1px solid #000;
        box-shadow: 0 0 12px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.04);
        color: #c7d5e0;
        font: 12px/1.4 "Motiva Sans", Arial, Helvetica, sans-serif;
        border-radius: 3px;
      }
      .gs-panel__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 14px 10px;
        background: radial-gradient(120% 80% at 0% 0%, rgba(102,192,244,.18), transparent 55%),
                    linear-gradient(90deg, #1a2332, #1b2838);
        border-bottom: 1px solid #000;
      }
      .gs-panel__title {
        color: #fff;
        font-size: 14px;
        font-weight: 700;
      }
      .gs-panel__subtitle {
        margin-top: 2px;
        color: #8f98a0;
        font-size: 11px;
      }
      .gs-panel__close {
        border: 0;
        background: transparent;
        color: #8f98a0;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        padding: 0 2px;
      }
      .gs-panel__close:hover { color: #fff; }
      .gs-panel__section {
        padding: 10px 14px;
      }
      .gs-panel__section-title {
        margin: 0 0 8px;
        color: #66c0f4;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .04em;
        text-transform: uppercase;
      }
      .gs-panel__section--row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .gs-panel__divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #000, transparent);
        margin: 0 10px;
      }
      .gs-panel__footer {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px 14px 14px;
        border-top: 1px solid #000;
        background: rgba(0,0,0,.2);
      }
      .gs-panel__footer-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }
      .gs-panel__footer-divider {
        height: 1px;
        width: 100%;
        background: linear-gradient(90deg, transparent, #000, transparent);
      }
      .gs-panel__repo {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        color: #8f98a0;
        text-decoration: none;
      }
      .gs-panel__repo:hover {
        color: #c7d5e0;
      }
      .gs-panel__repo:hover .gs-panel__repo-title {
        color: #66c0f4;
      }
      .gs-panel__repo-title {
        color: #67c1f5;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.2;
      }
      .gs-panel__repo-desc {
        font-size: 11px;
        line-height: 1.3;
      }
      .gs-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-bottom: 8px;
      }
      .gs-field:last-child { margin-bottom: 0; }
      .gs-field__label {
        color: #8f98a0;
        text-transform: uppercase;
        letter-spacing: .04em;
        font-size: 10px;
        font-weight: 700;
      }
      .gs-field input,
      .gs-field select {
        height: 30px;
        padding: 0 8px;
        border: 1px solid #000;
        border-radius: 2px;
        background: #316282;
        color: #fff;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.05);
        outline: none;
        font: inherit;
      }
      .gs-field input::placeholder { color: rgba(255,255,255,.45); }
      .gs-field input:focus,
      .gs-field select:focus {
        background: #3d7a9c;
        box-shadow: 0 0 0 1px #66c0f4;
      }
      .gs-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .gs-hint {
        margin: 6px 0 0;
        color: #8f98a0;
        font-size: 11px;
        line-height: 1.35;
      }
      .gs-switch {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
      }
      .gs-switch input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .gs-switch__track {
        width: 34px;
        height: 18px;
        border-radius: 9px;
        background: #0e1620;
        border: 1px solid #000;
        position: relative;
        box-shadow: inset 0 1px 2px rgba(0,0,0,.5);
        flex: 0 0 auto;
      }
      .gs-switch__track::after {
        content: '';
        position: absolute;
        top: 1px;
        left: 1px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #8f98a0;
        transition: transform .15s ease, background .15s ease;
      }
      .gs-switch input:checked + .gs-switch__track {
        background: linear-gradient(to bottom, #66c0f4, #417a9b);
      }
      .gs-switch input:checked + .gs-switch__track::after {
        transform: translateX(16px);
        background: #fff;
      }
      .gs-switch__label { color: #c7d5e0; }
      .gs-pill {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .06em;
        padding: 2px 7px;
        border-radius: 2px;
        background: #0e1620;
        color: #8f98a0;
        border: 1px solid #000;
        flex: 0 0 auto;
      }
      .gs-pill.is-on {
        color: #beee11;
        background: #1b3708;
        border-color: #53760d;
      }
      .gs-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: 0 12px;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        color: #fff;
        font: 700 12px/28px "Motiva Sans", Arial, Helvetica, sans-serif;
        background: linear-gradient(to bottom, #66c0f4 5%, #417a9b 95%);
        text-shadow: 0 1px 1px rgba(0,0,0,.3);
        box-shadow: 0 0 0 1px rgba(0,0,0,.4);
      }
      .gs-btn:hover { filter: brightness(1.08); }
      .gs-btn--ghost {
        background: linear-gradient(to bottom, #3d4450 5%, #2c313a 95%);
      }
      .gs-btn--green {
        background: linear-gradient(to bottom, #a4d007 5%, #536904 95%);
      }
      .gs-btn--danger {
        background: linear-gradient(to bottom, #c45c5c 5%, #8a3030 95%);
      }
      .gs-cache-status {
        margin: 8px 0 0;
        min-height: 14px;
        color: #beee11;
        font-size: 11px;
      }
      .gs-cache-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 8px;
      }

      @media (max-width: 900px) {
        .gs-header-btn__text { display: none; }
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
      const ttl = getCacheTtlMs();
      if (ttl <= 0) return null;
      const entry = readCache()[String(appId)];
      if (!entry) return null;
      if (Date.now() - entry.ts > ttl) return null;
      return entry;
    }

    function setCached(appId, payload) {
      if (getCacheTtlMs() <= 0) return;
      const cache = readCache();
      cache[String(appId)] = { ...payload, ts: Date.now() };
      writeCache(cache);
    }

    function getCacheEntryCount() {
      return Object.keys(readCache()).length;
    }

    function clearGameCache() {
      const count = getCacheEntryCount();
      memoryCache = {};
      cacheDirty = false;
      clearTimeout(cachePersistTimer);
      cachePersistTimer = null;
      GM_setValue(CACHE_KEY, '{}');
      inflight.clear();
      return count;
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

    function hrefMatchesAppId(href, appId) {
      if (!href || !appId) return false;
      return extractAppIdFromHref(href) === String(appId);
    }

    function findAppAnchor(root, appId, { includeClosest = false } = {}) {
      if (!root || !appId) return null;
      const id = String(appId);

      if (root instanceof HTMLAnchorElement && hrefMatchesAppId(root.href, id)) {
        return root;
      }

      if (includeClosest && root.closest) {
        const wrap = root.closest('a[href*="/app/"]');
        if (wrap && hrefMatchesAppId(wrap.href, id)) return wrap;
      }

      if (!root.querySelectorAll) return null;
      for (const anchor of root.querySelectorAll('a[href*="/app/"]')) {
        if (hrefMatchesAppId(anchor.href, id)) return anchor;
      }
      return null;
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
      'a[href*="/app/"] img[src*="/apps/"] + div',
    ];
  
    const INVALID_SLUG_RE =
      /^(https?-)?(store-)?steam(powered|static)?(-[a-z0-9]+)*(-com)?$|steampowered|steamstatic|akamaihd|^(on-)?wishlist$|^gamestatus$|^(soon-)?on-game-pass$/;

    const UI_CHROME_TITLE_RE =
      /^(in library|в библиотеке|owned|ignored|on wishlist|в вишлисте|в желаемом|wishlisted|on game pass|soon on game pass|скоро в game pass|gamestatus(?:…|\.{0,3})?|not in database|нет в базе|load error|ошибка загрузки|\+\d+\s*more)$/i;
  
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
      if (/^free to play$/i.test(value)) return true;
  
      const digits = (value.match(/\d/g) || []).length;
      return digits > 0 && digits / value.length > 0.45 && /%|руб|₽|\$|€|£/.test(value);
    }

    function isUiChromeTitle(text) {
      const value = String(text || '').replace(/\s+/g, ' ').trim();
      if (!value) return true;
      if (UI_CHROME_TITLE_RE.test(value)) return true;
      if (/^game\s*status/i.test(value)) return true;
      return false;
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
  
    function normalizeImageAltTitle(alt) {
      return String(alt || '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\s+(banner|capsule|header|poster|logo)$/i, '')
        .trim();
    }

    function getCardTitle(card, link) {
      const sources = [];

      const add = (value) => {
        const text = String(value || '').replace(/\s+/g, ' ').trim();
        if (!text || isUiChromeTitle(text) || looksLikePriceText(text) || sources.includes(text)) return;
        sources.push(text);
      };
  
      for (const selector of TITLE_SELECTORS) {
        const element = card.querySelector(selector);
        if (element) add(element.textContent);
      }

      if (isDsAppCapsule(card)) {
        const capsuleLink = link || getCardLink(card);
        add(normalizeImageAltTitle(card.querySelector('img[alt]')?.alt));
        const slugFromCapsule = extractSlugFromHref(capsuleLink?.href);
        if (slugFromCapsule && isValidSlug(slugFromCapsule)) {
          add(slugFromCapsule.replace(/-/g, ' '));
        }
      }
  
      add(
        normalizeImageAltTitle(
          card.querySelector(
            'img.sale_capsule_image[alt], img.tab_row_capsule[alt], img[class*="capsule"][alt], img[alt]'
          )?.alt
        )
      );
  
      const ariaLabel = link?.getAttribute('aria-label')?.trim();
      if (ariaLabel && !/^\d+%\s*off\b/i.test(ariaLabel) && !looksLikePriceText(ariaLabel)) {
        add(ariaLabel.replace(/\.\s*\d+%\s*off.*$/i, '').trim());
      }
  
      const slugFromHref = extractSlugFromHref(link?.href);
      if (slugFromHref && isValidSlug(slugFromHref)) {
        add(slugFromHref.replace(/-/g, ' '));
      }
  
      if (!sources.length && link) {
        const clone = link.cloneNode(true);
        clone
          .querySelectorAll(
            `.${BADGE_CLASS}, .ds_flag, .ds_options, .alike_cont, [class*="WishlistFlag"], [class*="wishlist_flag"]`
          )
          .forEach((el) => el.remove());
        const firstLine = clone.textContent
          .split('\n')
          .map((line) => line.trim())
          .find((line) => line && !looksLikePriceText(line) && !isUiChromeTitle(line));
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
        if (!normalized || looksLikePriceText(normalized) || isUiChromeTitle(normalized)) return;
  
        addSlug(slugify(normalized));
        addSlug(slugify(normalized.replace(/\s*[-–—:|].*$/, '')));
      };
  
      addFromHref(link?.href);

      // Only for the page's own game — not recommendation cards on the same page
      if (isGamePage() && String(appId) === String(getPageAppId())) {
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

    const steamTitleCache = new Map();
    const steamTitleInflight = new Map();

    async function fetchSteamAppTitle(appId) {
      const key = String(appId);
      if (steamTitleCache.has(key)) return steamTitleCache.get(key);
      if (steamTitleInflight.has(key)) return steamTitleInflight.get(key);

      const promise = (async () => {
        try {
          const onStore = location.hostname === 'store.steampowered.com';
          const url = `${STEAM_APPDETAILS_URL}?appids=${encodeURIComponent(key)}&filters=basic`;
          const response = await fetch(url, {
            credentials: onStore ? 'same-origin' : 'omit',
          });
          if (!response.ok) {
            steamTitleCache.set(key, null);
            return null;
          }
          const json = await response.json();
          const payload = json?.[key];
          const name = payload?.success ? payload.data?.name : null;
          const title = name ? String(name).replace(/\s+/g, ' ').trim() : null;
          steamTitleCache.set(key, title || null);
          return title || null;
        } catch {
          steamTitleCache.set(key, null);
          return null;
        } finally {
          steamTitleInflight.delete(key);
        }
      })();

      steamTitleInflight.set(key, promise);
      return promise;
    }
  
    async function tryResolveBySlugs(appId, slugs, triedUrls) {
      const slugsToTry = slugs.slice(0, MAX_SLUG_ATTEMPTS);
      for (const slug of slugsToTry) {
        try {
          const data = await fetchBySlug(slug, appId);
          if (data) {
            return {
              data,
              slug,
              slugs,
              triedUrls,
              apiUrl: buildApiUrl(slug),
              missing: false,
            };
          }
        } catch {
          // try next slug
        }
      }
      return null;
    }

    async function resolveGame(appId, link, title) {
      const cached = getCached(appId);
      if (cached) return cached;

      const safeTitle = isUiChromeTitle(title) ? '' : title;
      let resolvedTitle = safeTitle;
      let slugs = buildSlugCandidates(appId, link, resolvedTitle);
      let triedUrls = slugs.map(buildApiUrl);
      let usedSteamTitle = false;

      // Capsules like Personal Calendar often have /app/{id}?… with no real title
      // (DOM may only expose Steam UI chrome such as "ON WISHLIST").
      if (!slugs.length) {
        const steamTitle = await fetchSteamAppTitle(appId);
        usedSteamTitle = true;
        if (steamTitle) {
          resolvedTitle = steamTitle;
          slugs = buildSlugCandidates(appId, link, resolvedTitle);
          triedUrls = slugs.map(buildApiUrl);
        }
      }

      let entry = await tryResolveBySlugs(appId, slugs, triedUrls);
      if (entry) {
        setCached(appId, entry);
        return entry;
      }

      // Bad DOM titles (wishlist flags, badge text) can yield junk slugs — retry via Steam name.
      if (!usedSteamTitle) {
        const steamTitle = await fetchSteamAppTitle(appId);
        if (steamTitle && steamTitle !== resolvedTitle) {
          const steamSlugs = buildSlugCandidates(appId, link, steamTitle);
          const steamTried = [...new Set([...triedUrls, ...steamSlugs.map(buildApiUrl)])];
          entry = await tryResolveBySlugs(appId, steamSlugs, steamTried);
          if (entry) {
            setCached(appId, entry);
            return entry;
          }
          slugs = steamSlugs.length ? steamSlugs : slugs;
          triedUrls = steamTried;
          resolvedTitle = steamTitle;
        }
      }

      entry = {
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
  
    function tooltipRow(label, valueHtml) {
      if (!valueHtml) return '';
      return `
        <div class="gs-tip-row">
          <span class="gs-tip-label">${escapeHtml(label)}</span>
          <span class="gs-tip-value">${valueHtml}</span>
        </div>
      `;
    }

    function tipChip(text, variant = '') {
      if (!text) return '';
      const mod = variant ? ` gs-tip-chip--${variant}` : '';
      return `<span class="gs-tip-chip${mod}">${escapeHtml(text)}</span>`;
    }

    function splitChipValues(value) {
      return String(value || '')
        .split(/[,;/|]+/)
        .map((part) => part.trim())
        .filter(Boolean);
    }

    function normalizeScorePercent(value) {
      const number = Number(value);
      if (!Number.isFinite(number)) return null;
      if (number <= 10) return number * 10;
      return Math.max(0, Math.min(100, number));
    }

    function getScoreTone(value) {
      const percent = normalizeScorePercent(value);
      if (percent === null) return 'unknown';
      if (percent >= 75) return 'high';
      if (percent >= 50) return 'mid';
      return 'low';
    }

    function formatScoreBadge(label, value) {
      const text = formatScore(value);
      if (!text) return '';
      const tone = getScoreTone(value);
      return `
        <div class="gs-tip-score gs-tip-score--${tone}">
          <span class="gs-tip-score__value">${escapeHtml(text)}</span>
          <span class="gs-tip-score__label">${escapeHtml(label)}</span>
        </div>
      `;
    }

    function formatTooltipFooter(entry, game) {
      const pageUrl = game?.slug ? `${SITE_BASE}/${game.slug}` : SITE_BASE;
      const apiUrl = entry?.apiUrl || (game?.slug ? buildApiUrl(game.slug) : null);
      const links = [
        apiUrl
          ? `<a href="${escapeAttr(apiUrl)}" target="_blank" rel="noopener noreferrer">API</a>`
          : '',
        `<a href="${escapeAttr(pageUrl)}" target="_blank" rel="noopener noreferrer">GameStatus</a>`,
      ].filter(Boolean);

      return `
        <div class="gs-tip-footer">
          <div class="gs-tip-footer-top">
            <a class="gs-tip-donate-btn" href="${escapeAttr(DONATE_URL)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(t('supportProject'))}</span></a>
            <div class="gs-tip-footer-links">${links.join('<span class="gs-tip-footer-sep">·</span>')}</div>
          </div>
          <div class="gs-tip-footer-divider" role="separator"></div>
          <a class="gs-tip-repo" href="${escapeAttr(REPO_URL)}" target="_blank" rel="noopener noreferrer">
            <span class="gs-tip-repo-title">${escapeHtml(t('repoLink'))}</span>
            <span class="gs-tip-repo-desc">${escapeHtml(t('repoAbout'))}</span>
          </a>
        </div>
      `;
    }

    function formatHardwareSection(specs) {
      if (!specs || typeof specs !== 'object') return '';
      const rows = [
        ['CPU', specs.cpu_info],
        ['RAM', specs.ram_info],
        ['GPU', specs.gpu_info],
        ['OS', specs.os_info],
      ].filter(([, value]) => value);

      if (!rows.length) return '';

      return `
        <div class="gs-tip-section">
          <div class="gs-tip-section-title">${escapeHtml(t('hardware'))}</div>
          <div class="gs-tip-specs">
            ${rows
              .map(
                ([key, value]) => `
              <div class="gs-tip-spec">
                <span class="gs-tip-spec__key">${escapeHtml(key)}</span>
                <span class="gs-tip-spec__val">${escapeHtml(value)}</span>
              </div>`
              )
              .join('')}
          </div>
        </div>
      `;
    }

    function formatTooltip(entry) {
      const game = entry?.data || null;

      if (!game) {
        const urls = getTriedUrls(entry);
        const links = urls.length
          ? `<div class="gs-tip-section">
              <div class="gs-tip-section-title">${escapeHtml(t('checkedUrls'))}</div>
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

        return `
          <div class="gs-tip-header">
            <div class="gs-tip-header-body">
              <div class="gs-tip-title">GameStatus</div>
              <div class="gs-tip-chips">${tipChip(t('notInDatabase'), 'missing')}</div>
            </div>
          </div>
          <div class="gs-tip-body">
            <p class="gs-tip-muted">${escapeHtml(t('gameNotFound'))}</p>
            ${links}
          </div>
          ${formatTooltipFooter(entry, null)}
        `;
      }

      const statusType = getStatusType(game);
      const statusLabel = getStatusLabel(game, statusType);
      const protectionChips = splitChipValues(game.protections)
        .map((item) => tipChip(item, 'protection'))
        .join('');
      const group = getLocalizedGroup(game);
      const headerChips = [
        tipChip(statusLabel, statusType),
        game.is_AAA ? tipChip('AAA', 'aaa') : '',
        protectionChips,
        group ? tipChip(group) : '',
      ]
        .filter(Boolean)
        .join('');

      const cover = game.short_image
        ? `<img class="gs-tip-cover" src="${escapeAttr(game.short_image)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`
        : '';

      const infoRows = [
        tooltipRow(t('release'), formatDate(game.release_date) ? escapeHtml(formatDate(game.release_date)) : ''),
        tooltipRow(t('crack'), formatDate(game.crack_date) ? escapeHtml(formatDate(game.crack_date)) : ''),
        tooltipRow(t('steamId'), game.steam_prod_id ? escapeHtml(String(game.steam_prod_id)) : ''),
        tooltipRow(
          t('subscriptions'),
          game.count_subscribe > 0 ? escapeHtml(String(game.count_subscribe)) : ''
        ),
      ].join('');

      const scores = [formatScoreBadge(t('score'), game.user_score), formatScoreBadge(t('metacritic'), game.mata_score)]
        .filter(Boolean)
        .join('');
      const scoresBlock = scores ? `<div class="gs-tip-section"><div class="gs-tip-scores">${scores}</div></div>` : '';

      const description = truncateText(getLocalizedDescription(game), 180);
      const descriptionBlock = description
        ? `<div class="gs-tip-section"><p class="gs-tip-desc">${escapeHtml(description)}</p></div>`
        : '';

      return `
        <div class="gs-tip-header">
          ${cover}
          <div class="gs-tip-header-body">
            <div class="gs-tip-title">${escapeHtml(game.title || 'GameStatus')}</div>
            <div class="gs-tip-chips">${headerChips}</div>
          </div>
        </div>
        <div class="gs-tip-body">
          ${infoRows ? `<div class="gs-tip-section">${infoRows}</div>` : ''}
          ${scoresBlock}
          ${formatHardwareSection(game.specs_info)}
          ${descriptionBlock}
        </div>
        ${formatTooltipFooter(entry, game)}
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
  
    function createLoaderBadge(isPage = false, isChart = false) {
      const badge = document.createElement('span');
      const pageClass = isPage ? ` ${BADGE_CLASS}--page` : '';
      const chartClass = isChart ? ` ${BADGE_CLASS}--chart` : '';
      badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--loading${pageClass}${chartClass}`;
      badge.innerHTML = `<span class="${BADGE_CLASS}__dot"></span><span class="${BADGE_CLASS}__label">${escapeHtml(t('loading'))}</span>`;
      return badge;
    }

    function renderBadge(entry, options = {}) {
      const { isPage = false, isChart = false, appId = null } = options;
      const game = entry?.data || null;
      const type = getStatusType(game);
      const label = getStatusLabel(game, type);
      const href = game?.slug ? `${SITE_BASE}/${game.slug}` : SITE_BASE;

      const badge = document.createElement('a');
      const pageClass = isPage ? ` ${BADGE_CLASS}--page` : '';
      const chartClass = isChart ? ` ${BADGE_CLASS}--chart` : '';
      badge.className = `${BADGE_CLASS} ${BADGE_CLASS}--${type}${pageClass}${chartClass}`;
      badge.href = href;
      badge.target = '_blank';
      badge.rel = 'noopener noreferrer';
      badge.setAttribute('data-gs-processed', '1');
      badge.dataset.gsAppId = String(appId || game?.steam_prod_id || '');
      badge.innerHTML = `<span class="${BADGE_CLASS}__dot"></span><span class="${BADGE_CLASS}__label">${escapeHtml(label)}</span>`;

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
      if (el.id === 'gs-panel' || el.id === 'gs-settings-btn') return false;
      if (el.closest?.('#gs-panel')) return false;
      if (el.classList?.contains(BADGE_CLASS)) return false;
      if (el.closest?.(`.${BADGE_CLASS}__tooltip`)) return false;
      if (el.closest?.('[data-gs-observed="1"]')) {
        const observed = el.closest('[data-gs-observed="1"]');
        if (observed && !hasMultipleGames(observed)) return false;
      }
      if (el.matches?.('a[href*="/app/"]')) return true;
      return Boolean(el.querySelector?.('a[href*="/app/"]'));
    }

    function isFeaturedWideCarouselCard(card) {
      return (
        card?.classList?.contains('store_main_capsule') &&
        Boolean(card.closest('.carousel_wide_mode'))
      );
    }

    function isCarouselBadgeVisible(card) {
      if (!isFeaturedWideCarouselCard(card)) return true;
      return card.classList.contains('focus');
    }

    function verifyBadgeAppId(card, anchor) {
      const expectedAppId = getCardAppId(card);
      if (!expectedAppId || !anchor) return false;

      const badge = anchor.querySelector(`.${BADGE_CLASS}:not(.${BADGE_CLASS}--loading)`);
      if (!badge) return false;

      if (badge.dataset.gsAppId && badge.dataset.gsAppId !== expectedAppId) {
        badge.remove();
        resetBadgeAnchor(anchor);
        if (card !== anchor && card.dataset.gsObserved === '1') {
          delete card.dataset.gsObserved;
          delete card.dataset.gsAppId;
          delete card.dataset.gsTitle;
        }
        return true;
      }

      return false;
    }

    function collectRelevantMutations(mutations) {
      const nodes = [];
      let needsRescan = false;

      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (!(target instanceof Element)) continue;

          if (mutation.attributeName === 'class' && isFeaturedWideCarouselCard(target)) {
            if (target.classList.contains('focus')) {
              const anchor = getBadgeAnchor(target);
              if (verifyBadgeAppId(target, anchor)) {
                needsRescan = true;
              }
              nodes.push(target);
            }
            continue;
          }

          if (!target.hasAttribute('data-ds-appid')) continue;
          if (resetStaleCapsuleBadge(target)) {
            needsRescan = true;
          }
          nodes.push(target);
          continue;
        }

        for (const node of mutation.addedNodes) {
          if (isRelevantAddedNode(node)) {
            nodes.push(/** @type {Element} */ (node));
          }
        }
      }

      if (needsRescan && !nodes.length) {
        nodes.push(document.body);
      }

      return nodes;
    }

    function getChartRowLink(row) {
      const titleLink = row.querySelector('td a[href*="/app/"] img[src*="/apps/"]')?.closest('a');
      return titleLink || row.querySelector('a[href*="/app/"]');
    }

    function getCardAppId(card) {
      if (!card) return null;

      // Prefer href on <a /app/{id}/> — SteamPeek (and similar) put the page app id in data-ds-appid
      if (card instanceof HTMLAnchorElement) {
        const fromHref = extractAppIdFromHref(card.href);
        if (fromHref) return fromHref;
      }

      const fromAttr = card.getAttribute('data-ds-appid') || card.dataset.dsAppid;
      if (fromAttr) return fromAttr;

      if (isChartTableRow(card)) {
        const link = getChartRowLink(card);
        return link ? extractAppIdFromHref(link.href) : null;
      }

      return null;
    }

    function resolveCardAppId(card, fallbackAppId) {
      return getCardAppId(card) || String(fallbackAppId || '');
    }

    function countDistinctAppIds(element) {
      if (!element) return 0;
      return new Set(
        [...element.querySelectorAll('[data-ds-appid]')]
          .map((el) => el.getAttribute('data-ds-appid'))
          .filter(Boolean)
      ).size;
    }

    function hasMultipleGames(element) {
      return countDistinctAppIds(element) > 1;
    }

    function findDsAppCard(link) {
      const appId = extractAppIdFromHref(link.href);
      if (!appId) return null;

      // Link itself is the capsule; href wins when data-ds-appid mismatches (SteamPeek)
      if (link.hasAttribute('data-ds-appid')) {
        return link;
      }

      const inner =
        link.querySelector(`[data-ds-appid="${appId}"]`) || link.querySelector('[data-ds-appid]');
      if (inner) {
        const innerId = inner.getAttribute('data-ds-appid');
        if (!innerId || innerId === appId) return inner;
      }

      const ancestor = link.closest('[data-ds-appid]');
      if (ancestor?.getAttribute('data-ds-appid') === appId) return ancestor;

      return null;
    }

    function isDsAppCapsule(card) {
      return Boolean(card?.hasAttribute?.('data-ds-appid'));
    }

    function tryAddCardFromLink(link, cards) {
      if (link.classList.contains(BADGE_CLASS)) return;
      if (link.closest('.home_content_reason')) return;

      const appId = extractAppIdFromHref(link.href);
      if (!appId) return;
      // Game page header badge is handled separately — skip same-app capsules
      if (isGamePage() && appId === getPageAppId()) return;

      const card = findCardContainer(link);
      if (!card || card.closest('.apphub_AppName, .game_area_purchase, #game_highlights')) return;
      if (!isCarouselBadgeVisible(card)) return;

      const cardAppId = getCardAppId(card);
      if (cardAppId && cardAppId !== appId) return;

      const anchor = getBadgeAnchor(card);
      if (!anchor) return;
      if (anchor.querySelector(`.${BADGE_CLASS}:not(.${BADGE_CLASS}--loading)`)) return;
      if (anchor.dataset.gsObserved === '1' && anchor.querySelector(`.${BADGE_CLASS}--loading`)) return;

      const cardLink = getCardLink(card) || link;
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
  
    function isChartTableRow(element) {
      return Boolean(element?.matches?.('tr') && element.querySelector('[class*="StoreSalePriceWidgetContainer"]'));
    }

    function findChartTableRow(link) {
      const row = link.closest('tr');
      if (!row) return null;

      const priceAnchor = row.querySelector('[class*="StoreSalePriceWidgetContainer"]');
      if (!priceAnchor) return null;

      const rowAppIds = new Set(
        [...row.querySelectorAll('a[href*="/app/"]')]
          .map((anchor) => extractAppIdFromHref(anchor.href))
          .filter(Boolean)
      );
      if (rowAppIds.size !== 1) return null;

      const linkAppId = extractAppIdFromHref(link.href);
      if (linkAppId && !rowAppIds.has(linkAppId)) return null;

      return row;
    }

    function getChartPriceAnchor(row) {
      return row.querySelector('[class*="StoreSalePriceWidgetContainer"]');
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

    function getCapsuleImageAnchor(card) {
      if (!card) return null;

      return (
        card.querySelector('.microtrailer_wrapper') ||
        card.querySelector('.capsule.capsule_image_ctn.main_capsule') ||
        card.querySelector('.capsule_image_ctn.main_capsule') ||
        card.querySelector('.capsule.capsule_image_ctn') ||
        card.querySelector('.capsule_image_ctn') ||
        card.querySelector('a.capsule_image_ctn')
      );
    }

    function getBadgeAnchor(card) {
      if (!card) return card;

      if (isChartTableRow(card)) {
        const priceAnchor = getChartPriceAnchor(card);
        if (priceAnchor) return priceAnchor;
      }

      const imageAnchor = getCapsuleImageAnchor(card);
      if (imageAnchor) return imageAnchor;

      const homeRoot = card.closest('.home_content.single, .home_content_single_ctn');
      if (homeRoot) {
        const gamelink = homeRoot.querySelector('.home_content_items[data-ds-appid], .gamelink[data-ds-appid]');
        return (
          getCapsuleImageAnchor(gamelink) ||
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

    function cleanupMisplacedGroupBadge(card, anchor) {
      if (!card || !hasMultipleGames(card)) return;

      cleanupMisplacedCapsuleBadges(card, anchor);

      if (card.dataset.gsObserved === '1' && card !== anchor) {
        delete card.dataset.gsObserved;
        delete card.dataset.gsAppId;
        delete card.dataset.gsTitle;
      }
    }

    function cleanupMisplacedCapsuleBadges(card, anchor) {
      if (!card || !anchor) return;

      card.querySelectorAll('.' + BADGE_CLASS).forEach((badge) => {
        if (!anchor.contains(badge)) badge.remove();
      });

      const anchorBadges = [...anchor.querySelectorAll('.' + BADGE_CLASS)];
      anchorBadges.slice(1).forEach((badge) => badge.remove());
    }

    function resetStaleCapsuleBadge(card) {
      if (!card?.hasAttribute?.('data-ds-appid')) return false;

      const appId = getCardAppId(card);
      if (!appId) return false;

      const anchor = getBadgeAnchor(card);
      if (anchor.dataset.gsObserved !== '1' || anchor.dataset.gsAppId === appId) return false;

      resetBadgeAnchor(anchor);
      if (card !== anchor && card.dataset.gsObserved === '1') {
        delete card.dataset.gsObserved;
        delete card.dataset.gsAppId;
        delete card.dataset.gsTitle;
      }
      return true;
    }

    function shouldPreferCard(candidate, current) {
      if (!current) return true;
      if (current.contains(candidate)) return false;
      if (candidate.contains(current)) return true;

      if (isDsAppCapsule(candidate) && !isDsAppCapsule(current)) return true;
      if (isDsAppCapsule(current) && !isDsAppCapsule(candidate)) return false;

      if (isChartTableRow(candidate) && !isChartTableRow(current)) return true;
      if (isChartTableRow(current) && !isChartTableRow(candidate)) return false;

      const candidateAnchor = getBadgeAnchor(candidate);
      const currentAnchor = getBadgeAnchor(current);
      const candidateHasImage = candidateAnchor !== candidate;
      const currentHasImage = currentAnchor !== current;
      return candidateHasImage && !currentHasImage;
    }

    function findCardContainer(link) {
      const chartRow = findChartTableRow(link);
      if (chartRow) return chartRow;

      const homeGamelink = findHomeContentGamelink(link);
      if (homeGamelink) return homeGamelink;

      const dsCard = findDsAppCard(link);
      if (dsCard) return dsCard;

      const appId = extractAppIdFromHref(link.href);
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

      if (container && hasMultipleGames(container) && appId) {
        const specific = container.querySelector(`[data-ds-appid="${appId}"]`);
        if (specific) return specific;
        return null;
      }

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
        const matched =
          findAppAnchor(card, cardAppId, { includeClosest: isDsAppCapsule(card) }) ||
          (isDsAppCapsule(card) ? findAppAnchor(card.parentElement, cardAppId, { includeClosest: true }) : null);
        if (matched) return matched;
      }

      if (isChartTableRow(card)) {
        const titleLink = getChartRowLink(card);
        if (titleLink) return titleLink;
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
            anchor.closest('[data-ds-appid]') ||
            anchor.closest('tr') ||
            anchor.closest('.home_content_items[data-ds-appid], .gamelink[data-ds-appid], [data-ds-appid]') ||
            anchor;
          if (!isCarouselBadgeVisible(card)) return;

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

    function shouldRenderMissingBadge(entry) {
      if (entry?.data) return true;
      return settings.showMissingBadge !== false;
    }

    async function hydrateCard(card, appId, link, title) {
      const anchor = getBadgeAnchor(card);
      const isChart = isChartTableRow(card);
      const resolvedAppId = resolveCardAppId(card, appId);
      const resolvedLink = getCardLink(card) || link;
      const resolvedTitle = title || getCardTitle(card, resolvedLink);
      const loader = anchor.querySelector(`.${BADGE_CLASS}--loading`);

      if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
        loader?.remove();
        return;
      }

      try {
        const entry = await loadGame(resolvedAppId, resolvedLink, resolvedTitle);
        if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
          loader?.remove();
          return;
        }

        if (!shouldRenderMissingBadge(entry)) {
          requestAnimationFrame(() => {
            if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
              loader?.remove();
              return;
            }
            loader?.remove();
            anchor.dataset.gsMissingHidden = '1';
          });
          return;
        }

        const badge = renderBadge(entry, { isChart, appId: resolvedAppId });
        requestAnimationFrame(() => {
          if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
            loader?.remove();
            return;
          }
          loader?.replaceWith(badge);
        });
      } catch {
        if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
          loader?.remove();
          return;
        }

        if (!settings.showMissingBadge) {
          loader?.remove();
          return;
        }

        const badge = renderBadge({ data: null, missing: true, triedUrls: [] }, { isChart, appId: resolvedAppId });
        badge.querySelector(`.${BADGE_CLASS}__label`).textContent = t('loadError');
        requestAnimationFrame(() => {
          if (anchor.dataset.gsAppId && anchor.dataset.gsAppId !== resolvedAppId) {
            loader?.remove();
            return;
          }
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
            if (!isCarouselBadgeVisible(card)) return;

            const anchor = getBadgeAnchor(card);
            const isChart = isChartTableRow(card);
            if (verifyBadgeAppId(card, anchor)) {
              // stale badge removed — continue to re-observe
            } else if (anchor.dataset.gsObserved === '1') {
              if (anchor.dataset.gsAppId === resolvedAppId) return;
              resetBadgeAnchor(anchor);
            }

            cleanupMisplacedHomeBadge(card);
            cleanupMisplacedGroupBadge(card, anchor);
            cleanupMisplacedCapsuleBadges(card, anchor);
            if (!isChart) {
              ensureRelativePosition(anchor);
            }
            anchor.dataset.gsObserved = '1';
            anchor.dataset.gsAppId = resolvedAppId;
            anchor.dataset.gsTitle = title;

            if (!hasMultipleGames(card) || card === anchor) {
              card.dataset.gsObserved = '1';
            }

            if (!anchor.querySelector(`.${BADGE_CLASS}`)) {
              anchor.appendChild(createLoaderBadge(false, isChart));
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
      const link =
        findAppAnchor(document, appId) ||
        document.querySelector(`a[href*="/app/${appId}"]`) ||
        { href: location.pathname };

      try {
        const entry = await loadGame(appId, link, title);
        if (!shouldRenderMissingBadge(entry)) {
          loader.remove();
          return;
        }
        loader.replaceWith(renderBadge(entry, { isPage: true }));
      } catch {
        if (!settings.showMissingBadge) {
          loader.remove();
          return;
        }
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

    /* ─── Header button + settings panel ─── */

    function observeHeader() {
      const observer = new MutationObserver(() => {
        if (!document.getElementById('gs-settings-btn')) {
          ensureSettingsButton();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    function waitForElement(selector, timeout = 15000) {
      return new Promise((resolve) => {
        const existing = document.querySelector(selector);
        if (existing) {
          resolve(existing);
          return;
        }
        const observer = new MutationObserver(() => {
          const el = document.querySelector(selector);
          if (el) {
            observer.disconnect();
            resolve(el);
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(document.querySelector(selector));
        }, timeout);
      });
    }

    async function ensureSettingsButton() {
      const host = await waitForElement('#global_actions', 20000);
      if (!host || document.getElementById('gs-settings-btn')) {
        updateSettingsButtonState();
        return document.getElementById('gs-settings-btn');
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'gs-settings-btn';
      btn.className = 'gs-header-btn';
      btn.title = t('btnTitle');
      btn.innerHTML = `
        <span class="gs-header-btn__text">${escapeHtml(t('btnText'))}</span>
        <span class="gs-header-btn__dot" id="gs-settings-dot"></span>
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
      });

      const srbbBtn = host.querySelector('#srbb-settings-btn');
      const sihBtn = host.querySelector('.sih-features-button');
      if (srbbBtn) host.insertBefore(btn, srbbBtn.nextSibling);
      else if (sihBtn) host.insertBefore(btn, sihBtn);
      else host.insertBefore(btn, host.firstChild);

      ensurePanel();
      updateSettingsButtonState();
      return btn;
    }

    function updateSettingsButtonState() {
      const dot = document.getElementById('gs-settings-dot');
      const customized =
        settings.cacheHours !== DEFAULT_SETTINGS.cacheHours ||
        settings.badgeVertical !== DEFAULT_SETTINGS.badgeVertical ||
        settings.badgeHorizontal !== DEFAULT_SETTINGS.badgeHorizontal ||
        settings.badgeSize !== DEFAULT_SETTINGS.badgeSize ||
        settings.showMissingBadge !== DEFAULT_SETTINGS.showMissingBadge;
      if (dot) {
        dot.classList.toggle('is-on', customized);
        dot.title = customized ? t('on') : t('off');
      }
    }

    function ensurePanel() {
      if (document.getElementById('gs-panel')) return;

      const panel = document.createElement('div');
      panel.id = 'gs-panel';
      panel.className = 'gs-panel';
      panel.hidden = true;
      panel.innerHTML = `
        <div class="gs-panel__header">
          <div>
            <div class="gs-panel__title">${escapeHtml(t('panelTitle'))}</div>
            <div class="gs-panel__subtitle">${escapeHtml(t('panelSubtitle'))}</div>
          </div>
          <button type="button" class="gs-panel__close" data-gs="close" aria-label="${escapeHtml(t('close'))}">×</button>
        </div>

        <div class="gs-panel__section">
          <div class="gs-panel__section-title">${escapeHtml(t('sectionBadge'))}</div>
          <div class="gs-field">
            <span class="gs-field__label">${escapeHtml(t('badgePosition'))}</span>
            <div class="gs-grid">
              <label class="gs-field">
                <span class="gs-field__label">${escapeHtml(t('badgeVertical'))}</span>
                <select id="gs-badge-vertical">
                  <option value="top">${escapeHtml(t('posTop'))}</option>
                  <option value="bottom">${escapeHtml(t('posBottom'))}</option>
                </select>
              </label>
              <label class="gs-field">
                <span class="gs-field__label">${escapeHtml(t('badgeHorizontal'))}</span>
                <select id="gs-badge-horizontal">
                  <option value="left">${escapeHtml(t('posLeft'))}</option>
                  <option value="right">${escapeHtml(t('posRight'))}</option>
                </select>
              </label>
            </div>
          </div>
          <p class="gs-hint">${escapeHtml(t('badgePositionHint'))}</p>
          <label class="gs-field">
            <span class="gs-field__label">${escapeHtml(t('badgeSize'))}</span>
            <select id="gs-badge-size">
              <option value="small">${escapeHtml(t('sizeSmall'))}</option>
              <option value="medium">${escapeHtml(t('sizeMedium'))}</option>
              <option value="large">${escapeHtml(t('sizeLarge'))}</option>
              <option value="xlarge">${escapeHtml(t('sizeXLarge'))}</option>
            </select>
          </label>
          <p class="gs-hint">${escapeHtml(t('badgeSizeHint'))}</p>
        </div>

        <div class="gs-panel__section gs-panel__section--row">
          <label class="gs-switch">
            <input type="checkbox" id="gs-show-missing" />
            <span class="gs-switch__track"></span>
            <span class="gs-switch__label">${escapeHtml(t('showMissing'))}</span>
          </label>
          <span class="gs-pill" id="gs-show-missing-pill">${escapeHtml(t('off'))}</span>
        </div>
        <div class="gs-panel__section" style="padding-top:0">
          <p class="gs-hint" style="margin-top:0">${escapeHtml(t('showMissingHint'))}</p>
        </div>

        <div class="gs-panel__divider"></div>

        <div class="gs-panel__section">
          <div class="gs-panel__section-title">${escapeHtml(t('sectionCache'))}</div>
          <label class="gs-field">
            <span class="gs-field__label">${escapeHtml(t('cacheHours'))}</span>
            <input type="number" id="gs-cache-hours" min="0" max="${CACHE_HOURS_MAX}" step="1" placeholder="6" inputmode="numeric" />
          </label>
          <p class="gs-hint">${escapeHtml(t('cacheHoursHint'))}</p>
          <div class="gs-cache-row">
            <button type="button" class="gs-btn gs-btn--danger" data-gs="clear-cache">${escapeHtml(t('clearCache'))}</button>
          </div>
          <p class="gs-hint">${escapeHtml(t('cacheClearHint'))}</p>
          <p class="gs-cache-status" id="gs-cache-status" aria-live="polite"></p>
        </div>

        <div class="gs-panel__footer">
          <div class="gs-panel__footer-actions">
            <button type="button" class="gs-btn gs-btn--ghost" data-gs="close">${escapeHtml(t('cancel'))}</button>
            <button type="button" class="gs-btn" data-gs="save">${escapeHtml(t('save'))}</button>
            <button type="button" class="gs-btn gs-btn--green" data-gs="save-run">${escapeHtml(t('saveReload'))}</button>
          </div>
          <div class="gs-panel__footer-divider" role="separator"></div>
          <a class="gs-panel__repo" href="${REPO_URL}" target="_blank" rel="noopener noreferrer">
            <span class="gs-panel__repo-title">${escapeHtml(t('repoLink'))}</span>
            <span class="gs-panel__repo-desc">${escapeHtml(t('repoAbout'))}</span>
          </a>
        </div>
      `;
      document.body.appendChild(panel);

      panel.addEventListener('click', (e) => e.stopPropagation());
      panel.querySelectorAll('[data-gs="close"]').forEach((el) =>
        el.addEventListener('click', () => togglePanel(false))
      );
      panel.querySelector('[data-gs="save"]').addEventListener('click', () => {
        persistPanelForm();
        togglePanel(false);
      });
      panel.querySelector('[data-gs="save-run"]').addEventListener('click', () => {
        persistPanelForm();
        togglePanel(false);
        location.reload();
      });
      panel.querySelector('[data-gs="clear-cache"]').addEventListener('click', () => {
        const count = clearGameCache();
        const status = panel.querySelector('#gs-cache-status');
        if (status) {
          status.textContent =
            count > 0 ? t('cacheCleared', { count }) : t('cacheEmpty');
        }
      });

      const missingToggle = panel.querySelector('#gs-show-missing');
      missingToggle.addEventListener('change', () => syncMissingPill());

      document.addEventListener('click', (e) => {
        if (!panelOpen) return;
        const btn = document.getElementById('gs-settings-btn');
        if (panel.contains(e.target) || btn?.contains(e.target)) return;
        togglePanel(false);
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panelOpen) togglePanel(false);
      });
    }

    function syncMissingPill() {
      const panel = document.getElementById('gs-panel');
      if (!panel) return;
      const on = panel.querySelector('#gs-show-missing').checked;
      const pill = panel.querySelector('#gs-show-missing-pill');
      pill.textContent = on ? t('on') : t('off');
      pill.classList.toggle('is-on', on);
    }

    function fillPanelForm() {
      const panel = document.getElementById('gs-panel');
      if (!panel) return;
      panel.querySelector('#gs-badge-vertical').value = normalizeBadgeVertical(settings.badgeVertical);
      panel.querySelector('#gs-badge-horizontal').value = normalizeBadgeHorizontal(settings.badgeHorizontal);
      panel.querySelector('#gs-badge-size').value = normalizeBadgeSize(settings.badgeSize);
      panel.querySelector('#gs-show-missing').checked = settings.showMissingBadge !== false;
      panel.querySelector('#gs-cache-hours').value = String(normalizeCacheHours(settings.cacheHours));
      const status = panel.querySelector('#gs-cache-status');
      if (status) status.textContent = '';
      syncMissingPill();
    }

    function persistPanelForm() {
      const panel = document.getElementById('gs-panel');
      if (!panel) return;
      saveSettings({
        badgeVertical: panel.querySelector('#gs-badge-vertical').value,
        badgeHorizontal: panel.querySelector('#gs-badge-horizontal').value,
        badgeSize: panel.querySelector('#gs-badge-size').value,
        showMissingBadge: panel.querySelector('#gs-show-missing').checked,
        cacheHours: normalizeCacheHours(panel.querySelector('#gs-cache-hours').value),
      });
    }

    function togglePanel(force) {
      ensurePanel();
      const panel = document.getElementById('gs-panel');
      const btn = document.getElementById('gs-settings-btn');
      if (!panel) return;

      panelOpen = typeof force === 'boolean' ? force : !panelOpen;
      panel.hidden = !panelOpen;
      btn?.classList.toggle('is-open', panelOpen);

      if (panelOpen) {
        fillPanelForm();
        positionPanel();
      }
    }

    function positionPanel() {
      const panel = document.getElementById('gs-panel');
      const btn = document.getElementById('gs-settings-btn');
      if (!panel || !btn) return;

      const rect = btn.getBoundingClientRect();
      const width = 360;
      let left = rect.right - width;
      if (left < 8) left = 8;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;

      panel.style.top = `${Math.round(rect.bottom + 8)}px`;
      panel.style.left = `${Math.round(left)}px`;
    }

    function init() {
      applyBadgeAppearance();
      loadMemoryCache();
      setupScrollListener();
      window.addEventListener('pagehide', persistCacheNow);
      ensureSettingsButton();
      observeHeader();
      if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand(t('menuSettings'), () => {
          ensureSettingsButton().then(() => togglePanel(true));
        });
      }
      scheduleScan();

      mutationObserver = new MutationObserver((mutations) => {
        const nodes = collectRelevantMutations(mutations);
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
  