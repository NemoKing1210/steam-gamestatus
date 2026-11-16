# Steam GameStatus

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · **한국어** · [Polski](README.pl.md)

[![유저스크립트 설치](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)
[![라이선스: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![버전](https://img.shields.io/badge/version-1.14.1-green?style=for-the-badge)](CHANGELOG.md)

Steam 상점과 Steam 커뮤니티를 위한 유저스크립트로, [GameStatus.info](https://gamestatus.info)의 추가 게임 정보(보호, 출시일, 점수, 하드웨어 사양 등)를 표시합니다.

Steam을 둘러보는 동안 상점을 떠나지 않고 게임 카드와 게임 페이지 헤더에서 간결한 정보 배지를 볼 수 있습니다.

[Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat 및 `// ==UserScript==` 메타데이터 블록을 지원하는 기타 관리자와 호환됩니다.

## 빠른 설치

1. 유저스크립트 관리자를 설치합니다(Tampermonkey 또는 Violentmonkey 권장).
2. 아래 설치 링크를 클릭합니다. 관리자가 설치 확인 창을 엽니다.

**설치 URL:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
```

[![설치](https://img.shields.io/badge/⬇_Install-Steam_GameStatus-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)

### URL로 설치(대시보드)

| 관리자 | 경로 |
|---------|------|
| Tampermonkey | 대시보드 → **Utilities** → **Install from URL** |
| Violentmonkey | 대시보드 → **+** → **Install from URL** |
| Greasemonkey | 확장 프로그램 메뉴 → **New User Script** → 원본 URL 붙여넣기 |

위의 설치 URL을 붙여넣으세요.

### 수동 설치

1. 이 저장소의 [`steam-gamestatus.user.js`](steam-gamestatus.user.js)를 엽니다.
2. 파일 내용 전체를 복사합니다.
3. 유저스크립트 관리자에서 새 스크립트를 만들고 코드를 붙여넣습니다.
4. 저장하고 스크립트를 활성화합니다.

## 업데이트

스크립트에는 GitHub 원본 파일을 가리키는 `@updateURL` 및 `@downloadURL` 메타데이터가 포함되어 있습니다. 지원되는 관리자는 자동으로 업데이트를 확인합니다(Tampermonkey: 대시보드 → 확인 간격, Violentmonkey: 유사).

관리자는 설치된 `@version`과 원격 메타데이터를 비교하여 업데이트 제공 여부를 결정합니다.

## 기능

- **설정 패널** — 헤더 버튼에서 배지 위치 및 크기, 카드 위치, 캐시 기간, 캐시 지우기, "데이터베이스에 없음" 배지 표시 여부를 설정
- **게임 카드의 상태 배지** — 상점 홈, 검색 결과, 위시리스트, 할인 페이지 및 `/app/{id}` 링크가 있는 기타 목록
- **게임 페이지의 상태 배지** — `.apphub_OtherSiteInfo`에서 Community Hub / Store Page 링크 옆에 표시되는 간결한 칩
- **풍부한 툴팁** — 커버 이미지, 상태 칩, 색상 점수, 하드웨어 세부 정보가 포함된 Steam 스타일 팝오버
- **색상으로 구분된 상태** — 긴 게임 목록을 빠르게 시각적으로 확인
- **지연 로딩** — 카드가 화면에 들어올 때만 배지 로드
- **스마트 캐시** — 응답을 로컬에 캐시하여 API 부하를 줄이고 재방문 속도를 높임
- **Steam 스타일 UI** — Steam `.app_tag` 스타일의 배지, 상점 호버 팝오버 스타일의 툴팁
- **10개 UI 언어** — 영어, 러시아어, 중국어, 스페인어, 포르투갈어, 독일어, 프랑스어, 일본어, 한국어, 폴란드어(브라우저 언어로 자동 감지)

## 지원 페이지

| 사이트 | URL 패턴 |
|------|-------------|
| Steam 상점 | `https://store.steampowered.com/*` |
| Steam 커뮤니티(앱 허브) | `https://steamcommunity.com/app/*` |

## 상태 색상

각 배지에는 GameStatus.info에서의 게임 상태를 반영하는 색상 점이 있습니다:

| 색상 | 상태 | 의미 |
|-------|--------|---------|
| 녹색 | 준비됨 | 게임이 준비되었거나 이용 가능함을 나타냅니다 |
| 주황색 | 대기 중(최근) | 대기 상태. 게임 출시 후 1개월 미만 |
| 빨간색 | 대기 중(장기) | 대기 상태. 게임 출시 후 1개월 이상 |
| 주황색 | 보호 우회 | 보호를 우회하는 방법이 있음을 나타냅니다 |
| 파란색 | 오늘 출시 | 게임이 오늘 출시됩니다. 상태가 아직 대기 중일 수 있습니다 |
| 회색 | 상태 불명 / 데이터베이스에 없음 | 상태가 불분명하거나 GameStatus.info에서 게임을 찾을 수 없음 |
| 파란색(스피너) | 로딩 중 | API에서 데이터를 가져오는 중 |

배지를 클릭하면 GameStatus.info의 게임 페이지가 열립니다(게임을 찾지 못한 경우 사이트 홈페이지).

## 툴팁 내용

배지에 마우스를 올리면 Steam 스타일 팝오버가 열리며 다음 정보가 표시될 수 있습니다:

- **헤더** — 커버 이미지, 제목, 상태 칩, AAA / 보호 / 그룹 칩
- **날짜** — 출시일 및 상태 업데이트 날짜, Steam ID, 구독자 수
- **점수** — GameStatus 및 Metacritic 값, Metacritic 스타일 색상(녹색 ≥75, 노란색 ≥50, 빨간색 미만)
- **사양** — CPU, RAM, GPU, OS(있는 경우)
- **설명** — 게임에 대한 짧은 설명
- **푸터** — 후원 버튼 및 API / GameStatus 링크

게임이 데이터베이스에 없으면 팝오버에 "데이터베이스에 없음" 칩과 조회 중 시도한 API URL 목록이 표시됩니다.

## 설정

Steam 헤더의 **GameStatus**(또는 유저스크립트 관리자 메뉴)를 열어 설정합니다:

| 설정 | 기본값 | 참고 |
|---------|---------|--------|
| 배지 위치(세로 / 가로) | 위 / 왼쪽 | 상점 카드 배지에만 적용. 게임 페이지 칩은 헤더에 유지 |
| 카드 위치 | 왼쪽 | 게임 옆에서 GameStatus 카드가 열리는 위치. 공간이 없으면 공간이 있는 다음 면으로 전환 |
| 배지 크기 | 보통 | 작게 / 보통 / 크게 / 매우 크게. 상점 카드 배지에만 적용 |
| "데이터베이스에 없음" 배지 표시 | 켬 | 끄면 일치하지 않는 카드에 표시가 남지 않음 |
| 캐시 기간(시간) | 6 | 모든 캐시된 조회에 적용. 최대 168(7일) |
| 캐시 지우기 | — | 즉시 적용. 저장 필요 없음 |

## 개발자용

이 섹션은 전용 가이드로 이동했습니다:

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — 빌드, 로컬 테스트, 구성, 릴리스
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 작동 방식, 저장소 구조, 메타데이터, 권한
- [CONTRIBUTING.md](CONTRIBUTING.md) — 기여 워크플로 및 PR 체크리스트
- [AGENTS.md](AGENTS.md) — AI 코딩 에이전트 지침
- [SECURITY.md](SECURITY.md) — 보안 정책 및 비공개 신고

## 다른 사용자 스크립트

같은 제작자의 다른 사용자 스크립트:

| 사용자 스크립트 | 기능 |
|:----------------|:-----|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Steam 상점과 Steam 커뮤니티 콘텐츠(게임 설명, 리뷰, 프로필 댓글, 뉴스)를 페이지에서 바로 번역하는 전체 설정 패널 |
| [![Steam Region Block Bypass](https://img.shields.io/badge/Steam_Region_Block_Bypass-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-region-block-bypass) | Steam에서 "이 아이템은 현재 지역에서 이용할 수 없습니다"라고 표시될 때 상점 제품 페이지를 복원합니다 |

## 데이터 출처

모든 게임 데이터는 공개 GameStatus.info API에서 가져옵니다:

```
GET https://gamestatus.info/back/api/gameinfo/game/{slug}/
```

이 프로젝트는 Valve, Steam 또는 GameStatus.info와 **제휴 관계가 없습니다**. 상태 정보는 커뮤니티에서 유지 관리하며 불완전하거나 오래되었을 수 있습니다. 보증이 아닌 참고 자료로 사용하세요.

## 라이선스

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
