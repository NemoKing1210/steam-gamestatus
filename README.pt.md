# Steam GameStatus

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh.md) · [Español](README.es.md) · **Português** · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![Instalar userscript](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)
[![Licença: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Versão](https://img.shields.io/badge/version-1.14.1-green?style=for-the-badge)](CHANGELOG.md)

Um userscript para a loja da Steam e a Steam Community que adiciona informações extras dos jogos do [GameStatus.info](https://gamestatus.info) — proteção, datas de lançamento, notas, requisitos de hardware e muito mais.

Enquanto navega pela Steam, você vê emblemas compactos com informações nos cards de jogos e no cabeçalho da página do jogo — sem sair da loja.

Compatível com [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), ScriptCat e outros gerenciadores que suportam o bloco de metadados `// ==UserScript==`.

## Instalação rápida

1. Instale um gerenciador de userscripts (Tampermonkey ou Violentmonkey recomendados).
2. Clique no link de instalação abaixo — o gerenciador deve abrir uma janela de instalação.

**URL de instalação:**

```
https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
```

[![Instalar](https://img.shields.io/badge/⬇_Install-Steam_GameStatus-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)

### Instalar por URL (painel)

| Gerenciador | Caminho |
|---------|------|
| Tampermonkey | Painel → **Utilities** → **Install from URL** |
| Violentmonkey | Painel → **+** → **Install from URL** |
| Greasemonkey | Menu da extensão → **New User Script** → cole a URL bruta |

Cole a URL de instalação indicada acima.

### Instalação manual

1. Abra [`steam-gamestatus.user.js`](steam-gamestatus.user.js) neste repositório.
2. Copie todo o conteúdo do arquivo.
3. No seu gerenciador de userscripts, crie um novo script e cole o código.
4. Salve e ative o script.

## Atualizações

O script inclui os metadados `@updateURL` e `@downloadURL` apontando para o arquivo bruto do GitHub. Os gerenciadores compatíveis verificam atualizações automaticamente (Tampermonkey: Painel → intervalo de verificação; Violentmonkey: semelhante).

Os gerenciadores comparam a `@version` instalada com os metadados remotos para decidir se oferecem uma atualização.

## Recursos

- **Painel de configurações** — botão no cabeçalho para definir posição e tamanho do emblema, posição do card, duração do cache, limpar o cache e se deve mostrar emblemas “Não está no banco de dados”
- **Emblemas de status nos cards de jogos** — página inicial da loja, resultados de busca, listas de desejos, páginas de promoções e outras listagens com links `/app/{id}`
- **Emblema de status nas páginas de jogos** — chip compacto em `.apphub_OtherSiteInfo`, ao lado dos links Community Hub / Store Page
- **Tooltips completos** — popovers no estilo Steam com capa, chips de status, notas coloridas e detalhes de hardware
- **Status com código de cores** — leitura visual rápida de uma longa lista de jogos
- **Carregamento sob demanda** — os emblemas só carregam quando os cards entram na área visível
- **Cache inteligente** — as respostas ficam salvas localmente para reduzir a carga da API e acelerar visitas repetidas
- **Interface no estilo Steam** — emblemas parecidos com `.app_tag` da Steam e tooltips como os popovers da loja
- **10 idiomas de interface** — inglês, russo, chinês, espanhol, português, alemão, francês, japonês, coreano e polonês (detectado pelo idioma do navegador)

## Páginas suportadas

| Site | Padrão de URL |
|------|-------------|
| Loja da Steam | `https://store.steampowered.com/*` |
| Steam Community (hub do app) | `https://steamcommunity.com/app/*` |

## Cores de status

Cada emblema tem um ponto colorido que reflete o status do jogo no GameStatus.info:

| Cor | Status | Significado |
|-------|--------|---------|
| Verde | Pronto | O status indica que o jogo está pronto / disponível |
| Laranja | Pendente (recente) | Status pendente; o jogo foi lançado há menos de um mês |
| Vermelho | Pendente (espera longa) | Status pendente; o jogo foi lançado há mais de um mês |
| Laranja | Bypass de proteção | O status indica um método de bypass de proteção |
| Azul | Lançamento hoje | O jogo será lançado hoje; o status ainda pode estar pendente |
| Cinza | Desconhecido / não está no banco | Status indefinido ou jogo não encontrado no GameStatus.info |
| Azul (spinner) | Carregando | Os dados estão sendo obtidos da API |

Clicar em um emblema abre a página do jogo no GameStatus.info (ou a página inicial do site se o jogo não foi encontrado).

## Conteúdo do tooltip

Passar o mouse sobre um emblema abre um popover no estilo Steam que pode mostrar:

- **Cabeçalho** — capa, título, chip de status, chips AAA / proteção / grupo
- **Datas** — datas de lançamento e de atualização do status, Steam ID, inscrições
- **Notas** — valores do GameStatus e do Metacritic com cores no estilo Metacritic (verde ≥75, amarelo ≥50, vermelho abaixo)
- **Hardware** — CPU, RAM, GPU e SO quando disponíveis
- **Descrição** — breve descrição do jogo
- **Rodapé** — botão de apoio e links da API / GameStatus

Se um jogo não estiver no banco de dados, o popover mostra o chip “Não está no banco de dados” e lista as URLs da API tentadas durante a busca.

## Configurações

Abra **GameStatus** no cabeçalho da Steam (ou no menu do gerenciador de userscripts) para configurar:

| Configuração | Padrão | Observações |
|---------|---------|--------|
| Posição do emblema (vertical / horizontal) | Topo / Esquerda | Apenas emblemas dos cards; os chips das páginas de jogos ficam no cabeçalho |
| Posição do card | Esquerda | Onde o card do GameStatus abre ao lado do jogo; muda para o próximo lado com espaço |
| Tamanho do emblema | Médio | Pequeno / Médio / Grande / Muito grande; apenas emblemas dos cards |
| Mostrar emblemas “Não está no banco de dados” | Ativado | Se desativado, cards sem correspondência ficam sem marcação |
| Duração do cache (horas) | 6 | Aplica-se a todas as consultas em cache; máximo 168 (7 dias) |
| Limpar cache | — | Imediato; não exige salvar |

## Para desenvolvedores

Esta seção foi movida para guias dedicados:

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — compilação, testes locais, configuração, lançamento
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — como funciona, estrutura do repositório, metadados, permissões
- [CONTRIBUTING.md](CONTRIBUTING.md) — fluxo de contribuição e checklist de PR
- [AGENTS.md](AGENTS.md) — instruções para agentes de IA
- [SECURITY.md](SECURITY.md) — política de segurança e relato privado

## Outros userscripts

Outros userscripts do mesmo autor:

| Userscript | O que faz |
|:-----------|:----------|
| [![Steam Plus](https://img.shields.io/badge/Steam_Plus-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-plus) | Painel de configurações completo e tradução na página do conteúdo da Steam Store e Steam Community — descrições de jogos, análises, comentários de perfil e notícias |
| [![Steam Region Block Bypass](https://img.shields.io/badge/Steam_Region_Block_Bypass-1b2838?style=flat-square&logo=steam&logoColor=66c0f4)](https://github.com/NemoKing1210/steam-region-block-bypass) | Restaura a página do produto na Steam quando a Steam mostra “Este item não está disponível na sua região no momento” |

## Fonte dos dados

Todos os dados dos jogos vêm da API pública do GameStatus.info:

```
GET https://gamestatus.info/back/api/gameinfo/game/{slug}/
```

Este projeto **não é afiliado** à Valve, à Steam ou ao GameStatus.info. As informações de status são mantidas pela comunidade e podem estar incompletas ou desatualizadas. Use-as como referência, não como garantia.

## Licença

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
