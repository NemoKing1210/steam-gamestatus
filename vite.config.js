import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json' with { type: 'json' };

const RAW_BASE =
  'https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: { passes: 2, pure_getters: true },
      mangle: true,
      format: { comments: false },
    },
    cssMinify: true,
    target: 'es2018',
    reportCompressedSize: true,
  },
  esbuild: {
    legalComments: 'none',
  },
  plugins: [
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: {
          '': 'Steam GameStatus',
          ru: 'Steam GameStatus',
          'zh-CN': 'Steam GameStatus',
          es: 'Steam GameStatus',
          'pt-BR': 'Steam GameStatus',
          de: 'Steam GameStatus',
          fr: 'Steam GameStatus',
          ja: 'Steam GameStatus',
          ko: 'Steam GameStatus',
          pl: 'Steam GameStatus',
        },
        namespace: 'https://github.com/NemoKing1210/steam-gamestatus',
        version: pkg.version,
        description: {
          '': 'Adds extra game info from gamestatus.info on Steam store cards and game pages',
          ru: 'Добавляет доп. информацию с gamestatus.info на карточки Steam и страницы игр',
          'zh-CN':
            '在 Steam 商店卡片和游戏页面显示来自 gamestatus.info 的额外游戏信息',
          es: 'Añade información extra de gamestatus.info en tarjetas y páginas de Steam',
          'pt-BR':
            'Adiciona informações extras do gamestatus.info nos cards e páginas da Steam',
          de: 'Zeigt zusätzliche Spieldaten von gamestatus.info auf Steam-Karten und Spielseiten',
          fr: 'Ajoute des infos supplémentaires de gamestatus.info sur les cartes et pages Steam',
          ja: 'Steamのカードとゲームページに gamestatus.info の追加ゲーム情報を表示',
          ko: 'Steam 카드 및 게임 페이지에 gamestatus.info 추가 게임 정보를 표시',
          pl: 'Dodaje dodatkowe informacje z gamestatus.info na kartach i stronach Steam',
        },
        author: 'NemoKing1210',
        tag: ['steam', 'games'],
        homepageURL: 'https://github.com/NemoKing1210/steam-gamestatus',
        supportURL: 'https://github.com/NemoKing1210/steam-gamestatus/issues',
        updateURL: `${RAW_BASE}/steam-gamestatus.user.js`,
        downloadURL: `${RAW_BASE}/steam-gamestatus.user.js`,
        license: 'MIT',
        icon: 'https://gamestatus.info/favicon.ico',
        match: [
          'https://store.steampowered.com/*',
          'https://steamcommunity.com/app/*',
        ],
        connect: ['gamestatus.info', 'cdn.gamestatus.info'],
        'run-at': 'document-idle',
        noframes: true,
      },
      server: {
        prefix: 'dev:',
      },
      build: {
        fileName: 'steam-gamestatus.user.js',
        metaFileName: true,
      },
    }),
  ],
});
