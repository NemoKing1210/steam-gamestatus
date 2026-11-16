# Steam GameStatus

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh.md) · **Español** · [Português](README.pt.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![Instalar userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)
[![Licencia: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Versión](https://img.shields.io/badge/version-1.14.1-green?style=for-the-badge)](CHANGELOG.md)

Un userscript para la tienda de Steam y Steam Community que añade información extra de los juegos desde [GameStatus.info](https://gamestatus.info): protección, fechas de lanzamiento, puntuaciones, requisitos de hardware y más.

Mientras navegas por Steam, ves insignias compactas con información en las cartas de juego y en la cabecera de la página del juego, sin salir de la tienda.

Compatible con [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat y otros gestores que admitan el bloque de metadatos `// ==UserScript==`.

## Instalación rápida

1. Instala un gestor de userscripts (se recomiendan Tampermonkey o Violentmonkey).
2. Haz clic en el enlace de instalación de abajo; el gestor debería abrir un diálogo de instalación.

**URL de instalación:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
```

[![Instalar](https://img.shields.io/badge/⬇_Install-Steam_GameStatus-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)

### Instalar desde URL (panel)

| Gestor | Ruta |
|---------|------|
| Tampermonkey | Panel → **Utilities** → **Install from URL** |
| Violentmonkey | Panel → **+** → **Install from URL** |
| Greasemonkey | Menú de la extensión → **New User Script** → pega la URL sin procesar |

Pega la URL de instalación indicada arriba.

### Instalación manual

1. Abre [`steam-gamestatus.user.js`](steam-gamestatus.user.js) en este repositorio.
2. Copia todo el contenido del archivo.
3. En tu gestor de userscripts, crea un script nuevo y pega el código.
4. Guarda y activa el script.

## Actualizaciones

El script incluye metadatos `@updateURL` y `@downloadURL` que apuntan al archivo sin procesar de GitHub. Los gestores compatibles buscan actualizaciones automáticamente (Tampermonkey: Panel → intervalo de comprobación; Violentmonkey: similar).

Los gestores comparan la `@version` instalada con los metadatos remotos para decidir si ofrecer una actualización.

## Funciones

- **Panel de ajustes** — botón en la cabecera para configurar la posición y el tamaño de la insignia, la posición de la tarjeta, la duración de la caché, borrar la caché y si mostrar las insignias «no está en la base de datos»
- **Insignias de estado en las cartas de juego** — inicio de la tienda, resultados de búsqueda, listas de deseados, páginas de rebajas y otros listados con enlaces `/app/{id}`
- **Insignia de estado en las páginas de juego** — chip compacto en `.apphub_OtherSiteInfo`, junto a los enlaces Community Hub / Store Page
- **Tooltips completos** — ventanas emergentes al estilo Steam con carátula, chips de estado, puntuaciones de color y detalles de hardware
- **Estados codificados por color** — un vistazo rápido a listas largas de juegos
- **Carga diferida** — las insignias se cargan solo cuando las cartas entran en el área visible
- **Caché inteligente** — las respuestas se guardan localmente para reducir la carga de la API y acelerar las visitas repetidas
- **Interfaz al estilo Steam** — insignias con el estilo de `.app_tag` de Steam y tooltips como las ventanas emergentes de la tienda
- **10 idiomas de interfaz** — inglés, ruso, chino, español, portugués, alemán, francés, japonés, coreano y polaco (detectado según el idioma del navegador)

## Páginas compatibles

| Sitio | Patrón de URL |
|------|-------------|
| Tienda de Steam | `https://store.steampowered.com/*` |
| Steam Community (hub de la app) | `https://steamcommunity.com/app/*` |

## Colores de estado

Cada insignia tiene un punto de color que refleja el estado del juego en GameStatus.info:

| Color | Estado | Significado |
|-------|--------|---------|
| Verde | Listo | El estado indica que el juego está listo / disponible |
| Naranja | Pendiente (reciente) | Estado pendiente; el juego salió hace menos de un mes |
| Rojo | Pendiente (espera larga) | Estado pendiente; el juego salió hace más de un mes |
| Naranja | Bypass de protección | El estado indica un método de bypass de protección |
| Azul | Lanzamiento hoy | El juego se lanza hoy; el estado aún puede ser pendiente |
| Gris | Desconocido / no está en la base | Estado poco claro o juego no encontrado en GameStatus.info |
| Azul (indicador) | Cargando | Los datos se están obteniendo de la API |

Al hacer clic en una insignia se abre la página del juego en GameStatus.info (o la página principal del sitio si no se encontró el juego).

## Contenido del tooltip

Al pasar el cursor sobre una insignia se abre una ventana emergente al estilo Steam que puede mostrar:

- **Cabecera** — carátula, título, chip de estado, chips AAA / protección / grupo
- **Fechas** — fechas de lanzamiento y de actualización del estado, Steam ID, suscripciones
- **Puntuaciones** — valores de GameStatus y Metacritic con colores al estilo Metacritic (verde ≥75, amarillo ≥50, rojo por debajo)
- **Hardware** — CPU, RAM, GPU y SO cuando estén disponibles
- **Descripción** — breve descripción del juego
- **Pie** — botón de apoyo y enlaces a la API / GameStatus

Si un juego no está en la base de datos, la ventana muestra el chip «no está en la base de datos» y enumera las URL de la API probadas durante la búsqueda.

## Ajustes

Abre **GameStatus** en la cabecera de Steam (o en el menú del gestor de userscripts) para configurar:

| Ajuste | Predeterminado | Notas |
|---------|---------|--------|
| Posición de la insignia (vertical / horizontal) | Arriba / Izquierda | Solo insignias de cartas; los chips de las páginas de juego se quedan en la cabecera |
| Posición de la tarjeta | Izquierda | Dónde se abre la tarjeta de GameStatus junto al juego; cambia al siguiente lado con espacio |
| Tamaño de la insignia | Medio | Pequeño / Medio / Grande / Muy grande; solo insignias de cartas |
| Mostrar insignias «no está en la base de datos» | Activado | Si se desactiva, las cartas sin coincidencia quedan sin marca |
| Duración de la caché (horas) | 6 | Se aplica a todas las consultas en caché; máximo 168 (7 días) |
| Borrar caché | — | Inmediato; no requiere guardar |

## Para desarrolladores

Esta sección se trasladó a guías dedicadas:

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — compilación, pruebas locales, configuración, publicación
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — cómo funciona, estructura del repositorio, metadatos, permisos
- [CONTRIBUTING.md](CONTRIBUTING.md) — flujo de contribución y lista de comprobación para PR
- [AGENTS.md](AGENTS.md) — instrucciones para agentes de IA
- [SECURITY.md](SECURITY.md) — política de seguridad y reporte privado

## Otros userscripts

Otros userscripts del mismo autor:

| Userscript | Qué hace |
|:-----------|:---------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Panel de ajustes completo y traducción en la página del contenido de Steam Store y Steam Community — descripciones de juegos, reseñas, comentarios de perfil y noticias |
| [![Steam Region Block Bypass](https://img.shields.io/badge/Steam_Region_Block_Bypass-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-region-block-bypass) | Restaura la página del producto en Steam cuando Steam muestra «Este artículo no está disponible actualmente en tu región» |

## Fuente de datos

Todos los datos de los juegos provienen de la API pública de GameStatus.info:

```
GET https://gamestatus.info/back/api/gameinfo/game/{slug}/
```

Este proyecto **no está afiliado** con Valve, Steam ni GameStatus.info. La información de estado la mantiene la comunidad y puede estar incompleta o desactualizada. Úsala como referencia, no como garantía.

## Licencia

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
